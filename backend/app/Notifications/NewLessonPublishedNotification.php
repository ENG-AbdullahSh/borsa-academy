<?php

namespace App\Notifications;

use App\Models\Lesson;
use App\Models\User;
use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewLessonPublishedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Lesson $lesson,
        private readonly ?User $actor = null,
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
        $this->lesson->loadMissing('section.course.instructor');

        $course = $this->lesson->section->course;
        $instructorName = $this->actor?->name
            ?? $course->instructor?->name
            ?? $course->instructor_name
            ?? 'المدرب';

        return NotificationPayload::make(
            type: 'lesson.published',
            title: 'درس جديد متاح الآن',
            message: "قام {$instructorName} بإضافة درس جديد: {$this->lesson->title} في دورة {$course->title}.",
            actionUrl: '/my-courses',
            entities: [
                'lesson_id' => $this->lesson->id,
                'course_id' => $course->id,
                'section_id' => $this->lesson->section_id,
                'actor_id' => $this->actor?->id,
            ],
            audience: 'student',
            priority: 'normal',
            icon: 'play_lesson',
            channels: ['database', 'mail'],
        );
    }
}
