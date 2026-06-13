<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * Store a newly created message in storage and broadcast it.
     */
    public function sendMessage(Request $request): JsonResponse
    {
        // 1. Validate the request
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'chat_room_id' => ['required', 'exists:chat_rooms,id'],
        ]);

        // 2. Verify user authorization
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'غير مصرح لك بإرسال رسائل.'], 401);
        }

        $room = \App\Models\ChatRoom::findOrFail($validated['chat_room_id']);

        // Verify user is a participant, room is public, or user is enrolled in the course
        $isParticipant = $room->audience_type === 'all' || 
            \App\Models\ChatParticipant::where('chat_room_id', $room->id)->where('user_id', $user->id)->exists() ||
            ($room->audience_type === 'course_id' && \App\Models\Enrollment::where('course_id', $room->course_id)->where('user_id', $user->id)->exists());

        if (!$isParticipant && $user->role !== 'admin') {
            return response()->json(['message' => 'أنت لست عضواً في هذه الغرفة.'], 403);
        }

        // 3. Save message to database
        $message = Message::create([
            'chat_room_id' => $validated['chat_room_id'],
            'sender_id' => $user->id,
            'message' => $validated['message'],
        ]);

        // Load relations
        $message->load(['sender', 'room']);

        // 4. Broadcast the event
        broadcast(new MessageSent($message))->toOthers();

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

        $room = \App\Models\ChatRoom::findOrFail($chatRoomId);

        // Verify user is a participant, room is public, or user is enrolled in the course
        $isParticipant = $room->audience_type === 'all' || 
            \App\Models\ChatParticipant::where('chat_room_id', $room->id)->where('user_id', $user->id)->exists() ||
            ($room->audience_type === 'course_id' && \App\Models\Enrollment::where('course_id', $room->course_id)->where('user_id', $user->id)->exists());

        if (!$isParticipant && $user->role !== 'admin') {
            return response()->json(['message' => 'أنت لست عضواً في هذه الغرفة.'], 403);
        }

        $messages = Message::with('sender')
            ->where('chat_room_id', $chatRoomId)
            ->latest()
            ->paginate(50);

        return response()->json([
            'status' => 'success',
            'data' => $messages
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
}
