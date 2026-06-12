<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CertificateResource;
use App\Models\Certificate;
use App\Models\CourseSection;
use App\Services\CertificateService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CertificateController extends Controller
{
    public function __construct(
        private readonly CertificateService $certificateService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $certificates = $request->user()
            ->certificates()
            ->with(['user:id,name', 'course:id,title', 'section:id,title,course_id'])
            ->latest('issued_at')
            ->get()
            ->filter(function (Certificate $certificate) use ($request): bool {
                $eligibility = $this->eligibilityForCertificate($request, $certificate);

                return (bool) ($eligibility['certificate_unlocked'] ?? false);
            })
            ->values();

        return CertificateResource::collection($certificates);
    }

    public function show(Request $request, Certificate $certificate): CertificateResource|JsonResponse
    {
        if ($certificate->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Certificate was not found.',
            ], 404);
        }

        $eligibility = $this->eligibilityForCertificate($request, $certificate);

        if (! $eligibility || ! $eligibility['certificate_unlocked']) {
            return response()->json([
                'message' => $eligibility['locked_message'] ?? 'Certificate is locked.',
                'locked_reason' => $eligibility['locked_reason'] ?? 'not_enrolled',
                'certificate_status' => $eligibility,
            ], 423);
        }

        return new CertificateResource(
            $certificate->load(['user:id,name', 'course:id,title', 'section:id,title,course_id']),
        );
    }

    public function course(Request $request, int $courseId): JsonResponse
    {
        $enrollment = $request->user()
            ->enrollments()
            ->where('course_id', $courseId)
            ->first();

        if (! $enrollment) {
            return response()->json([
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        $eligibility = $this->certificateService->eligibilityForEnrollment($enrollment);

        if (! $eligibility['certificate_unlocked']) {
            return response()->json([
                'message'            => $eligibility['locked_message'],
                'locked_reason'      => $eligibility['locked_reason'],
                'certificate_status' => $eligibility,
            ], $eligibility['locked_reason'] === 'course_incomplete' ? 422 : 423);
        }

        $certificate = $this->certificateService->issueForEnrollment($enrollment);

        return (new CertificateResource(
            $certificate->load(['user:id,name', 'course:id,title', 'section:id,title,course_id']),
        ))->response()->setStatusCode(200);
    }

    public function section(Request $request, int $courseId, CourseSection $section): JsonResponse
    {
        if ($section->course_id !== $courseId) {
            return response()->json([
                'message' => 'Section was not found in this course.',
            ], 404);
        }

        $enrollment = $request->user()
            ->enrollments()
            ->where('course_id', $courseId)
            ->first();

        if (! $enrollment) {
            return response()->json([
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        $eligibility = $this->certificateService->eligibilityForSection($enrollment, $section);

        if (! $eligibility['certificate_unlocked']) {
            return response()->json([
                'message' => $eligibility['locked_message'],
                'locked_reason' => $eligibility['locked_reason'],
                'certificate_status' => $eligibility,
            ], 423);
        }

        $certificate = $this->certificateService->issueForSection($enrollment, $section);

        return (new CertificateResource(
            $certificate->load(['user:id,name', 'course:id,title', 'section:id,title,course_id']),
        ))->response()->setStatusCode(200);
    }

    /**
     * Generate and download a PDF certificate for the authenticated user.
     */
    public function downloadPdf(Request $request, int $id): Response|JsonResponse
    {
        $certificate = Certificate::with(['user:id,name', 'course:id,title', 'section:id,title,course_id'])
            ->find($id);

        // 404 — certificate does not exist
        if (! $certificate) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }

        // 403 — certificate belongs to someone else
        if ($certificate->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }

        // Verify the student actually earned this (course + quiz complete)
        $eligibility = $this->eligibilityForCertificate($request, $certificate);

        if (! $eligibility || ! $eligibility['certificate_unlocked']) {
            return response()->json(['message' => 'Certificate is not yet unlocked.'], 423);
        }

        $pdf = Pdf::loadView('certificates.pdf', [
            'certificate' => $certificate,
            'studentName' => $certificate->user?->name  ?? 'Student',
            'courseName'  => $certificate->section
                ? (($certificate->course?->title ?? 'Course') . ' - ' . $certificate->section->title)
                : ($certificate->course?->title ?? 'Course'),
            'issuedAt'    => $certificate->issued_at
                ? $certificate->issued_at->format('d F Y')
                : now()->format('d F Y'),
            'certNumber'  => $certificate->certificate_number,
        ])->setPaper('a4', 'landscape');

        event(new \App\Events\FileDownloadedEvent($request->user(), 'certificate-' . $id . '.pdf'));
        event(new \App\Events\UserGeneratedCertificateEvent($request->user(), $certificate->course));

        return $pdf->download('certificate-' . $id . '.pdf');
    }

    /**
     * @return array<string, mixed>|null
     */
    private function eligibilityForCertificate(Request $request, Certificate $certificate): ?array
    {
        $enrollment = $request->user()
            ->enrollments()
            ->where('course_id', $certificate->course_id)
            ->first();

        if (! $enrollment) {
            return null;
        }

        if ($certificate->scope_type === 'section') {
            $section = $certificate->section;

            return $section
                ? $this->certificateService->eligibilityForSection($enrollment, $section)
                : null;
        }

        return $this->certificateService->eligibilityForEnrollment($enrollment);
    }
}
