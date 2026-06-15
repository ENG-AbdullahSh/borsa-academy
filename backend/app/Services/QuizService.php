<?php

namespace App\Services;

use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Support\Collection;

class QuizService
{
    public function activeQuizForCourse(int $courseId): ?Quiz
    {
        return Quiz::query()
            ->where('course_id', $courseId)
            ->whereNull('lesson_id')
            ->where('is_active', true)
            ->first();
    }

    public function activeQuizForLesson(int $lessonId): ?Quiz
    {
        return Quiz::query()
            ->where('lesson_id', $lessonId)
            ->where('is_active', true)
            ->first();
    }

    public function isReady(Quiz $quiz): bool
    {
        $quiz->loadMissing('questions.options');

        if ($quiz->questions->isEmpty()) {
            return false;
        }

        return $quiz->questions->every(
            fn ($question): bool => $question->options->count() >= 2
                && $question->options->where('is_correct', true)->count() === 1,
        );
    }

    public function passedAttempt(int $userId, int $quizId): ?QuizAttempt
    {
        return QuizAttempt::query()
            ->where('user_id', $userId)
            ->where('quiz_id', $quizId)
            ->where('passed', true)
            ->latest('submitted_at')
            ->first();
    }

    /**
     * @return array<string, mixed>
     */
    public function lessonGateStatus(int $userId, Lesson $lesson): array
    {
        $lesson->loadMissing('quiz.questions.options');

        $quiz = $lesson->quiz?->is_active
            ? $lesson->quiz
            : $this->activeQuizForLesson($lesson->id);
        $quizReady = $quiz ? $this->isReady($quiz) : false;
        $videoCompleted = LessonProgress::query()
            ->where('user_id', $userId)
            ->where('lesson_id', $lesson->id)
            ->where('completed', true)
            ->exists();

        $latestAttempt = null;
        $passedAttempt = null;
        $attemptsCount = 0;

        if ($quiz) {
            $attempts = QuizAttempt::query()
                ->where('user_id', $userId)
                ->where('quiz_id', $quiz->id);
            $attemptsCount = (clone $attempts)->count();
            $latestAttempt = (clone $attempts)->latest('submitted_at')->first();
            $passedAttempt = $this->passedAttempt($userId, $quiz->id);
        }

        $gatePassed = $videoCompleted && $quiz !== null && $quizReady && $passedAttempt !== null;
        $lockedReason = null;
        $lockedMessage = null;

        if (! $quiz) {
            $lockedReason = 'lesson_quiz_missing';
            $lockedMessage = 'This lesson needs an active quiz before students can progress.';
        } elseif (! $quizReady) {
            $lockedReason = 'lesson_quiz_not_ready';
            $lockedMessage = 'The lesson quiz is not ready yet.';
        } elseif (! $videoCompleted) {
            $lockedReason = 'lesson_video_incomplete';
            $lockedMessage = 'Watch the lesson video before taking its quiz.';
        } elseif (! $passedAttempt) {
            $lockedReason = 'lesson_quiz_not_passed';
            $lockedMessage = 'Pass the lesson quiz to unlock the next lesson.';
        }

        return [
            'lesson_id' => $lesson->id,
            'section_id' => $lesson->section_id,
            'video_completed' => $videoCompleted,
            'lesson_completed' => $gatePassed,
            'gate_passed' => $gatePassed,
            'has_active_quiz' => $quiz !== null,
            'quiz_id' => $quiz?->id,
            'quiz_title' => $quiz?->title,
            'passing_score' => $quiz?->passing_score,
            'quiz_ready' => $quizReady,
            'quiz_passed' => $passedAttempt !== null,
            'can_take_quiz' => $videoCompleted && $quiz !== null && $quizReady && ! $passedAttempt,
            'attempts_count' => $attemptsCount,
            'latest_attempt' => $latestAttempt ? $this->formatAttempt($latestAttempt) : null,
            'passed_attempt' => $passedAttempt ? $this->formatAttempt($passedAttempt) : null,
            'locked_reason' => $gatePassed ? null : $lockedReason,
            'locked_message' => $gatePassed ? null : $lockedMessage,
        ];
    }

    public function lessonGatePassed(int $userId, Lesson $lesson): bool
    {
        return $this->lessonGateStatus($userId, $lesson)['gate_passed'];
    }

    /**
     * @return array<string, mixed>
     */
    public function sectionStatus(Enrollment $enrollment, CourseSection $section): array
    {
        $lessons = $section->lessons()
            ->where('is_published', true)
            ->with('quiz.questions.options')
            ->get();

        $lessonStatuses = $lessons
            ->map(fn (Lesson $lesson): array => $this->lessonGateStatus($enrollment->user_id, $lesson));
        $totalLessons = $lessons->count();
        $completedLessons = $lessonStatuses
            ->where('gate_passed', true)
            ->count();
        $sectionCompleted = $totalLessons > 0 && $completedLessons >= $totalLessons;
        $firstLocked = $lessonStatuses
            ->first(fn (array $status): bool => ! $status['gate_passed']);

        return [
            'section_id' => $section->id,
            'course_id' => $section->course_id,
            'total_lessons' => $totalLessons,
            'completed_lessons' => $completedLessons,
            'progress_percentage' => $totalLessons > 0
                ? (int) round(($completedLessons / $totalLessons) * 100)
                : 0,
            'section_completed' => $sectionCompleted,
            'certificate_unlocked' => $sectionCompleted,
            'locked_reason' => $sectionCompleted ? null : ($firstLocked['locked_reason'] ?? 'section_incomplete'),
            'locked_message' => $sectionCompleted
                ? null
                : ($firstLocked['locked_message'] ?? 'Complete every lesson quiz in this section.'),
            'lessons' => $lessonStatuses->values(),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function sectionStatusesForEnrollment(Enrollment $enrollment): Collection
    {
        return CourseSection::query()
            ->where('course_id', $enrollment->course_id)
            ->with([
                'lessons' => function ($query) {
                    $query->where('is_published', true);
                },
                'lessons.quiz.questions.options'
            ])
            ->orderBy('order')
            ->orderBy('id')
            ->get()
            ->map(fn (CourseSection $section): array => $this->sectionStatus($enrollment, $section));
    }

    /**
     * @return array<string, mixed>
     */
    public function statusForEnrollment(Enrollment $enrollment): array
    {
        $quiz = $this->activeQuizForCourse($enrollment->course_id);
        $latestAttempt = null;
        $passedAttempt = null;
        $attemptsCount = 0;
        $quizReady = true;
        $sectionStatuses = $this->sectionStatusesForEnrollment($enrollment);
        $totalLessons = $sectionStatuses->sum('total_lessons');
        $completedLessons = $sectionStatuses->sum('completed_lessons');

        if ($quiz) {
            $quizReady = $this->isReady($quiz);
            $attempts = QuizAttempt::query()
                ->where('user_id', $enrollment->user_id)
                ->where('quiz_id', $quiz->id);
            $attemptsCount = (clone $attempts)->count();
            $latestAttempt = (clone $attempts)->latest('submitted_at')->first();
            $passedAttempt = $this->passedAttempt($enrollment->user_id, $quiz->id);
        }

        $progressComplete = $totalLessons > 0 && $completedLessons >= $totalLessons;
        $quizPassed = ! $quiz || $passedAttempt !== null;
        $certificateUnlocked = $progressComplete && $quizPassed;
        $lockedReason = null;
        $lockedMessage = null;

        if (! $progressComplete) {
            $firstLockedSection = $sectionStatuses
                ->first(fn (array $status): bool => ! $status['section_completed']);
            $lockedReason = $firstLockedSection['locked_reason'] ?? 'course_incomplete';
            $lockedMessage = $firstLockedSection['locked_message']
                ?? 'Every lesson video and lesson quiz must be completed before a certificate is issued.';
        } elseif ($quiz && ! $quizReady) {
            $lockedReason = 'quiz_not_ready';
            $lockedMessage = 'The active course quiz is not ready yet.';
        } elseif ($quiz && ! $passedAttempt) {
            $lockedReason = 'quiz_not_passed';
            $lockedMessage = 'The certificate is locked until the course quiz is passed.';
        }

        return [
            'course_id' => $enrollment->course_id,
            'progress_percentage' => $totalLessons > 0
                ? (int) round(($completedLessons / $totalLessons) * 100)
                : 0,
            'course_completed' => $progressComplete,
            'completed_lessons' => $completedLessons,
            'total_lessons' => $totalLessons,
            'has_active_quiz' => $quiz !== null,
            'quiz_id' => $quiz?->id,
            'quiz_title' => $quiz?->title,
            'passing_score' => $quiz?->passing_score,
            'quiz_ready' => $quizReady,
            'quiz_passed' => $quizPassed,
            'can_take_quiz' => $progressComplete && $quiz !== null && $quizReady && ! $passedAttempt,
            'attempts_count' => $attemptsCount,
            'latest_attempt' => $latestAttempt ? $this->formatAttempt($latestAttempt) : null,
            'passed_attempt' => $passedAttempt ? $this->formatAttempt($passedAttempt) : null,
            'certificate_unlocked' => $certificateUnlocked,
            'locked_reason' => $lockedReason,
            'locked_message' => $lockedMessage,
            'sections' => $sectionStatuses->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function formatAttempt(QuizAttempt $attempt): array
    {
        return [
            'id' => $attempt->id,
            'quiz_id' => $attempt->quiz_id,
            'course_id' => $attempt->course_id,
            'lesson_id' => $attempt->lesson_id,
            'score' => $attempt->score,
            'total_points' => $attempt->total_points,
            'percentage' => (float) $attempt->percentage,
            'passed' => $attempt->passed,
            'submitted_at' => $attempt->submitted_at,
        ];
    }
}
