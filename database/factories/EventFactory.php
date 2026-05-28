<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->randomElement(['Aurora Summit', 'Noite das Estrelas', 'Founders Dinner']);

        return [
            'tenant_id' => Tenant::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.$this->faker->unique()->numberBetween(10, 99),
            'status' => 'published',
            'timezone' => 'America/Sao_Paulo',
            'starts_at' => now()->addDays(45),
            'ends_at' => now()->addDays(45)->addHours(5),
            'venue_name' => 'Atelier Vista',
            'address' => 'Av. Paulista, 1000 - Sao Paulo, SP',
            'spotify_playlist_url' => 'https://open.spotify.com/playlist/37i9dQZF1DX4dyzvuaRJ0n',
            'hero' => [
                'eyebrow' => 'Convite digital',
                'title' => $name,
                'subtitle' => 'Uma experiencia elegante para confirmar presenca e acompanhar cada detalhe.',
                'image_url' => 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=80',
            ],
            'content' => [
                'hosts' => ['Equipe Invitely'],
                'schedule' => [
                    ['time' => '19:00', 'title' => 'Recepcao'],
                    ['time' => '20:30', 'title' => 'Cerimonia'],
                    ['time' => '21:30', 'title' => 'Celebracao'],
                ],
                'dress_code' => 'Smart casual',
                'note' => 'Use seu QR Code na entrada para check-in rapido.',
            ],
            'theme' => [
                'mode' => 'dark',
                'primary' => '#0A84FF',
                'accent' => '#14B8A6',
            ],
            'gallery' => [
                ['url' => 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80', 'alt' => 'Event tables'],
                ['url' => 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80', 'alt' => 'Celebration lights'],
                ['url' => 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80', 'alt' => 'Premium venue'],
            ],
            'seo' => [
                'title' => $name,
                'description' => 'Convite digital com RSVP e check-in por QR Code.',
            ],
            'capacity' => 180,
        ];
    }
}
