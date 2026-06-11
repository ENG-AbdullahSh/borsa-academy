<?php

use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->student = User::factory()->create([
        'role' => 'student',
        'status' => 'active',
    ]);

    $this->course = Course::create([
        'title' => 'Progress Test Course',
        'slug' => 'progress-test-course',
        'short_description' => 'A course used to test lesson progress.',
        'description' => 'A complete course description for progress tests.',
        'price' => 0,
        'level' => 'beginner',
        'category' => 'Testing',
        'instructor_name' => 'Test Instructor',
        'duration_hours' => 2,
        'status' => 'published',
    ]);

    $section = CourseSection::create([
        'course_id' => $this->course->id,
        'title' => 'Test Section',
        'order' => 1,
    ]);

    $this->firstLesson = Lesson::create([
        'section_id' => $section->id,
        'title' => 'First Lesson',
        'duration_minutes' => 10,
        'order' => 1,
    ]);

    $this->secondLesson = Lesson::create([
        'section_id' => $section->id,
        'title' => 'Second Lesson',
        'duration_minutes' => 10,
        'order' => 2,
    ]);
});

function createLessonQuiz($test, Lesson $lesson): array
{
    Sanctum::actingAs($test->admin);

    $quiz = $test->postJson("/api/admin/lessons/{$lesson->id}/quiz", [
        'title' => 'Checkpoint',
        'description' => 'Pass to continue.',
        'passing_score' => 70,
        'is_active' => true,
    ])->assertCreated()->json('data');

    $question = $test->postJson("/api/admin/quizzes/{$quiz['id']}/questions", [
        'question_text' => 'Correct answer?',
        'points' => 1,
        'order' => 1,
        'options' => [
            ['option_text' => 'Yes', 'is_correct' => true, 'order' => 1],
            ['option_text' => 'No', 'is_correct' => false, 'order' => 2],
        ],
    ])->assertCreated()->json('data');

    return compact('quiz', 'question');
}

test('a student can complete lessons and undo completion', function () {
    $firstQuiz = createLessonQuiz($this, $this->firstLesson);
    $secondQuiz = createLessonQuiz($this, $this->secondLesson);
    $enrollment = Enrollment::create([
        'user_id' => $this->student->id,
        'course_id' => $this->course->id,
        'enrolled_at' => now(),
    ]);

    Sanctum::actingAs($this->student);

    $this->postJson("/api/lessons/{$this->firstLesson->id}/complete")
        ->assertOk()
        ->assertJson([
            'success' => true,
            'course_id' => $this->course->id,
            'lesson_id' => $this->firstLesson->id,
            'completed_lessons' => 0,
            'total_lessons' => 2,
            'progress_percentage' => 0,
            'course_completed' => false,
        ]);

    expect($enrollment->refresh())
        ->progress->toBe(0)
        ->completed->toBeFalse();

    $this->postJson("/api/lessons/{$this->firstLesson->id}/quiz/submit", [
        'answers' => [
            [
                'question_id' => $firstQuiz['question']['id'],
                'option_id' => $firstQuiz['question']['options'][0]['id'],
            ],
        ],
    ])->assertCreated()
        ->assertJsonPath('progress_percentage', 50)
        ->assertJsonPath('lesson_quiz_status.gate_passed', true);

    expect($enrollment->refresh())
        ->progress->toBe(50)
        ->completed->toBeFalse();

    $this->postJson("/api/lessons/{$this->secondLesson->id}/complete")
        ->assertOk()
        ->assertJson([
            'completed_lessons' => 1,
            'total_lessons' => 2,
            'progress_percentage' => 50,
            'course_completed' => false,
        ]);

    expect($enrollment->refresh())
        ->progress->toBe(50)
        ->completed->toBeFalse();

    $this->postJson("/api/lessons/{$this->secondLesson->id}/quiz/submit", [
        'answers' => [
            [
                'question_id' => $secondQuiz['question']['id'],
                'option_id' => $secondQuiz['question']['options'][0]['id'],
            ],
        ],
    ])->assertCreated()
        ->assertJsonPath('progress_percentage', 100)
        ->assertJsonPath('course_completed', true);

    expect($enrollment->refresh())
        ->progress->toBe(100)
        ->completed->toBeTrue();

    expect(Certificate::query()
        ->where('user_id', $this->student->id)
        ->where('course_id', $this->course->id)
        ->count())->toBe(2);

    $this->deleteJson("/api/lessons/{$this->secondLesson->id}/complete")
        ->assertOk()
        ->assertJson([
            'completed_lessons' => 1,
            'total_lessons' => 2,
            'progress_percentage' => 50,
            'course_completed' => false,
        ]);

    expect($enrollment->refresh())
        ->progress->toBe(50)
        ->completed->toBeFalse();
});

test('course and overall progress endpoints return synchronized statistics', function () {
    $firstQuiz = createLessonQuiz($this, $this->firstLesson);
    Enrollment::create([
        'user_id' => $this->student->id,
        'course_id' => $this->course->id,
        'enrolled_at' => now(),
    ]);

    Sanctum::actingAs($this->student);
    $this->postJson("/api/lessons/{$this->firstLesson->id}/complete")->assertOk();
    $this->postJson("/api/lessons/{$this->firstLesson->id}/quiz/submit", [
        'answers' => [
            [
                'question_id' => $firstQuiz['question']['id'],
                'option_id' => $firstQuiz['question']['options'][0]['id'],
            ],
        ],
    ])->assertCreated();

    $this->getJson("/api/my-courses/{$this->course->id}/progress")
        ->assertOk()
        ->assertJson([
            'success' => true,
            'course_id' => $this->course->id,
            'completed_lessons' => 1,
            'total_lessons' => 2,
            'progress_percentage' => 50,
            'course_completed' => false,
            'completed_lesson_ids' => [$this->firstLesson->id],
        ]);

    $this->getJson('/api/my-progress')
        ->assertOk()
        ->assertJsonPath('summary.total_enrolled_courses', 1)
        ->assertJsonPath('summary.completed_courses', 0)
        ->assertJsonPath('summary.in_progress_courses', 1)
        ->assertJsonPath('summary.overall_learning_progress', 50);
});

test('lesson completion is blocked for unauthenticated and non-enrolled students', function () {
    $this->postJson("/api/lessons/{$this->firstLesson->id}/complete")
        ->assertUnauthorized();

    Sanctum::actingAs($this->student);

    $this->postJson("/api/lessons/{$this->firstLesson->id}/complete")
        ->assertForbidden()
        ->assertJson([
            'success' => false,
            'message' => 'يجب الاشتراك في الدورة أولاً.',
        ]);
});

test('missing lessons and non-student roles are rejected', function () {
    Enrollment::create([
        'user_id' => $this->student->id,
        'course_id' => $this->course->id,
        'enrolled_at' => now(),
    ]);

    Sanctum::actingAs($this->student);

    $this->postJson('/api/lessons/999999/complete')
        ->assertNotFound()
        ->assertJson([
            'success' => false,
            'message' => 'الدرس غير موجود.',
        ]);

    $admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    Sanctum::actingAs($admin);

    $this->postJson("/api/lessons/{$this->firstLesson->id}/complete")
        ->assertForbidden();
});
