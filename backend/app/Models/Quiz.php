<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['course_id', 'lesson_id', 'title', 'description', 'passing_score', 'is_active'])]
class Quiz extends Model
{
    protected static function booted(): void
    {
        static::saved(function (Quiz $quiz) {
            if ($quiz->lesson_id) {
                $quiz->lesson()->update(['is_published' => $quiz->is_active]);
            }
        });

        static::deleted(function (Quiz $quiz) {
            if ($quiz->lesson_id) {
                $lesson = $quiz->lesson;
                if ($lesson) {
                    $lesson->update(['is_published' => false]);
                }
            }
        });
    }

    protected function casts(): array
    {
        return [
            'passing_score' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class)
            ->orderBy('order')
            ->orderBy('id');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }
}
