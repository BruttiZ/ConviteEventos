<?php

namespace App\Domain\Events\Actions;

use App\Domain\Events\Data\CreateEventData;
use App\Domain\Events\Repositories\EventRepository;
use App\Models\Event;
use Illuminate\Support\Facades\Cache;

final readonly class CreateEventAction
{
    public function __construct(private EventRepository $events) {}

    public function execute(CreateEventData $data): Event
    {
        $event = $this->events->create($data);

        Cache::forget('events.public.'.$data->slug);

        return $event;
    }
}
