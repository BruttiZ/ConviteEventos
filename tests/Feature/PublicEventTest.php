<?php

use App\Mail\RsvpVerificationCodeMail;
use App\Models\Event;
use App\Models\Guest;
use App\Models\PublicRsvpOtp;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

it('returns a published public event by slug', function (): void {
    $tenant = Tenant::factory()->create();
    $event = Event::factory()->for($tenant)->create([
        'slug' => 'demo-event',
        'status' => 'published',
    ]);

    $this->getJson('/api/v1/events/demo-event')
        ->assertOk()
        ->assertJsonPath('data.id', $event->id)
        ->assertJsonPath('data.slug', 'demo-event');
});

it('confirms rsvp for an invited guest', function (): void {
    $tenant = Tenant::factory()->create();
    $event = Event::factory()->for($tenant)->create(['slug' => 'demo-event']);
    $guest = Guest::factory()->for($event)->create([
        'invite_token' => 'token-123',
        'max_companions' => 2,
    ]);

    $this->postJson('/api/v1/events/demo-event/rsvp', [
        'invite_token' => 'token-123',
        'status' => 'accepted',
        'companions' => 1,
        'message' => 'Nos vemos la.',
    ])->assertCreated()
        ->assertJsonPath('data.status', 'accepted');

    expect($guest->refresh()->status)->toBe('accepted')
        ->and($guest->party_size)->toBe(2);
});

it('sends a public rsvp verification code by email', function (): void {
    Mail::fake();

    $tenant = Tenant::factory()->create();
    $event = Event::factory()->for($tenant)->create(['status' => 'published']);

    $this->postJson('/api/v1/rsvp/request-code', [
        'event_id' => $event->id,
        'email' => 'maria@example.com',
    ])->assertOk()
        ->assertJsonPath('expires_in_minutes', 10);

    expect(PublicRsvpOtp::query()->where('event_id', $event->id)->where('email', 'maria@example.com')->exists())
        ->toBeTrue();

    Mail::assertSent(RsvpVerificationCodeMail::class);
});

it('verifies public rsvp code and creates a guest when needed', function (): void {
    $tenant = Tenant::factory()->create();
    $event = Event::factory()->for($tenant)->create(['status' => 'published']);

    PublicRsvpOtp::query()->create([
        'event_id' => $event->id,
        'email' => 'novo@example.com',
        'code_hash' => Hash::make('123456'),
        'expires_at' => now()->addMinutes(10),
    ]);

    $this->postJson('/api/v1/rsvp/verify-code', [
        'event_id' => $event->id,
        'email' => 'novo@example.com',
        'code' => '123456',
        'status' => 'accepted',
        'name' => 'Novo Convidado',
        'companions' => 1,
        'message' => 'Ate la.',
    ])->assertOk()
        ->assertJsonPath('data.status', 'accepted');

    $guest = Guest::query()->where('event_id', $event->id)->where('email', 'novo@example.com')->firstOrFail();

    expect($guest->name)->toBe('Novo Convidado')
        ->and($guest->status)->toBe('accepted')
        ->and($guest->party_size)->toBe(2);
});
