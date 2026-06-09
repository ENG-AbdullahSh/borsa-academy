<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Models\Lesson;

class LessonCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Lesson $lesson)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'course',
            'title' => 'تم إنجاز الدرس! 📘',
            'message' => 'لقد أكملت درس "' . $this->lesson->title . '". استمر في التقدم!',
            'action_url' => null,
        ];
    }
}
