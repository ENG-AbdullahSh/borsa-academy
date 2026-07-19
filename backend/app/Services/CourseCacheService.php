<?php

namespace App\Services;

use App\Models\Course;
use Illuminate\Support\Facades\Cache;

class CourseCacheService
{
    /**
     * Get the current cache version for courses index/query caches.
     */
    public function getCacheVersion(): int
    {
        return (int) Cache::rememberForever('courses.cache_version', fn() => 1);
    }

    /**
     * Invalidate all courses catalog caches by incrementing the cache version
     * and deleting specific detail caches.
     *
     * @param int|null $courseId If provided, also clears the detail cache for this specific course.
     */
    public function invalidate(int $courseId = null): void
    {
        try {
            // Increment version to instantly invalidate all dynamic query indexes
            Cache::increment('courses.cache_version');
        } catch (\Throwable $e) {
            Cache::forever('courses.cache_version', $this->getCacheVersion() + 1);
        }

        // Invalidate best sellers cache
        Cache::forget('courses.best_sellers');

        // If specific course ID is provided, invalidate its detail cache
        if ($courseId) {
            Cache::forget("courses.show.{$courseId}");
        }
    }

    /**
     * Get paginated courses list from cache, or database if missing.
     *
     * @param array $filters Filters applied to the query
     * @param int $perPage Number of items per page
     * @return array
     */
    public function getCachedIndex(array $filters, int $perPage = 10): array
    {
        $version = $this->getCacheVersion();
        
        // Generate unique cache key based on version and query parameters
        $filterHash = md5(json_encode($filters) . '_' . $perPage);
        $cacheKey = "courses.index.v{$version}.{$filterHash}";

        return Cache::remember($cacheKey, now()->addMinutes(15), function () use ($filters, $perPage) {
            return Course::query()
                ->with('instructor.user') // Prevent N+1 query issue
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
                ->when($filters['min_price'] ?? null, function ($query, float $minPrice): void {
                    $query->where('price', '>=', $minPrice);
                })
                ->when($filters['max_price'] ?? null, function ($query, float $maxPrice): void {
                    $query->where('price', '<=', $maxPrice);
                })
                ->latest()
                ->paginate($perPage)
                ->withQueryString()
                ->toArray();
        });
    }

    /**
     * Get a single course's detailed data from cache.
     *
     * @param int $id Course ID
     * @return Course
     */
    public function getCachedShow(int $id): Course
    {
        $cacheKey = "courses.show.{$id}";

        $cached = Cache::get($cacheKey);
        
        if ($cached instanceof Course) {
            return $cached;
        }

        // If the cached value is corrupted or not a Course model (e.g. __PHP_Incomplete_Class), clear it
        if ($cached !== null) {
            Cache::forget($cacheKey);
        }

        $course = Course::query()
            ->with(['instructor.user', 'sections.lessons.quiz']) // Eager load relations
            ->published()
            ->findOrFail($id);

        Cache::put($cacheKey, $course, now()->addMinutes(30));

        return $course;
    }

    /**
     * Get the list of best-selling courses based on enrollment count.
     *
     * @param int $limit Max courses to fetch
     * @return array
     */
    public function getBestSellers(int $limit = 6): array
    {
        $cacheKey = 'courses.best_sellers';

        return Cache::remember($cacheKey, now()->addMinutes(60), function () use ($limit) {
            return Course::query()
                ->with('instructor.user')
                ->published()
                ->withCount('enrollments')
                ->orderByDesc('enrollments_count')
                ->take($limit)
                ->get()
                ->toArray();
        });
    }
}
