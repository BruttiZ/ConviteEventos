<?php

use App\Models\Tenant;
use App\Models\User;

it('issues a sanctum token for valid admin credentials', function (): void {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->for($tenant)->create([
        'email' => 'admin@example.com',
        'password' => 'password',
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@example.com',
        'password' => 'password',
        'device_name' => 'test-suite',
    ])->assertOk()
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonStructure(['data' => ['token', 'token_type', 'user']]);
});

it('rejects invalid admin credentials', function (): void {
    $this->postJson('/api/v1/auth/login', [
        'email' => 'missing@example.com',
        'password' => 'wrong-password',
    ])->assertUnprocessable();
});
