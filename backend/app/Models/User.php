<?php

namespace App\Models;

use Database\Factories\UserFactory;
use App\Notifications\CustomResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;


    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar',
        'status',
        'google_id',
        'email_verified_at',
    ];


    protected $hidden = [
        'password',
        'remember_token',
    ];


    protected $appends = [
        'avatar_url'
    ];


    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }


    public function getAvatarUrlAttribute(): ?string
    {
        if (empty($this->avatar)) {
            return null;
        }


        if (filter_var($this->avatar, FILTER_VALIDATE_URL)) {
            return $this->avatar;
        }


        return asset('storage/' . ltrim($this->avatar, '/'));
    }


    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }


    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }


    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }


    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }


    public function contactMessages(): HasMany
    {
        return $this->hasMany(ContactMessage::class);
    }


    public function instructorProfile(): HasOne
    {
        return $this->hasOne(Instructor::class);
    }


    public function reviews(): HasMany
    {
        return $this->hasMany(CourseReview::class);
    }


    public function sendPasswordResetNotification($token)
    {
        $this->notify(new CustomResetPassword($token));
    }
}