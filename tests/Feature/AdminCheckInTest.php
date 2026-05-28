<?php

use App\Models\Event;
use App\Models\Guest;
use App\Models\Tenant;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('checks in an accepted guest using an invitation token', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->for($tenant)->create(['role' => 'owner']);
    $event = Event::factory()->for($tenant)->create();
    $guest = Guest::factory()->for($event)->create([
        'invite_token' => 'check-in-token',
        'status' => 'accepted',
    ]);

    Sanctum::actingAs($user, ['admin']);

    $this->postJson("/api/v1/admin/events/{$event->id}/check-ins", [
        'invite_token' => 'check-in-token',
        'method' => 'qr_code',
    ])->assertCreated()
        ->assertJsonPath('data.guest_id', $guest->id)
        ->assertJsonPath('data.method', 'qr_code');

    expect($guest->checkIn()->exists())->toBeTrue();
});

it('exports event guests as csv', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->for($tenant)->create(['role' => 'owner']);
    $event = Event::factory()->for($tenant)->create(['slug' => 'csv-event']);
    Guest::factory()->for($event)->create(['name' => 'Ana Silva', 'status' => 'accepted']);

    Sanctum::actingAs($user, ['admin']);

    $this->getJson("/api/v1/admin/events/{$event->id}/guests/export")
        ->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');
});
