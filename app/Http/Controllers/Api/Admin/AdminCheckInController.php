<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Guests\Actions\CheckInGuestAction;
use App\Domain\Guests\Repositories\GuestRepository;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CheckInGuestRequest;
use App\Models\Event;
use Illuminate\Http\JsonResponse;

final class AdminCheckInController extends Controller
{
    public function __construct(
        private readonly GuestRepository $guests,
        private readonly CheckInGuestAction $checkInGuest,
    ) {}

    public function store(CheckInGuestRequest $request, Event $event): JsonResponse
    {
        $this->authorize('update', $event);

        $guest = $this->guests->findByInviteToken($event, (string) $request->validated('invite_token'));

        if (! $guest) {
            return response()->json(['message' => 'Guest not found for this invitation token.'], 404);
        }

        $checkIn = $this->checkInGuest->execute(
            guest: $guest,
            actor: $request->user(),
            method: (string) ($request->validated('method') ?: 'qr_code'),
        );

        return response()->json([
            'message' => 'Check-in confirmed.',
            'data' => [
                'id' => $checkIn->id,
                'guest_id' => $guest->id,
                'guest_name' => $guest->name,
                'checked_in_at' => $checkIn->checked_in_at,
                'method' => $checkIn->method,
            ],
        ], 201);
    }
}
