<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Models\Course;
use App\Models\User;

class UserStartedCourseAdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public User $user, public Course $course)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'is_admin_activity' => true,
            'icon' => 'rocket',
            'user_name' => $this->user->name,
            'course_title' => $this->course->title,
            'title' => 'طالب جديد بدأ كورس',
            'message' => 'لقد بدأ الطالب ' . $this->user->name . ' دراسة كورس "' . $this->course->title . '".',
        ];
    }
}
