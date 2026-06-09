<?php

namespace App\Http\Requests\Courses;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends FormRequest
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
            'title'             => ['sometimes', 'required', 'string', 'max:255'],
            'slug'              => ['sometimes', 'nullable', 'string', 'max:191'],
            'short_description' => ['sometimes', 'required', 'string', 'max:500'],
            'description'       => ['sometimes', 'required', 'string'],
            'thumbnail'         => ['sometimes', 'nullable', 'string', 'max:2048'],
            'image_path'        => ['sometimes', 'nullable', 'string', 'max:2048'],
            'price'             => ['sometimes', 'required', 'numeric', 'min:0', 'max:99999999.99'],
            'level'             => ['sometimes', 'required', Rule::in(Course::LEVELS)],
            'category'          => ['sometimes', 'required', 'string', 'max:191'],
            // Frontend sends instructor_id (integer FK); name is resolved in the controller
            'instructor_id'     => ['sometimes', 'required', 'integer', Rule::exists('instructors', 'id')],
            'duration_hours'    => ['sometimes', 'required', 'integer', 'min:1', 'max:1000'],
            'status'            => ['sometimes', 'required', Rule::in(Course::STATUSES)],
        ];
    }
}
