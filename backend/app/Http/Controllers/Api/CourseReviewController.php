<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseReviewRequest;
use App\Http\Requests\UpdateCourseReviewRequest;
use App\Models\Course;
use App\Models\CourseReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class CourseReviewController extends Controller
{
    /**
     * Display a listing of the course reviews.
     */
    public function index(Request $request, Course $course): JsonResponse
    {
        $sort = $request->query('sort', 'newest'); // 'newest', 'highest', 'lowest', 'helpful'
        
        $query = $course->reviews()
            ->where('is_visible', true)
            ->with(['user:id,name,avatar']);

        switch ($sort) {
            case 'highest':
                $query->orderByDesc('rating')->orderByDesc('created_at');
                break;
            case 'lowest':
                $query->orderBy('rating')->orderByDesc('created_at');
                break;
            case 'helpful':
                $query->orderByDesc('helpful_count')->orderByDesc('created_at');
                break;
            case 'newest':
            default:
                $query->orderByDesc('created_at');
                break;
        }

        $reviews = $query->paginate(10);

        // Fetch distribution for summary
        $distribution = $course->reviews()
            ->where('is_visible', true)
            ->select('rating', DB::raw('count(*) as count'))
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        $distributionMap = [
            "5" => $distribution[5] ?? 0,
            "4" => $distribution[4] ?? 0,
            "3" => $distribution[3] ?? 0,
            "2" => $distribution[2] ?? 0,
            "1" => $distribution[1] ?? 0,
        ];

        // Format distribution for frontend summary array expectations
        $summaryDistribution = [];
        $totalVisibleReviews = array_sum($distribution);
        for ($i = 5; $i >= 1; $i--) {
            $count = $distribution[$i] ?? 0;
            $percentage = $totalVisibleReviews > 0 ? round(($count / $totalVisibleReviews) * 100) : 0;
            $summaryDistribution[] = [
                'rating' => $i,
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        // Get authenticated user review if exists
        $userReview = null;
        if ($request->user()) {
            $userReview = $course->reviews()
                ->where('user_id', $request->user()->id)
                ->first();
        }

        return response()->json([
            'success' => true,
            'average_rating' => (float) $course->average_rating,
            'ratings_count' => (int) $course->total_reviews,
            'rating_distribution' => $distributionMap,
            'distribution' => $distributionMap, // map format
            'summary_distribution' => $summaryDistribution, // array format for frontend component
            'reviews' => $reviews,
            'data' => $reviews, // backward compatibility with pagination
            'user_review' => $userReview,
        ]);
    }

    /**
     * Store a newly created review or update the existing one.
     */
    public function upsert(StoreCourseReviewRequest $request, Course $course): JsonResponse
    {
        $user = $request->user();

        // Business rules checks

        // Only authenticated students can review.
        if ($user->role !== 'student') {
            return response()->json([
                'success' => false,
                'message' => 'فقط الطلاب يمكنهم كتابة تقييم.'
            ], 403);
        }

        // Student must be enrolled in the course.
        $enrollment = $user->enrollments()->where('course_id', $course->id)->first();
        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'يجب أن تكون مسجلاً في هذه الدورة لتتمكن من تقييمها.'
            ], 403);
        }

        // Student must have completed the course (100% progress).
        // if ($enrollment->progress < 100 || !$enrollment->completed) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'يجب إكمال الدورة بنسبة 100% لتتمكن من كتابة تقييم.'
        //     ], 403);
        // }

        $review = DB::transaction(function () use ($request, $course, $user) {
            $existingReview = $course->reviews()->where('user_id', $user->id)->first();

            if ($existingReview) {
                $existingReview->update([
                    'rating' => $request->validated('rating'),
                    'title' => $request->validated('title'),
                    'review' => $request->validated('review'),
                ]);
                $course->updateRatingStats();
                return $existingReview;
            } else {
                $newReview = $course->reviews()->create([
                    'user_id' => $user->id,
                    'rating' => $request->validated('rating'),
                    'title' => $request->validated('title'),
                    'review' => $request->validated('review'),
                    'is_verified' => true,
                    'is_visible' => true,
                ]);
                $course->updateRatingStats();
                return $newReview;
            }
        });

        $review->load('user:id,name,avatar');

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ التقييم بنجاح.',
            'data' => $review,
        ]);
    }

    /**
     * Store a newly created review in storage.
     */
    public function store(StoreCourseReviewRequest $request, Course $course): JsonResponse
    {
        // Keep store for backward compatibility or direct calls
        Gate::authorize('create', [CourseReview::class, $course]);

        $review = DB::transaction(function () use ($request, $course) {
            $created = $course->reviews()->create([
                'user_id' => $request->user()->id,
                'rating' => $request->validated('rating'),
                'title' => $request->validated('title'),
                'review' => $request->validated('review'),
                'is_verified' => true,
            ]);

            $course->updateRatingStats();

            return $created;
        });

        $review->load('user:id,name,avatar');

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ التقييم بنجاح.',
            'data' => $review,
        ], 201);
    }

    /**
     * Update the specified review in storage.
     */
    public function update(UpdateCourseReviewRequest $request, CourseReview $review): JsonResponse
    {
        Gate::authorize('update', $review);

        $updatedReview = DB::transaction(function () use ($request, $review) {
            $review->update($request->validated());
            $review->course->updateRatingStats();
            return $review;
        });

        return response()->json([
            'success' => true,
            'message' => 'Review updated successfully',
            'data' => $updatedReview,
        ]);
    }

    /**
     * Remove the specified review from storage.
     */
    public function destroy(CourseReview $review): JsonResponse
    {
        Gate::authorize('delete', $review);

        $course = $review->course;
        
        DB::transaction(function () use ($review, $course) {
            $review->delete();
            $course->updateRatingStats();
        });

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully',
        ]);
    }

    /**
     * Get the rating summary for a course.
     */
    public function summary(Course $course): JsonResponse
    {
        // This is efficient because we use the cached values on the course table
        // For the distribution, we can do a single aggregate query
        $distribution = $course->reviews()
            ->where('is_visible', true)
            ->select('rating', DB::raw('count(*) as count'))
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        // Fill in missing ratings with 0
        $summaryDistribution = [];
        $totalVisibleReviews = array_sum($distribution);
        
        for ($i = 5; $i >= 1; $i--) {
            $count = $distribution[$i] ?? 0;
            $percentage = $totalVisibleReviews > 0 ? round(($count / $totalVisibleReviews) * 100) : 0;
            $summaryDistribution[] = [
                'rating' => $i,
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'average_rating' => (float) $course->average_rating,
                'total_reviews' => $course->total_reviews,
                'distribution' => $summaryDistribution,
            ]
        ]);
    }

    /**
     * Mark a review as helpful.
     */
    public function toggleHelpful(Request $request, CourseReview $review): JsonResponse
    {
        // For simplicity, we just increment. 
        // In a real app, you'd have a `review_helpful_votes` pivot table to prevent multiple votes per user.
        $review->increment('helpful_count');
        
        return response()->json([
            'success' => true,
            'message' => 'Marked as helpful',
            'helpful_count' => $review->helpful_count,
        ]);
    }

    /**
     * Report a review.
     */
    public function report(Request $request, CourseReview $review): JsonResponse
    {
        $review->increment('reported_count');
        
        return response()->json([
            'success' => true,
            'message' => 'Review reported successfully',
        ]);
    }
}
