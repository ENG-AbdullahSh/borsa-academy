<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'section_id',
    'title',
    'description',
    'video_url',
    'video_path',
    'pdf_url',
    'pdf_path',
    'file_path',
    'duration_minutes',
    'order',
    'is_preview',
])]
class Lesson extends Model
{
    /**
     * Get the video URL.
     * If an uploaded video path exists, returns its public URL; otherwise returns the video_url value.
     */
    public function getVideoUrlAttribute(?string $value): ?string
    {
        if (!empty($this->video_path)) {
            // Route through the dedicated streaming endpoint that handles
            // HTTP Range requests — required for video seeking in all browsers.
            return url("/api/lessons/{$this->id}/stream");
        }
        return $value;
    }

    /**
     * Get the PDF URL.
     * If an uploaded pdf path exists, returns its public URL; otherwise returns the pdf_url value.
     */
    public function getPdfUrlAttribute(?string $value): ?string
    {
        if (!empty($this->pdf_path)) {
            return asset('storage/' . $this->pdf_path);
        }
        return $value;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'duration_minutes' => 'integer',
            'order' => 'integer',
            'is_preview' => 'boolean',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class, 'section_id');
    }

    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }
}
