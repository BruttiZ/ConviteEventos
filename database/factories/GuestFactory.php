<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Guest;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Guest>
 */
class GuestFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'status' => 'invited',
            'party_size' => 1,
            'max_companions' => $this->faker->numberBetween(0, 3),
            'invite_token' => Str::random(40),
            'invited_at' => now(),
            'metadata' => [
                'segment' => $this->faker->randomElement(['family', 'friends', 'team']),
            ],
        ];
    }
}
