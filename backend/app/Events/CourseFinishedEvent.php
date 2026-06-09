<?php

namespace App\Events;

use App\Models\User;
use App\Models\Course;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CourseFinishedEvent implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public User $user, public Course $course, public int $certificateId)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->user->id),
        ];
    }
}
