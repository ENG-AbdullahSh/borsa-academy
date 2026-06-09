<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Models\Course;

class CourseEnrollmentNotification extends Notification implements ShouldQueue
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
            'type' => 'course',
            'title' => 'تم تسجيلك في الكورس بنجاح! 🎉',
            'message' => 'لقد انضممت إلى كورس "' . $this->course->title . '". ابدأ التعلم الآن وحقق أهدافك.',
            'action_url' => '/my-courses',
        ];
    }
}
