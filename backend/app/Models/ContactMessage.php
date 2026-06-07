<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactMessage extends Model
{
    protected $fillable = [
        'user_id',
        'sender_type',
        'name',
        'email',
        'subject',
        'message',
        'status',
        'admin_note',
        'reply_subject',
        'reply_message',
        'replied_at',
        'replied_by',
        'email_sent',
    ];

    protected $casts = [
        'email_sent' => 'boolean',
        'replied_at' => 'datetime',
    ];

    protected $appends = [
        'registered_user_name',
        'registered_user_email',
        'sender_name',
        'sender_email',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'replied_by');
    }

    public function getRegisteredUserNameAttribute(): ?string
    {
        return $this->user?->name;
    }

    public function getRegisteredUserEmailAttribute(): ?string
    {
        return $this->user?->email;
    }

    public function getSenderNameAttribute(): string
    {
        return $this->name;
    }

    public function getSenderEmailAttribute(): string
    {
        return $this->email;
    }

    /* ── Scopes ──────────────────────────────────────────────── */

    public function scopeUnread($query)
    {
        return $query->where('status', 'unread');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['unread', 'read', 'replied']);
    }

    /* ── Helpers ─────────────────────────────────────────────── */

    public function markAsRead(): void
    {
        if ($this->status === 'unread') {
            $this->update(['status' => 'read']);
        }
    }
}
