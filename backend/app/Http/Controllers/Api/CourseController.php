<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Courses\StoreCourseRequest;
use App\Http\Requests\Courses\UpdateCourseRequest;
use App\Models\Course;
use App\Models\Instructor;
use App\Notifications\InstructorAssignedToCourseNotification;
use App\Services\NotificationRecipientService;
use App\Services\CourseCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

class CourseController extends Controller
{
    public function __construct(
        private readonly NotificationRecipientService $notificationRecipients,
        private readonly CourseCacheService $courseCache,
    ) {}

    /**
     * Get list of published courses (cached).
     */
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

        $perPage = (int) ($filters['per_page'] ?? 10);
        $courses = $this->courseCache->getCachedIndex($filters, $perPage);

        return response()->json($courses);
    }

    /**
     * Get a single published course details (cached).
     */
    public function show(int $id): JsonResponse
    {
        $course = $this->courseCache->getCachedShow($id);

        return response()->json([
            'data' => $course,
        ]);
    }

    /**
     * Get list of best selling courses (cached).
     */
    public function bestSellers(Request $request): JsonResponse
    {
        $limit = (int) $request->input('limit', 6);
        $courses = $this->courseCache->getBestSellers($limit);

        return response()->json([
            'success' => true,
            'data' => $courses
        ]);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'level' => ['nullable', Rule::in(Course::LEVELS)],
            'status' => ['nullable', Rule::in(Course::STATUSES)],
            'category' => ['nullable', 'string', 'max:191'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $courses = Course::query()
            ->with('instructor.user') // Eager load
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('instructor_name', 'like', "%{$search}%");
                });
            })
            ->when($filters['level'] ?? null, function ($query, string $level): void {
                $query->where('level', $level);
            })
            ->when($filters['status'] ?? null, function ($query, string $status): void {
                $query->where('status', $status);
            })
            ->when($filters['category'] ?? null, function ($query, string $category): void {
                $query->where('category', $category);
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 25)
            ->withQueryString();

        return response()->json($courses);
    }

    public function adminShow(int $id): JsonResponse
    {
        return response()->json([
            'data' => Course::with('instructor.user')->findOrFail($id),
        ]);
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['slug'] = $this->makeUniqueSlug($validated['slug'] ?? $validated['title']);

        // Resolve instructor_name from the FK so the denormalized column stays in sync
        $validated['instructor_name'] = Instructor::findOrFail($validated['instructor_id'])->name;

        $course = Course::create($validated);
        $course->load('instructor.user');
        
        // Invalidate course caches so the new course appears instantly
        $this->courseCache->invalidate();

        $this->notifyAssignedInstructor($course);

        return response()->json([
            'message' => 'تمت إضافة الكورس بنجاح.',
            'data'    => $course,
        ], 201);
    }

    public function update(UpdateCourseRequest $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $previousInstructorId = $course->instructor_id;
        $validated = $request->validated();

        if (array_key_exists('slug', $validated)) {
            $validated['slug'] = $this->makeUniqueSlug($validated['slug'] ?: $course->title, $course->id);
        }

        // Keep instructor_name denormalized column in sync when instructor_id changes
        if (array_key_exists('instructor_id', $validated)) {
            $validated['instructor_name'] = Instructor::findOrFail($validated['instructor_id'])->name;
        }

        $course->update($validated);
        $course->refresh()->load('instructor.user');

        // Invalidate course caches to clear old data
        $this->courseCache->invalidate($course->id);

        if (
            array_key_exists('instructor_id', $validated)
            && (int) $validated['instructor_id'] !== (int) $previousInstructorId
        ) {
            $this->notifyAssignedInstructor($course);
        }

        return response()->json([
            'message' => 'تم تحديث الكورس بنجاح.',
            'data'    => $course,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $course->delete();

        // Invalidate course caches
        $this->courseCache->invalidate($id);

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

    private function notifyAssignedInstructor(Course $course): void
    {
        try {
            $this->notificationRecipients->notifyInstructor(
                $course,
                new InstructorAssignedToCourseNotification($course),
            );
        } catch (Throwable $exception) {
            Log::warning('Instructor course assignment notification failed', [
                'course_id' => $course->id,
                'instructor_id' => $course->instructor_id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
