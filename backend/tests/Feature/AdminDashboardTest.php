<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('an admin can view real dashboard statistics and recent enrollments', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $student = User::factory()->create(['role' => 'student']);
    $course = Course::create([
        'title' => 'Admin Dashboard Course',
        'slug' => 'admin-dashboard-course',
        'short_description' => 'Dashboard test course.',
        'description' => 'A course used to verify admin dashboard statistics.',
        'price' => 100,
        'level' => 'beginner',
        'category' => 'Testing',
        'instructor_name' => 'Test Instructor',
        'duration_hours' => 3,
        'status' => 'published',
    ]);

    Enrollment::create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'enrolled_at' => now(),
        'progress' => 100,
        'completed' => true,
    ]);

    Sanctum::actingAs($admin);

    $this->getJson('/api/admin/dashboard')
        ->assertOk()
        ->assertJson([
            'success' => true,
            'stats' => [
                'total_courses' => 1,
                'published_courses' => 1,
                'total_students' => 1,
                'total_enrollments' => 1,
                'completed_enrollments' => 1,
                'average_progress' => 100,
                'total_certificates' => 0,
            ],
        ])
        ->assertJsonPath('recent_enrollments.0.student.email', $student->email)
        ->assertJsonPath('recent_enrollments.0.course.title', $course->title);
});

test('students cannot view the admin dashboard endpoint', function () {
    Sanctum::actingAs(User::factory()->create(['role' => 'student']));

    $this->getJson('/api/admin/dashboard')->assertForbidden();
});
