<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CertificateResource;
use App\Models\Certificate;
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
            ->with(['user:id,name', 'course:id,title'])
            ->latest('issued_at')
            ->get()
            ->filter(function (Certificate $certificate) use ($request): bool {
                $enrollment = $request->user()
                    ->enrollments()
                    ->where('course_id', $certificate->course_id)
                    ->first();

                return $enrollment
                    && $this->certificateService
                        ->eligibilityForEnrollment($enrollment)['certificate_unlocked'];
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

        $enrollment = $request->user()
            ->enrollments()
            ->where('course_id', $certificate->course_id)
            ->first();
        $eligibility = $enrollment
            ? $this->certificateService->eligibilityForEnrollment($enrollment)
            : null;

        if (! $eligibility || ! $eligibility['certificate_unlocked']) {
            return response()->json([
                'message' => $eligibility['locked_message'] ?? 'Certificate is locked.',
                'locked_reason' => $eligibility['locked_reason'] ?? 'not_enrolled',
                'certificate_status' => $eligibility,
            ], 423);
        }

        return new CertificateResource(
            $certificate->load(['user:id,name', 'course:id,title']),
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
            $certificate->load(['user:id,name', 'course:id,title']),
        ))->response()->setStatusCode(200);
    }

    /**
     * Generate and download a PDF certificate for the authenticated user.
     */
    public function downloadPdf(Request $request, int $id): Response|JsonResponse
    {
        $certificate = Certificate::with(['user:id,name', 'course:id,title'])
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
        $enrollment = $request->user()
            ->enrollments()
            ->where('course_id', $certificate->course_id)
            ->first();

        $eligibility = $enrollment
            ? $this->certificateService->eligibilityForEnrollment($enrollment)
            : null;

        if (! $eligibility || ! $eligibility['certificate_unlocked']) {
            return response()->json(['message' => 'Certificate is not yet unlocked.'], 423);
        }

        $pdf = Pdf::loadView('certificates.pdf', [
            'certificate' => $certificate,
            'studentName' => $certificate->user?->name  ?? 'Student',
            'courseName'  => $certificate->course?->title ?? 'Course',
            'issuedAt'    => $certificate->issued_at
                ? $certificate->issued_at->format('d F Y')
                : now()->format('d F Y'),
            'certNumber'  => $certificate->certificate_number,
        ])->setPaper('a4', 'landscape');

        event(new \App\Events\FileDownloadedEvent($request->user(), 'certificate-' . $id . '.pdf'));
        event(new \App\Events\UserGeneratedCertificateEvent($request->user(), $certificate->course));

        return $pdf->download('certificate-' . $id . '.pdf');
    }
}
