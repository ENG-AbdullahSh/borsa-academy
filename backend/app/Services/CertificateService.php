<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\CourseSection;
use App\Models\Enrollment;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

class CertificateService
{
    public function __construct(
        private readonly QuizService $quizService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function eligibilityForEnrollment(Enrollment $enrollment): array
    {
        $enrollment->refresh();

        return $this->quizService->statusForEnrollment($enrollment);
    }

    /**
     * @return array<string, mixed>
     */
    public function eligibilityForSection(Enrollment $enrollment, CourseSection $section): array
    {
        return $this->quizService->sectionStatus($enrollment, $section);
    }

    public function issueForEnrollment(Enrollment $enrollment): ?Certificate
    {
        $eligibility = $this->eligibilityForEnrollment($enrollment);

        if (! $eligibility['certificate_unlocked']) {
            return null;
        }

        $existingCertificate = Certificate::query()
            ->where('user_id', $enrollment->user_id)
            ->where('scope_type', 'course')
            ->where('scope_id', $enrollment->course_id)
            ->first();

        if ($existingCertificate) {
            return $existingCertificate;
        }

        try {
            return Certificate::create([
                'user_id' => $enrollment->user_id,
                'course_id' => $enrollment->course_id,
                'section_id' => null,
                'scope_type' => 'course',
                'scope_id' => $enrollment->course_id,
                'certificate_number' => $this->generateCertificateNumber(),
                'issued_at' => now(),
            ]);
        } catch (QueryException $exception) {
            $certificate = Certificate::query()
                ->where('user_id', $enrollment->user_id)
                ->where('scope_type', 'course')
                ->where('scope_id', $enrollment->course_id)
                ->first();

            if ($certificate) {
                return $certificate;
            }

            throw $exception;
        }
    }

    public function issueForSection(Enrollment $enrollment, CourseSection $section): ?Certificate
    {
        if ($section->course_id !== $enrollment->course_id) {
            return null;
        }

        $eligibility = $this->eligibilityForSection($enrollment, $section);

        if (! $eligibility['certificate_unlocked']) {
            return null;
        }

        $existingCertificate = Certificate::query()
            ->where('user_id', $enrollment->user_id)
            ->where('scope_type', 'section')
            ->where('scope_id', $section->id)
            ->first();

        if ($existingCertificate) {
            return $existingCertificate;
        }

        try {
            return Certificate::create([
                'user_id' => $enrollment->user_id,
                'course_id' => $enrollment->course_id,
                'section_id' => $section->id,
                'scope_type' => 'section',
                'scope_id' => $section->id,
                'certificate_number' => $this->generateCertificateNumber(),
                'issued_at' => now(),
            ]);
        } catch (QueryException $exception) {
            $certificate = Certificate::query()
                ->where('user_id', $enrollment->user_id)
                ->where('scope_type', 'section')
                ->where('scope_id', $section->id)
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
