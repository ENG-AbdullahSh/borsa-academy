<?php

namespace App\Notifications;

use App\Models\Course;
use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InstructorAssignedToCourseNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Course $course) {}

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
            type: 'course.instructor_assigned',
            title: 'تم تعيينك كمدرب لدورة',
            message: "قام الأدمن بتعيينك كمدرب رسمي لدورة {$this->course->title}.",
            actionUrl: "/instructor/courses/{$this->course->id}",
            entities: [
                'course_id' => $this->course->id,
            ],
            audience: 'instructor',
            priority: 'high',
            icon: 'school',
        );
    }
}
