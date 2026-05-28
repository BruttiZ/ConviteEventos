<?php

namespace App\Http\Resources;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Event
 */
class EventResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'status' => $this->status,
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'timezone' => $this->timezone,
            'venue' => [
                'name' => $this->venue_name,
                'address' => $this->address,
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
            ],
            'spotify_playlist_url' => $this->spotify_playlist_url,
            'hero' => $this->hero,
            'content' => $this->content,
            'theme' => $this->theme,
            'gallery' => $this->gallery ?? [],
            'seo' => $this->seo ?? [],
            'capacity' => $this->capacity,
            'metrics' => $this->whenLoaded('rsvps', fn () => [
                'accepted' => $this->rsvps->where('status', 'accepted')->count(),
                'declined' => $this->rsvps->where('status', 'declined')->count(),
                'invited' => $this->guests->count(),
            ]),
        ];
    }
}
