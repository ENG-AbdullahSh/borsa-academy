<?php

namespace App\Notifications;

use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ChatRoomActivatedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly object $chatRoom) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $roomName = $this->chatRoom->name ?: 'غرفة مباشرة';

        return NotificationPayload::make(
            type: 'live_session.activated',
            title: 'تم تفعيل غرفة مباشرة',
            message: "يمكنك الآن الانضمام والمشاركة في الغرفة: {$roomName}.",
            actionUrl: '/chat',
            entities: [
                'chat_room_id' => $this->chatRoom->id,
                'course_id' => $this->chatRoom->course_id,
            ],
            audience: $notifiable->role ?? 'user',
            priority: 'urgent',
            icon: 'podcasts',
        );
    }
}
