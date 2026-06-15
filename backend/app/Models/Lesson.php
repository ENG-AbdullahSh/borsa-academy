<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
    'is_published',
])]
class Lesson extends Model
{
    /**
     * Get the video URL.
     *
     * For uploaded videos, we serve the file directly from public storage
     * (e.g. http://localhost:8000/storage/lessons/videos/xxx.mp4) instead of
     * routing through the PHP /stream controller.
     *
     * Why: php artisan serve is single-threaded.  Pumping a large video file
     * through PHP blocks every other request and causes severe loading delays.
     * Serving from public storage lets the OS/webserver stream bytes natively
     * with zero PHP overhead, full HTTP Range support, and instant start times.
     */
    public function getVideoUrlAttribute(?string $value): ?string
    {
        if (!empty($this->video_path)) {
            // Return a direct public-storage URL — no PHP processing involved.
            return asset('storage/' . $this->video_path);
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
            'is_published' => 'boolean',
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

    public function quiz(): HasOne
    {
        return $this->hasOne(Quiz::class);
    }
}
