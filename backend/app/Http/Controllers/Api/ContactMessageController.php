<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactRequest;
use App\Http\Requests\ReplyToContactMessageRequest;
use App\Mail\ContactMessage as ContactMail;
use App\Mail\ContactMessageReply;
use App\Models\ContactMessage;
use App\Notifications\ContactMessageReplied;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Throwable;

class ContactMessageController extends Controller
{
    /**
     * The recipient email address for all contact messages.
     */
    private const RECIPIENT = 'gro.pepo@gmail.com';

    /**
     * Handle an incoming contact form submission.
     *
     * POST /api/contact
     */
    public function send(ContactRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user('sanctum');
        $senderName = $user?->name ?? $data['name'];
        $senderEmail = $user?->email ?? $data['email'];

        // ── 1. Save to database (always) ──────────────────────────
        try {
            $record = ContactMessage::create([
                'user_id'    => $user?->id,
                'sender_type' => $user ? 'user' : 'guest',
                'name'       => $senderName,
                'email'      => $senderEmail,
                'subject'    => $data['subject'],
                'message'    => $data['message'],
                'status'     => 'unread',
                'email_sent' => false,
            ]);
        } catch (Throwable $e) {
            Log::error('Contact form DB save failed', [
                'error'       => $e->getMessage(),
                'senderEmail' => $senderEmail,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء حفظ الرسالة، يرجى المحاولة لاحقًا',
            ], 500);
        }

        // ── 2. Try to send email (optional — failure is non-fatal) ─
        $submittedAt = now()->setTimezone('Asia/Riyadh')->format('Y-m-d H:i:s') . ' (بتوقيت الرياض)';

        try {
            Mail::to(self::RECIPIENT)->send(new ContactMail(
                senderName:  $senderName,
                senderEmail: $senderEmail,
                inquirySubject: $data['subject'],
                messageBody: $data['message'],
                submittedAt: $submittedAt,
            ));

            $record->update(['email_sent' => true]);
        } catch (Throwable $e) {
            // Log the failure but do NOT fail the response — DB save succeeded
            Log::warning('Contact form email delivery failed (non-fatal)', [
                'contact_message_id' => $record->id,
                'error'              => $e->getMessage(),
            ]);
        }

        // ── 3. Return success (based on DB save, not email) ────────
        return response()->json([
            'success' => true,
            'message' => 'تم إرسال رسالتك بنجاح',
        ]);
    }

    /**
     * List all contact messages (admin only).
     *
     * GET /api/admin/contact-messages
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['unread', 'read', 'replied', 'archived'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $counts = [
            'total' => ContactMessage::count(),
            'unread' => ContactMessage::where('status', 'unread')->count(),
            'read' => ContactMessage::where('status', 'read')->count(),
            'replied' => ContactMessage::where('status', 'replied')->count(),
            'archived' => ContactMessage::where('status', 'archived')->count(),
        ];

        $messages = ContactMessage::query()
            ->with('user:id,name,email')
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%")
                        ->orWhere('message', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, function ($query, string $status): void {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();

        return response()->json([
            'data' => $messages->items(),
            'current_page' => $messages->currentPage(),
            'last_page' => $messages->lastPage(),
            'per_page' => $messages->perPage(),
            'total' => $messages->total(),
            'from' => $messages->firstItem(),
            'to' => $messages->lastItem(),
            'counts' => $counts,
            'unread_count' => $counts['unread'],
            'total_count' => $counts['total'],
        ]);
    }

    /**
     * Display a single contact message (admin only).
     *
     * GET /api/admin/contact-messages/{id}
     */
    public function show(ContactMessage $contactMessage): JsonResponse
    {
        return response()->json([
            'data' => $contactMessage->load([
                'user:id,name,email',
                'replier:id,name,email',
            ]),
        ]);
    }

    /**
     * List contact messages submitted by the authenticated user.
     *
     * GET /api/my-contact-messages
     */
    public function myMessages(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $messages = ContactMessage::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'user:id,name,email',
                'replier:id,name,email',
            ])
            ->latest()
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        return response()->json($messages);
    }

    /**
     * Reply to a contact message (admin only).
     *
     * POST /api/admin/contact-messages/{id}/reply
     */
    public function reply(
        ReplyToContactMessageRequest $request,
        ContactMessage $contactMessage
    ): JsonResponse {
        $data = $request->validated();

        $contactMessage->update([
            'reply_subject' => $data['reply_subject'],
            'reply_message' => $data['reply_message'],
            'replied_at' => now(),
            'replied_by' => $request->user()->id,
            'status' => 'replied',
        ]);

        try {
            Mail::to($contactMessage->email)->send(new ContactMessageReply(
                recipientName: $contactMessage->name,
                replySubject: $data['reply_subject'],
                replyMessage: $data['reply_message'],
                originalSubject: $contactMessage->subject,
            ));
        } catch (Throwable $e) {
            Log::warning('Contact message reply email delivery failed (non-fatal)', [
                'contact_message_id' => $contactMessage->id,
                'error' => $e->getMessage(),
            ]);
        }

        if ($contactMessage->user_id) {
            try {
                $contactMessage->user?->notify(new ContactMessageReplied($contactMessage));
            } catch (Throwable $e) {
                Log::warning('Contact message in-app reply notification failed (non-fatal)', [
                    'contact_message_id' => $contactMessage->id,
                    'user_id' => $contactMessage->user_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إرسال الرد بنجاح',
            'data' => $contactMessage->fresh()->load([
                'user:id,name,email',
                'replier:id,name,email',
            ]),
        ]);
    }

    /**
     * Update status or admin_note for a single message (admin only).
     *
     * PATCH /api/admin/contact-messages/{id}
     */
    public function update(Request $request, ContactMessage $contactMessage): JsonResponse
    {
        $data = $request->validate([
            'status'     => ['sometimes', 'in:unread,read,archived'],
            'admin_note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $contactMessage->update($data);

        return response()->json([
            'success' => true,
            'data'    => $contactMessage->fresh(),
        ]);
    }

    /**
     * Delete a contact message (admin only).
     *
     * DELETE /api/admin/contact-messages/{id}
     */
    public function destroy(ContactMessage $contactMessage): JsonResponse
    {
        $contactMessage->delete();

        return response()->json(['success' => true]);
    }
}
