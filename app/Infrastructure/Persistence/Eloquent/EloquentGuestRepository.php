<?php

namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\Guests\Repositories\GuestRepository;
use App\Models\Event;
use App\Models\Guest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class EloquentGuestRepository implements GuestRepository
{
    public function findByInviteToken(Event $event, string $token): ?Guest
    {
        return Guest::query()
            ->whereBelongsTo($event)
            ->where('invite_token', $token)
            ->first();
    }

    /**
     * @return LengthAwarePaginator<int, Guest>
     */
    public function paginateForEvent(Event $event, int $perPage = 25): LengthAwarePaginator
    {
        return Guest::query()
            ->with(['rsvp', 'checkIn'])
            ->whereBelongsTo($event)
            ->orderBy('name')
            ->paginate($perPage);
    }
}
