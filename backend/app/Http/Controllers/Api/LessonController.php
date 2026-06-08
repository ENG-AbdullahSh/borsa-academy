<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\AuthorizesInstructorCourseOwnership;
use App\Http\Requests\Lessons\StoreLessonRequest;
use App\Http\Requests\Lessons\UpdateLessonRequest;
use App\Models\CourseSection;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    use AuthorizesInstructorCourseOwnership;

    public function store(StoreLessonRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $section = CourseSection::with('course')->findOrFail($validated['section_id']);
        $this->authorizeCourseOwnership($request, $section->course);

        $lesson = Lesson::create($validated);

        return response()->json([
            'message' => 'Lesson created successfully.',
            'data' => $lesson,
        ], 201);
    }

    public function update(UpdateLessonRequest $request, int $id): JsonResponse
    {
        $lesson = Lesson::findOrFail($id);
        $validated = $request->validated();
        $this->authorizeCourseOwnership($request, $lesson->section->course);

        if (isset($validated['section_id']) && $validated['section_id'] !== $lesson->section_id) {
            $targetSection = CourseSection::with('course')->findOrFail($validated['section_id']);
            $this->authorizeCourseOwnership($request, $targetSection->course);
        }

        $lesson->update($validated);

        return response()->json([
            'message' => 'Lesson updated successfully.',
            'data' => $lesson->refresh(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $lesson = Lesson::findOrFail($id);
        $this->authorizeCourseOwnership($request, $lesson->section->course);
        $lesson->delete();

        return response()->json([
            'message' => 'Lesson deleted successfully.',
        ]);
    }
}
