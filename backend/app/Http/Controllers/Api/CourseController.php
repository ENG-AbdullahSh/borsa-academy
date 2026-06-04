<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Courses\StoreCourseRequest;
use App\Http\Requests\Courses\UpdateCourseRequest;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'level' => ['nullable', Rule::in(Course::LEVELS)],
            'category' => ['nullable', 'string', 'max:191'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0', 'gte:min_price'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $courses = Course::query()
            ->published()
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($filters['level'] ?? null, function ($query, string $level): void {
                $query->where('level', $level);
            })
            ->when($filters['category'] ?? null, function ($query, string $category): void {
                $query->where('category', $category);
            })
            ->when(array_key_exists('min_price', $filters), function ($query) use ($filters): void {
                $query->where('price', '>=', $filters['min_price']);
            })
            ->when(array_key_exists('max_price', $filters), function ($query) use ($filters): void {
                $query->where('price', '<=', $filters['max_price']);
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();

        return response()->json($courses);
    }

    public function show(int $id): JsonResponse
    {
        $course = Course::query()
            ->published()
            ->findOrFail($id);

        return response()->json([
            'data' => $course,
        ]);
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['slug'] = $this->makeUniqueSlug($validated['slug'] ?? $validated['title']);

        $course = Course::create($validated);

        return response()->json([
            'message' => 'Course created successfully.',
            'data' => $course,
        ], 201);
    }

    public function update(UpdateCourseRequest $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $validated = $request->validated();

        if (array_key_exists('slug', $validated)) {
            $validated['slug'] = $this->makeUniqueSlug($validated['slug'] ?: $course->title, $course->id);
        }

        $course->update($validated);

        return response()->json([
            'message' => 'Course updated successfully.',
            'data' => $course->refresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json([
            'message' => 'Course deleted successfully.',
        ]);
    }

    private function makeUniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($value);
        $baseSlug = $baseSlug !== '' ? substr($baseSlug, 0, 180) : 'course';
        $slug = $baseSlug;
        $counter = 2;

        while (
            Course::where('slug', $slug)
                ->when($ignoreId !== null, function ($query) use ($ignoreId): void {
                    $query->where('id', '!=', $ignoreId);
                })
                ->exists()
        ) {
            $suffix = "-{$counter}";
            $slug = substr($baseSlug, 0, 191 - strlen($suffix)).$suffix;
            $counter++;
        }

        return $slug;
    }
}
