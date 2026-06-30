<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\CourseReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourseReview>
 */
class CourseReviewFactory extends Factory
{
    protected $model = CourseReview::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'user_id' => User::factory(),
            'rating' => fake()->numberBetween(1, 5),
            'title' => fake()->optional(0.7)->sentence(4),
            'review' => fake()->optional(0.8)->paragraph(),
            'is_verified' => true,
            'is_visible' => true,
            'helpful_count' => 0,
            'reported_count' => 0,
        ];
    }
}
