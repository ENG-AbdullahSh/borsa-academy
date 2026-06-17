<?php

namespace App\Notifications;

use App\Models\ChatRoom;
use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LiveSessionStartingSoonNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly ChatRoom $chatRoom) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $roomName = $this->chatRoom->name ?: 'المحاضرة المباشرة';
        $url = url(config('app.frontend_url', 'http://localhost:5173') . '/chat');

        return (new MailMessage)
            ->subject("تذكير: {$roomName} تبدأ بعد 30 دقيقة")
            ->greeting("أهلاً {$notifiable->name}")
            ->line("استعد، {$roomName} ستبدأ بعد 30 دقيقة.")
            ->action('الانضمام إلى الغرفة', $url);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $roomName = $this->chatRoom->name ?: 'المحاضرة المباشرة';
        $isInstructor = $notifiable->role === 'instructor';

        return NotificationPayload::make(
            type: 'live_session.starting_soon',
            title: $isInstructor ? 'محاضرتك المباشرة تبدأ قريباً' : 'استعد للبث المباشر',
            message: $isInstructor
                ? "لديك محاضرة مباشرة بعنوان {$roomName} بعد 30 دقيقة. جهّز قاعة البث واستعد للطلاب."
                : "البث المباشر الخاص بـ {$roomName} سيبدأ بعد 30 دقيقة. اضغط هنا للانضمام إلى الغرفة.",
            actionUrl: '/chat',
            entities: [
                'chat_room_id' => $this->chatRoom->id,
                'course_id' => $this->chatRoom->course_id,
            ],
            audience: $isInstructor ? 'instructor' : 'student',
            priority: 'urgent',
            icon: 'notifications_active',
            channels: ['database', 'mail'],
            metadata: [
                'scheduled_at' => $this->chatRoom->scheduled_at?->toIso8601String(),
            ],
        );
    }
}
