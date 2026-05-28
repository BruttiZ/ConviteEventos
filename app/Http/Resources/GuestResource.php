<?php

namespace App\Http\Resources;

use App\Models\Guest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Guest
 */
class GuestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'status' => $this->status,
            'party_size' => $this->party_size,
            'max_companions' => $this->max_companions,
            'invite_token' => $this->invite_token,
            'rsvp' => $this->whenLoaded('rsvp', fn () => $this->rsvp),
            'checked_in' => $this->whenLoaded('checkIn', fn () => $this->checkIn !== null),
        ];
    }
}
