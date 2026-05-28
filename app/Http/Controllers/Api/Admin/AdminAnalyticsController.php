<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;

final class AdminAnalyticsController extends Controller
{
    public function __invoke(Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        $event->load(['guests', 'rsvps', 'checkIns']);

        return response()->json([
            'data' => [
                'invited' => $event->guests->count(),
                'accepted' => $event->rsvps->where('status', 'accepted')->count(),
                'declined' => $event->rsvps->where('status', 'declined')->count(),
                'checked_in' => $event->checkIns->count(),
                'response_rate' => $event->guests->count() > 0
                    ? round(($event->rsvps->count() / $event->guests->count()) * 100, 1)
                    : 0,
            ],
        ]);
    }
}
