<?php

namespace App\Notifications;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ContactMessageReplied extends Notification
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
        return [
            'title' => 'تم الرد على رسالتك',
            'message' => 'تم الرد على رسالتك من إدارة الأكاديمية',
            'action_url' => '/notifications',
            'contact_message_id' => $this->contactMessage->id,
        ];
    }
}
