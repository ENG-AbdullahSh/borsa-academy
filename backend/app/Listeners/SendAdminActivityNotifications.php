<?php

namespace App\Listeners;

use App\Events\UserStartedCourseEvent;
use App\Events\UserGeneratedCertificateEvent;
use App\Models\User;
use App\Notifications\UserStartedCourseAdminNotification;
use App\Notifications\UserGeneratedCertificateAdminNotification;
use Illuminate\Support\Facades\Notification;

class SendAdminActivityNotifications
{
    public function handleUserStartedCourse(UserStartedCourseEvent $event): void
    {
        $admins = User::where('role', 'admin')->get();
        Notification::send($admins, new UserStartedCourseAdminNotification($event->user, $event->course));
    }

    public function handleUserGeneratedCertificate(UserGeneratedCertificateEvent $event): void
    {
        $admins = User::where('role', 'admin')->get();
        Notification::send($admins, new UserGeneratedCertificateAdminNotification($event->user, $event->course));
    }

    public function subscribe($events): array
    {
        return [
            UserStartedCourseEvent::class => 'handleUserStartedCourse',
            UserGeneratedCertificateEvent::class => 'handleUserGeneratedCertificate',
        ];
    }
}
