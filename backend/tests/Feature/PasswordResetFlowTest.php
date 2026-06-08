<?php

use App\Models\User;
use App\Notifications\CustomResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

test('forgot password always returns the generic arabic response', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'reset.user@example.com',
    ]);

    $expectedMessage = 'إذا كان البريد مسجلاً لدينا، سيتم إرسال رابط استعادة كلمة المرور';

    $this->postJson('/api/forgot-password', [
        'email' => $user->email,
    ])->assertOk()
        ->assertJsonPath('message', $expectedMessage);

    $this->postJson('/api/forgot-password', [
        'email' => 'missing@example.com',
    ])->assertOk()
        ->assertJsonPath('message', $expectedMessage);

    Notification::assertSentTo($user, CustomResetPassword::class);
});

test('a password reset token can be used once and the new password can login', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'password.owner@example.com',
        'password' => Hash::make('OldPassword123!'),
        'status' => 'active',
    ]);
    $user->createToken('old-session');

    $this->postJson('/api/forgot-password', [
        'email' => $user->email,
    ])->assertOk();

    $token = null;

    Notification::assertSentTo(
        $user,
        CustomResetPassword::class,
        function (CustomResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        }
    );

    expect($token)->not->toBeNull();

    $payload = [
        'token' => $token,
        'email' => $user->email,
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ];

    $this->postJson('/api/reset-password', $payload)
        ->assertOk()
        ->assertJsonPath('message', 'تمت إعادة تعيين كلمة المرور بنجاح.');

    $user->refresh();

    expect(Hash::check('NewPassword123!', $user->password))->toBeTrue();

    $this->assertDatabaseMissing('password_reset_tokens', [
        'email' => $user->email,
    ]);
    $this->assertDatabaseMissing('personal_access_tokens', [
        'tokenable_id' => $user->id,
    ]);

    $this->postJson('/api/reset-password', $payload)
        ->assertUnprocessable()
        ->assertJsonPath('message', 'رابط استعادة كلمة المرور غير صالح أو منتهي الصلاحية.');

    $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'NewPassword123!',
    ])->assertOk()
        ->assertJsonPath('user.id', $user->id);
});

test('password reset validates the required fields', function () {
    $this->postJson('/api/reset-password', [
        'email' => 'not-an-email',
        'password' => 'short',
        'password_confirmation' => 'different',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors([
            'token',
            'email',
            'password',
        ]);
});
