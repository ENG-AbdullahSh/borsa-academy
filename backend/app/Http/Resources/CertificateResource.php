<?php

namespace App\Http\Resources;

use App\Models\Enrollment;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CertificateResource extends JsonResource
{
    /**
     *eng : monther owda ;
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $progress = Enrollment::query()
            ->where('user_id', $this->user_id)
            ->where('course_id', $this->course_id)
            ->value('progress');

        // Resolve instructor name: prefer linked instructor profile, fall back to legacy text field
        $instructorName = $this->course?->instructor?->name
            ?? $this->course?->instructor_name
            ?? null;

        // Resolve center director name from global settings
        $centerDirectorName = Setting::first()?->center_director_name ?? 'كريم ابو رمضان';

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'course_id' => $this->course_id,
            'section_id' => $this->section_id,
            'scope_type' => $this->scope_type ?? 'course',
            'scope_id' => $this->scope_id,
            'certificate_number' => $this->certificate_number,
            'student_name' => $this->user?->name,
            'course_title' => $this->course?->title,
            'section_title' => $this->section?->title,
            'certificate_title' => $this->section
                ? (($this->course?->title ?? 'Course') . ' - ' . $this->section->title)
                : $this->course?->title,
            'issued_at' => $this->issued_at,
            'progress_percentage' => $this->scope_type === 'section' ? 100 : (int) ($progress ?? 100),
            'verification_url' => url("/certificates/verify/{$this->certificate_number}"),
            'duration_hours' => $this->course?->duration_hours,
            'instructor_name' => $instructorName,
            'center_director_name' => $centerDirectorName,
        ];
    }
}
