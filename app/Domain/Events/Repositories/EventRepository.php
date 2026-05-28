<?php

namespace App\Domain\Events\Repositories;

use App\Domain\Events\Data\CreateEventData;
use App\Models\Event;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface EventRepository
{
    public function create(CreateEventData $data): Event;

    public function findPublicBySlug(string $slug): ?Event;

    /**
     * @return LengthAwarePaginator<int, Event>
     */
    public function paginateForTenant(string $tenantId, int $perPage = 15): LengthAwarePaginator;
}
