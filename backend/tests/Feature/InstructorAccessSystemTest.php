<?php

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Instructor;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function instructorCourse(Instructor $instructor, string $slug): Course
{
    return Course::create([
        'title' => "Course {$slug}",
        'slug' => $slug,
        'short_description' => 'Instructor access test course.',
        'description' => 'Instructor access test course description.',
        'price' => 0,
        'level' => 'beginner',
        'category' => 'Testing',
        'instructor_name' => $instructor->name,
        'instructor_id' => $instructor->id,
        'duration_hours' => 2,
        'status' => 'published',
    ]);
}

test('admin can create an instructor profile with a login account', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    Sanctum::actingAs($admin);

    $response = $this->postJson('/api/admin/instructors', [
        'name' => 'Instructor Login',
        'specialization' => 'Technical Analysis',
        'bio' => 'Experienced market instructor.',
        'login_email' => 'instructor@example.com',
        'password' => 'Password123!',
    ])->assertCreated()
        ->assertJsonPath('data.user.email', 'instructor@example.com')
        ->assertJsonPath('data.user.role', 'instructor')
        ->assertJsonPath('data.user.status', 'active');

    $instructor = Instructor::findOrFail($response->json('data.id'));

    expect($instructor->user_id)->not->toBeNull();

    $this->assertDatabaseHas('users', [
        'id' => $instructor->user_id,
        'email' => 'instructor@example.com',
        'role' => 'instructor',
        'status' => 'active',
    ]);

    $this->app['auth']->forgetGuards();

    $this->postJson('/api/login', [
        'email' => 'instructor@example.com',
        'password' => 'Password123!',
    ])->assertOk()
        ->assertJsonPath('user.role', 'instructor');
});

test('admin can create an instructor profile linked to an existing instructor user', function () {
    $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
    $instructorUser = User::factory()->create(['role' => 'instructor', 'status' => 'active']);

    Sanctum::actingAs($admin);

    $this->postJson('/api/admin/instructors', [
        'name' => 'Profile Only',
        'specialization' => 'Forex',
        'user_id' => $instructorUser->id,
    ])->assertCreated()
        ->assertJsonPath('data.user.id', $instructorUser->id)
        ->assertJsonPath('data.user.role', 'instructor');

    $secondProfile = Instructor::create(['name' => 'Second Profile']);

    $this->putJson("/api/admin/instructors/{$secondProfile->id}", [
        'user_id' => $instructorUser->id,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('user_id');
});

test('admin cannot create a new instructor without a linked or new login account', function () {
    $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);

    Sanctum::actingAs($admin);

    $this->postJson('/api/admin/instructors', [
        'name' => 'Profile Only',
        'specialization' => 'Forex',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('login_email');
});

test('instructor sees own course data and cannot access another instructors course', function () {
    $firstUser = User::factory()->create(['role' => 'instructor', 'status' => 'active']);
    $secondUser = User::factory()->create(['role' => 'instructor', 'status' => 'active']);
    $firstInstructor = Instructor::create(['user_id' => $firstUser->id, 'name' => 'First Instructor']);
    $secondInstructor = Instructor::create(['user_id' => $secondUser->id, 'name' => 'Second Instructor']);
    $ownCourse = instructorCourse($firstInstructor, 'own-instructor-course');
    $otherCourse = instructorCourse($secondInstructor, 'other-instructor-course');

    Sanctum::actingAs($firstUser);

    $this->getJson('/api/instructor/courses')
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.id', $ownCourse->id);

    $this->getJson("/api/instructor/courses/{$ownCourse->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $ownCourse->id);

    $this->getJson("/api/instructor/courses/{$otherCourse->id}")
        ->assertForbidden();

    $this->getJson("/api/instructor/courses/{$otherCourse->id}/students")
        ->assertForbidden();
});

test('instructor can manage own curriculum and quiz but not another instructors resources', function () {
    $firstUser = User::factory()->create(['role' => 'instructor', 'status' => 'active']);
    $secondUser = User::factory()->create(['role' => 'instructor', 'status' => 'active']);
    $firstInstructor = Instructor::create(['user_id' => $firstUser->id, 'name' => 'First Instructor']);
    $secondInstructor = Instructor::create(['user_id' => $secondUser->id, 'name' => 'Second Instructor']);
    $ownCourse = instructorCourse($firstInstructor, 'own-content-course');
    $otherCourse = instructorCourse($secondInstructor, 'other-content-course');
    $otherSection = CourseSection::create([
        'course_id' => $otherCourse->id,
        'title' => 'Other Section',
        'order' => 1,
    ]);

    Sanctum::actingAs($firstUser);

    $ownSectionId = $this->postJson('/api/instructor/sections', [
        'course_id' => $ownCourse->id,
        'title' => 'Owned Section',
        'order' => 1,
    ])->assertCreated()
        ->json('data.id');

    $this->postJson('/api/instructor/lessons', [
        'section_id' => $ownSectionId,
        'title' => 'Owned Lesson',
        'duration_minutes' => 20,
    ])->assertCreated();

    $this->postJson('/api/instructor/lessons', [
        'section_id' => $otherSection->id,
        'title' => 'Forbidden Lesson',
        'duration_minutes' => 20,
    ])->assertForbidden();

    $this->postJson("/api/instructor/courses/{$ownCourse->id}/quiz", [
        'title' => 'Owned Quiz',
        'passing_score' => 70,
    ])->assertCreated();

    $this->postJson("/api/instructor/courses/{$otherCourse->id}/quiz", [
        'title' => 'Forbidden Quiz',
    ])->assertForbidden();
});

test('instructor dashboard exposes only aggregate data for assigned courses', function () {
    $instructorUser = User::factory()->create(['role' => 'instructor', 'status' => 'active']);
    $instructor = Instructor::create(['user_id' => $instructorUser->id, 'name' => 'Dashboard Instructor']);
    $course = instructorCourse($instructor, 'dashboard-course');
    $student = User::factory()->create(['role' => 'student', 'status' => 'active']);
    $section = CourseSection::create([
        'course_id' => $course->id,
        'title' => 'Dashboard Section',
        'order' => 1,
    ]);
    Lesson::create([
        'section_id' => $section->id,
        'title' => 'Dashboard Lesson',
        'duration_minutes' => 10,
        'order' => 1,
    ]);
    Enrollment::create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'enrolled_at' => now(),
        'progress' => 60,
    ]);
    $quiz = Quiz::create([
        'course_id' => $course->id,
        'title' => 'Dashboard Quiz',
    ]);
    QuizAttempt::create([
        'user_id' => $student->id,
        'quiz_id' => $quiz->id,
        'course_id' => $course->id,
        'score' => 8,
        'total_points' => 10,
        'percentage' => 80,
        'passed' => true,
        'submitted_at' => now(),
    ]);

    Sanctum::actingAs($instructorUser);

    $this->getJson('/api/instructor/dashboard')
        ->assertOk()
        ->assertJsonPath('data.total_courses', 1)
        ->assertJsonPath('data.total_students', 1)
        ->assertJsonPath('data.total_lessons', 1)
        ->assertJsonPath('data.average_progress', 60)
        ->assertJsonCount(1, 'data.latest_enrollments')
        ->assertJsonCount(1, 'data.latest_quiz_attempts');
});

test('students cannot access instructor routes and instructors cannot access admin routes', function () {
    $student = User::factory()->create(['role' => 'student', 'status' => 'active']);
    Sanctum::actingAs($student);

    $this->getJson('/api/instructor/dashboard')->assertForbidden();

    $instructorUser = User::factory()->create(['role' => 'instructor', 'status' => 'active']);
    Instructor::create(['user_id' => $instructorUser->id, 'name' => 'Restricted Instructor']);
    Sanctum::actingAs($instructorUser);

    $this->getJson('/api/admin/users')->assertForbidden();
    $this->putJson('/api/admin/settings', [])->assertForbidden();
});

test('existing admin instructor access still works', function () {
    $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
    Instructor::create(['name' => 'Existing Profile']);

    Sanctum::actingAs($admin);

    $this->getJson('/api/admin/instructors')
        ->assertOk()
        ->assertJsonPath('0.name', 'Existing Profile');
});

test('a linked instructor user cannot be changed to another role until unlinked', function () {
    $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
    $instructorUser = User::factory()->create(['role' => 'instructor', 'status' => 'active']);
    Instructor::create(['user_id' => $instructorUser->id, 'name' => 'Linked Instructor']);

    Sanctum::actingAs($admin);

    $this->putJson("/api/admin/users/{$instructorUser->id}/role", [
        'role' => 'student',
    ])->assertUnprocessable()
        ->assertJsonPath('message', 'افصل حساب المستخدم عن ملف المدرب قبل تغيير دوره.');

    expect($instructorUser->refresh()->role)->toBe('instructor');
});

test('deleting an instructor demotes the linked user back to student', function () {
    $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
    $instructorUser = User::factory()->create(['role' => 'instructor', 'status' => 'active']);
    $instructor = Instructor::create(['user_id' => $instructorUser->id, 'name' => 'Delete Me']);

    Sanctum::actingAs($admin);

    $this->deleteJson("/api/admin/instructors/{$instructor->id}")
        ->assertOk()
        ->assertJsonPath('message', 'تم حذف ملف المدرب وتم تحويل الحساب المرتبط إلى طالب.');

    expect($instructorUser->refresh()->role)->toBe('student');
    $this->assertDatabaseMissing('instructors', [
        'id' => $instructor->id,
    ]);
});
