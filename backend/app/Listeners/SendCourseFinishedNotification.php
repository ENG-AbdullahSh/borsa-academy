<?php

namespace App\Listeners;

use App\Events\CourseFinishedEvent;
use App\Notifications\CourseFinishedNotification;

class SendCourseFinishedNotification
{
    public function handle(CourseFinishedEvent $event): void
    {
        $event->user->notify(new CourseFinishedNotification($event->course, $event->certificateId));
    }
}
