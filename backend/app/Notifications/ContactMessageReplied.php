<?php

namespace App\Notifications;

use App\Models\ContactMessage;
use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ContactMessageReplied extends Notification
{
    use Queueable;

    public function __construct(
        public readonly ContactMessage $contactMessage,
        public readonly string $replyMessage,
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
        return [
            ...NotificationPayload::make(
            type: 'contact.replied',
            title: 'تم الرد على رسالتك',
            message: 'تم الرد على رسالتك من إدارة الأكاديمية',
            actionUrl: '/notifications',
            entities: [
                'contact_message_id' => $this->contactMessage->id,
                'replied_by_id' => $this->contactMessage->replied_by,
            ],
            audience: 'student',
            priority: 'normal',
            icon: 'support_agent',
            channels: ['database', 'mail'],
            metadata: [
                'original_subject' => $this->contactMessage->subject,
                'reply_preview' => mb_strimwidth($this->replyMessage, 0, 120, '...'),
                'replied_by' => $this->contactMessage->replier?->name ?? 'الإدارة',
            ],
            ),
            'contact_message_id' => $this->contactMessage->id,
            'original_subject' => $this->contactMessage->subject,
            'replied_by' => $this->contactMessage->replier?->name ?? 'الإدارة',
        ];
    }
}
