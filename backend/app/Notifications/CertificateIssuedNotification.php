<?php

namespace App\Notifications;

use App\Models\Certificate;
use App\Support\NotificationPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CertificateIssuedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Certificate $certificate) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $this->certificate->loadMissing('course');
        $url = url(config('app.frontend_url', 'http://localhost:5173') . "/certificates/{$this->certificate->id}");

        return (new MailMessage)
            ->subject('تم إصدار شهادتك')
            ->greeting("تهانينا {$notifiable->name}")
            ->line("تم إصدار شهادتك في دورة {$this->certificate->course->title}.")
            ->action('عرض الشهادة', $url);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $this->certificate->loadMissing('course');

        return NotificationPayload::make(
            type: 'certificate.issued',
            title: 'تهانينا! تم إصدار شهادتك',
            message: "لقد أتممت {$this->certificate->course->title} بنجاح، وشهادتك جاهزة الآن.",
            actionUrl: "/certificates/{$this->certificate->id}",
            entities: [
                'certificate_id' => $this->certificate->id,
                'course_id' => $this->certificate->course_id,
                'section_id' => $this->certificate->section_id,
            ],
            audience: 'student',
            priority: 'high',
            icon: 'workspace_premium',
            channels: ['database', 'mail'],
            metadata: [
                'certificate_number' => $this->certificate->certificate_number,
                'scope_type' => $this->certificate->scope_type,
            ],
        );
    }
}
