<?php

namespace App\Listeners;

use App\Events\CourseEnrollmentEvent;
use App\Notifications\CourseEnrollmentNotification;

class SendCourseEnrollmentNotification
{
    public function handle(CourseEnrollmentEvent $event): void
    {
        $event->user->notify(new CourseEnrollmentNotification($event->course));
    }
}
