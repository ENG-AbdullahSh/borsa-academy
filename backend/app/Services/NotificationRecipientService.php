<?php

namespace App\Services;

use App\Models\ChatRoom;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Notifications\Notification;

class NotificationRecipientService
{
    /**
     * @return Collection<int, User>
     */
    public function activeAdmins(): Collection
    {
        return User::query()
            ->where('role', 'admin')
            ->where('status', 'active')
            ->get();
    }

    /**
     * @return Collection<int, User>
     */
    public function activeCourseStudents(Course $course): Collection
    {
        return User::query()
            ->where('role', 'student')
            ->where('status', 'active')
            ->whereHas('enrollments', fn ($query) => $query->where('course_id', $course->id))
            ->get();
    }

    public function courseInstructor(Course $course): ?User
    {
        $course->loadMissing('instructor.user');

        return $course->instructor?->user;
    }

    /**
     * @return Collection<int, User>
     */
    public function chatRoomUsers(ChatRoom $room): Collection
    {
        $room->loadMissing('participants.user');

        return $room->participants
            ->pluck('user')
            ->filter(fn (?User $user): bool => $user !== null && $user->status === 'active')
            ->unique('id')
            ->values();
    }

    public function notifyCourseStudents(Course $course, Notification $notification): void
    {
        foreach ($this->activeCourseStudents($course) as $student) {
            $student->notify($notification);
        }
    }

    public function notifyInstructor(Course $course, Notification $notification): void
    {
        $this->courseInstructor($course)?->notify($notification);
    }

    public function notifyChatRoomUsers(ChatRoom $room, Notification $notification): void
    {
        foreach ($this->chatRoomUsers($room) as $user) {
            $user->notify($notification);
        }
    }
}
