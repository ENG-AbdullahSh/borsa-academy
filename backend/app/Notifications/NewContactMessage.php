<?php

namespace App\Notifications;

use App\Models\ContactMessage;
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
            'title'              => 'رسالة جديدة من ' . $this->contactMessage->name,
            'message'            => "[{$this->contactMessage->subject}] {$preview}",
            'action_url'         => '/admin/messages',
            'contact_message_id' => $this->contactMessage->id,
            'sender_name'        => $this->contactMessage->name,
            'sender_email'       => $this->contactMessage->email,
            'subject'            => $this->contactMessage->subject,
        ];
    }
}
