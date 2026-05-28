<?php

namespace App\Domain\Guests\Actions;

use App\Models\CheckIn;
use App\Models\Guest;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final class CheckInGuestAction
{
    public function execute(Guest $guest, ?User $actor, string $method = 'qr_code'): CheckIn
    {
        if ($guest->status !== 'accepted') {
            throw ValidationException::withMessages([
                'guest' => __('Only confirmed guests can be checked in.'),
            ]);
        }

        return CheckIn::query()->firstOrCreate(
            ['event_id' => $guest->event_id, 'guest_id' => $guest->id],
            [
                'checked_in_by' => $actor?->id,
                'checked_in_at' => now(),
                'method' => $method,
            ],
        );
    }
}
