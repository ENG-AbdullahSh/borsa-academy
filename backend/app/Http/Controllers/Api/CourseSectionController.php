<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\AuthorizesInstructorCourseOwnership;
use App\Http\Requests\CourseSections\StoreCourseSectionRequest;
use App\Http\Requests\CourseSections\UpdateCourseSectionRequest;
use App\Models\Course;
use App\Models\CourseSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseSectionController extends Controller
{
    use AuthorizesInstructorCourseOwnership;

    public function store(StoreCourseSectionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $this->authorizeCourseOwnership($request, Course::findOrFail($validated['course_id']));

        $section = CourseSection::create($validated);

        return response()->json([
            'message' => 'Section created successfully.',
            'data' => $section->load('lessons'),
        ], 201);
    }

    public function update(UpdateCourseSectionRequest $request, int $id): JsonResponse
    {
        $section = CourseSection::findOrFail($id);
        $validated = $request->validated();

        $this->authorizeCourseOwnership($request, $section->course);

        if (isset($validated['course_id']) && $validated['course_id'] !== $section->course_id) {
            $this->authorizeCourseOwnership($request, Course::findOrFail($validated['course_id']));
        }

        $section->update($validated);

        return response()->json([
            'message' => 'Section updated successfully.',
            'data' => $section->refresh()->load('lessons'),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $section = CourseSection::findOrFail($id);
        $this->authorizeCourseOwnership($request, $section->course);
        $section->delete();

        return response()->json([
            'message' => 'Section deleted successfully.',
        ]);
    }
}
