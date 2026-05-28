<?php

namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\Events\Data\CreateEventData;
use App\Domain\Events\Repositories\EventRepository;
use App\Models\Event;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class EloquentEventRepository implements EventRepository
{
    public function create(CreateEventData $data): Event
    {
        return Event::query()->create([
            'tenant_id' => $data->tenantId,
            'name' => $data->name,
            'slug' => $data->slug,
            'starts_at' => $data->startsAt,
            'ends_at' => $data->endsAt,
            'timezone' => $data->timezone,
            'venue_name' => $data->venueName,
            'address' => $data->address,
            'spotify_playlist_url' => $data->spotifyPlaylistUrl,
            'hero' => $data->hero,
            'content' => $data->content,
            'theme' => $data->theme,
            'gallery' => $data->gallery,
            'seo' => $data->seo,
            'capacity' => $data->capacity,
        ]);
    }

    public function findPublicBySlug(string $slug): ?Event
    {
        return Event::query()
            ->with(['guests.rsvp'])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->first();
    }

    /**
     * @return LengthAwarePaginator<int, Event>
     */
    public function paginateForTenant(string $tenantId, int $perPage = 15): LengthAwarePaginator
    {
        return Event::query()
            ->where('tenant_id', $tenantId)
            ->latest('starts_at')
            ->paginate($perPage);
    }
}
