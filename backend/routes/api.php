<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\AdminCertificateController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminQuizController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\ContactMessageController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\CourseCurriculumController;
use App\Http\Controllers\Api\CourseSectionController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\InstructorController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\LessonProgressController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{id}', [CourseController::class, 'show'])->whereNumber('id');
Route::get('/courses/{id}/curriculum', [CourseCurriculumController::class, 'show'])->whereNumber('id');
Route::get('/settings', [SettingController::class, 'getSettings']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);
Route::post('/upload', [UploadController::class, 'uploadFile']);

// ── Contact Form ────────────────────────────────────────────────────────
// Public route — rate-limited to 5 submissions per minute per IP
Route::post('/contact', [ContactMessageController::class, 'send'])
    ->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ── Profile ────────────────────────────────────────────────────────
    Route::put('/profile/update', [ProfileController::class, 'updateProfile']);
    Route::put('/profile/update-password', [ProfileController::class, 'updatePassword']);

    // ── Notifications ──────────────────────────────────────────────
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-read', [NotificationController::class, 'markAsRead']);
    Route::get('/my-contact-messages', [ContactMessageController::class, 'myMessages']);
    Route::middleware('role:student')->group(function (): void {
        Route::post('/enrollments', [EnrollmentController::class, 'store']);
        Route::get('/my-courses', [EnrollmentController::class, 'index']);
        Route::get('/my-courses/{courseId}/progress', [LessonProgressController::class, 'course'])->whereNumber('courseId');
        Route::get('/my-courses/{courseId}', [EnrollmentController::class, 'show'])->whereNumber('courseId');
        Route::get('/my-progress', [LessonProgressController::class, 'index']);
        Route::get('/my-certificates', [CertificateController::class, 'index']);
        Route::get('/my-certificates/{certificate}', [CertificateController::class, 'show'])->whereNumber('certificate');
        Route::get('/my-courses/{courseId}/certificate', [CertificateController::class, 'course'])->whereNumber('courseId');
        Route::get('/certificates/{id}/download', [CertificateController::class, 'downloadPdf'])->whereNumber('id');
        Route::get('/courses/{course}/quiz', [QuizController::class, 'show'])->whereNumber('course');
        Route::post('/courses/{course}/quiz/submit', [QuizController::class, 'submit'])->whereNumber('course');
        Route::get('/my-quiz-attempts', [QuizController::class, 'attempts']);
        Route::get('/my-courses/{course}/quiz-status', [QuizController::class, 'status'])->whereNumber('course');
        Route::post('/lessons/{lesson}/complete', [LessonProgressController::class, 'complete'])->whereNumber('lesson');
        Route::delete('/lessons/{lesson}/complete', [LessonProgressController::class, 'destroy'])->whereNumber('lesson');
    });

    Route::middleware('role:admin')->group(function (): void {
        Route::put('/admin/settings', [SettingController::class, 'updateSettings']);
        Route::apiResource('/admin/users', AdminUserController::class);
        Route::apiResource('/admin/instructors', InstructorController::class);
        Route::get('/admin/dashboard', [AdminDashboardController::class, 'index']);
        Route::get('/admin/certificates', [AdminCertificateController::class, 'index']);
        Route::get('/admin/courses/{course}/quiz', [AdminQuizController::class, 'show'])->whereNumber('course');
        Route::post('/admin/courses/{course}/quiz', [AdminQuizController::class, 'store'])->whereNumber('course');
        Route::put('/admin/quizzes/{quiz}', [AdminQuizController::class, 'update'])->whereNumber('quiz');
        Route::delete('/admin/quizzes/{quiz}', [AdminQuizController::class, 'destroy'])->whereNumber('quiz');
        Route::post('/admin/quizzes/{quiz}/questions', [AdminQuizController::class, 'storeQuestion'])->whereNumber('quiz');
        Route::put('/admin/quiz-questions/{question}', [AdminQuizController::class, 'updateQuestion'])->whereNumber('question');
        Route::delete('/admin/quiz-questions/{question}', [AdminQuizController::class, 'destroyQuestion'])->whereNumber('question');
        Route::post('/admin/quiz-questions/{question}/options', [AdminQuizController::class, 'storeOption'])->whereNumber('question');
        Route::put('/admin/quiz-options/{option}', [AdminQuizController::class, 'updateOption'])->whereNumber('option');
        Route::delete('/admin/quiz-options/{option}', [AdminQuizController::class, 'destroyOption'])->whereNumber('option');
        Route::get('/admin/test', function () {
            return response()->json([
                'message' => 'Admin route access confirmed.',
            ]);
        });

        Route::get('/admin/courses', [CourseController::class, 'adminIndex']);
        Route::get('/admin/courses/{id}', [CourseController::class, 'adminShow'])->whereNumber('id');
        Route::get('/admin/courses/{id}/curriculum', [CourseCurriculumController::class, 'adminShow'])->whereNumber('id');
        Route::post('/admin/courses', [CourseController::class, 'store']);
        Route::put('/admin/courses/{id}', [CourseController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/courses/{id}', [CourseController::class, 'destroy'])->whereNumber('id');
        Route::post('/admin/sections', [CourseSectionController::class, 'store']);
        Route::put('/admin/sections/{id}', [CourseSectionController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/sections/{id}', [CourseSectionController::class, 'destroy'])->whereNumber('id');
        Route::post('/admin/lessons', [LessonController::class, 'store']);
        Route::put('/admin/lessons/{id}', [LessonController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/lessons/{id}', [LessonController::class, 'destroy'])->whereNumber('id');

        // ── Contact Messages ────────────────────────────────────────────
        Route::get('/admin/contact-messages', [ContactMessageController::class, 'index']);
        Route::get('/admin/contact-messages/{contactMessage}', [ContactMessageController::class, 'show']);
        Route::post('/admin/contact-messages/{contactMessage}/reply', [ContactMessageController::class, 'reply']);
        Route::patch('/admin/contact-messages/{contactMessage}', [ContactMessageController::class, 'update']);
        Route::delete('/admin/contact-messages/{contactMessage}', [ContactMessageController::class, 'destroy']);
    });

});
