<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Instructor;
use App\Models\Lesson;
use App\Models\QuizAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InstructorPortalController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $instructor = $this->profile($request);
        $courseIds = $instructor->courses()->pluck('id');

        $latestEnrollments = Enrollment::query()
            ->whereIn('course_id', $courseIds)
            ->with(['user:id,name,email', 'course:id,title'])
            ->latest('enrolled_at')
            ->limit(5)
            ->get()
            ->map(fn (Enrollment $enrollment): array => $this->formatEnrollment($enrollment))
            ->values();

        $latestAttempts = QuizAttempt::query()
            ->whereIn('course_id', $courseIds)
            ->with(['user:id,name,email', 'course:id,title', 'lesson:id,title'])
            ->latest('submitted_at')
            ->limit(5)
            ->get()
            ->map(fn (QuizAttempt $attempt): array => $this->formatAttempt($attempt))
            ->values();

        return response()->json([
            'data' => [
                'instructor' => $instructor->only([
                    'id',
                    'name',
                    'specialization',
                    'profile_image_path',
                ]),
                'total_courses' => $courseIds->count(),
                'total_students' => Enrollment::query()
                    ->whereIn('course_id', $courseIds)
                    ->distinct('user_id')
                    ->count('user_id'),
                'total_lessons' => Lesson::query()
                    ->whereHas('section', fn ($query) => $query->whereIn('course_id', $courseIds))
                    ->count(),
                'average_progress' => round((float) Enrollment::query()
                    ->whereIn('course_id', $courseIds)
                    ->avg('progress'), 1),
                'latest_enrollments' => $latestEnrollments,
                'latest_quiz_attempts' => $latestAttempts,
            ],
        ]);
    }

    public function courses(Request $request): JsonResponse
    {
        $instructor = $this->profile($request);
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(Course::STATUSES)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $courses = $instructor->courses()
            ->when($validated['search'] ?? null, fn ($query, string $search) => $query
                ->where('title', 'like', '%'.addcslashes(trim($search), '%_\\').'%'))
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query
                ->where('status', $status))
            ->withCount([
                'enrollments as students_count',
                'lessons',
            ])
            ->withAvg('enrollments as average_progress', 'progress')
            ->latest()
            ->paginate($validated['per_page'] ?? 12)
            ->withQueryString()
            ->through(fn (Course $course): array => $this->formatCourse($course));

        return response()->json($courses);
    }

    public function course(Request $request, Course $course): JsonResponse
    {
        $this->ownedCourse($request, $course);

        $course->load([
            'sections.lessons',
            'quiz:id,course_id,title,passing_score,is_active',
        ])->loadCount([
            'enrollments as students_count',
            'lessons',
        ])->loadAvg('enrollments as average_progress', 'progress');

        return response()->json([
            'data' => [
                ...$this->formatCourse($course),
                'short_description' => $course->short_description,
                'description' => $course->description,
                'category' => $course->category,
                'level' => $course->level,
                'duration_hours' => $course->duration_hours,
                'quiz' => $course->quiz,
                'sections' => $course->sections,
            ],
        ]);
    }

    public function curriculum(Request $request, Course $course): JsonResponse
    {
        $this->ownedCourse($request, $course);
        $course->load('sections.lessons');

        return response()->json([
            'data' => [
                'course_id' => $course->id,
                'course_title' => $course->title,
                'can_access_full_curriculum' => true,
                'sections' => $course->sections,
            ],
        ]);
    }

    public function students(Request $request, Course $course): JsonResponse
    {
        $this->ownedCourse($request, $course);

        $perPage = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ])['per_page'] ?? 25;

        $students = $course->enrollments()
            ->with([
                'course:id,title',
                'user' => fn ($query) => $query
                    ->select(['id', 'name', 'email'])
                    ->withCount([
                        'certificates as certificates_count' => fn ($query) => $query
                            ->where('course_id', $course->id),
                    ]),
            ])
            ->latest('enrolled_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Enrollment $enrollment): array => $this->formatEnrollment($enrollment));

        return response()->json($students);
    }

    public function quizResults(Request $request, Course $course): JsonResponse
    {
        $this->ownedCourse($request, $course);

        $perPage = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ])['per_page'] ?? 25;

        $attempts = $course->quizAttempts()
            ->with(['user:id,name,email', 'course:id,title', 'lesson:id,title'])
            ->latest('submitted_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (QuizAttempt $attempt): array => $this->formatAttempt($attempt));

        return response()->json($attempts);
    }

    private function profile(Request $request): Instructor
    {
        $instructor = Instructor::query()
            ->where('user_id', $request->user()->id)
            ->first();

        abort_unless($instructor, 403, 'لا يوجد ملف مدرب مرتبط بهذا الحساب.');

        return $instructor;
    }

    private function ownedCourse(Request $request, Course $course): Instructor
    {
        $instructor = $this->profile($request);

        abort_unless(
            $course->instructor_id === $instructor->id,
            403,
            'غير مصرح لك بالوصول إلى هذه الدورة.',
        );

        return $instructor;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatCourse(Course $course): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'slug' => $course->slug,
            'status' => $course->status,
            'thumbnail' => $course->thumbnail,
            'image_path' => $course->image_path,
            'students_count' => (int) ($course->students_count ?? 0),
            'lessons_count' => (int) ($course->lessons_count ?? 0),
            'average_progress' => round((float) ($course->average_progress ?? 0), 1),
            'created_at' => $course->created_at,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatEnrollment(Enrollment $enrollment): array
    {
        return [
            'id' => $enrollment->id,
            'student' => [
                'id' => $enrollment->user?->id,
                'name' => $enrollment->user?->name,
                'email' => $enrollment->user?->email,
            ],
            'course' => [
                'id' => $enrollment->course?->id ?? $enrollment->course_id,
                'title' => $enrollment->course?->title,
            ],
            'progress' => $enrollment->progress,
            'completed' => $enrollment->completed,
            'certificates_count' => (int) ($enrollment->user?->certificates_count ?? 0),
            'enrolled_at' => $enrollment->enrolled_at,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatAttempt(QuizAttempt $attempt): array
    {
        return [
            'id' => $attempt->id,
            'student' => [
                'id' => $attempt->user?->id,
                'name' => $attempt->user?->name,
                'email' => $attempt->user?->email,
            ],
            'course' => [
                'id' => $attempt->course?->id ?? $attempt->course_id,
                'title' => $attempt->course?->title,
            ],
            'lesson' => [
                'id' => $attempt->lesson?->id ?? $attempt->lesson_id,
                'title' => $attempt->lesson?->title,
            ],
            'score' => $attempt->score,
            'total_points' => $attempt->total_points,
            'percentage' => (float) $attempt->percentage,
            'passed' => $attempt->passed,
            'submitted_at' => $attempt->submitted_at,
        ];
    }
}
