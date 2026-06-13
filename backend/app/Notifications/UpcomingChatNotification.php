<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UpcomingChatNotification extends Notification
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
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $roomName = $this->chatRoom->name ?: 'غرفة دردشة جماعية';
        $time = $this->chatRoom->scheduled_at->format('H:i');
        $url = url(config('app.frontend_url', 'http://localhost:5173') . '/chat');

        return (new MailMessage)
            ->subject("تذكير: بث مباشر أو دردشة بعد قليل - $roomName")
            ->greeting("أهلاً {$notifiable->name}،")
            ->line("نود تذكيرك بأن هناك بث مباشر أو دردشة جماعية بعنوان ($roomName) ستبدأ بعد حوالي نصف ساعة (الساعة $time).")
            ->action('الذهاب إلى غرفة الدردشة', $url)
            ->line('ننتظر مشاركتك معنا!');
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
            'title' => 'تذكير ببث مباشر أو دردشة',
            'message' => "غرفة ($roomName) ستبدأ بعد نصف ساعة.",
            'link' => '/chat',
            'chat_room_id' => $this->chatRoom->id,
            'type' => 'chat_reminder'
        ];
    }
}
