<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_filter([
        env('FRONTEND_URL'),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://your-vercel-app.vercel.app',
    ])),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
