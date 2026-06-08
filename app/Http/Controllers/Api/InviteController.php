<?php

namespace App\Http\Controllers\Api;

use App\Models\Guest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class InviteController extends Controller {
    /**
     * Get invite details by token
     * No authentication required - public endpoint
     */
    public function show(Request $request, string $token): JsonResponse {
        $guest = Guest::where('invite_token', $token)
            ->with('event')
            ->first();

        if (!$guest) {
            return response()->json(['error' => 'Convite não encontrado ou expirou'], 404);
        }

        // Check if invite has expired (if you implement expiration in the future)
        // For now, all invites are valid until explicitly rejected/accepted

        return response()->json([
            'guest_name' => $guest->name,
            'guest_email' => $guest->email,
            'event_name' => $guest->event->name ?? 'Evento',
            'event_date' => $guest->event->date ?? null,
        ]);
    }

    /**
     * Accept an invite by token
     * No authentication required - public endpoint
     */
    public function accept(Request $request, string $token): JsonResponse {
        $guest = Guest::where('invite_token', $token)->first();

        if (!$guest) {
            return response()->json(['error' => 'Convite não encontrado'], 404);
        }

        // Only allow accepting pending invites
        if ($guest->status !== 'pending' && $guest->status !== 'invited') {
            return response()->json(['error' => 'Este convite já foi processado'], 400);
        }

        // Update guest status
        $guest->update([
            'status' => 'accepted',
            'invited_at' => now(),
        ]);

        return response()->json([
            'message' => 'Convite aceito com sucesso',
            'guest_id' => $guest->id,
            'event_id' => $guest->event_id,
        ]);
    }

    /**
     * Reject an invite by token
     * No authentication required - public endpoint
     */
    public function reject(Request $request, string $token): JsonResponse {
        $guest = Guest::where('invite_token', $token)->first();

        if (!$guest) {
            return response()->json(['error' => 'Convite não encontrado'], 404);
        }

        // Only allow rejecting pending invites
        if ($guest->status !== 'pending' && $guest->status !== 'invited') {
            return response()->json(['error' => 'Este convite já foi processado'], 400);
        }

        // Update guest status
        $guest->update([
            'status' => 'declined',
            'invited_at' => now(),
        ]);

        return response()->json([
            'message' => 'Convite recusado',
            'guest_id' => $guest->id,
        ]);
    }
}
