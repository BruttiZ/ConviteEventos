<?php

namespace App\Http\Controllers\Api\Public;

use App\Domain\Events\Repositories\EventRepository;
use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

final class PublicEventController extends Controller
{
    public function __construct(private readonly EventRepository $events) {}

    public function show(string $slug): EventResource|JsonResponse
    {
        $event = Cache::remember(
            'events.public.'.$slug,
            now()->addMinutes(5),
            fn () => $this->events->findPublicBySlug($slug),
        );

        if (! $event) {
            return response()->json(['message' => 'Event not found.'], 404);
        }

        return EventResource::make($event);
    }
}
