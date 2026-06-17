<?php

namespace App\Notifications;

use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AcademyNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $title,
        private readonly string $message,
        private readonly ?string $actionUrl = null,
    ) {}

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
        return NotificationPayload::make(
            type: 'academy.announcement',
            title: $this->title,
            message: $this->message,
            actionUrl: $this->actionUrl,
            audience: $notifiable->role ?? 'user',
            priority: 'normal',
            icon: 'campaign',
        );
    }
}
