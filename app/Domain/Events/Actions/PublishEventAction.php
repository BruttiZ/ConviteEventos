<?php

namespace App\Domain\Events\Actions;

use App\Models\Event;
use Illuminate\Support\Facades\Cache;

final class PublishEventAction
{
    public function execute(Event $event): Event
    {
        $event->forceFill(['status' => 'published'])->save();

        Cache::forget('events.public.'.$event->slug);

        return $event->refresh();
    }
}
