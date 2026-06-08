<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin user routes require authentication and the admin role', function () {
    $student = User::factory()->create([
        'role' => 'student',
        'status' => 'active',
    ]);

    $this->getJson('/api/admin/users')->assertUnauthorized();

    Sanctum::actingAs($student);

    $this->getJson('/api/admin/users')
        ->assertForbidden();
});

test('an admin can search filter and paginate users with relationship counts', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    $matchingUser = User::factory()->create([
        'name' => 'Search Target',
        'email' => 'target@example.com',
        'role' => 'student',
        'status' => 'active',
    ]);

    User::factory()->create([
        'name' => 'Search Target Suspended',
        'email' => 'suspended-target@example.com',
        'role' => 'student',
        'status' => 'suspended',
    ]);

    User::factory()->create([
        'name' => 'Different Instructor',
        'role' => 'instructor',
        'status' => 'active',
    ]);

    Sanctum::actingAs($admin);

    $this->getJson('/api/admin/users?search=target@example.com&role=student&status=active&per_page=1')
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('per_page', 1)
        ->assertJsonPath('data.0.id', $matchingUser->id)
        ->assertJsonPath('data.0.name', 'Search Target')
        ->assertJsonPath('data.0.email', 'target@example.com')
        ->assertJsonPath('data.0.role', 'student')
        ->assertJsonPath('data.0.status', 'active')
        ->assertJsonPath('data.0.enrollments_count', 0)
        ->assertJsonPath('data.0.certificates_count', 0)
        ->assertJsonStructure([
            'data' => [[
                'id',
                'name',
                'email',
                'role',
                'status',
                'created_at',
                'enrollments_count',
                'certificates_count',
            ]],
            'current_page',
            'last_page',
            'total',
        ]);

    $this->getJson("/api/admin/users/{$matchingUser->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $matchingUser->id)
        ->assertJsonPath('data.enrollments_count', 0)
        ->assertJsonPath('data.certificates_count', 0);
});

test('an admin can suspend and reactivate a student without deleting the account', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    $student = User::factory()->create([
        'email' => 'managed.student@example.com',
        'password' => Hash::make('Password123!'),
        'role' => 'student',
        'status' => 'active',
    ]);

    $student->createToken('student-session');

    Sanctum::actingAs($admin);

    $this->putJson("/api/admin/users/{$student->id}/status", [
        'status' => 'suspended',
    ])->assertOk()
        ->assertJsonPath('data.status', 'suspended')
        ->assertJsonPath('message', 'تم تحديث حالة المستخدم بنجاح.');

    $this->assertDatabaseHas('users', [
        'id' => $student->id,
        'status' => 'suspended',
    ]);
    $this->assertDatabaseMissing('personal_access_tokens', [
        'tokenable_id' => $student->id,
    ]);

    $this->postJson('/api/login', [
        'email' => 'managed.student@example.com',
        'password' => 'Password123!',
    ])->assertForbidden()
        ->assertJsonPath('code', 'ACCOUNT_SUSPENDED');

    $this->putJson("/api/admin/users/{$student->id}/status", [
        'status' => 'active',
    ])->assertOk()
        ->assertJsonPath('data.status', 'active');

    $this->postJson('/api/login', [
        'email' => 'managed.student@example.com',
        'password' => 'Password123!',
    ])->assertOk();
});

test('an admin cannot disable or demote his own account', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    Sanctum::actingAs($admin);

    $this->putJson("/api/admin/users/{$admin->id}/status", [
        'status' => 'suspended',
    ])->assertUnprocessable()
        ->assertJsonPath('message', 'لا يمكنك تعطيل أو إيقاف حسابك الشخصي.');

    $this->putJson("/api/admin/users/{$admin->id}/role", [
        'role' => 'student',
    ])->assertUnprocessable()
        ->assertJsonPath('message', 'لا يمكنك إزالة صلاحية المسؤول من حسابك الشخصي.');

    $admin->refresh();

    expect($admin->status)->toBe('active')
        ->and($admin->role)->toBe('admin');
});

test('an admin can safely update another users role and no delete route exists', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    $student = User::factory()->create([
        'role' => 'student',
        'status' => 'active',
    ]);

    Sanctum::actingAs($admin);

    $this->putJson("/api/admin/users/{$student->id}/role", [
        'role' => 'instructor',
    ])->assertOk()
        ->assertJsonPath('data.role', 'instructor')
        ->assertJsonPath('message', 'تم تحديث دور المستخدم بنجاح.');

    $this->deleteJson("/api/admin/users/{$student->id}")
        ->assertStatus(405);

    $this->assertDatabaseHas('users', [
        'id' => $student->id,
        'role' => 'instructor',
    ]);
});
