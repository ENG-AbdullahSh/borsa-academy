<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReplyToContactMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'reply_subject' => ['required', 'string', 'max:255'],
            'reply_message' => ['required', 'string', 'min:2', 'max:10000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'reply_subject.required' => 'موضوع الرد مطلوب.',
            'reply_subject.max' => 'يجب ألا يتجاوز موضوع الرد ٢٥٥ حرفًا.',
            'reply_message.required' => 'نص الرد مطلوب.',
            'reply_message.min' => 'يجب أن يحتوي الرد على حرفين على الأقل.',
            'reply_message.max' => 'يجب ألا يتجاوز الرد ١٠٠٠٠ حرف.',
        ];
    }
}
