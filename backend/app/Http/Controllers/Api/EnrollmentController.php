<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Enrollments\StoreEnrollmentRequest;
use App\Models\Course;
use App\Models\Enrollment;
use App\Notifications\AcademyNotification;
use App\Services\CertificateService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function __construct(
        private readonly CertificateService $certificateService,
    ) {}

    public function store(StoreEnrollmentRequest $request): JsonResponse
    {
        $user = $request->user();
        $course = Course::query()
            ->published()
            ->find($request->integer('course_id'));

        if (! $course) {
            return response()->json([
                'message' => 'Course was not found.',
            ], 404);
        }

        if ($user->enrollments()->where('course_id', $course->id)->exists()) {
            return response()->json([
                'message' => 'You are already enrolled in this course.',
            ], 409);
        }

        try {
            $enrollment = $user->enrollments()->create([
                'course_id' => $course->id,
                'enrolled_at' => now(),
                'progress' => 0,
                'completed' => false,
            ]);
        } catch (QueryException) {
            return response()->json([
                'message' => 'You are already enrolled in this course.',
            ], 409);
        }

        // Fire enrollment notification to the student
        event(new \App\Events\CourseEnrollmentEvent($user, $course));
        
        // Fire admin monitoring event
        event(new \App\Events\UserStartedCourseEvent($user, $course));

        return response()->json([
            'message' => 'Enrollment created successfully.',
            'data'    => $this->formatEnrollment($enrollment->load('course')),
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $user = $request->user();
        $summary = [
            'total_enrolled_courses' => $user->enrollments()->count(),
            'completed_courses' => $user->enrollments()->where('completed', true)->count(),
            'in_progress_courses' => $user->enrollments()->where('completed', false)->count(),
        ];

        $enrollments = $user->enrollments()
            ->with('course')
            ->latest('enrolled_at')
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return response()->json([
            'data' => $enrollments->getCollection()
                ->map(fn (Enrollment $enrollment): array => $this->formatEnrollment($enrollment))
                ->values(),
            'current_page' => $enrollments->currentPage(),
            'last_page' => $enrollments->lastPage(),
            'per_page' => $enrollments->perPage(),
            'total' => $enrollments->total(),
            'from' => $enrollments->firstItem(),
            'to' => $enrollments->lastItem(),
            'summary' => $summary,
        ]);
    }

    public function show(Request $request, int $courseId): JsonResponse
    {
        $enrollment = $request->user()
            ->enrollments()
            ->with('course')
            ->where('course_id', $courseId)
            ->first();

        if (! $enrollment) {
            return response()->json([
                'message' => 'يجب الاشتراك في الدورة أولاً',
            ], 403);
        }

        return response()->json([
            'data' => $this->formatEnrollment($enrollment),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatEnrollment(Enrollment $enrollment): array
    {
        return [
            'id' => $enrollment->id,
            'user_id' => $enrollment->user_id,
            'course_id' => $enrollment->course_id,
            'enrolled_at' => $enrollment->enrolled_at,
            'progress' => $enrollment->progress,
            'completed' => $enrollment->completed,
            'certificate_status' => $this->certificateService->eligibilityForEnrollment($enrollment),
            'course' => $enrollment->course,
        ];
    }
}
