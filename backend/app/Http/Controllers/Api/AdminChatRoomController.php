<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminChatRoomController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $rooms = \App\Models\ChatRoom::with('course')->latest()->paginate(20);
        return response()->json([
            'status' => 'success',
            'data' => $rooms
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'type'          => 'required|in:private,group,global',
            'scheduled_at'  => 'nullable|date',
            'audience_type' => 'required|in:all,course_id,specific_users',
            'course_id'     => 'required_if:audience_type,course_id|nullable|exists:courses,id',
            'is_live'       => 'boolean',
        ]);

        $room = \App\Models\ChatRoom::create($validated);

        $this->syncParticipants($room, $validated['audience_type'], $validated['course_id'] ?? null);

        if ($room->is_live) {
            $participants = $room->participants()->with('user')->get();
            foreach ($participants as $participant) {
                if ($participant->user) {
                    $participant->user->notify(new \App\Notifications\ChatRoomActivatedNotification($room));
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم إنشاء غرفة الدردشة بنجاح.',
            'data' => $room
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $room = \App\Models\ChatRoom::with(['course', 'participants.user'])->findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data' => $room
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $room = \App\Models\ChatRoom::findOrFail($id);
        $wasLive = $room->is_live;

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'type'          => 'required|in:private,group,global',
            'scheduled_at'  => 'nullable|date',
            'audience_type' => 'required|in:all,course_id,specific_users',
            'course_id'     => 'required_if:audience_type,course_id|nullable|exists:courses,id',
            'is_live'       => 'boolean',
        ]);

        $room->update($validated);

        $this->syncParticipants($room, $validated['audience_type'], $validated['course_id'] ?? null);

        if ($room->is_live && !$wasLive) {
            $participants = $room->participants()->with('user')->get();
            foreach ($participants as $participant) {
                if ($participant->user) {
                    $participant->user->notify(new \App\Notifications\ChatRoomActivatedNotification($room));
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث غرفة الدردشة بنجاح.',
            'data' => $room
        ]);
    }

    /**
     * Helper to sync chat room participants.
     */
    protected function syncParticipants($room, $audienceType, $courseId = null)
    {
        $room->participants()->delete();

        if ($audienceType === 'all') {
            $userIds = \App\Models\User::pluck('id')->toArray();
            $room->participants()->createMany(
                array_map(fn($id) => ['user_id' => $id], $userIds)
            );
        } elseif ($audienceType === 'course_id' && $courseId) {
            $studentIds = \App\Models\Enrollment::where('course_id', $courseId)->pluck('user_id')->toArray();
            $course = \App\Models\Course::find($courseId);
            $instructorUserId = $course && $course->instructor ? $course->instructor->user_id : null;
            $adminIds = \App\Models\User::where('role', 'admin')->pluck('id')->toArray();

            $userIds = array_unique(array_merge(
                $studentIds,
                $adminIds,
                $instructorUserId ? [$instructorUserId] : []
            ));
            $room->participants()->createMany(
                array_map(fn($id) => ['user_id' => $id], $userIds)
            );
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $room = \App\Models\ChatRoom::findOrFail($id);
        $room->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم حذف غرفة الدردشة بنجاح.'
        ]);
    }
}
