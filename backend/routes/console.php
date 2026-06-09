<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Services\NotificationSchedulerService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    app(NotificationSchedulerService::class)->runDailyNudges();
})->dailyAt('10:00')->name('daily_learning_nudges')->withoutOverlapping();
