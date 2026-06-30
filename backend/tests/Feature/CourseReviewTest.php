<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseReview;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_review_completed_course(): void
    {
        $user = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create();

        Enrollment::factory()->create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'progress' => 100,
            'completed' => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/courses/{$course->id}/review", [
            'rating' => 5,
            'title' => 'ممتاز جداً',
            'review' => 'هذا الكورس رائع واستفدت منه الكثير.',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('course_reviews', [
            'course_id' => $course->id,
            'user_id' => $user->id,
            'rating' => 5,
        ]);

        $course->refresh();
        $this->assertEquals(5.00, (float) $course->average_rating);
        $this->assertEquals(1, $course->total_reviews);
    }

    public function test_student_upsert_can_update_existing_review(): void
    {
        $user = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create();

        Enrollment::factory()->create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'progress' => 100,
            'completed' => true,
        ]);

        // Create initial review directly in DB, sync stats
        CourseReview::factory()->create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'rating' => 3,
            'title' => 'مقبول',
            'review' => 'كان لا بأس به.',
            'is_visible' => true,
        ]);
        $course->updateRatingStats();
        $course->refresh();
        $this->assertEquals(3.00, (float) $course->average_rating);
        $this->assertEquals(1, $course->total_reviews);

        // Upsert should update the existing review
        $response = $this->actingAs($user, 'sanctum')->postJson("/api/courses/{$course->id}/review", [
            'rating' => 5,
            'title' => 'معدل وممتاز',
            'review' => 'بعد مراجعة المحتوى مرة أخرى تبين لي أنه ممتاز.',
        ]);

        $response->assertStatus(200);

        // Only one review must exist
        $this->assertEquals(1, CourseReview::where('course_id', $course->id)->where('user_id', $user->id)->count());

        $this->assertDatabaseHas('course_reviews', [
            'course_id' => $course->id,
            'user_id' => $user->id,
            'rating' => 5,
        ]);

        $course->refresh();
        $this->assertEquals(5.00, (float) $course->average_rating);
        $this->assertEquals(1, $course->total_reviews);
    }

    public function test_guest_cannot_review(): void
    {
        $course = Course::factory()->create();

        $response = $this->postJson("/api/courses/{$course->id}/review", [
            'rating' => 5,
        ]);

        $response->assertStatus(401);
    }

    public function test_instructor_cannot_review(): void
    {
        $user = User::factory()->create(['role' => 'instructor']);
        $course = Course::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/courses/{$course->id}/review", [
            'rating' => 5,
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_review(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $course = Course::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/courses/{$course->id}/review", [
            'rating' => 5,
        ]);

        $response->assertStatus(403);
    }

    public function test_student_not_enrolled_cannot_review(): void
    {
        $user = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/courses/{$course->id}/review", [
            'rating' => 5,
        ]);

        $response->assertStatus(403);
    }

    public function test_student_not_completed_cannot_review(): void
    {
        $user = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create();

        Enrollment::factory()->create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'progress' => 80,
            'completed' => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/courses/{$course->id}/review", [
            'rating' => 5,
        ]);

        $response->assertStatus(403);
    }

    public function test_rating_aggregation_and_distribution_calculations(): void
    {
        $course = Course::factory()->create();

        $student1 = User::factory()->create(['role' => 'student']);
        $student2 = User::factory()->create(['role' => 'student']);
        $student3 = User::factory()->create(['role' => 'student']);

        Enrollment::factory()->create(['user_id' => $student1->id, 'course_id' => $course->id, 'progress' => 100, 'completed' => true]);
        Enrollment::factory()->create(['user_id' => $student2->id, 'course_id' => $course->id, 'progress' => 100, 'completed' => true]);
        Enrollment::factory()->create(['user_id' => $student3->id, 'course_id' => $course->id, 'progress' => 100, 'completed' => true]);

        $this->actingAs($student1, 'sanctum')->postJson("/api/courses/{$course->id}/review", ['rating' => 5]);
        $this->actingAs($student2, 'sanctum')->postJson("/api/courses/{$course->id}/review", ['rating' => 4]);
        $this->actingAs($student3, 'sanctum')->postJson("/api/courses/{$course->id}/review", ['rating' => 5]);

        $course->refresh();

        // (5 + 4 + 5) / 3 = 4.67
        $this->assertEquals(4.67, (float) $course->average_rating);
        $this->assertEquals(3, $course->total_reviews);

        // Verify reviews list endpoint returns summary data
        $response = $this->getJson("/api/courses/{$course->id}/reviews");
        $response->assertStatus(200);
        $response->assertJsonPath('average_rating', 4.67);
        $response->assertJsonPath('ratings_count', 3);
    }

    public function test_admin_can_delete_any_review(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create();

        $review = CourseReview::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'is_visible' => true,
        ]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/reviews/{$review->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('course_reviews', ['id' => $review->id]);
    }
}
