<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseSections\StoreCourseSectionRequest;
use App\Http\Requests\CourseSections\UpdateCourseSectionRequest;
use App\Models\CourseSection;
use Illuminate\Http\JsonResponse;

class CourseSectionController extends Controller
{
    public function store(StoreCourseSectionRequest $request): JsonResponse
    {
        $section = CourseSection::create($request->validated());

        return response()->json([
            'message' => 'Section created successfully.',
            'data' => $section->load('lessons'),
        ], 201);
    }

    public function update(UpdateCourseSectionRequest $request, int $id): JsonResponse
    {
        $section = CourseSection::findOrFail($id);
        $section->update($request->validated());

        return response()->json([
            'message' => 'Section updated successfully.',
            'data' => $section->refresh()->load('lessons'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        CourseSection::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Section deleted successfully.',
        ]);
    }
}
