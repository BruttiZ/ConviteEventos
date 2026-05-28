<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EventTemplate extends Model
{
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'category',
        'tokens',
        'schema',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'tokens' => 'array',
            'schema' => 'array',
            'is_public' => 'boolean',
        ];
    }
}
