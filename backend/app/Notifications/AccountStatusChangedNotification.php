<?php

namespace App\Notifications;

use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $status) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('تم تحديث حالة حسابك')
            ->greeting("أهلاً {$notifiable->name}")
            ->line("تم تغيير حالة حسابك إلى: {$this->status}.")
            ->line('إذا كنت تعتقد أن هذا الإجراء غير صحيح، تواصل مع الدعم.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return NotificationPayload::make(
            type: 'account.status_changed',
            title: 'تم تحديث حالة حسابك',
            message: "تم تغيير حالة حسابك إلى {$this->status}.",
            actionUrl: '/profile',
            entities: [
                'user_id' => $notifiable->id,
            ],
            audience: $notifiable->role ?? 'user',
            priority: 'urgent',
            icon: 'admin_panel_settings',
            channels: ['database', 'mail'],
            metadata: [
                'status' => $this->status,
            ],
        );
    }
}
