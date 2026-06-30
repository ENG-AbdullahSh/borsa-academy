<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'title',
    'slug',
    'short_description',
    'description',
    'thumbnail',
    'image_path',
    'price',
    'level',
    'category',
    'instructor_name',
    'instructor_id',
    'duration_hours',
    'status',
])]
class Course extends Model
{
    use HasFactory;
    public const LEVELS = ['beginner', 'intermediate', 'advanced'];

    public const STATUSES = ['draft', 'published'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'duration_hours' => 'integer',
            'average_rating' => 'decimal:2',
            'total_reviews' => 'integer',
        ];
    }

    /**
     * @param  Builder<Course>  $query
     * @return Builder<Course>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)
            ->orderBy('order')
            ->orderBy('id');
    }

    public function lessons(): HasManyThrough
    {
        return $this->hasManyThrough(
            Lesson::class,
            CourseSection::class,
            'course_id',
            'section_id',
        );
    }

    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function quiz(): HasOne
    {
        return $this->hasOne(Quiz::class)->whereNull('lesson_id');
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(CourseReview::class);
    }

    /**
     * Recalculate and update the average rating and total reviews for the course.
     */
    public function updateRatingStats(): void
    {
        $stats = $this->reviews()
            ->where('is_visible', true)
            ->selectRaw('COUNT(*) as total, AVG(rating) as average')
            ->first();

        $this->forceFill([
            'total_reviews' => (int) ($stats->total ?? 0),
            'average_rating' => round((float) ($stats->average ?? 0), 2),
        ])->save();
    }
}
