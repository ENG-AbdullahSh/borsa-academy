<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The React frontend (Vite dev server) runs on localhost:5173 and issues
    | requests to this Laravel API on localhost:8000.  These settings grant
    | that origin access to both the API routes and static storage assets.
    |
    */

    // Allow CORS for API routes, Sanctum cookie endpoint, and served storage files
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    'allowed_methods' => ['*'],

    // Explicitly list the React dev-server origins; use env var for production
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    // Expose headers the browser needs to read for video Range-request seeking
    'exposed_headers' => ['Content-Range', 'Accept-Ranges', 'Content-Length'],

    'max_age' => 0,

    // Must be true when using Sanctum cookie-based auth with credentials
    'supports_credentials' => true,

];
