<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lessons\StoreLessonRequest;
use App\Http\Requests\Lessons\UpdateLessonRequest;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;

class LessonController extends Controller
{
    public function store(StoreLessonRequest $request): JsonResponse
    {
        $lesson = Lesson::create($request->validated());

        return response()->json([
            'message' => 'Lesson created successfully.',
            'data' => $lesson,
        ], 201);
    }

    public function update(UpdateLessonRequest $request, int $id): JsonResponse
    {
        $lesson = Lesson::findOrFail($id);
        $lesson->update($request->validated());

        return response()->json([
            'message' => 'Lesson updated successfully.',
            'data' => $lesson->refresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        Lesson::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Lesson deleted successfully.',
        ]);
    }
}
