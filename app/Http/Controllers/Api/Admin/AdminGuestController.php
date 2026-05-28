<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Guests\Repositories\GuestRepository;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGuestRequest;
use App\Http\Resources\GuestResource;
use App\Models\Event;
use App\Models\Guest;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

final class AdminGuestController extends Controller
{
    public function __construct(private readonly GuestRepository $guests) {}

    public function index(Event $event): AnonymousResourceCollection
    {
        $this->authorize('view', $event);

        return GuestResource::collection($this->guests->paginateForEvent($event));
    }

    public function store(StoreGuestRequest $request, Event $event): GuestResource
    {
        $this->authorize('update', $event);

        $guest = $event->guests()->create([
            ...$request->validated(),
            'invite_token' => Str::random(40),
            'status' => 'invited',
        ]);

        return GuestResource::make($guest);
    }

    public function show(Guest $guest): GuestResource
    {
        $this->authorize('view', $guest->event);

        return GuestResource::make($guest->load(['rsvp', 'checkIn']));
    }

    public function update(StoreGuestRequest $request, Guest $guest): GuestResource
    {
        $this->authorize('update', $guest->event);

        $guest->update($request->validated());

        return GuestResource::make($guest->refresh());
    }

    public function destroy(Guest $guest): Response
    {
        $this->authorize('update', $guest->event);

        $guest->delete();

        return response()->noContent();
    }
}
