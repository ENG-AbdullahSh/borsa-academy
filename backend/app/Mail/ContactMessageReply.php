<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactMessageReply extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $recipientName,
        public readonly string $replySubject,
        public readonly string $replyMessage,
        public readonly string $originalSubject,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->replySubject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.contact-message-reply',
            with: [
                'recipientName' => $this->recipientName,
                'replySubject' => $this->replySubject,
                'replyMessage' => $this->replyMessage,
                'originalSubject' => $this->originalSubject,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
