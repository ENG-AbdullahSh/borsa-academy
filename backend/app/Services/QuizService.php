<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\Quiz;
use App\Models\QuizAttempt;

class QuizService
{
    public function activeQuizForCourse(int $courseId): ?Quiz
    {
        return Quiz::query()
            ->where('course_id', $courseId)
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
    public function statusForEnrollment(Enrollment $enrollment): array
    {
        $quiz = $this->activeQuizForCourse($enrollment->course_id);
        $latestAttempt = null;
        $passedAttempt = null;
        $attemptsCount = 0;
        $quizReady = true;

        if ($quiz) {
            $quizReady = $this->isReady($quiz);
            $attempts = QuizAttempt::query()
                ->where('user_id', $enrollment->user_id)
                ->where('quiz_id', $quiz->id);
            $attemptsCount = (clone $attempts)->count();
            $latestAttempt = (clone $attempts)->latest('submitted_at')->first();
            $passedAttempt = $this->passedAttempt($enrollment->user_id, $quiz->id);
        }

        $progressComplete = $enrollment->progress === 100 && $enrollment->completed;
        $quizPassed = ! $quiz || $passedAttempt !== null;
        $certificateUnlocked = $progressComplete && $quizPassed;
        $lockedReason = null;
        $lockedMessage = null;

        if (! $progressComplete) {
            $lockedReason = 'course_incomplete';
            $lockedMessage = 'The course must be completed before a certificate is issued.';
        } elseif ($quiz && ! $quizReady) {
            $lockedReason = 'quiz_not_ready';
            $lockedMessage = 'The active course quiz is not ready yet.';
        } elseif ($quiz && ! $passedAttempt) {
            $lockedReason = 'quiz_not_passed';
            $lockedMessage = 'The certificate is locked until the course quiz is passed.';
        }

        return [
            'course_id' => $enrollment->course_id,
            'progress_percentage' => $enrollment->progress,
            'course_completed' => $enrollment->completed,
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
            'score' => $attempt->score,
            'total_points' => $attempt->total_points,
            'percentage' => (float) $attempt->percentage,
            'passed' => $attempt->passed,
            'submitted_at' => $attempt->submitted_at,
        ];
    }
}
