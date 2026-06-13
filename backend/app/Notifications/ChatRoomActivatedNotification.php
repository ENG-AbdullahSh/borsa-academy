<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ChatRoomActivatedNotification extends Notification
{
    use Queueable;

    protected $chatRoom;

    /**
     * Create a new notification instance.
     */
    public function __construct($chatRoom)
    {
        $this->chatRoom = $chatRoom;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $roomName = $this->chatRoom->name ?: 'غرفة دردشة جماعية';

        return [
            'title' => 'تم تفعيل غرفة دردشة جديدة',
            'message' => "يمكنك الآن الانضمام والمشاركة في غرفة الدردشة: $roomName",
            'action_url' => '/chat',
            'chat_room_id' => $this->chatRoom->id,
            'type' => 'chat_activated'
        ];
    }
}
