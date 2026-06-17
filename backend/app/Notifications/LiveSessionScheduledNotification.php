<?php

namespace App\Notifications;

use App\Models\ChatRoom;
use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class LiveSessionScheduledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly ChatRoom $chatRoom) {}

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
        $this->chatRoom->loadMissing('course');

        $roomName = $this->chatRoom->name ?: 'محاضرة مباشرة';
        $startsAt = $this->chatRoom->scheduled_at?->timezone(config('app.timezone'))->format('Y-m-d H:i');

        return NotificationPayload::make(
            type: 'live_session.scheduled',
            title: 'تمت جدولة بث مباشر جديد',
            message: "تم تحديد موعد {$roomName}" . ($startsAt ? " بتاريخ {$startsAt}." : '.'),
            actionUrl: '/chat',
            entities: [
                'chat_room_id' => $this->chatRoom->id,
                'course_id' => $this->chatRoom->course_id,
            ],
            audience: 'course',
            priority: 'high',
            icon: 'live_tv',
            channels: ['database'],
            metadata: [
                'scheduled_at' => $this->chatRoom->scheduled_at?->toIso8601String(),
                'course_title' => $this->chatRoom->course?->title,
            ],
        );
    }
}
