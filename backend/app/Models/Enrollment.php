<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
     protected $fillable = ['user_id', 'course_id', 'enrolled_at', 'progress', 'completed'];
    use HasFactory;
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'enrolled_at' => 'datetime',
            'progress' => 'integer',
            'completed' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
