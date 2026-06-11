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
        'name' => 'Certificate Student',
        'role' => 'student',
        'status' => 'active',
    ]);

    $this->course = Course::create([
        'title' => 'Certificate Course',
        'slug' => 'certificate-course',
        'short_description' => 'A course used to test certificates.',
        'description' => 'A complete course description for certificate tests.',
        'price' => 0,
        'level' => 'beginner',
        'category' => 'Testing',
        'instructor_name' => 'Test Instructor',
        'duration_hours' => 1,
        'status' => 'published',
    ]);

    $section = CourseSection::create([
        'course_id' => $this->course->id,
        'title' => 'Certificate Section',
        'order' => 1,
    ]);

    $this->lesson = Lesson::create([
        'section_id' => $section->id,
        'title' => 'Final Lesson',
        'duration_minutes' => 10,
        'order' => 1,
    ]);

    $this->enrollment = Enrollment::create([
        'user_id' => $this->student->id,
        'course_id' => $this->course->id,
        'enrolled_at' => now(),
    ]);
});

function createAndPassLessonQuiz($test): void
{
    Sanctum::actingAs($test->admin);

    $quiz = $test->postJson("/api/admin/lessons/{$test->lesson->id}/quiz", [
        'title' => 'Certificate Gate',
        'description' => 'Pass to unlock certificates.',
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

    Sanctum::actingAs($test->student);
    $test->postJson("/api/lessons/{$test->lesson->id}/complete")->assertOk();
    $test->postJson("/api/lessons/{$test->lesson->id}/quiz/submit", [
        'answers' => [
            [
                'question_id' => $question['id'],
                'option_id' => $question['options'][0]['id'],
            ],
        ],
    ])->assertCreated();
}

test('completing the final lesson quiz issues section and course certificates', function () {
    createAndPassLessonQuiz($this);

    $courseCertificate = Certificate::query()->where('scope_type', 'course')->sole();
    $sectionCertificate = Certificate::query()->where('scope_type', 'section')->sole();

    expect($courseCertificate->user_id)->toBe($this->student->id)
        ->and($courseCertificate->course_id)->toBe($this->course->id)
        ->and($courseCertificate->certificate_number)->toStartWith('BA-')
        ->and($courseCertificate->issued_at)->not->toBeNull()
        ->and($sectionCertificate->section_id)->toBe($this->lesson->section_id);
});

test('a student can list and view only their certificates', function () {
    createAndPassLessonQuiz($this);

    Sanctum::actingAs($this->student);

    $certificateId = $this->getJson("/api/my-courses/{$this->course->id}/certificate")
        ->assertOk()
        ->assertJsonPath('data.student_name', $this->student->name)
        ->assertJsonPath('data.course_title', $this->course->title)
        ->assertJsonPath('data.progress_percentage', 100)
        ->assertJsonPath('data.verification_url', fn ($value) => is_string($value) && $value !== '')
        ->json('data.id');

    $this->getJson('/api/my-certificates')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $certificateId);

    $this->getJson("/api/my-certificates/{$certificateId}")
        ->assertOk()
        ->assertJsonPath('data.certificate_number', Certificate::findOrFail($certificateId)->certificate_number);

    $otherStudent = User::factory()->create(['role' => 'student']);
    Sanctum::actingAs($otherStudent);

    $this->getJson("/api/my-certificates/{$certificateId}")->assertNotFound();
});

test('a certificate requires a completed enrollment', function () {
    Sanctum::actingAs($this->student);

    $this->getJson("/api/my-courses/{$this->course->id}/certificate")
        ->assertStatus(423)
        ->assertJsonPath('locked_reason', 'lesson_quiz_missing');

    expect(Certificate::query()->count())->toBe(0);

    $otherStudent = User::factory()->create(['role' => 'student']);
    Sanctum::actingAs($otherStudent);

    $this->getJson("/api/my-courses/{$this->course->id}/certificate")
        ->assertForbidden();
});

test('admins can list certificates and students cannot use the admin endpoint', function () {
    createAndPassLessonQuiz($this);

    Sanctum::actingAs($this->student);
    $this->getJson("/api/my-courses/{$this->course->id}/certificate")->assertOk();
    $this->getJson('/api/admin/certificates')->assertForbidden();

    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $this->getJson('/api/admin/certificates')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.student_name', $this->student->name)
        ->assertJsonPath('data.0.course_title', $this->course->title);

    $this->getJson('/api/admin/dashboard')
        ->assertOk()
        ->assertJsonPath('stats.total_certificates', 2);
});
