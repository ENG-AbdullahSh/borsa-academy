<?php

namespace App\Events;

use App\Models\User;
use App\Models\Course;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserGeneratedCertificateEvent
{
    use Dispatchable, SerializesModels;

    public function __construct(public User $user, public Course $course)
    {
    }
}
