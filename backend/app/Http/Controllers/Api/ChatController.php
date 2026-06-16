<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Events\MessageReactionUpdated;
use App\Http\Controllers\Controller;
use App\Models\ChatParticipant;
use App\Models\ChatRoom;
use App\Models\Enrollment;
use App\Models\Message;
use App\Models\MessageReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class ChatController extends Controller
{
    private const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '🔥', '👏', '🎉', '🤔', '😮'];

    /**
     * Store a newly created message in storage and broadcast it.
     */
    public function sendMessage(Request $request): JsonResponse
    {
        // 1. Validate the request
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'chat_room_id' => ['required', 'exists:chat_rooms,id'],
            'parent_id' => ['nullable', 'exists:messages,id'],
        ]);

        // 2. Verify user authorization
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'غير مصرح لك بإرسال رسائل.'], 401);
        }

        $room = ChatRoom::findOrFail($validated['chat_room_id']);

        if (!$this->userCanAccessRoom($user, $room)) {
            return response()->json(['message' => 'أنت لست عضواً في هذه الغرفة.'], 403);
        }

        // 3. Save message to database
        $messageData = [
            'chat_room_id' => $validated['chat_room_id'],
            'sender_id' => $user->id,
            'message' => $validated['message'],
        ];

        if (isset($validated['parent_id']) && !is_null($validated['parent_id'])) {
            $messageData['parent_id'] = $validated['parent_id'];
        }

        $message = Message::create($messageData);

        // Load relations
        $message->load(['sender', 'room', 'parent.sender', 'reactions.user:id,name']);

        // 4. Broadcast the event
        broadcast(new MessageSent($message))->toOthers();

        // 5. Notify other users/participants
        if ($room->audience_type === 'all') {
            $users = \App\Models\User::where('id', '!=', $user->id)->get();
        } else {
            $userIds = ChatParticipant::where('chat_room_id', $room->id)
                ->where('user_id', '!=', $user->id)
                ->pluck('user_id')
                ->toArray();
            
            if ($room->audience_type === 'course_id') {
                $enrolledUserIds = Enrollment::where('course_id', $room->course_id)
                    ->where('user_id', '!=', $user->id)
                    ->pluck('user_id')
                    ->toArray();
                $userIds = array_unique(array_merge($userIds, $enrolledUserIds));
            }
            
            $users = \App\Models\User::whereIn('id', $userIds)->get();
        }

        foreach ($users as $recipient) {
            $recipient->notify(new \App\Notifications\NewMessageNotification($message));
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم إرسال الرسالة بنجاح',
            'data' => $message
        ]);
    }

    /**
     * Get chat history for a room.
     */
    public function getMessages(Request $request): JsonResponse
    {
        $user = $request->user();
        $chatRoomId = $request->query('chat_room_id');

        $request->validate([
            'chat_room_id' => 'required|exists:chat_rooms,id'
        ]);

        $room = ChatRoom::findOrFail($chatRoomId);

        if (!$this->userCanAccessRoom($user, $room)) {
            return response()->json(['message' => 'أنت لست عضواً في هذه الغرفة.'], 403);
        }

        $messages = Message::with(['sender', 'parent.sender', 'reactions.user:id,name'])
            ->where('chat_room_id', $chatRoomId)
            ->latest()
            ->paginate(50);

        return response()->json([
            'status' => 'success',
            'data' => $messages
        ]);
    }

    /**
     * Add, update, or remove the authenticated user's reaction to a message.
     */
    public function toggleReaction(Request $request, Message $message): JsonResponse
    {
        $validated = $request->validate([
            'emoji' => ['required', 'string', 'max:16', Rule::in(self::ALLOWED_REACTIONS)],
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'غير مصرح لك بالتفاعل مع الرسائل.'], 401);
        }

        $message->load('room');

        if (!$message->room || !$this->userCanAccessRoom($user, $message->room)) {
            return response()->json(['message' => 'أنت لست عضواً في هذه الغرفة.'], 403);
        }

        $reaction = MessageReaction::query()
            ->where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->first();

        $action = 'created';

        if ($reaction && $reaction->emoji === $validated['emoji']) {
            $reaction->delete();
            $action = 'removed';
        } elseif ($reaction) {
            $reaction->update(['emoji' => $validated['emoji']]);
            $action = 'updated';
        } else {
            MessageReaction::create([
                'message_id' => $message->id,
                'user_id' => $user->id,
                'emoji' => $validated['emoji'],
            ]);
        }

        $message->load(['reactions.user:id,name']);
        broadcast(new MessageReactionUpdated($message))->toOthers();

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث التفاعل بنجاح',
            'data' => [
                'message_id' => $message->id,
                'chat_room_id' => $message->chat_room_id,
                'action' => $action,
                'reactions' => $this->serializeReactions($message),
            ],
        ]);
    }

    /**
     * Get chat rooms for the authenticated user.
     */
    public function getRooms(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // الاستعلام الأول: نجلب كل الغرف بشروطنا
            $chatRooms = \App\Models\ChatRoom::query()
                ->where(function ($query) use ($user) {
                    $query->whereHas('participants', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    })
                    ->orWhere('audience_type', 'all')
                    ->orWhere(function ($q) use ($user) {
                        $q->where('audience_type', 'course_id')
                          ->whereHas('course', function ($courseQuery) use ($user) {
                              $courseQuery->whereHas('enrollments', function ($enrollmentQuery) use ($user) {
                                  $enrollmentQuery->where('user_id', $user->id);
                              });
                          });
                    });
                })
                ->distinct()
                // تم إزالة avatar_url لأنها تسبب الخطأ SQLSTATE[42S22]: Unknown column 'avatar_url'
                ->with(['participants.user:id,name'])
                ->orderByDesc('is_live')
                ->orderByDesc('scheduled_at')
                ->get();

            Log::info('Fetched Chat Rooms successfully for User ID ' . $user->id);

            return response()->json([
                'status' => 'success',
                'data'   => $chatRooms
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching chat rooms with full relations: ' . $e->getMessage());

            // استعلام الملاذ الآمن (Fallback) في حال فشل الاستعلام المعقد
            // نتجاهل أي علاقات قد تكون مفقودة (مثل الكورسات أو enrollment) ونجلب الغرف العامة والمباشرة
            try {
                $user = $request->user();
                $safeChatRooms = \App\Models\ChatRoom::query()
                    ->where('audience_type', 'all')
                    ->orWhereHas('participants', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    })
                    ->orderByDesc('id')
                    ->get();
                
                return response()->json([
                    'status' => 'success',
                    'data'   => $safeChatRooms,
                    'warning'=> 'تم جلب الغرف الأساسية فقط بسبب خطأ داخلي.'
                ]);
            } catch (\Exception $fallbackException) {
                // فشل تام: نرجع مصفوفة فارغة لكي لا ينهار الـ Frontend
                Log::error('Safe Fallback query also failed: ' . $fallbackException->getMessage());
                return response()->json([
                    'status' => 'success',
                    'data'   => [],
                    'warning'=> 'لا يمكن جلب الغرف حالياً.'
                ]);
            }
        }
    }

    private function userCanAccessRoom($user, ChatRoom $room): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $room->audience_type === 'all'
            || ChatParticipant::where('chat_room_id', $room->id)->where('user_id', $user->id)->exists()
            || (
                $room->audience_type === 'course_id'
                && Enrollment::where('course_id', $room->course_id)->where('user_id', $user->id)->exists()
            );
    }

    private function serializeReactions(Message $message): array
    {
        return $message->reactions->map(fn (MessageReaction $reaction) => [
            'id' => $reaction->id,
            'message_id' => $reaction->message_id,
            'user_id' => $reaction->user_id,
            'emoji' => $reaction->emoji,
            'user' => $reaction->user ? [
                'id' => $reaction->user->id,
                'name' => $reaction->user->name,
            ] : null,
        ])->values()->all();
    }
}
