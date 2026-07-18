<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;


class QuizAttempt extends Model
{
    protected $fillable = [
        'user_id',
        'quiz_id',
        'course_id',
        'lesson_id',
        'score',
        'total_points',
        'percentage',
        'passed',
        'submitted_at',
    ];
    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'total_points' => 'integer',
            'percentage' => 'decimal:2',
            'passed' => 'boolean',
            'submitted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(QuizAnswer::class, 'attempt_id');
    }
}
