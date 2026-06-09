<?php

namespace App\Listeners;

use App\Events\LessonCompletedEvent;
use App\Notifications\LessonCompletedNotification;

class SendLessonCompletedNotification
{
    public function handle(LessonCompletedEvent $event): void
    {
        $event->user->notify(new LessonCompletedNotification($event->lesson));
    }
}
