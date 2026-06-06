<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CertificateResource;
use App\Models\Certificate;
use App\Services\CertificateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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
            ->get();

        return CertificateResource::collection($certificates);
    }

    public function show(Request $request, Certificate $certificate): CertificateResource|JsonResponse
    {
        if ($certificate->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Certificate was not found.',
            ], 404);
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

        $certificate = $this->certificateService->issueForEnrollment($enrollment);

        if (! $certificate) {
            return response()->json([
                'message' => 'The course must be completed before a certificate is issued.',
            ], 422);
        }

        return (new CertificateResource(
            $certificate->load(['user:id,name', 'course:id,title']),
        ))->response()->setStatusCode(200);
    }
}
