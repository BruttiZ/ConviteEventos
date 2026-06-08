<?php

namespace App\Domain\Guests\Actions;

use App\Mail\RsvpVerificationCodeMail;
use App\Models\Event;
use App\Models\PublicRsvpOtp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

final class RequestPublicRsvpCodeAction
{
    public function execute(Event $event, string $email, Request $request): void
    {
        $normalizedEmail = Str::lower(trim($email));
        $code = (string) random_int(100000, 999999);

        PublicRsvpOtp::query()
            ->where('event_id', $event->id)
            ->where('email', $normalizedEmail)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        PublicRsvpOtp::query()->create([
            'event_id' => $event->id,
            'email' => $normalizedEmail,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'metadata' => [
                'source' => 'public_rsvp',
                'requested_at' => now()->toIso8601String(),
            ],
        ]);

        Mail::to($normalizedEmail)->send(new RsvpVerificationCodeMail($event, $code));
    }
}
