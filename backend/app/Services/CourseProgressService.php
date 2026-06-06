<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;

class CourseProgressService
{
    /**
     * @return array<string, int|bool>
     */
    public function syncEnrollment(Enrollment $enrollment): array
    {
        $totalLessons = Lesson::query()
            ->whereHas('section', function ($query) use ($enrollment): void {
                $query->where('course_id', $enrollment->course_id);
            })
            ->count();

        $completedLessons = LessonProgress::query()
            ->where('user_id', $enrollment->user_id)
            ->where('course_id', $enrollment->course_id)
            ->where('completed', true)
            ->whereHas('lesson.section', function ($query) use ($enrollment): void {
                $query->where('course_id', $enrollment->course_id);
            })
            ->count();

        $progressPercentage = $totalLessons > 0
            ? (int) round(($completedLessons / $totalLessons) * 100)
            : 0;
        $progressPercentage = min(max($progressPercentage, 0), 100);
        $courseCompleted = $totalLessons > 0 && $completedLessons >= $totalLessons;

        $enrollment->update([
            'progress' => $progressPercentage,
            'completed' => $courseCompleted,
        ]);

        return [
            'course_id' => $enrollment->course_id,
            'completed_lessons' => $completedLessons,
            'total_lessons' => $totalLessons,
            'progress_percentage' => $progressPercentage,
            'course_completed' => $courseCompleted,
        ];
    }
}
