<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quizzes\SubmitQuizRequest;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Services\CertificateService;
use App\Services\QuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    public function __construct(
        private readonly QuizService $quizService,
        private readonly CertificateService $certificateService,
    ) {}

    public function show(Request $request, Course $course): JsonResponse
    {
        $enrollment = $this->enrollment($request, $course);

        if (! $enrollment) {
            return $this->notEnrolledResponse();
        }

        if ($enrollment->progress !== 100 || ! $enrollment->completed) {
            return response()->json([
                'message' => 'Complete the course before opening its quiz.',
            ], 403);
        }

        $quiz = $this->activeQuiz($course);

        if (! $quiz) {
            return response()->json([
                'message' => 'This course does not have an active quiz.',
            ], 404);
        }

        if (! $this->quizService->isReady($quiz)) {
            return response()->json([
                'message' => 'The active course quiz is not ready yet.',
            ], 422);
        }

        $passedAttempt = $this->quizService->passedAttempt($request->user()->id, $quiz->id);

        return response()->json([
            'data' => $this->formatStudentQuiz($quiz),
            'passed_attempt' => $passedAttempt
                ? $this->quizService->formatAttempt($passedAttempt)
                : null,
        ]);
    }

    public function submit(
        SubmitQuizRequest $request,
        Course $course,
    ): JsonResponse {
        $enrollment = $this->enrollment($request, $course);

        if (! $enrollment) {
            return $this->notEnrolledResponse();
        }

        if ($enrollment->progress !== 100 || ! $enrollment->completed) {
            return response()->json([
                'message' => 'Complete the course before submitting its quiz.',
            ], 403);
        }

        $quiz = $this->activeQuiz($course);

        if (! $quiz) {
            return response()->json([
                'message' => 'This course does not have an active quiz.',
            ], 404);
        }

        if (! $this->quizService->isReady($quiz)) {
            return response()->json([
                'message' => 'The active course quiz is not ready yet.',
            ], 422);
        }

        $passedAttempt = $this->quizService->passedAttempt($request->user()->id, $quiz->id);

        if ($passedAttempt) {
            $certificate = $this->certificateService->issueForEnrollment($enrollment);

            return response()->json([
                'message' => 'The course quiz has already been passed.',
                'already_passed' => true,
                'attempt' => $this->quizService->formatAttempt($passedAttempt),
                'certificate_id' => $certificate?->id,
                'certificate_unlocked' => $certificate !== null,
            ]);
        }

        $submittedAnswers = collect($request->validated('answers'))
            ->keyBy('question_id');
        $questionIds = $quiz->questions->pluck('id');

        if (
            $submittedAnswers->count() !== $quiz->questions->count()
            || $questionIds->diff($submittedAnswers->keys())->isNotEmpty()
            || $submittedAnswers->keys()->diff($questionIds)->isNotEmpty()
        ) {
            return response()->json([
                'message' => 'Every quiz question must be answered exactly once.',
            ], 422);
        }

        $gradedAnswers = [];
        $score = 0;
        $totalPoints = $quiz->questions->sum('points');

        foreach ($quiz->questions as $question) {
            $submitted = $submittedAnswers->get($question->id);
            $option = $question->options->firstWhere('id', (int) $submitted['option_id']);

            if (! $option) {
                return response()->json([
                    'message' => 'One or more selected options do not belong to their questions.',
                ], 422);
            }

            $isCorrect = $option->is_correct;
            $pointsAwarded = $isCorrect ? $question->points : 0;
            $score += $pointsAwarded;
            $gradedAnswers[] = [
                'question_id' => $question->id,
                'option_id' => $option->id,
                'is_correct' => $isCorrect,
                'points_awarded' => $pointsAwarded,
            ];
        }

        $percentage = $totalPoints > 0
            ? round(($score / $totalPoints) * 100, 2)
            : 0;
        $passed = $percentage >= $quiz->passing_score;

        $attempt = DB::transaction(function () use (
            $request,
            $quiz,
            $course,
            $score,
            $totalPoints,
            $percentage,
            $passed,
            $gradedAnswers,
        ): QuizAttempt {
            $attempt = QuizAttempt::create([
                'user_id' => $request->user()->id,
                'quiz_id' => $quiz->id,
                'course_id' => $course->id,
                'score' => $score,
                'total_points' => $totalPoints,
                'percentage' => $percentage,
                'passed' => $passed,
                'submitted_at' => now(),
            ]);
            $attempt->answers()->createMany($gradedAnswers);

            return $attempt;
        });

        $certificate = $passed
            ? $this->certificateService->issueForEnrollment($enrollment)
            : null;

        return response()->json([
            'message' => $passed ? 'Quiz passed successfully.' : 'The passing score was not achieved.',
            'already_passed' => false,
            'attempt' => $this->quizService->formatAttempt($attempt),
            'certificate_id' => $certificate?->id,
            'certificate_unlocked' => $certificate !== null,
        ], 201);
    }

    public function attempts(Request $request): JsonResponse
    {
        $attempts = $request->user()
            ->quizAttempts()
            ->with(['quiz:id,title,passing_score', 'course:id,title'])
            ->latest('submitted_at')
            ->get()
            ->map(fn (QuizAttempt $attempt): array => [
                ...$this->quizService->formatAttempt($attempt),
                'quiz_title' => $attempt->quiz?->title,
                'passing_score' => $attempt->quiz?->passing_score,
                'course_title' => $attempt->course?->title,
            ])
            ->values();

        return response()->json([
            'data' => $attempts,
        ]);
    }

    public function status(Request $request, Course $course): JsonResponse
    {
        $enrollment = $this->enrollment($request, $course);

        if (! $enrollment) {
            return $this->notEnrolledResponse();
        }

        $status = $this->quizService->statusForEnrollment($enrollment);
        $certificate = $request->user()
            ->certificates()
            ->where('course_id', $course->id)
            ->first();

        return response()->json([
            'data' => [
                ...$status,
                'certificate_id' => $status['certificate_unlocked'] ? $certificate?->id : null,
            ],
        ]);
    }

    private function enrollment(Request $request, Course $course): ?Enrollment
    {
        return $request->user()
            ->enrollments()
            ->where('course_id', $course->id)
            ->first();
    }

    private function activeQuiz(Course $course): ?Quiz
    {
        return $course->quiz()
            ->where('is_active', true)
            ->with('questions.options')
            ->first();
    }

    /**
     * @return array<string, mixed>
     */
    private function formatStudentQuiz(Quiz $quiz): array
    {
        return [
            'id' => $quiz->id,
            'course_id' => $quiz->course_id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'passing_score' => $quiz->passing_score,
            'questions' => $quiz->questions
                ->map(fn (QuizQuestion $question): array => [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'type' => $question->type,
                    'points' => $question->points,
                    'order' => $question->order,
                    'options' => $question->options
                        ->map(fn ($option): array => [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                            'order' => $option->order,
                        ])
                        ->values(),
                ])
                ->values(),
        ];
    }

    private function notEnrolledResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'You are not enrolled in this course.',
        ], 403);
    }
}
