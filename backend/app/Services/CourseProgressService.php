<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\CourseSection;

class CourseProgressService
{
    public function __construct(
        private readonly CertificateService $certificateService,
        private readonly QuizService $quizService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function syncEnrollment(Enrollment $enrollment): array
    {
        $sections = CourseSection::query()
            ->where('course_id', $enrollment->course_id)
            ->with('lessons.quiz.questions.options')
            ->orderBy('order')
            ->orderBy('id')
            ->get();
        $sectionStatuses = $sections
            ->map(fn (CourseSection $section): array => $this->quizService->sectionStatus($enrollment, $section));
        $totalLessons = $sectionStatuses->sum('total_lessons');
        $completedLessons = $sectionStatuses->sum('completed_lessons');

        $progressPercentage = $totalLessons > 0
            ? (int) round(($completedLessons / $totalLessons) * 100)
            : 0;
        $progressPercentage = min(max($progressPercentage, 0), 100);
        $courseCompleted = $totalLessons > 0 && $completedLessons >= $totalLessons;

        $enrollment->update([
            'progress' => $progressPercentage,
            'completed' => $courseCompleted,
        ]);

        $sectionCertificates = [];

        foreach ($sections as $section) {
            $status = $sectionStatuses->firstWhere('section_id', $section->id);

            if ($status && $status['section_completed']) {
                $sectionCertificate = $this->certificateService->issueForSection($enrollment, $section);

                if ($sectionCertificate) {
                    $sectionCertificates[] = [
                        'section_id' => $section->id,
                        'certificate_id' => $sectionCertificate->id,
                    ];
                }
            }
        }

        $certificate = $courseCompleted
            ? $this->certificateService->issueForEnrollment($enrollment)
            : null;
        $certificateStatus = $this->certificateService->eligibilityForEnrollment($enrollment);

        return [
            'course_id' => $enrollment->course_id,
            'completed_lessons' => $completedLessons,
            'total_lessons' => $totalLessons,
            'progress_percentage' => $progressPercentage,
            'course_completed' => $courseCompleted,
            'certificate_id' => $certificate?->id,
            'certificate_status' => $certificateStatus,
            'section_certificates' => $sectionCertificates,
            'section_statuses' => $sectionStatuses->values(),
        ];
    }
}
