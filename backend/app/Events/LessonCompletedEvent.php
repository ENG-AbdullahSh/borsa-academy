<?php

namespace App\Events;

use App\Models\User;
use App\Models\Lesson;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LessonCompletedEvent
{
    use Dispatchable, SerializesModels;

    public function __construct(public User $user, public Lesson $lesson)
    {
    }
}
