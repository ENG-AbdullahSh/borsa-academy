<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('a student can register and use the returned sanctum token', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'New Student',
        'email' => 'NEW.STUDENT@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])->assertCreated()
        ->assertJsonPath('user.email', 'new.student@example.com')
        ->assertJsonPath('user.role', 'student')
        ->assertJsonPath('user.status', 'active')
        ->assertJsonPath('token_type', 'Bearer')
        ->assertJsonStructure(['user', 'token', 'token_type']);

    $user = User::where('email', 'new.student@example.com')->firstOrFail();

    expect(Hash::check('Password123!', $user->password))->toBeTrue();

    $this->withToken($response->json('token'))
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('user.id', $user->id);
});

test('registration rejects a duplicate email with an arabic error', function () {
    User::factory()->create(['email' => 'used@example.com']);

    $this->postJson('/api/register', [
        'name' => 'Duplicate User',
        'email' => 'USED@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'هذا البريد مستخدم بالفعل');
});

test('login distinguishes an unknown account from an incorrect password', function () {
    User::factory()->create([
        'email' => 'student@example.com',
        'password' => Hash::make('Password123!'),
        'role' => 'student',
        'status' => 'active',
    ]);

    $this->postJson('/api/login', [
        'email' => 'missing@example.com',
        'password' => 'Password123!',
    ])->assertNotFound()
        ->assertJson([
            'message' => 'لا يوجد حساب بهذا البريد الإلكتروني، يرجى إنشاء حساب جديد',
            'code' => 'ACCOUNT_NOT_FOUND',
        ]);

    $this->postJson('/api/login', [
        'email' => 'student@example.com',
        'password' => 'WrongPassword!',
    ])->assertUnprocessable()
        ->assertJson([
            'message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            'code' => 'INVALID_CREDENTIALS',
        ]);
});

test('active users can login and logout while blocked users cannot login', function () {
    $activeUser = User::factory()->create([
        'email' => 'active@example.com',
        'password' => Hash::make('Password123!'),
        'role' => 'student',
        'status' => 'active',
    ]);

    User::factory()->create([
        'email' => 'suspended@example.com',
        'password' => Hash::make('Password123!'),
        'status' => 'suspended',
    ]);

    $login = $this->postJson('/api/login', [
        'email' => 'ACTIVE@example.com',
        'password' => 'Password123!',
    ])->assertOk()
        ->assertJsonPath('user.id', $activeUser->id)
        ->assertJsonPath('token_type', 'Bearer');

    $token = $login->json('token');

    $this->withToken($token)
        ->postJson('/api/logout')
        ->assertOk();

    $this->app['auth']->forgetGuards();

    $this->withToken($token)
        ->getJson('/api/me')
        ->assertUnauthorized();

    $this->postJson('/api/login', [
        'email' => 'suspended@example.com',
        'password' => 'Password123!',
    ])->assertForbidden()
        ->assertJson([
            'message' => 'هذا الحساب غير مفعل أو موقوف',
            'code' => 'ACCOUNT_SUSPENDED',
        ]);
});
