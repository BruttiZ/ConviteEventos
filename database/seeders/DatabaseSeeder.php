<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventTemplate;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $tenant = Tenant::query()->firstOrCreate(
            ['slug' => 'demo'],
            [
                'name' => 'Invitely Demo',
                'plan' => 'community',
                'settings' => ['locale' => 'pt_BR', 'timezone' => 'America/Sao_Paulo'],
            ],
        );

        collect([
            ['email' => 'host@invitely.dev', 'name' => 'Marina Host', 'role' => 'owner', 'tenant_id' => $tenant->id],
            ['email' => 'guest@invitely.dev', 'name' => 'Lucas Convidado', 'role' => 'guest', 'tenant_id' => $tenant->id],
            ['email' => 'admin@invitely.dev', 'name' => 'Invitely Admin', 'role' => 'platform_admin', 'tenant_id' => null],
        ])->each(function (array $user): void {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'tenant_id' => $user['tenant_id'],
                    'name' => $user['name'],
                    'password' => Hash::make('password'),
                    'role' => $user['role'],
                ],
            );
        });

        EventTemplate::query()->firstOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => 'linear-premium'],
            [
                'name' => 'Linear Premium',
                'category' => 'corporate',
                'tokens' => [
                    'radius' => 8,
                    'font' => 'Inter',
                    'palette' => ['#0A84FF', '#14B8A6', '#0F172A'],
                ],
                'schema' => ['supports' => ['gallery', 'spotify', 'map', 'countdown']],
                'is_public' => true,
            ],
        );

        $event = Event::query()->updateOrCreate([
            'tenant_id' => $tenant->id,
            'slug' => 'invitely-launch-night',
        ], [
            'name' => 'Invitely Launch Night',
            'status' => 'published',
            'timezone' => 'America/Sao_Paulo',
            'starts_at' => now()->addDays(45),
            'ends_at' => now()->addDays(45)->addHours(5),
            'venue_name' => 'Atelier Vista',
            'address' => 'Av. Paulista, 1000 - Sao Paulo, SP',
            'spotify_playlist_url' => 'https://open.spotify.com/playlist/37i9dQZF1DX4dyzvuaRJ0n',
            'hero' => [
                'eyebrow' => 'Convite digital',
                'title' => 'Invitely Launch Night',
                'subtitle' => 'Uma noite para celebrar produto, comunidade e experiencias memoraveis.',
                'image_url' => 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=85',
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
                'title' => 'Invitely Launch Night',
                'description' => 'Convite digital com RSVP e check-in por QR Code.',
            ],
            'capacity' => 180,
        ]);

        collect(range(1, 30))->each(function (int $index) use ($event): void {
            $event->guests()->firstOrCreate([
                'email' => 'guest'.$index.'@example.com',
            ], [
                'name' => 'Convidado '.$index,
                'phone' => '+55 11 90000-'.str_pad((string) $index, 4, '0', STR_PAD_LEFT),
                'status' => $index % 3 === 0 ? 'accepted' : 'invited',
                'party_size' => 1,
                'max_companions' => $index % 4,
                'invite_token' => $index === 1 ? 'demo-invite-token' : Str::random(40),
                'invited_at' => now(),
                'metadata' => ['segment' => ['family', 'friends', 'team'][$index % 3]],
            ]);
        });
    }
}
