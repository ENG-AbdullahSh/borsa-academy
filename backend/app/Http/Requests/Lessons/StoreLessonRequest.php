<?php

namespace App\Http\Requests\Lessons;

use Illuminate\Foundation\Http\FormRequest;

class StoreLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'section_id' => ['required', 'integer', 'exists:course_sections,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string', 'max:2048'],
            'video' => ['required', 'file', 'mimetypes:video/mp4,video/mpeg,video/quicktime,video/webm', 'max:512000'],
            'pdf' => ['nullable', 'file', 'mimes:pdf', 'max:20480'], // max 20MB
            'pdf_url' => ['nullable', 'string', 'max:2048'],
            'file_path' => ['nullable', 'string', 'max:2048'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'order' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'is_preview' => ['nullable', 'boolean'],
        ];
    }
}
