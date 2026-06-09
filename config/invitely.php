<?php

return [
    'demo_users' => [
        'password' => env('INVITELY_DEMO_PASSWORD', 'password'),
        'owner' => [
            'email' => env('INVITELY_DEMO_OWNER_EMAIL', 'host@invitely.dev'),
            'name' => env('INVITELY_DEMO_OWNER_NAME', 'Marina Host'),
        ],
        'guest' => [
            'email' => env('INVITELY_DEMO_GUEST_EMAIL', 'guest@invitely.dev'),
            'name' => env('INVITELY_DEMO_GUEST_NAME', 'Lucas Convidado'),
        ],
        'platform_admin' => [
            'email' => env('INVITELY_DEMO_ADMIN_EMAIL', 'admin@invitely.dev'),
            'name' => env('INVITELY_DEMO_ADMIN_NAME', 'Invitely Admin'),
        ],
    ],
];
