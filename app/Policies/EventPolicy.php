<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    public function view(User $user, Event $event): bool
    {
        return $user->tenant_id === $event->tenant_id;
    }

    public function update(User $user, Event $event): bool
    {
        return $user->tenant_id === $event->tenant_id && in_array($user->role, ['owner', 'admin'], true);
    }

    public function delete(User $user, Event $event): bool
    {
        return $user->tenant_id === $event->tenant_id && $user->role === 'owner';
    }
}
