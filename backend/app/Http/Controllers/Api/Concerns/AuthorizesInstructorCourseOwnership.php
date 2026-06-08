<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Course;
use Illuminate\Http\Request;

trait AuthorizesInstructorCourseOwnership
{
    protected function authorizeCourseOwnership(Request $request, Course $course): void
    {
        $user = $request->user();

        if ($user?->role === 'admin') {
            return;
        }

        abort_unless(
            $user?->role === 'instructor'
                && $course->instructor()
                    ->where('user_id', $user->id)
                    ->exists(),
            403,
            'غير مصرح لك بإدارة هذه الدورة.',
        );
    }
}
