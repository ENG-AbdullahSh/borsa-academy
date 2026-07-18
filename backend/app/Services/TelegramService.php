<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class TelegramService
{
    private string $telegramServiceUrl;


    public function __construct()
    {
        $this->telegramServiceUrl = env(
            'TELEGRAM_SERVICE_URL',
            'http://127.0.0.1:5000'
        );
    }


public function checkEmail($email): array
{
    $response = Http::post(
        $this->telegramServiceUrl . '/check-email',
        [
            'email' => $email
        ]
    );


    if (!$response->successful()) {
        return [
            'success' => false,
            'registered' => false,
            'message' => 'Telegram service error'
        ];
    }


    return $response->json();
}
}