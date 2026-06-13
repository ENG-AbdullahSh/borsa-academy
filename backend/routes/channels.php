<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Authorize chat room channel
Broadcast::channel('chat-room.{id}', function ($user, $id) {
    // Check if the authenticated user is a participant in this room
    return \App\Models\ChatParticipant::where('chat_room_id', $id)
        ->where('user_id', $user->id)
        ->exists();
});
