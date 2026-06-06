<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Enrollment;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

class CertificateService
{
    public function issueForEnrollment(Enrollment $enrollment): ?Certificate
    {
        $enrollment->refresh();

        if ($enrollment->progress !== 100 || ! $enrollment->completed) {
            return null;
        }

        $existingCertificate = Certificate::query()
            ->where('user_id', $enrollment->user_id)
            ->where('course_id', $enrollment->course_id)
            ->first();

        if ($existingCertificate) {
            return $existingCertificate;
        }

        try {
            return Certificate::create([
                'user_id' => $enrollment->user_id,
                'course_id' => $enrollment->course_id,
                'certificate_number' => $this->generateCertificateNumber(),
                'issued_at' => now(),
            ]);
        } catch (QueryException $exception) {
            $certificate = Certificate::query()
                ->where('user_id', $enrollment->user_id)
                ->where('course_id', $enrollment->course_id)
                ->first();

            if ($certificate) {
                return $certificate;
            }

            throw $exception;
        }
    }

    private function generateCertificateNumber(): string
    {
        do {
            $certificateNumber = sprintf(
                'BA-%s-%s',
                now()->format('Y'),
                Str::upper(Str::random(12)),
            );
        } while (Certificate::query()->where('certificate_number', $certificateNumber)->exists());

        return $certificateNumber;
    }
}
