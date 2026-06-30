<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    protected $model = Course::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(4);

        return [
            'title' => $title,
            'slug' => Str::slug($title) . '-' . fake()->unique()->randomNumber(5),
            'short_description' => fake()->sentence(10),
            'description' => fake()->paragraphs(3, true),
            'thumbnail' => null,
            'price' => fake()->randomElement([0, 9.99, 19.99, 49.99, 99.99]),
            'level' => fake()->randomElement(Course::LEVELS),
            'category' => fake()->randomElement(['أساسيات التداول', 'التحليل الفني', 'حركة السعر', 'إدارة المخاطر']),
            'instructor_name' => fake()->name(),
            'duration_hours' => fake()->numberBetween(2, 40),
            'status' => 'published',
            'average_rating' => 0.00,
            'total_reviews' => 0,
        ];
    }

    /**
     * Indicate that the course is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
        ]);
    }
}
