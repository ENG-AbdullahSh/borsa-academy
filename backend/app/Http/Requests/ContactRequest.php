<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContactRequest extends FormRequest
{
    /**
     * Anyone can submit the contact form — no auth required.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Sanitise input before validation runs.
     */
    protected function prepareForValidation(): void
    {
        $prepared = [
            'subject' => strip_tags(trim($this->subject ?? '')),
            'message' => strip_tags(trim($this->message ?? '')),
        ];

        if (! $this->user('sanctum')) {
            $prepared['name'] = strip_tags(trim($this->name ?? ''));
            $prepared['email'] = trim($this->email ?? '');
        }

        $this->merge($prepared);
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        $hasAuthenticatedUser = $this->user('sanctum') !== null;

        return [
            'name'    => [Rule::excludeIf($hasAuthenticatedUser), 'required', 'string', 'min:3', 'max:100'],
            'email'   => [Rule::excludeIf($hasAuthenticatedUser), 'required', 'email:rfc'],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ];
    }

    /**
     * Arabic validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required'    => 'حقل الاسم مطلوب.',
            'name.min'         => 'يجب أن يحتوي الاسم على ٣ أحرف على الأقل.',
            'name.max'         => 'يجب ألا يتجاوز الاسم ١٠٠ حرف.',

            'email.required'   => 'حقل البريد الإلكتروني مطلوب.',
            'email.email'      => 'يرجى إدخال بريد إلكتروني صحيح.',

            'subject.required' => 'حقل الموضوع مطلوب.',
            'subject.max'      => 'يجب ألا يتجاوز الموضوع ٢٠٠ حرف.',

            'message.required' => 'حقل الرسالة مطلوب.',
            'message.min'      => 'يجب أن تحتوي الرسالة على ١٠ أحرف على الأقل.',
            'message.max'      => 'يجب ألا تتجاوز الرسالة ٥٠٠٠ حرف.',
        ];
    }

    /**
     * Arabic attribute names for validation error messages.
     */
    public function attributes(): array
    {
        return [
            'name'    => 'الاسم',
            'email'   => 'البريد الإلكتروني',
            'subject' => 'الموضوع',
            'message' => 'الرسالة',
        ];
    }
}
