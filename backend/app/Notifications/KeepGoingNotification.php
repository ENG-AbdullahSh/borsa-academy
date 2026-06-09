<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Models\Course;

class KeepGoingNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Course $course)
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
            'title' => 'أنت قريب جداً من النهاية! 🎯',
            'message' => 'لقد أنجزت معظم دورة "' . $this->course->title . '". خطوة أخيرة وتستلم شهادتك!',
            'action_url' => '/my-courses',
            'course_id' => $this->course->id,
        ];
    }
}
