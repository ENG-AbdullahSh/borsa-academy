<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Notifications\KeepGoingNotification;
use App\Notifications\ReturnToStudyNotification;

class NotificationSchedulerService
{
    public function runDailyNudges(): void
    {
        // 1. Inactivity Nudge (Return to Study)
        $this->processInactivityNudges();

        // 2. Milestone Nudge (Keep Going - 80%)
        $this->processMilestoneNudges();
    }

    private function processInactivityNudges(): void
    {
        // Get enrollments that are not completed
        $activeEnrollments = Enrollment::with(['user', 'course'])
            ->where('progress', '<', 100)
            ->where('completed', false)
            ->get();

        foreach ($activeEnrollments as $enrollment) {
            $user = $enrollment->user;
            $course = $enrollment->course;

            // Determine last accessed time
            // Try to find the latest updated_at from LessonProgress for this user and course
            $latestProgress = LessonProgress::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->latest('updated_at')
                ->first();

            $lastAccessed = $latestProgress ? $latestProgress->updated_at : $enrollment->enrolled_at;

            // Check if older than 48 hours
            if ($lastAccessed && now()->diffInHours($lastAccessed) >= 48) {
                // Anti-spam: Check if we sent this exact notification in the last 3 days
                $recentlySent = $user->notifications()
                    ->where('type', ReturnToStudyNotification::class)
                    ->where('data->course_id', $course->id)
                    ->where('created_at', '>=', now()->subDays(3))
                    ->exists();

                if (! $recentlySent) {
                    $user->notify(new ReturnToStudyNotification($course));
                }
            }
        }
    }

    private function processMilestoneNudges(): void
    {
        // Get enrollments where progress is >= 80 and < 100
        $milestoneEnrollments = Enrollment::with(['user', 'course'])
            ->where('progress', '>=', 80)
            ->where('progress', '<', 100)
            ->where('completed', false)
            ->get();

        foreach ($milestoneEnrollments as $enrollment) {
            $user = $enrollment->user;
            $course = $enrollment->course;

            // Anti-spam: Ensure we ONLY send this once ever per course
            $alreadySent = $user->notifications()
                ->where('type', KeepGoingNotification::class)
                ->where('data->course_id', $course->id)
                ->exists();

            if (! $alreadySent) {
                $user->notify(new KeepGoingNotification($course));
            }
        }
    }
}
