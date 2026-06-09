<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Models\Course;

class ReturnToStudyNotification extends Notification implements ShouldQueue
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
            'title' => 'اشتقنا لك في الدورة!',
            'message' => 'لقد مر بعض الوقت منذ آخر دخول لك في دورة "' . $this->course->title . '". واصل مسيرتك التعليمية الآن ولا تستسلم!',
            'action_url' => '/my-courses',
            'course_id' => $this->course->id,
        ];
    }
}
