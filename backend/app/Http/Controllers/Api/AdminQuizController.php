<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\AuthorizesInstructorCourseOwnership;
use App\Http\Requests\Quizzes\StoreQuizOptionRequest;
use App\Http\Requests\Quizzes\StoreQuizQuestionRequest;
use App\Http\Requests\Quizzes\StoreQuizRequest;
use App\Http\Requests\Quizzes\UpdateQuizOptionRequest;
use App\Http\Requests\Quizzes\UpdateQuizQuestionRequest;
use App\Http\Requests\Quizzes\UpdateQuizRequest;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Services\QuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminQuizController extends Controller
{
    use AuthorizesInstructorCourseOwnership;

    public function __construct(
        private readonly QuizService $quizService,
    ) {}

    public function show(Request $request, Course $course): JsonResponse
    {
        $this->authorizeCourseOwnership($request, $course);

        $quiz = $course->quiz()
            ->with('questions.options')
            ->first();

        return response()->json([
            'data' => $quiz ? $this->formatQuiz($quiz) : null,
        ]);
    }

    public function store(StoreQuizRequest $request, Course $course): JsonResponse
    {
        $this->authorizeCourseOwnership($request, $course);

        if ($course->quiz()->exists()) {
            return response()->json([
                'message' => 'This course already has a quiz.',
            ], 409);
        }

        $quiz = $course->quiz()->create($request->validated());

        return response()->json([
            'message' => 'Quiz created successfully.',
            'data' => $this->formatQuiz($quiz->load('questions.options')),
        ], 201);
    }

    public function showLesson(Request $request, Lesson $lesson): JsonResponse
    {
        $lesson->load('section.course');
        $this->authorizeCourseOwnership($request, $lesson->section->course);

        $quiz = $lesson->quiz()
            ->with('questions.options')
            ->first();

        return response()->json([
            'data' => $quiz ? $this->formatQuiz($quiz) : null,
        ]);
    }

    public function storeLesson(StoreQuizRequest $request, Lesson $lesson): JsonResponse
    {
        $lesson->load('section.course');
        $this->authorizeCourseOwnership($request, $lesson->section->course);

        if ($lesson->quiz()->exists()) {
            return response()->json([
                'message' => 'This lesson already has a quiz.',
            ], 409);
        }

        $quiz = $lesson->quiz()->create([
            ...$request->validated(),
            'course_id' => $lesson->section->course_id,
        ]);

        return response()->json([
            'message' => 'Lesson quiz created successfully.',
            'data' => $this->formatQuiz($quiz->load('questions.options')),
        ], 201);
    }

    public function update(UpdateQuizRequest $request, Quiz $quiz): JsonResponse
    {
        $this->authorizeCourseOwnership($request, $quiz->course);
        $quiz->update($request->validated());

        return response()->json([
            'message' => 'Quiz updated successfully.',
            'data' => $this->formatQuiz($quiz->refresh()->load('questions.options')),
        ]);
    }

    public function destroy(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorizeCourseOwnership($request, $quiz->course);
        $quiz->delete();

        return response()->json([
            'message' => 'Quiz deleted successfully.',
        ]);
    }

    public function storeQuestion(StoreQuizQuestionRequest $request, Quiz $quiz): JsonResponse
    {
        $this->authorizeCourseOwnership($request, $quiz->course);
        $validated = $request->validated();
        $options = $validated['options'];
        unset($validated['options']);

        $question = DB::transaction(function () use ($quiz, $validated, $options): QuizQuestion {
            $question = $quiz->questions()->create($validated);
            $question->options()->createMany($options);

            return $question;
        });

        return response()->json([
            'message' => 'Quiz question created successfully.',
            'data' => $this->formatQuestion($question->load('options')),
        ], 201);
    }

    public function updateQuestion(
        UpdateQuizQuestionRequest $request,
        QuizQuestion $question,
    ): JsonResponse {
        $this->authorizeCourseOwnership($request, $question->quiz->course);
        $question->update($request->validated());

        return response()->json([
            'message' => 'Quiz question updated successfully.',
            'data' => $this->formatQuestion($question->refresh()->load('options')),
        ]);
    }

    public function destroyQuestion(Request $request, QuizQuestion $question): JsonResponse
    {
        $this->authorizeCourseOwnership($request, $question->quiz->course);
        $question->delete();

        return response()->json([
            'message' => 'Quiz question deleted successfully.',
        ]);
    }

    public function storeOption(
        StoreQuizOptionRequest $request,
        QuizQuestion $question,
    ): JsonResponse {
        $this->authorizeCourseOwnership($request, $question->quiz->course);
        $validated = $request->validated();

        $option = DB::transaction(function () use ($question, $validated): QuizOption {
            if ($validated['is_correct'] ?? false) {
                $question->options()->update(['is_correct' => false]);
            }

            return $question->options()->create($validated);
        });

        return response()->json([
            'message' => 'Quiz option created successfully.',
            'data' => $this->formatOption($option),
        ], 201);
    }

    public function updateOption(
        UpdateQuizOptionRequest $request,
        QuizOption $option,
    ): JsonResponse {
        $this->authorizeCourseOwnership($request, $option->question->quiz->course);
        $validated = $request->validated();

        if (
            $option->is_correct
            && array_key_exists('is_correct', $validated)
            && ! $validated['is_correct']
        ) {
            return response()->json([
                'message' => 'Mark another option as correct before changing the current correct option.',
            ], 422);
        }

        DB::transaction(function () use ($option, $validated): void {
            if ($validated['is_correct'] ?? false) {
                $option->question->options()
                    ->whereKeyNot($option->id)
                    ->update(['is_correct' => false]);
            }

            $option->update($validated);
        });

        return response()->json([
            'message' => 'Quiz option updated successfully.',
            'data' => $this->formatOption($option->refresh()),
        ]);
    }

    public function destroyOption(Request $request, QuizOption $option): JsonResponse
    {
        $this->authorizeCourseOwnership($request, $option->question->quiz->course);
        if ($option->question->options()->count() <= 2) {
            return response()->json([
                'message' => 'Each question must keep at least two options.',
            ], 422);
        }

        if ($option->is_correct) {
            return response()->json([
                'message' => 'Mark another option as correct before deleting this option.',
            ], 422);
        }

        $option->delete();

        return response()->json([
            'message' => 'Quiz option deleted successfully.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatQuiz(Quiz $quiz): array
    {
        $quiz->loadMissing(['lesson', 'questions.options']);

        return [
            'id' => $quiz->id,
            'course_id' => $quiz->course_id,
            'lesson_id' => $quiz->lesson_id,
            'lesson_title' => $quiz->lesson?->title,
            'section_id' => $quiz->lesson?->section_id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'passing_score' => $quiz->passing_score,
            'is_active' => $quiz->is_active,
            'is_ready' => $this->quizService->isReady($quiz),
            'questions' => $quiz->questions
                ->map(fn (QuizQuestion $question): array => $this->formatQuestion($question))
                ->values(),
            'created_at' => $quiz->created_at,
            'updated_at' => $quiz->updated_at,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatQuestion(QuizQuestion $question): array
    {
        $question->loadMissing('options');

        return [
            'id' => $question->id,
            'quiz_id' => $question->quiz_id,
            'question_text' => $question->question_text,
            'type' => $question->type,
            'points' => $question->points,
            'order' => $question->order,
            'options' => $question->options
                ->map(fn (QuizOption $option): array => $this->formatOption($option))
                ->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatOption(QuizOption $option): array
    {
        return [
            'id' => $option->id,
            'question_id' => $option->question_id,
            'option_text' => $option->option_text,
            'is_correct' => $option->is_correct,
            'order' => $option->order,
        ];
    }
}
