<?php

namespace App\Domain\Events\Data;

use Carbon\CarbonImmutable;

final readonly class CreateEventData
{
    /**
     * @param  array<string, mixed>  $hero
     * @param  array<string, mixed>  $content
     * @param  array<string, mixed>  $theme
     * @param  array<int, array<string, mixed>>|null  $gallery
     * @param  array<string, mixed>|null  $seo
     */
    public function __construct(
        public string $tenantId,
        public string $name,
        public string $slug,
        public CarbonImmutable $startsAt,
        public ?CarbonImmutable $endsAt,
        public string $timezone,
        public ?string $venueName,
        public ?string $address,
        public ?string $spotifyPlaylistUrl,
        public array $hero,
        public array $content,
        public array $theme,
        public ?array $gallery,
        public ?array $seo,
        public ?int $capacity,
    ) {}
}
