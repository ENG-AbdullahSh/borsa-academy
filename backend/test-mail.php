<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    Illuminate\Support\Facades\Mail::raw('This is a test email from Borsa Academy to verify the Mailtrap configuration.', function($msg) {
        $msg->to('test@example.com')->subject('Test Mailtrap Email - Borsa Academy');
    });
    echo 'Test email sent successfully to Mailtrap!' . PHP_EOL;
} catch (\Exception $e) {
    echo 'Failed to send email: ' . $e->getMessage() . PHP_EOL;
}
