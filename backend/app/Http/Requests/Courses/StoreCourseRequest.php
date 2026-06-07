<?php

namespace App\Http\Requests\Courses;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:191'],
            'short_description' => ['required', 'string', 'max:500'],
            'description' => ['required', 'string'],
            'thumbnail' => ['nullable', 'string', 'max:2048'],
            'image_path' => ['nullable', 'string', 'max:2048'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'level' => ['required', Rule::in(Course::LEVELS)],
            'category' => ['required', 'string', 'max:191'],
            'instructor_name' => ['required', 'string', 'max:255'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:1000'],
            'status' => ['required', Rule::in(Course::STATUSES)],
        ];
    }
}
