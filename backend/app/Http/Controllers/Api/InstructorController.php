<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Instructor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Instructor::latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'bio' => 'nullable|string',
            'specialization' => 'nullable|string|max:255',
            'profile_image_path' => 'nullable|string|max:2048',
        ]);

        $instructor = Instructor::create($validated);

        return response()->json([
            'message' => 'Instructor created successfully.',
            'data' => $instructor,
        ], 201);
    }

    public function show(Instructor $instructor): JsonResponse
    {
        return response()->json([
            'data' => $instructor,
        ]);
    }

    public function update(Request $request, Instructor $instructor): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'bio' => 'nullable|string',
            'specialization' => 'nullable|string|max:255',
            'profile_image_path' => 'nullable|string|max:2048',
        ]);

        $instructor->update($validated);

        return response()->json([
            'message' => 'Instructor updated successfully.',
            'data' => $instructor,
        ]);
    }

    public function destroy(Instructor $instructor): JsonResponse
    {
        $instructor->delete();

        return response()->json([
            'message' => 'Instructor deleted successfully.',
        ]);
    }
}
