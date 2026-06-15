<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Services\CourseProgressService;
use App\Services\QuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LessonProgressController extends Controller
{
    public function __construct(
        private readonly CourseProgressService $courseProgressService,
        private readonly QuizService $quizService,
    ) {}

    public function complete(Request $request, int $lesson): JsonResponse
    {
        $lessonModel = Lesson::query()->with('section')->find($lesson);

        if (! $lessonModel) {
            return response()->json([
                'success' => false,
                'message' => 'الدرس غير موجود.',
            ], 404);
        }

        if (! $lessonModel->is_published) {
            $user = $request->user();
            $isAuthorized = false;
            if ($user) {
                if ($user->role === 'admin') {
                    $isAuthorized = true;
                } elseif ($user->role === 'instructor') {
                    $instructor = \App\Models\Instructor::where('user_id', $user->id)->first();
                    $course = $lessonModel->section?->course;
                    if ($instructor && $course && $course->instructor_id === $instructor->id) {
                        $isAuthorized = true;
                    }
                }
            }
            if (!$isAuthorized) {
                return response()->json([
                    'success' => false,
                    'message' => 'الدرس غير منشور بعد.',
                ], 403);
            }
        }

        $enrollment = $this->findEnrollment(
            $request,
            $lessonModel->section->course_id,
        );

        if (! $enrollment) {
            return $this->notEnrolledResponse();
        }

        $progress = DB::transaction(function () use ($request, $lessonModel, $enrollment): array {
            $lockedEnrollment = Enrollment::query()
                ->lockForUpdate()
                ->findOrFail($enrollment->id);

            LessonProgress::updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'lesson_id' => $lessonModel->id,
                ],
                [
                    'course_id' => $lockedEnrollment->course_id,
                    'completed' => true,
                    'completed_at' => now(),
                ],
            );

            return $this->courseProgressService->syncEnrollment($lockedEnrollment);
        });

        event(new \App\Events\LessonCompletedEvent($request->user(), $lessonModel));

        if ($progress['course_completed']) {
            event(new \App\Events\CourseFinishedEvent($request->user(), $lessonModel->section->course, $progress['certificate_id'] ?? 0));
        }

        $lessonStatus = $this->quizService->lessonGateStatus($request->user()->id, $lessonModel);

        return response()->json([
            'success' => true,
            'course_id' => $progress['course_id'],
            'lesson_id' => $lessonModel->id,
            'section_id' => $lessonModel->section_id,
            'video_completed' => $lessonStatus['video_completed'],
            'lesson_completed' => $lessonStatus['gate_passed'],
            'lesson_quiz_status' => $lessonStatus,
            'completed_lessons' => $progress['completed_lessons'],
            'total_lessons' => $progress['total_lessons'],
            'progress_percentage' => $progress['progress_percentage'],
            'course_completed' => $progress['course_completed'],
            'certificate_id' => $progress['certificate_id'],
            'certificate_status' => $progress['certificate_status'],
            'section_certificates' => $progress['section_certificates'],
            'section_statuses' => $progress['section_statuses'],
        ]);
    }

    public function destroy(Request $request, int $lesson): JsonResponse
    {
        $lessonModel = Lesson::query()->with('section')->find($lesson);

        if (! $lessonModel) {
            return response()->json([
                'success' => false,
                'message' => 'الدرس غير موجود.',
            ], 404);
        }

        if (! $lessonModel->is_published) {
            $user = $request->user();
            $isAuthorized = false;
            if ($user) {
                if ($user->role === 'admin') {
                    $isAuthorized = true;
                } elseif ($user->role === 'instructor') {
                    $instructor = \App\Models\Instructor::where('user_id', $user->id)->first();
                    $course = $lessonModel->section?->course;
                    if ($instructor && $course && $course->instructor_id === $instructor->id) {
                        $isAuthorized = true;
                    }
                }
            }
            if (!$isAuthorized) {
                return response()->json([
                    'success' => false,
                    'message' => 'الدرس غير منشور بعد.',
                ], 403);
            }
        }

        $enrollment = $this->findEnrollment(
            $request,
            $lessonModel->section->course_id,
        );

        if (! $enrollment) {
            return $this->notEnrolledResponse();
        }

        $progress = DB::transaction(function () use ($request, $lessonModel, $enrollment): array {
            $lockedEnrollment = Enrollment::query()
                ->lockForUpdate()
                ->findOrFail($enrollment->id);

            LessonProgress::query()
                ->where('user_id', $request->user()->id)
                ->where('course_id', $lockedEnrollment->course_id)
                ->where('lesson_id', $lessonModel->id)
                ->delete();

            return $this->courseProgressService->syncEnrollment($lockedEnrollment);
        });

        $lessonStatus = $this->quizService->lessonGateStatus($request->user()->id, $lessonModel);

        return response()->json([
            'success' => true,
            'course_id' => $progress['course_id'],
            'lesson_id' => $lessonModel->id,
            'section_id' => $lessonModel->section_id,
            'video_completed' => $lessonStatus['video_completed'],
            'lesson_completed' => $lessonStatus['gate_passed'],
            'lesson_quiz_status' => $lessonStatus,
            'completed_lessons' => $progress['completed_lessons'],
            'total_lessons' => $progress['total_lessons'],
            'progress_percentage' => $progress['progress_percentage'],
            'course_completed' => $progress['course_completed'],
            'certificate_id' => $progress['certificate_id'],
            'certificate_status' => $progress['certificate_status'],
            'section_certificates' => $progress['section_certificates'],
            'section_statuses' => $progress['section_statuses'],
        ]);
    }

    public function course(Request $request, int $courseId): JsonResponse
    {
        $course = Course::find($courseId);

        if (! $course) {
            return response()->json([
                'success' => false,
                'message' => 'الدورة غير موجودة.',
            ], 404);
        }

        $enrollment = $this->findEnrollment($request, $course->id);

        if (! $enrollment) {
            return $this->notEnrolledResponse();
        }

        $progress = $this->courseProgressService->syncEnrollment($enrollment);
        $videoCompletedLessonIds = LessonProgress::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->where('completed', true)
            ->pluck('lesson_id')
            ->values();
        $completedLessonIds = collect($progress['section_statuses'])
            ->flatMap(fn (array $section): array => collect($section['lessons'])
                ->where('gate_passed', true)
                ->pluck('lesson_id')
                ->all())
            ->values();

        return response()->json([
            'success' => true,
            ...$progress,
            'completed_lesson_ids' => $completedLessonIds,
            'video_completed_lesson_ids' => $videoCompletedLessonIds,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $enrollments = $request->user()
            ->enrollments()
            ->with('course')
            ->latest('enrolled_at')
            ->get();

        $courses = $enrollments->map(function (Enrollment $enrollment): array {
            $progress = $this->courseProgressService->syncEnrollment($enrollment);

            return [
                'id' => $enrollment->id,
                'course_id' => $enrollment->course_id,
                'enrolled_at' => $enrollment->enrolled_at,
                'progress' => $progress['progress_percentage'],
                'completed' => $progress['course_completed'],
                'completed_lessons' => $progress['completed_lessons'],
                'total_lessons' => $progress['total_lessons'],
                'certificate_status' => $progress['certificate_status'],
                'course' => $enrollment->course,
            ];
        })->values();

        $totalCourses = $courses->count();
        $completedCourses = $courses->where('completed', true)->count();
        $inProgressCourses = $courses
            ->filter(fn (array $course): bool => $course['progress'] > 0 && $course['progress'] < 100)
            ->count();
        $notStartedCourses = $courses->where('progress', 0)->count();
        $overallProgress = $totalCourses > 0
            ? (int) round($courses->avg('progress'))
            : 0;

        return response()->json([
            'success' => true,
            'summary' => [
                'total_enrolled_courses' => $totalCourses,
                'completed_courses' => $completedCourses,
                'in_progress_courses' => $inProgressCourses,
                'not_started_courses' => $notStartedCourses,
                'overall_learning_progress' => $overallProgress,
            ],
            'courses' => $courses,
        ]);
    }

    private function findEnrollment(Request $request, int $courseId): ?Enrollment
    {
        return $request->user()
            ->enrollments()
            ->where('course_id', $courseId)
            ->first();
    }

    private function notEnrolledResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'يجب الاشتراك في الدورة أولاً.',
        ], 403);
    }
}
