<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('chat:notify-upcoming')]
#[Description('Send notifications for chat rooms scheduled to start in 30 minutes')]
class NotifyUpcomingChats extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $targetTime = now()->addMinutes(30)->startOfMinute();

        $chatRooms = \App\Models\ChatRoom::whereNotNull('scheduled_at')
            ->whereBetween('scheduled_at', [
                $targetTime->copy(),
                $targetTime->copy()->endOfMinute()
            ])
            ->get();

        foreach ($chatRooms as $room) {
            $participants = $room->participants()->with('user')->get();
            foreach ($participants as $participant) {
                if ($participant->user) {
                    $participant->user->notify(new \App\Notifications\UpcomingChatNotification($room));
                }
            }
        }

        $this->info("Notified participants for {$chatRooms->count()} upcoming chat rooms.");
    }
}
