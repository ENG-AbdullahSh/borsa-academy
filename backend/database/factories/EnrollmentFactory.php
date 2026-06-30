<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Enrollment>
 */
class EnrollmentFactory extends Factory
{
    protected $model = Enrollment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'course_id' => Course::factory(),
            'enrolled_at' => now(),
            'progress' => 0,
            'completed' => false,
        ];
    }

    /**
     * Indicate that the student has completed the course.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'progress' => 100,
            'completed' => true,
        ]);
    }
}
