<?php

namespace App\Http\Controllers\Api\Public;

use App\Domain\Guests\Actions\RequestPublicRsvpCodeAction;
use App\Domain\Guests\Actions\VerifyPublicRsvpCodeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\RequestRsvpCodeRequest;
use App\Http\Requests\Public\VerifyRsvpCodeRequest;
use App\Models\Event;
use Illuminate\Http\JsonResponse;

final class PublicRsvpCodeController extends Controller
{
    public function requestCode(
        RequestRsvpCodeRequest $request,
        RequestPublicRsvpCodeAction $requestPublicRsvpCode,
    ): JsonResponse {
        $event = Event::query()
            ->whereKey((string) $request->validated('event_id'))
            ->where('status', 'published')
            ->firstOrFail();

        $requestPublicRsvpCode->execute(
            $event,
            (string) $request->validated('email'),
            $request,
        );

        return response()->json([
            'message' => 'Codigo enviado para o e-mail informado.',
            'expires_in_minutes' => 10,
        ]);
    }

    public function verifyCode(
        VerifyRsvpCodeRequest $request,
        VerifyPublicRsvpCodeAction $verifyPublicRsvpCode,
    ): JsonResponse {
        $event = Event::query()
            ->whereKey((string) $request->validated('event_id'))
            ->where('status', 'published')
            ->firstOrFail();

        $rsvp = $verifyPublicRsvpCode->execute(
            event: $event,
            email: (string) $request->validated('email'),
            code: (string) $request->validated('code'),
            status: (string) $request->validated('status'),
            name: is_string($request->validated('name')) ? $request->validated('name') : null,
            companions: (int) $request->validated('companions'),
            message: is_string($request->validated('message')) ? $request->validated('message') : null,
        );

        return response()->json([
            'message' => $rsvp->status === 'accepted'
                ? 'Presenca confirmada!'
                : 'Voce recusou o convite.',
            'data' => $rsvp,
        ]);
    }
}
