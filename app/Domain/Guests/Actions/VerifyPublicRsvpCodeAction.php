<?php

namespace App\Domain\Guests\Actions;

use App\Models\Event;
use App\Models\Guest;
use App\Models\PublicRsvpOtp;
use App\Models\Rsvp;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class VerifyPublicRsvpCodeAction
{
    public function execute(
        Event $event,
        string $email,
        string $code,
        string $status,
        ?string $name,
        int $companions,
        ?string $message,
    ): Rsvp {
        $normalizedEmail = Str::lower(trim($email));

        return DB::transaction(function () use (
            $event,
            $normalizedEmail,
            $code,
            $status,
            $name,
            $companions,
            $message,
        ): Rsvp {
            /** @var PublicRsvpOtp|null $otp */
            $otp = PublicRsvpOtp::query()
                ->where('event_id', $event->id)
                ->where('email', $normalizedEmail)
                ->whereNull('consumed_at')
                ->latest()
                ->lockForUpdate()
                ->first();

            if (! $otp) {
                throw ValidationException::withMessages([
                    'code' => __('Solicite um novo codigo para confirmar sua presenca.'),
                ]);
            }

            if (Carbon::parse($otp->expires_at)->isPast()) {
                $otp->forceFill(['consumed_at' => now()])->save();

                throw ValidationException::withMessages([
                    'code' => __('Codigo expirado. Solicite um novo codigo.'),
                ]);
            }

            if ($otp->attempts >= 5) {
                $otp->forceFill(['consumed_at' => now()])->save();

                throw ValidationException::withMessages([
                    'code' => __('Muitas tentativas invalidas. Solicite um novo codigo.'),
                ]);
            }

            if (! Hash::check($code, $otp->code_hash)) {
                $otp->increment('attempts');

                throw ValidationException::withMessages([
                    'code' => __('Codigo invalido. Confira os 6 digitos enviados por e-mail.'),
                ]);
            }

            $guest = Guest::query()
                ->where('event_id', $event->id)
                ->where('email', $normalizedEmail)
                ->lockForUpdate()
                ->first();

            if (! $guest) {
                $guest = Guest::query()->create([
                    'event_id' => $event->id,
                    'name' => $this->guestName($name, $normalizedEmail),
                    'email' => $normalizedEmail,
                    'status' => 'invited',
                    'party_size' => 1,
                    'max_companions' => 5,
                    'invite_token' => Str::random(40),
                    'invited_at' => now(),
                    'metadata' => [
                        'source' => 'public_rsvp_otp',
                    ],
                ]);
            }

            if ($companions > $guest->max_companions) {
                throw ValidationException::withMessages([
                    'companions' => __('Este convite permite no maximo :count acompanhantes.', [
                        'count' => $guest->max_companions,
                    ]),
                ]);
            }

            $rsvp = Rsvp::query()->updateOrCreate(
                ['event_id' => $event->id, 'guest_id' => $guest->id],
                [
                    'status' => $status,
                    'companions' => $companions,
                    'message' => $message,
                    'answers' => null,
                    'source' => 'public_otp',
                ],
            );

            $guest->forceFill([
                'name' => $this->guestName($name, $normalizedEmail, $guest->name),
                'status' => $status,
                'party_size' => 1 + $companions,
                'last_seen_at' => now(),
            ])->save();

            $otp->forceFill(['consumed_at' => now()])->save();

            Cache::forget('events.public.'.$event->slug);

            return $rsvp->refresh();
        });
    }

    private function guestName(?string $name, string $email, ?string $fallback = null): string
    {
        if (is_string($name) && trim($name) !== '') {
            return trim($name);
        }

        if (is_string($fallback) && trim($fallback) !== '') {
            return trim($fallback);
        }

        return Str::headline(Str::before($email, '@'));
    }
}
