<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quizzes\SubmitQuizRequest;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Services\CertificateService;
use App\Services\CourseProgressService;
use App\Services\QuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    public function __construct(
        private readonly QuizService $quizService,
        private readonly CertificateService $certificateService,
        private readonly CourseProgressService $courseProgressService,
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

        return $this->submitQuizAttempt($request, $course, $quiz, $enrollment);
    }

    public function showLesson(Request $request, Lesson $lesson): JsonResponse
    {
        $lesson->load('section.course');
        $course = $lesson->section->course;
        $enrollment = $this->enrollment($request, $course);

        if (! $enrollment) {
            return $this->notEnrolledResponse();
        }

        if (! $this->videoCompleted($request, $lesson)) {
            return response()->json([
                'message' => 'Watch the lesson video before opening its quiz.',
            ], 403);
        }

        $quiz = $this->activeLessonQuiz($lesson);

        if (! $quiz) {
            return response()->json([
                'message' => 'This lesson does not have an active quiz.',
            ], 404);
        }

        if (! $this->quizService->isReady($quiz)) {
            return response()->json([
                'message' => 'The active lesson quiz is not ready yet.',
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

    public function submitLesson(
        SubmitQuizRequest $request,
        Lesson $lesson,
    ): JsonResponse {
        $lesson->load('section.course');
        $course = $lesson->section->course;
        $enrollment = $this->enrollment($request, $course);

        if (! $enrollment) {
            return $this->notEnrolledResponse();
        }

        if (! $this->videoCompleted($request, $lesson)) {
            return response()->json([
                'message' => 'Watch the lesson video before submitting its quiz.',
            ], 403);
        }

        $quiz = $this->activeLessonQuiz($lesson);

        if (! $quiz) {
            return response()->json([
                'message' => 'This lesson does not have an active quiz.',
            ], 404);
        }

        if (! $this->quizService->isReady($quiz)) {
            return response()->json([
                'message' => 'The active lesson quiz is not ready yet.',
            ], 422);
        }

        return $this->submitQuizAttempt($request, $course, $quiz, $enrollment, $lesson);
    }

    public function attempts(Request $request): JsonResponse
    {
        $attempts = $request->user()
            ->quizAttempts()
            ->with(['quiz:id,title,passing_score', 'course:id,title', 'lesson:id,title'])
            ->latest('submitted_at')
            ->get()
            ->map(fn (QuizAttempt $attempt): array => [
                ...$this->quizService->formatAttempt($attempt),
                'quiz_title' => $attempt->quiz?->title,
                'passing_score' => $attempt->quiz?->passing_score,
                'course_title' => $attempt->course?->title,
                'lesson_title' => $attempt->lesson?->title,
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
            ->where('scope_type', 'course')
            ->where('scope_id', $course->id)
            ->first();

        return response()->json([
            'data' => [
                ...$status,
                'certificate_id' => $status['certificate_unlocked'] ? $certificate?->id : null,
            ],
        ]);
    }

    private function submitQuizAttempt(
        SubmitQuizRequest $request,
        Course $course,
        Quiz $quiz,
        Enrollment $enrollment,
        ?Lesson $lesson = null,
    ): JsonResponse {
        $passedAttempt = $this->quizService->passedAttempt($request->user()->id, $quiz->id);

        if ($passedAttempt) {
            $progress = $this->courseProgressService->syncEnrollment($enrollment);

            return response()->json([
                'message' => $lesson
                    ? 'The lesson quiz has already been passed.'
                    : 'The course quiz has already been passed.',
                'already_passed' => true,
                'attempt' => $this->quizService->formatAttempt($passedAttempt),
                ...$this->progressPayload($progress, $lesson),
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
            $lesson,
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
                'lesson_id' => $lesson?->id,
                'score' => $score,
                'total_points' => $totalPoints,
                'percentage' => $percentage,
                'passed' => $passed,
                'submitted_at' => now(),
            ]);
            $attempt->answers()->createMany($gradedAnswers);

            return $attempt;
        });

        $progress = $passed
            ? $this->courseProgressService->syncEnrollment($enrollment)
            : $this->courseProgressService->syncEnrollment($enrollment);

        return response()->json([
            'message' => $passed ? 'Quiz passed successfully.' : 'The passing score was not achieved.',
            'already_passed' => false,
            'attempt' => $this->quizService->formatAttempt($attempt),
            ...$this->progressPayload($progress, $lesson),
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function progressPayload(array $progress, ?Lesson $lesson = null): array
    {
        $sectionCertificateId = null;
        $lessonStatus = null;

        if ($lesson) {
            $lessonStatus = $this->quizService->lessonGateStatus(
                request()->user()->id,
                $lesson,
            );
            $sectionCertificate = collect($progress['section_certificates'] ?? [])
                ->firstWhere('section_id', $lesson->section_id);
            $sectionCertificateId = $sectionCertificate['certificate_id'] ?? null;
        }

        return [
            'course_id' => $progress['course_id'],
            'lesson_id' => $lesson?->id,
            'section_id' => $lesson?->section_id,
            'completed_lessons' => $progress['completed_lessons'],
            'total_lessons' => $progress['total_lessons'],
            'progress_percentage' => $progress['progress_percentage'],
            'course_completed' => $progress['course_completed'],
            'certificate_id' => $progress['certificate_id'],
            'certificate_unlocked' => (bool) ($progress['certificate_status']['certificate_unlocked'] ?? false),
            'certificate_status' => $progress['certificate_status'],
            'lesson_quiz_status' => $lessonStatus,
            'section_certificate_id' => $sectionCertificateId,
            'section_statuses' => $progress['section_statuses'] ?? [],
        ];
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

    private function activeLessonQuiz(Lesson $lesson): ?Quiz
    {
        return $lesson->quiz()
            ->where('is_active', true)
            ->with('questions.options')
            ->first();
    }

    private function videoCompleted(Request $request, Lesson $lesson): bool
    {
        return LessonProgress::query()
            ->where('user_id', $request->user()->id)
            ->where('lesson_id', $lesson->id)
            ->where('completed', true)
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    private function formatStudentQuiz(Quiz $quiz): array
    {
        $quiz->loadMissing('lesson');

        return [
            'id' => $quiz->id,
            'course_id' => $quiz->course_id,
            'lesson_id' => $quiz->lesson_id,
            'section_id' => $quiz->lesson?->section_id,
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
