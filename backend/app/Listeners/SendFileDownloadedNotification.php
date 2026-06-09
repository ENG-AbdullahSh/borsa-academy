<?php

namespace App\Listeners;

use App\Events\FileDownloadedEvent;
use App\Notifications\FileDownloadedNotification;

class SendFileDownloadedNotification
{
    public function handle(FileDownloadedEvent $event): void
    {
        $event->user->notify(new FileDownloadedNotification($event->fileName));
    }
}
