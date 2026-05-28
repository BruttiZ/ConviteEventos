<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Events\Actions\CreateEventAction;
use App\Domain\Events\Data\CreateEventData;
use App\Domain\Events\Repositories\EventRepository;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Carbon\CarbonImmutable;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class AdminEventController extends Controller
{
    public function __construct(
        private readonly EventRepository $events,
        private readonly CreateEventAction $createEvent,
    ) {}

    public function index(): AnonymousResourceCollection
    {
        $tenantId = (string) request()->user()->tenant_id;

        return EventResource::collection($this->events->paginateForTenant($tenantId));
    }

    public function store(StoreEventRequest $request): EventResource
    {
        $tenantId = (string) $request->user()->tenant_id;

        $event = $this->createEvent->execute(new CreateEventData(
            tenantId: $tenantId,
            name: (string) $request->validated('name'),
            slug: (string) $request->validated('slug'),
            startsAt: CarbonImmutable::parse($request->validated('starts_at')),
            endsAt: $request->validated('ends_at') ? CarbonImmutable::parse($request->validated('ends_at')) : null,
            timezone: (string) $request->validated('timezone'),
            venueName: $request->validated('venue_name'),
            address: $request->validated('address'),
            spotifyPlaylistUrl: $request->validated('spotify_playlist_url'),
            hero: $request->validated('hero'),
            content: $request->validated('content'),
            theme: $request->validated('theme'),
            gallery: $request->validated('gallery'),
            seo: $request->validated('seo'),
            capacity: $request->validated('capacity'),
        ));

        return EventResource::make($event);
    }

    public function show(Event $event): EventResource
    {
        $this->authorize('view', $event);

        return EventResource::make($event->load(['rsvps', 'guests']));
    }

    public function update(StoreEventRequest $request, Event $event): EventResource
    {
        $this->authorize('update', $event);

        $event->update($request->validated());

        return EventResource::make($event->refresh());
    }

    public function destroy(Event $event): Response
    {
        $this->authorize('delete', $event);

        $event->delete();

        return response()->noContent();
    }
}
