<?php

namespace App\Http\Requests\Quizzes;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuizQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question_text' => ['sometimes', 'required', 'string'],
            'type' => ['sometimes', 'in:multiple_choice'],
            'points' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
