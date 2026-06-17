<?php

namespace App\Notifications;

use App\Models\QuizAttempt;
use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class QuizSubmittedInstructorNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly QuizAttempt $attempt) {}

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
        $this->attempt->loadMissing(['user', 'quiz', 'course']);

        return NotificationPayload::make(
            type: 'quiz.submitted',
            title: 'تم تسليم اختبار جديد',
            message: "قام الطالب {$this->attempt->user->name} بتسليم اختبار {$this->attempt->quiz->title} وحصل على {$this->attempt->percentage}%.",
            actionUrl: "/instructor/courses/{$this->attempt->course_id}/quiz-results",
            entities: [
                'attempt_id' => $this->attempt->id,
                'student_id' => $this->attempt->user_id,
                'quiz_id' => $this->attempt->quiz_id,
                'course_id' => $this->attempt->course_id,
                'lesson_id' => $this->attempt->lesson_id,
            ],
            audience: 'instructor',
            priority: $this->attempt->passed ? 'normal' : 'high',
            icon: 'quiz',
            metadata: [
                'percentage' => $this->attempt->percentage,
                'passed' => $this->attempt->passed,
            ],
        );
    }
}
