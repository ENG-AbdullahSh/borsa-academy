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

test('completing the final lesson automatically issues one certificate', function () {
    Sanctum::actingAs($this->student);

    $response = $this->postJson("/api/lessons/{$this->lesson->id}/complete")
        ->assertOk()
        ->assertJsonPath('progress_percentage', 100)
        ->assertJsonPath('course_completed', true);

    $certificate = Certificate::query()->sole();

    expect($response->json('certificate_id'))->toBe($certificate->id)
        ->and($certificate->user_id)->toBe($this->student->id)
        ->and($certificate->course_id)->toBe($this->course->id)
        ->and($certificate->certificate_number)->toStartWith('BA-')
        ->and($certificate->issued_at)->not->toBeNull();

    $this->postJson("/api/lessons/{$this->lesson->id}/complete")
        ->assertOk()
        ->assertJsonPath('certificate_id', $certificate->id);

    expect(Certificate::query()->count())->toBe(1);
});

test('a student can list and view only their certificates', function () {
    $this->enrollment->update([
        'progress' => 100,
        'completed' => true,
    ]);

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
        ->assertJsonCount(1, 'data')
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
        ->assertUnprocessable()
        ->assertJsonPath('message', 'The course must be completed before a certificate is issued.');

    expect(Certificate::query()->count())->toBe(0);

    $otherStudent = User::factory()->create(['role' => 'student']);
    Sanctum::actingAs($otherStudent);

    $this->getJson("/api/my-courses/{$this->course->id}/certificate")
        ->assertForbidden();
});

test('admins can list certificates and students cannot use the admin endpoint', function () {
    $this->enrollment->update([
        'progress' => 100,
        'completed' => true,
    ]);

    Sanctum::actingAs($this->student);
    $this->getJson("/api/my-courses/{$this->course->id}/certificate")->assertOk();
    $this->getJson('/api/admin/certificates')->assertForbidden();

    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $this->getJson('/api/admin/certificates')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.student_name', $this->student->name)
        ->assertJsonPath('data.0.course_title', $this->course->title);

    $this->getJson('/api/admin/dashboard')
        ->assertOk()
        ->assertJsonPath('stats.total_certificates', 1);
});
