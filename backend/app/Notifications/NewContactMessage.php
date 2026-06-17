<?php

namespace App\Notifications;

use App\Models\ContactMessage;
use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewContactMessage extends Notification
{
    use Queueable;

    public function __construct(
        public readonly ContactMessage $contactMessage,
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
        $preview = mb_strimwidth($this->contactMessage->message, 0, 80, '...');

        return [
            ...NotificationPayload::make(
            type: 'contact.received',
            title: 'رسالة تواصل جديدة من ' . $this->contactMessage->name,
            message: "[{$this->contactMessage->subject}] {$preview}",
            actionUrl: '/admin',
            entities: [
                'contact_message_id' => $this->contactMessage->id,
                'sender_user_id' => $this->contactMessage->user_id,
            ],
            audience: 'admin',
            priority: 'high',
            icon: 'mark_email_unread',
            channels: ['database', 'mail'],
            metadata: [
                'sender_name' => $this->contactMessage->name,
                'sender_email' => $this->contactMessage->email,
                'subject' => $this->contactMessage->subject,
            ],
            ),
            'contact_message_id' => $this->contactMessage->id,
            'sender_name' => $this->contactMessage->name,
            'sender_email' => $this->contactMessage->email,
            'subject' => $this->contactMessage->subject,
        ];
    }
}
