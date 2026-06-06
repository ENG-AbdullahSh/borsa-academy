<?php

namespace App\Http\Requests\Quizzes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreQuizQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question_text' => ['required', 'string'],
            'type' => ['nullable', 'in:multiple_choice'],
            'points' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'order' => ['nullable', 'integer', 'min:0'],
            'options' => ['required', 'array', 'min:2'],
            'options.*.option_text' => ['required', 'string'],
            'options.*.is_correct' => ['required', 'boolean'],
            'options.*.order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $correctOptions = collect($this->input('options', []))
                    ->where('is_correct', true)
                    ->count();

                if ($correctOptions !== 1) {
                    $validator->errors()->add(
                        'options',
                        'Each question must have exactly one correct option.',
                    );
                }
            },
        ];
    }
}
