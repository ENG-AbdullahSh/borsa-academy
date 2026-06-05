<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseCurriculumController extends Controller
{
    public function show(Request $request, int $id): JsonResponse
    {
        $course = Course::query()
            ->published()
            ->with(['sections.lessons'])
            ->findOrFail($id);

        return response()->json([
            'data' => $this->formatCourseCurriculum($course, $request),
        ]);
    }

    public function adminShow(Request $request, int $id): JsonResponse
    {
        $course = Course::query()
            ->with(['sections.lessons'])
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
        $isEnrolled = $user !== null
            && $user->role === 'student'
            && $user->enrollments()->where('course_id', $course->id)->exists();
        $canAccessAllLessons = $forceAccess || $isEnrolled || $user?->role === 'admin';

        return [
            'course_id' => $course->id,
            'course_title' => $course->title,
            'is_enrolled' => $isEnrolled,
            'can_access_full_curriculum' => $canAccessAllLessons,
            'sections' => $course->sections->map(function ($section) use ($canAccessAllLessons): array {
                return [
                    'id' => $section->id,
                    'course_id' => $section->course_id,
                    'title' => $section->title,
                    'order' => $section->order,
                    'lessons' => $section->lessons->map(
                        fn (Lesson $lesson): array => $this->formatLesson($lesson, $canAccessAllLessons)
                    )->values(),
                ];
            })->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatLesson(Lesson $lesson, bool $canAccessAllLessons): array
    {
        $canAccessLesson = $canAccessAllLessons || $lesson->is_preview;

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
        ];
    }
}
