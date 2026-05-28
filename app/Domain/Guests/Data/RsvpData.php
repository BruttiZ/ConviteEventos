<?php

namespace App\Domain\Guests\Data;

final readonly class RsvpData
{
    /**
     * @param  array<string, mixed>|null  $answers
     */
    public function __construct(
        public string $inviteToken,
        public string $status,
        public int $companions,
        public ?string $message,
        public ?array $answers = null,
    ) {}
}
