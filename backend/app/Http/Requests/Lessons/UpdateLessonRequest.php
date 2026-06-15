<?php

namespace App\Http\Requests\Lessons;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLessonRequest extends FormRequest
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
            'section_id' => ['sometimes', 'required', 'integer', 'exists:course_sections,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'video_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'pdf_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'file_path' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'duration_minutes' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'order' => ['sometimes', 'required', 'integer', 'min:0', 'max:10000'],
            'is_preview' => ['sometimes', 'boolean'],
        ];
    }
}
