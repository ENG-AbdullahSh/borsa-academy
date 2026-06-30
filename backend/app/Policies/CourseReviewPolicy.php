<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\CourseReview;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CourseReviewPolicy
{
    /**
     * Determine whether the user can create a review for the course.
     */
    public function create(User $user, Course $course): Response
    {
        // Must be student
        if ($user->role !== 'student') {
            return Response::deny('فقط الطلاب يمكنهم كتابة تقييم.');
        }

        // Must be enrolled
        $enrollment = $user->enrollments()->where('course_id', $course->id)->first();
        if (!$enrollment) {
            return Response::deny('يجب أن تكون مسجلاً في هذه الدورة لتتمكن من تقييمها.');
        }

        // Must have completed the course (100% progress)
        if ($enrollment->progress < 100 || !$enrollment->completed) {
            return Response::deny('يجب إكمال الدورة بنسبة 100% لتتمكن من كتابة تقييم.');
        }

        // Prevent duplicate reviews (only for new reviews)
        if ($course->reviews()->where('user_id', $user->id)->exists()) {
            return Response::deny('لقد قمت بتقييم هذه الدورة بالفعل.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the user can update the review.
     */
    public function update(User $user, CourseReview $courseReview): Response
    {
        if ($user->role !== 'student') {
            return Response::deny('فقط الطلاب يمكنهم تعديل التقييم.');
        }

        return $user->id === $courseReview->user_id
            ? Response::allow()
            : Response::deny('يمكنك فقط تعديل التقييم الخاص بك.');
    }

    /**
     * Determine whether the user can delete the review.
     */
    public function delete(User $user, CourseReview $courseReview): Response
    {
        if ($user->role === 'admin' || $user->id === $courseReview->user_id) {
            return Response::allow();
        }

        return Response::deny('ليس لديك صلاحية لحذف هذا التقييم.');
    }
}
