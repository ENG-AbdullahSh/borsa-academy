<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class FileDownloadedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $fileName)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'system',
            'title' => 'تم تحميل الملف',
            'message' => 'لقد قمت بتحميل الملف: ' . $this->fileName,
            'action_url' => null,
        ];
    }
}
