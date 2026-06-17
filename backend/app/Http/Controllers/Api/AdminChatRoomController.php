<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatRoom;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Notifications\ChatRoomActivatedNotification;
use App\Notifications\LiveSessionScheduledNotification;
use App\Services\NotificationRecipientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Throwable;

class AdminChatRoomController extends Controller
{
    public function __construct(
        private readonly NotificationRecipientService $notificationRecipients,
    ) {}

    public function index(): JsonResponse
    {
        $rooms = ChatRoom::with('course')->latest()->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $rooms,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:private,group,global'],
            'scheduled_at' => ['nullable', 'date'],
            'audience_type' => ['required', 'in:all,course_id,specific_users'],
            'course_id' => ['required_if:audience_type,course_id', 'nullable', 'exists:courses,id'],
            'is_live' => ['boolean'],
        ]);

        $room = ChatRoom::create($validated);
        $this->syncParticipants($room, $validated['audience_type'], $validated['course_id'] ?? null);

        if ($room->scheduled_at) {
            $this->notifyParticipants(
                $room,
                new LiveSessionScheduledNotification($room),
                'Live session scheduled notification failed',
            );
        }

        if ($room->is_live) {
            $this->notifyParticipants(
                $room,
                new ChatRoomActivatedNotification($room),
                'Live session activation notification failed',
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم إنشاء غرفة الدردشة بنجاح.',
            'data' => $room,
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $room = ChatRoom::with(['course', 'participants.user'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $room,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $room = ChatRoom::findOrFail($id);
        $wasLive = $room->is_live;
        $previousScheduledAt = $room->scheduled_at?->toIso8601String();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:private,group,global'],
            'scheduled_at' => ['nullable', 'date'],
            'audience_type' => ['required', 'in:all,course_id,specific_users'],
            'course_id' => ['required_if:audience_type,course_id', 'nullable', 'exists:courses,id'],
            'is_live' => ['boolean'],
        ]);

        $room->update($validated);
        $this->syncParticipants($room, $validated['audience_type'], $validated['course_id'] ?? null);
        $room->refresh();

        $scheduleChanged = $room->scheduled_at?->toIso8601String() !== $previousScheduledAt;
        if ($room->scheduled_at && $scheduleChanged) {
            $this->notifyParticipants(
                $room,
                new LiveSessionScheduledNotification($room),
                'Live session schedule update notification failed',
            );
        }

        if ($room->is_live && ! $wasLive) {
            $this->notifyParticipants(
                $room,
                new ChatRoomActivatedNotification($room),
                'Live session activation notification failed',
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث غرفة الدردشة بنجاح.',
            'data' => $room,
        ]);
    }

    protected function syncParticipants(ChatRoom $room, string $audienceType, ?int $courseId = null): void
    {
        $room->participants()->delete();

        if ($audienceType === 'all') {
            $userIds = User::query()->where('status', 'active')->pluck('id')->all();
            $room->participants()->createMany(
                array_map(fn (int $id): array => ['user_id' => $id], $userIds),
            );

            return;
        }

        if ($audienceType === 'course_id' && $courseId) {
            $studentIds = Enrollment::query()
                ->where('course_id', $courseId)
                ->pluck('user_id')
                ->all();
            $course = Course::with('instructor')->find($courseId);
            $instructorUserId = $course?->instructor?->user_id;
            $adminIds = User::query()
                ->where('role', 'admin')
                ->where('status', 'active')
                ->pluck('id')
                ->all();

            $userIds = array_values(array_unique(array_filter([
                ...$studentIds,
                ...$adminIds,
                $instructorUserId,
            ])));

            $room->participants()->createMany(
                array_map(fn (int $id): array => ['user_id' => $id], $userIds),
            );
        }
    }

    public function destroy(string $id): JsonResponse
    {
        $room = ChatRoom::findOrFail($id);
        $room->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم حذف غرفة الدردشة بنجاح.',
        ]);
    }

    private function notifyParticipants(ChatRoom $room, Notification $notification, string $warning): void
    {
        try {
            $this->notificationRecipients->notifyChatRoomUsers($room, $notification);
        } catch (Throwable $exception) {
            Log::warning($warning, [
                'chat_room_id' => $room->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
