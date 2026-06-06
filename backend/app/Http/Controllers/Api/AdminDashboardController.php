<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $enrollments = Enrollment::query();
        $totalEnrollments = (clone $enrollments)->count();

        $recentEnrollments = Enrollment::query()
            ->with([
                'user:id,name,email',
                'course:id,title',
            ])
            ->latest('enrolled_at')
            ->limit(8)
            ->get()
            ->map(fn (Enrollment $enrollment): array => [
                'id' => $enrollment->id,
                'student' => [
                    'id' => $enrollment->user?->id,
                    'name' => $enrollment->user?->name,
                    'email' => $enrollment->user?->email,
                ],
                'course' => [
                    'id' => $enrollment->course?->id,
                    'title' => $enrollment->course?->title,
                ],
                'enrolled_at' => $enrollment->enrolled_at,
                'progress' => $enrollment->progress,
                'completed' => $enrollment->completed,
            ])
            ->values();

        return response()->json([
            'success' => true,
            'stats' => [
                'total_courses' => Course::query()->count(),
                'published_courses' => Course::query()->published()->count(),
                'total_students' => User::query()->where('role', 'student')->count(),
                'total_enrollments' => $totalEnrollments,
                'completed_enrollments' => (clone $enrollments)->where('completed', true)->count(),
                'average_progress' => $totalEnrollments > 0
                    ? (int) round((float) (clone $enrollments)->avg('progress'))
                    : 0,
                'total_certificates' => Certificate::query()->count(),
            ],
            'recent_enrollments' => $recentEnrollments,
        ]);
    }
}
