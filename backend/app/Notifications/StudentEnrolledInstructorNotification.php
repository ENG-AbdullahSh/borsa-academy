<?php

namespace App\Notifications;

use App\Models\Course;
use App\Models\User;
use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class StudentEnrolledInstructorNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly User $student,
        private readonly Course $course,
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
        return NotificationPayload::make(
            type: 'course.student_enrolled',
            title: 'طالب جديد في دورتك',
            message: "انضم الطالب {$this->student->name} إلى دورتك {$this->course->title} اليوم.",
            actionUrl: "/instructor/courses/{$this->course->id}/students",
            entities: [
                'student_id' => $this->student->id,
                'course_id' => $this->course->id,
            ],
            audience: 'instructor',
            priority: 'normal',
            icon: 'person_add',
        );
    }
}
