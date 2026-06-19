<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo 'Notifications: ' . DB::table('notifications')->count() . PHP_EOL;
echo 'Jobs: ' . DB::table('jobs')->count() . PHP_EOL;

$jobs = DB::table('jobs')->get();
foreach ($jobs as $job) {
    echo "Job ID: {$job->id}, Queue: {$job->queue}, Payload: {$job->payload}" . PHP_EOL;
}
