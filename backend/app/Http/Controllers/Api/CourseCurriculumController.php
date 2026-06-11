<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Certificate;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Services\QuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseCurriculumController extends Controller
{
    public function __construct(
        private readonly QuizService $quizService,
    ) {}

    public function show(Request $request, int $id): JsonResponse
    {
        $course = Course::query()
            ->published()
            ->with(['sections.lessons.quiz.questions.options'])
            ->findOrFail($id);

        return response()->json([
            'data' => $this->formatCourseCurriculum($course, $request),
        ]);
    }

    public function adminShow(Request $request, int $id): JsonResponse
    {
        $course = Course::query()
            ->with(['sections.lessons.quiz.questions.options'])
            ->findOrFail($id);

        return response()->json([
            'data' => $this->formatCourseCurriculum($course, $request, true),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatCourseCurriculum(Course $course, Request $request, bool $forceAccess = false): array
    {
        $user = auth('sanctum')->user();
        $enrollment = $user !== null && $user->role === 'student'
            ? $user->enrollments()->where('course_id', $course->id)->first()
            : null;
        $isEnrolled = $enrollment !== null;
        $canAccessAllLessons = $forceAccess || $isEnrolled || $user?->role === 'admin';
        $completedLessonIds = $isEnrolled
            ? LessonProgress::query()
                ->where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->where('completed', true)
                ->pluck('lesson_id')
                ->flip()
            : collect();
        $sectionStatuses = $isEnrolled
            ? $this->quizService->sectionStatusesForEnrollment($enrollment)->keyBy('section_id')
            : collect();
        $sectionCertificateIds = $isEnrolled
            ? Certificate::query()
                ->where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->where('scope_type', 'section')
                ->pluck('id', 'section_id')
            : collect();

        return [
            'course_id' => $course->id,
            'course_title' => $course->title,
            'is_enrolled' => $isEnrolled,
            'can_access_full_curriculum' => $canAccessAllLessons,
            'progress_percentage' => $enrollment?->progress ?? 0,
            'course_completed' => $enrollment?->completed ?? false,
            'sections' => $course->sections->map(function ($section) use (
                $canAccessAllLessons,
                $completedLessonIds,
                $sectionStatuses,
                $sectionCertificateIds,
            ): array {
                $sectionStatus = $sectionStatuses->get($section->id);

                return [
                    'id' => $section->id,
                    'course_id' => $section->course_id,
                    'title' => $section->title,
                    'order' => $section->order,
                    'completed' => (bool) ($sectionStatus['section_completed'] ?? false),
                    'certificate_status' => $sectionStatus ? [
                        ...$sectionStatus,
                        'certificate_id' => ($sectionStatus['certificate_unlocked'] ?? false)
                            ? ($sectionCertificateIds->get($section->id) ?? null)
                            : null,
                    ] : null,
                    'lessons' => $section->lessons->map(
                        fn (Lesson $lesson): array => $this->formatLesson(
                            $lesson,
                            $canAccessAllLessons,
                            $completedLessonIds->has($lesson->id),
                            collect($sectionStatus['lessons'] ?? [])->firstWhere('lesson_id', $lesson->id),
                        )
                    )->values(),
                ];
            })->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatLesson(
        Lesson $lesson,
        bool $canAccessAllLessons,
        bool $videoCompleted,
        ?array $quizStatus = null,
    ): array
    {
        $canAccessLesson = $canAccessAllLessons || $lesson->is_preview;
        $lessonCompleted = (bool) ($quizStatus['gate_passed'] ?? false);

        return [
            'id' => $lesson->id,
            'section_id' => $lesson->section_id,
            'title' => $lesson->title,
            'description' => $canAccessLesson ? $lesson->description : null,
            'video_url' => $canAccessLesson ? $lesson->video_url : null,
            'pdf_url' => $canAccessLesson ? $lesson->pdf_url : null,
            'duration_minutes' => $lesson->duration_minutes,
            'order' => $lesson->order,
            'is_preview' => $lesson->is_preview,
            'is_locked' => ! $canAccessLesson,
            'video_completed' => $videoCompleted,
            'completed' => $lessonCompleted,
            'quiz_status' => $quizStatus,
        ];
    }
}
