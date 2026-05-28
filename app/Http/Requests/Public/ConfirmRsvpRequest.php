<?php

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmRsvpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'invite_token' => ['required', 'string', 'max:120'],
            'status' => ['required', 'in:accepted,declined'],
            'companions' => ['required', 'integer', 'min:0', 'max:20'],
            'message' => ['nullable', 'string', 'max:1000'],
            'answers' => ['nullable', 'array'],
        ];
    }
}
