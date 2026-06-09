<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Models\Course;

class CourseFinishedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Course $course, public int $certificateId)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'achievement',
            'title' => 'مبروك! لقد أكملت الكورس 🏆',
            'message' => 'لقد أتممت كورس "' . $this->course->title . '" بنجاح. يمكنك الآن عرض شهادتك.',
            'action_url' => '/my-certificates',
            'certificate_id' => $this->certificateId,
            'certificate_url' => '/api/certificates/' . $this->certificateId . '/download',
        ];
    }
}
