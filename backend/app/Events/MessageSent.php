<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Message $message;

    /**
     * Create a new event instance.
     */
    public function __construct(Message $message)
    {
        $this->message = $message;
        $this->message->loadMissing(['sender', 'parent.sender', 'reactions.user:id,name']);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to the specific chat room
        return [
            new PrivateChannel('chat-room.' . $this->message->chat_room_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'MessageSent';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'message' => $this->message->message,
            'sender_id' => $this->message->sender_id,
            'chat_room_id' => $this->message->chat_room_id,
            'parent_id' => $this->message->parent_id,
            'parent' => $this->message->parent ? [
                'id' => $this->message->parent->id,
                'message' => $this->message->parent->message,
                'sender_id' => $this->message->parent->sender_id,
                'sender' => $this->message->parent->sender ? [
                    'name' => $this->message->parent->sender->name,
                    'email' => $this->message->parent->sender->email,
                    'role' => $this->message->parent->sender->role,
                ] : null,
            ] : null,
            'sender' => [
                'name' => $this->message->sender->name,
                'email' => $this->message->sender->email,
                'role' => $this->message->sender->role,
            ],
            'reactions' => $this->message->reactions->map(fn ($reaction) => [
                'id' => $reaction->id,
                'message_id' => $reaction->message_id,
                'user_id' => $reaction->user_id,
                'emoji' => $reaction->emoji,
                'user' => $reaction->user ? [
                    'id' => $reaction->user->id,
                    'name' => $reaction->user->name,
                ] : null,
            ])->values()->all(),
            'created_at' => $this->message->created_at->toDateTimeString(),
        ];
    }
}
