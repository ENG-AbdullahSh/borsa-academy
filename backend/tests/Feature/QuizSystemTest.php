<?php

use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->student = User::factory()->create(['role' => 'student']);
    $this->course = Course::create([
        'title' => 'Quiz Test Course',
        'slug' => 'quiz-test-course',
        'short_description' => 'A course used to test quizzes.',
        'description' => 'A complete course description for quiz tests.',
        'price' => 0,
        'level' => 'beginner',
        'category' => 'Testing',
        'instructor_name' => 'Test Instructor',
        'duration_hours' => 1,
        'status' => 'published',
    ]);
    $section = CourseSection::create([
        'course_id' => $this->course->id,
        'title' => 'Quiz Section',
        'order' => 1,
    ]);
    $this->lesson = Lesson::create([
        'section_id' => $section->id,
        'title' => 'Only Lesson',
        'duration_minutes' => 10,
        'order' => 1,
    ]);
    $this->enrollment = Enrollment::create([
        'user_id' => $this->student->id,
        'course_id' => $this->course->id,
        'enrolled_at' => now(),
    ]);
});

function createQuizThroughApi($test): array
{
    Sanctum::actingAs($test->admin);

    $quiz = $test->postJson("/api/admin/courses/{$test->course->id}/quiz", [
        'title' => 'Final Course Quiz',
        'description' => 'Pass this quiz to unlock the certificate.',
        'passing_score' => 70,
        'is_active' => true,
    ])->assertCreated()->json('data');

    $firstQuestion = $test->postJson("/api/admin/quizzes/{$quiz['id']}/questions", [
        'question_text' => 'What protects trading capital?',
        'points' => 2,
        'order' => 1,
        'options' => [
            ['option_text' => 'Stop loss', 'is_correct' => true, 'order' => 1],
            ['option_text' => 'Higher leverage', 'is_correct' => false, 'order' => 2],
        ],
    ])->assertCreated()->json('data');

    $secondQuestion = $test->postJson("/api/admin/quizzes/{$quiz['id']}/questions", [
        'question_text' => 'Which result completes the quiz?',
        'points' => 1,
        'order' => 2,
        'options' => [
            ['option_text' => 'A passing score', 'is_correct' => true, 'order' => 1],
            ['option_text' => 'Opening the page', 'is_correct' => false, 'order' => 2],
        ],
    ])->assertCreated()->json('data');

    return compact('quiz', 'firstQuestion', 'secondQuestion');
}

function createLessonQuizThroughApi($test, ?Lesson $lesson = null): array
{
    Sanctum::actingAs($test->admin);
    $lesson ??= $test->lesson;

    $quiz = $test->postJson("/api/admin/lessons/{$lesson->id}/quiz", [
        'title' => 'Lesson Checkpoint',
        'description' => 'Pass this quiz to unlock the next video.',
        'passing_score' => 70,
        'is_active' => true,
    ])->assertCreated()->json('data');

    $question = $test->postJson("/api/admin/quizzes/{$quiz['id']}/questions", [
        'question_text' => 'What unlocks the next lesson?',
        'points' => 1,
        'order' => 1,
        'options' => [
            ['option_text' => 'Passing this quiz', 'is_correct' => true, 'order' => 1],
            ['option_text' => 'Only opening the video', 'is_correct' => false, 'order' => 2],
        ],
    ])->assertCreated()->json('data');

    return compact('quiz', 'question');
}

function passLessonQuiz($test, array $lessonQuiz, ?Lesson $lesson = null): void
{
    $lesson ??= $test->lesson;
    Sanctum::actingAs($test->student);

    $test->postJson("/api/lessons/{$lesson->id}/complete")->assertOk();
    $test->postJson("/api/lessons/{$lesson->id}/quiz/submit", [
        'answers' => [
            [
                'question_id' => $lessonQuiz['question']['id'],
                'option_id' => $lessonQuiz['question']['options'][0]['id'],
            ],
        ],
    ])->assertCreated()
        ->assertJsonPath('attempt.passed', true);
}

test('admin can manage one valid quiz per course', function () {
    $data = createQuizThroughApi($this);

    $this->postJson("/api/admin/courses/{$this->course->id}/quiz", [
        'title' => 'Duplicate Quiz',
    ])->assertConflict();

    $this->getJson("/api/admin/courses/{$this->course->id}/quiz")
        ->assertOk()
        ->assertJsonPath('data.is_ready', true)
        ->assertJsonCount(2, 'data.questions')
        ->assertJsonPath('data.questions.0.options.0.is_correct', true);

    $this->putJson("/api/admin/quizzes/{$data['quiz']['id']}", [
        'passing_score' => 80,
        'is_active' => false,
    ])->assertOk()
        ->assertJsonPath('data.passing_score', 80)
        ->assertJsonPath('data.is_active', false);

    $wrongOption = $data['firstQuestion']['options'][1];
    $this->putJson("/api/admin/quiz-options/{$wrongOption['id']}", [
        'is_correct' => true,
    ])->assertOk()
        ->assertJsonPath('data.is_correct', true);

    $this->deleteJson("/api/admin/quiz-options/{$wrongOption['id']}")
        ->assertUnprocessable();
});

test('question creation requires two options and exactly one correct option', function () {
    Sanctum::actingAs($this->admin);
    $quiz = Quiz::create([
        'course_id' => $this->course->id,
        'title' => 'Validation Quiz',
    ]);

    $this->postJson("/api/admin/quizzes/{$quiz->id}/questions", [
        'question_text' => 'Invalid question',
        'options' => [
            ['option_text' => 'Only option', 'is_correct' => false],
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('options');

    $this->postJson("/api/admin/quizzes/{$quiz->id}/questions", [
        'question_text' => 'Two correct options',
        'options' => [
            ['option_text' => 'First', 'is_correct' => true],
            ['option_text' => 'Second', 'is_correct' => true],
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('options');
});

test('quiz stays locked until course completion and hides correct answers', function () {
    $lessonQuiz = createLessonQuizThroughApi($this);
    createQuizThroughApi($this);
    Sanctum::actingAs($this->student);

    $this->getJson("/api/courses/{$this->course->id}/quiz")
        ->assertForbidden();

    $this->postJson("/api/lessons/{$this->lesson->id}/complete")
        ->assertOk()
        ->assertJsonPath('progress_percentage', 0)
        ->assertJsonPath('lesson_quiz_status.can_take_quiz', true)
        ->assertJsonPath('certificate_id', null)
        ->assertJsonPath('certificate_status.locked_reason', 'lesson_quiz_not_passed');

    expect(Certificate::query()->where('scope_type', 'course')->count())->toBe(0);

    $lessonResponse = $this->getJson("/api/lessons/{$this->lesson->id}/quiz")
        ->assertOk()
        ->assertJsonPath('data.passing_score', 70)
        ->assertJsonCount(1, 'data.questions');

    expect(json_encode($lessonResponse->json('data')))->not->toContain('is_correct');

    $this->postJson("/api/lessons/{$this->lesson->id}/quiz/submit", [
        'answers' => [
            [
                'question_id' => $lessonQuiz['question']['id'],
                'option_id' => $lessonQuiz['question']['options'][0]['id'],
            ],
        ],
    ])->assertCreated()
        ->assertJsonPath('progress_percentage', 100)
        ->assertJsonPath('certificate_status.locked_reason', 'quiz_not_passed');

    $response = $this->getJson("/api/courses/{$this->course->id}/quiz")
        ->assertOk()
        ->assertJsonPath('data.passing_score', 70)
        ->assertJsonCount(2, 'data.questions');

    expect(json_encode($response->json('data')))->not->toContain('is_correct');

    $this->getJson("/api/my-courses/{$this->course->id}/certificate")
        ->assertStatus(423)
        ->assertJsonPath('locked_reason', 'quiz_not_passed');
});

test('failed attempts keep the certificate locked and a passing attempt unlocks it', function () {
    $lessonQuiz = createLessonQuizThroughApi($this);
    $data = createQuizThroughApi($this);
    passLessonQuiz($this, $lessonQuiz);
    Sanctum::actingAs($this->student);

    $this->postJson("/api/courses/{$this->course->id}/quiz/submit", [
        'answers' => [
            [
                'question_id' => $data['firstQuestion']['id'],
                'option_id' => $data['firstQuestion']['options'][1]['id'],
            ],
            [
                'question_id' => $data['secondQuestion']['id'],
                'option_id' => $data['secondQuestion']['options'][1]['id'],
            ],
        ],
    ])->assertCreated()
        ->assertJsonPath('attempt.passed', false)
        ->assertJsonPath('certificate_unlocked', false);

    expect(Certificate::query()->where('scope_type', 'course')->count())->toBe(0)
        ->and(Certificate::query()->where('scope_type', 'section')->count())->toBe(1);

    $passingResponse = $this->postJson("/api/courses/{$this->course->id}/quiz/submit", [
        'answers' => [
            [
                'question_id' => $data['firstQuestion']['id'],
                'option_id' => $data['firstQuestion']['options'][0]['id'],
            ],
            [
                'question_id' => $data['secondQuestion']['id'],
                'option_id' => $data['secondQuestion']['options'][0]['id'],
            ],
        ],
    ])->assertCreated()
        ->assertJsonPath('attempt.passed', true)
        ->assertJsonPath('attempt.percentage', 100)
        ->assertJsonPath('certificate_unlocked', true);

    $certificateId = $passingResponse->json('certificate_id');

    expect(Certificate::query()->where('scope_type', 'course')->count())->toBe(1)
        ->and(Certificate::query()->where('scope_type', 'section')->count())->toBe(1)
        ->and(QuizAttempt::query()->count())->toBe(3);

    $this->getJson("/api/my-courses/{$this->course->id}/quiz-status")
        ->assertOk()
        ->assertJsonPath('data.quiz_passed', true)
        ->assertJsonPath('data.certificate_unlocked', true)
        ->assertJsonPath('data.certificate_id', $certificateId);

    $this->getJson("/api/my-courses/{$this->course->id}/certificate")
        ->assertOk()
        ->assertJsonPath('data.id', $certificateId);

    $this->postJson("/api/courses/{$this->course->id}/quiz/submit", [
        'answers' => [
            [
                'question_id' => $data['firstQuestion']['id'],
                'option_id' => $data['firstQuestion']['options'][0]['id'],
            ],
            [
                'question_id' => $data['secondQuestion']['id'],
                'option_id' => $data['secondQuestion']['options'][0]['id'],
            ],
        ],
    ])->assertOk()
        ->assertJsonPath('already_passed', true)
        ->assertJsonPath('certificate_id', $certificateId);

    expect(QuizAttempt::query()->count())->toBe(3)
        ->and(Certificate::query()->where('scope_type', 'course')->count())->toBe(1);

    $this->getJson('/api/my-quiz-attempts')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

test('a completed course without an active quiz still issues a certificate', function () {
    $lessonQuiz = createLessonQuizThroughApi($this);
    Sanctum::actingAs($this->student);

    $this->postJson("/api/lessons/{$this->lesson->id}/complete")
        ->assertOk()
        ->assertJsonPath('certificate_status.certificate_unlocked', false);

    $this->postJson("/api/lessons/{$this->lesson->id}/quiz/submit", [
        'answers' => [
            [
                'question_id' => $lessonQuiz['question']['id'],
                'option_id' => $lessonQuiz['question']['options'][0]['id'],
            ],
        ],
    ])->assertCreated()
        ->assertJsonPath('certificate_status.has_active_quiz', false)
        ->assertJsonPath('certificate_status.certificate_unlocked', true);

    expect(Certificate::query()->where('scope_type', 'course')->count())->toBe(1)
        ->and(Certificate::query()->where('scope_type', 'section')->count())->toBe(1);
});
