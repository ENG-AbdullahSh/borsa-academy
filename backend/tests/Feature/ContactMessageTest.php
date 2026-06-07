<?php

use App\Mail\ContactMessage as ContactMessageMail;
use App\Mail\ContactMessageReply;
use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function contactPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'أحمد محمد',
        'email' => 'ahmad@example.com',
        'subject' => 'استفسار عام',
        'message' => 'هذه رسالة تجريبية تحتوي على تفاصيل كافية.',
    ], $overrides);
}

function createContactMessage(array $overrides = []): ContactMessage
{
    return ContactMessage::create(array_merge([
        'name' => 'مرسل تجريبي',
        'email' => 'sender@example.com',
        'subject' => 'موضوع تجريبي',
        'message' => 'نص رسالة تجريبية طويلة بما يكفي للاختبار.',
        'sender_type' => 'guest',
        'status' => 'unread',
        'admin_note' => null,
        'email_sent' => false,
    ], $overrides));
}

test('a guest contact submission is saved and emailed', function () {
    Mail::fake();

    $this->postJson('/api/contact', contactPayload())
        ->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'تم إرسال رسالتك بنجاح',
        ]);

    $this->assertDatabaseHas('contact_messages', [
        'email' => 'ahmad@example.com',
        'user_id' => null,
        'sender_type' => 'guest',
        'status' => 'unread',
        'email_sent' => true,
    ]);

    Mail::assertSent(ContactMessageMail::class, function (ContactMessageMail $mail): bool {
        return $mail->hasTo('gro.pepo@gmail.com')
            && $mail->senderEmail === 'ahmad@example.com'
            && $mail->inquirySubject === 'استفسار عام';
    });
});

test('an authenticated contact submission uses the database identity and ignores submitted identity fields', function () {
    Mail::fake();

    $student = User::factory()->create([
        'name' => 'الطالب الحقيقي',
        'email' => 'student@example.com',
        'role' => 'student',
    ]);

    Sanctum::actingAs($student);

    $this->postJson('/api/contact', [
        'name' => 'اسم مزيف',
        'email' => 'spoofed@example.com',
        'subject' => 'دعم تقني',
        'message' => 'هذه رسالة مرسلة من حساب مستخدم مسجل.',
    ])
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('contact_messages', [
        'user_id' => $student->id,
        'sender_type' => 'user',
        'name' => 'الطالب الحقيقي',
        'email' => 'student@example.com',
        'subject' => 'دعم تقني',
    ]);

    $this->assertDatabaseMissing('contact_messages', [
        'email' => 'spoofed@example.com',
    ]);
});

test('an authenticated contact submission may omit name and email', function () {
    Mail::fake();

    $student = User::factory()->create([
        'name' => 'مستخدم مسجل',
        'email' => 'registered@example.com',
        'role' => 'student',
    ]);

    Sanctum::actingAs($student);

    $this->postJson('/api/contact', [
        'subject' => 'استفسار حساب',
        'message' => 'يجب قبول هذه الرسالة دون اسم أو بريد في الطلب.',
    ])
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('contact_messages', [
        'user_id' => $student->id,
        'name' => 'مستخدم مسجل',
        'email' => 'registered@example.com',
        'sender_type' => 'user',
    ]);
});

test('a guest receives success when email delivery fails after the message is saved', function () {
    Mail::shouldReceive('to')
        ->once()
        ->with('gro.pepo@gmail.com')
        ->andThrow(new RuntimeException('SMTP unavailable'));

    $this->postJson('/api/contact', contactPayload([
        'email' => 'saved-first@example.com',
    ]))
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('contact_messages', [
        'email' => 'saved-first@example.com',
        'status' => 'unread',
        'email_sent' => false,
    ]);
});

test('the log mailer logs the admin notification and still saves the guest message', function () {
    config()->set('mail.default', 'log');
    Mail::purge();

    $this->postJson('/api/contact', contactPayload([
        'email' => 'log-guest@example.com',
    ]))
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('contact_messages', [
        'email' => 'log-guest@example.com',
        'sender_type' => 'guest',
        'email_sent' => true,
    ]);
});

test('the guest contact endpoint returns arabic validation messages', function () {
    $this->postJson('/api/contact', contactPayload([
        'name' => '',
        'email' => 'invalid-email',
        'message' => 'قصيرة',
    ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'message'])
        ->assertJsonPath('errors.name.0', 'حقل الاسم مطلوب.')
        ->assertJsonPath('errors.email.0', 'يرجى إدخال بريد إلكتروني صحيح.');
});

test('contact message admin routes require authentication and the admin role', function () {
    $message = createContactMessage();

    $this->getJson('/api/admin/contact-messages')->assertUnauthorized();
    $this->postJson("/api/admin/contact-messages/{$message->id}/reply", [
        'reply_subject' => 'رد غير مصرح',
        'reply_message' => 'لا يجب السماح بهذا الرد.',
    ])->assertUnauthorized();

    Sanctum::actingAs(User::factory()->create(['role' => 'student']));

    $this->getJson('/api/admin/contact-messages')->assertForbidden();
    $this->getJson("/api/admin/contact-messages/{$message->id}")->assertForbidden();
    $this->postJson("/api/admin/contact-messages/{$message->id}/reply", [
        'reply_subject' => 'رد تجريبي',
        'reply_message' => 'هذا رد تجريبي.',
    ])->assertForbidden();
    $this->patchJson("/api/admin/contact-messages/{$message->id}", ['status' => 'read'])->assertForbidden();
    $this->deleteJson("/api/admin/contact-messages/{$message->id}")->assertForbidden();
});

test('an admin can paginate search and filter contact messages with counts', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    createContactMessage([
        'name' => 'أحمد الخاص',
        'email' => 'special@example.com',
        'status' => 'unread',
    ]);
    createContactMessage(['status' => 'read', 'email' => 'read@example.com']);
    createContactMessage(['status' => 'archived', 'email' => 'archived@example.com']);

    Sanctum::actingAs($admin);

    $this->getJson('/api/admin/contact-messages?status=unread&search=special&per_page=1')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.email', 'special@example.com')
        ->assertJsonPath('current_page', 1)
        ->assertJsonPath('last_page', 1)
        ->assertJsonPath('total', 1)
        ->assertJsonPath('counts.total', 3)
        ->assertJsonPath('counts.unread', 1)
        ->assertJsonPath('counts.read', 1)
        ->assertJsonPath('counts.archived', 1)
        ->assertJsonPath('unread_count', 1)
        ->assertJsonPath('total_count', 3);
});

test('an admin can view update and delete a contact message', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $message = createContactMessage();

    Sanctum::actingAs($admin);

    $this->getJson("/api/admin/contact-messages/{$message->id}")
        ->assertOk()
        ->assertJsonPath('data.message', $message->message);

    $this->patchJson("/api/admin/contact-messages/{$message->id}", [
        'status' => 'read',
        'admin_note' => 'تم التواصل مع المرسل.',
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'read')
        ->assertJsonPath('data.admin_note', 'تم التواصل مع المرسل.');

    $this->assertDatabaseHas('contact_messages', [
        'id' => $message->id,
        'status' => 'read',
        'admin_note' => 'تم التواصل مع المرسل.',
    ]);

    $this->deleteJson("/api/admin/contact-messages/{$message->id}")
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseMissing('contact_messages', ['id' => $message->id]);
});

test('admin responses include registered and final sender identities', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $student = User::factory()->create([
        'name' => 'صاحب الحساب',
        'email' => 'account@example.com',
        'role' => 'student',
    ]);
    $message = createContactMessage([
        'user_id' => $student->id,
        'sender_type' => 'user',
        'name' => $student->name,
        'email' => $student->email,
    ]);

    Sanctum::actingAs($admin);

    $this->getJson("/api/admin/contact-messages/{$message->id}")
        ->assertOk()
        ->assertJsonPath('data.user_id', $student->id)
        ->assertJsonPath('data.sender_type', 'user')
        ->assertJsonPath('data.registered_user_name', 'صاحب الحساب')
        ->assertJsonPath('data.registered_user_email', 'account@example.com')
        ->assertJsonPath('data.sender_name', 'صاحب الحساب')
        ->assertJsonPath('data.sender_email', 'account@example.com');

    $this->getJson('/api/admin/contact-messages')
        ->assertOk()
        ->assertJsonPath('data.0.registered_user_email', 'account@example.com')
        ->assertJsonPath('data.0.sender_email', 'account@example.com');
});

test('an admin can reply to a contact message', function () {
    Mail::fake();

    $admin = User::factory()->create([
        'name' => 'مدير النظام',
        'role' => 'admin',
    ]);
    $message = createContactMessage([
        'email' => 'recipient@example.com',
        'subject' => 'طلب مساعدة',
    ]);

    Sanctum::actingAs($admin);

    $this->postJson("/api/admin/contact-messages/{$message->id}/reply", [
        'reply_subject' => 'Re: طلب مساعدة',
        'reply_message' => 'شكرًا لتواصلك، تم حل طلبك.',
    ])
        ->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'تم إرسال الرد بنجاح',
        ])
        ->assertJsonPath('data.status', 'replied')
        ->assertJsonPath('data.reply_subject', 'Re: طلب مساعدة')
        ->assertJsonPath('data.reply_message', 'شكرًا لتواصلك، تم حل طلبك.')
        ->assertJsonPath('data.replied_by', $admin->id)
        ->assertJsonPath('data.replier.name', 'مدير النظام');

    $this->assertDatabaseHas('contact_messages', [
        'id' => $message->id,
        'reply_subject' => 'Re: طلب مساعدة',
        'reply_message' => 'شكرًا لتواصلك، تم حل طلبك.',
        'replied_by' => $admin->id,
        'status' => 'replied',
    ]);

    expect($message->fresh()->replied_at)->not->toBeNull();

    Mail::assertSent(ContactMessageReply::class, function (ContactMessageReply $mail): bool {
        return $mail->hasTo('recipient@example.com')
            && $mail->replySubject === 'Re: طلب مساعدة';
    });
});

test('reply validation uses arabic messages', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $message = createContactMessage();

    Sanctum::actingAs($admin);

    $this->postJson("/api/admin/contact-messages/{$message->id}/reply", [
        'reply_subject' => '',
        'reply_message' => '',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['reply_subject', 'reply_message'])
        ->assertJsonPath('errors.reply_subject.0', 'موضوع الرد مطلوب.')
        ->assertJsonPath('errors.reply_message.0', 'نص الرد مطلوب.');
});

test('a reply remains saved when email delivery fails', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $message = createContactMessage(['email' => 'offline@example.com']);

    Mail::shouldReceive('to')
        ->once()
        ->with('offline@example.com')
        ->andThrow(new RuntimeException('SMTP unavailable'));

    Sanctum::actingAs($admin);

    $this->postJson("/api/admin/contact-messages/{$message->id}/reply", [
        'reply_subject' => 'رد محفوظ',
        'reply_message' => 'يجب أن يبقى هذا الرد محفوظًا.',
    ])
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('contact_messages', [
        'id' => $message->id,
        'reply_subject' => 'رد محفوظ',
        'reply_message' => 'يجب أن يبقى هذا الرد محفوظًا.',
        'replied_by' => $admin->id,
        'status' => 'replied',
    ]);
});

test('the log mailer logs the reply and still saves it', function () {
    config()->set('mail.default', 'log');
    Mail::purge();

    $admin = User::factory()->create(['role' => 'admin']);
    $message = createContactMessage(['email' => 'logged@example.com']);

    Sanctum::actingAs($admin);

    $this->postJson("/api/admin/contact-messages/{$message->id}/reply", [
        'reply_subject' => 'رد عبر السجل',
        'reply_message' => 'يتم تسجيل هذا البريد محليًا.',
    ])
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('contact_messages', [
        'id' => $message->id,
        'reply_subject' => 'رد عبر السجل',
        'reply_message' => 'يتم تسجيل هذا البريد محليًا.',
        'status' => 'replied',
    ]);
});

test('replying to a registered user creates an in-app notification', function () {
    Mail::fake();

    $admin = User::factory()->create(['role' => 'admin']);
    $student = User::factory()->create(['role' => 'student']);
    $message = createContactMessage([
        'user_id' => $student->id,
        'sender_type' => 'user',
        'name' => $student->name,
        'email' => $student->email,
    ]);

    Sanctum::actingAs($admin);

    $this->postJson("/api/admin/contact-messages/{$message->id}/reply", [
        'reply_subject' => 'تمت متابعة طلبك',
        'reply_message' => 'هذا هو رد إدارة الأكاديمية.',
    ])
        ->assertOk()
        ->assertJsonPath('success', true);

    Mail::assertSent(ContactMessageReply::class, function (ContactMessageReply $mail) use ($student): bool {
        return $mail->hasTo($student->email);
    });

    $notification = $student->fresh()->notifications()->first();

    expect($notification)->not->toBeNull()
        ->and($notification->data['message'])->toBe('تم الرد على رسالتك من إدارة الأكاديمية')
        ->and($notification->data['contact_message_id'])->toBe($message->id);
});

test('an authenticated user can list only their own contact messages', function () {
    $student = User::factory()->create(['role' => 'student']);
    $otherStudent = User::factory()->create(['role' => 'student']);

    $ownMessage = createContactMessage([
        'user_id' => $student->id,
        'sender_type' => 'user',
        'name' => $student->name,
        'email' => $student->email,
    ]);
    createContactMessage([
        'user_id' => $otherStudent->id,
        'sender_type' => 'user',
        'name' => $otherStudent->name,
        'email' => $otherStudent->email,
    ]);
    createContactMessage(['email' => 'guest-only@example.com']);

    Sanctum::actingAs($student);

    $this->getJson('/api/my-contact-messages')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $ownMessage->id)
        ->assertJsonPath('data.0.user_id', $student->id)
        ->assertJsonPath('data.0.sender_type', 'user');
});

test('a guest cannot list personal contact messages', function () {
    $this->getJson('/api/my-contact-messages')->assertUnauthorized();
});
