<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Authorize chat room channel
Broadcast::channel('chat-room.{id}', function ($user, $id) {
    $room = \App\Models\ChatRoom::find($id);
    if (!$room) {
        return false;
    }

    if ($user->role === 'admin') {
        return true;
    }

    return $room->audience_type === 'all' || 
        \App\Models\ChatParticipant::where('chat_room_id', $room->id)->where('user_id', $user->id)->exists() ||
        ($room->audience_type === 'course_id' && \App\Models\Enrollment::where('course_id', $room->course_id)->where('user_id', $user->id)->exists());
});
