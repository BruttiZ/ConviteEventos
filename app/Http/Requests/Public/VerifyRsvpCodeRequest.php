<?php

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

class VerifyRsvpCodeRequest extends FormRequest
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
            'event_id' => ['required', 'uuid', 'exists:events,id'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'code' => ['required', 'digits:6'],
            'status' => ['required', 'in:accepted,declined'],
            'name' => ['nullable', 'string', 'max:160'],
            'companions' => ['required', 'integer', 'min:0', 'max:20'],
            'message' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
