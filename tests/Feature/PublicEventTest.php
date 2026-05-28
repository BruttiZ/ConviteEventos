<?php

use App\Models\Event;
use App\Models\Guest;
use App\Models\Tenant;

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
