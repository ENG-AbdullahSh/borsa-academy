<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification
{
    use Queueable;

    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct($message)
    {
        $this->message = $message;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $senderName = $this->message->sender->name ?? 'مستشار بورصة';
        $roomName = $this->message->room->name ?: 'غرفة الدردشة';

        $isReply = !empty($this->message->parent_id);
        $title = $isReply ? "رد جديد من $senderName" : "رسالة جديدة من $senderName";
        $messagePrefix = $isReply ? "ردّ في $roomName: " : "في $roomName: ";

        return [
            'title' => $title,
            'message' => $messagePrefix . mb_substr($this->message->message, 0, 100),
            'action_url' => '/chat',
            'chat_room_id' => $this->message->chat_room_id,
            'type' => 'new_message'
        ];
    }
}
