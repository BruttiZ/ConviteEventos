<?php

namespace App\Domain\Guests\Repositories;

use App\Models\Event;
use App\Models\Guest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface GuestRepository
{
    public function findByInviteToken(Event $event, string $token): ?Guest;

    /**
     * @return LengthAwarePaginator<int, Guest>
     */
    public function paginateForEvent(Event $event, int $perPage = 25): LengthAwarePaginator;
}
