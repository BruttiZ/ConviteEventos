<?php

namespace App\Domain\Guests\Actions;

use App\Domain\Guests\Data\RsvpData;
use App\Domain\Guests\Repositories\GuestRepository;
use App\Models\Event;
use App\Models\Rsvp;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

final readonly class ConfirmRsvpAction
{
    public function __construct(private GuestRepository $guests) {}

    public function execute(Event $event, RsvpData $data): Rsvp
    {
        $guest = $this->guests->findByInviteToken($event, $data->inviteToken);

        if (! $guest) {
            throw ValidationException::withMessages([
                'invite_token' => __('Invalid invitation token.'),
            ]);
        }

        if ($data->companions > $guest->max_companions) {
            throw ValidationException::withMessages([
                'companions' => __('This invitation does not allow that many companions.'),
            ]);
        }

        $rsvp = Rsvp::query()->updateOrCreate(
            ['event_id' => $event->id, 'guest_id' => $guest->id],
            [
                'status' => $data->status,
                'companions' => $data->companions,
                'message' => $data->message,
                'answers' => $data->answers,
                'source' => 'public',
            ],
        );

        $guest->forceFill([
            'status' => $data->status,
            'party_size' => 1 + $data->companions,
            'last_seen_at' => now(),
        ])->save();

        Cache::forget('events.public.'.$event->slug);

        return $rsvp->refresh();
    }
}
