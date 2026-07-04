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
use App\Http\Controllers\Api\InstructorPortalController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\LessonProgressController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SocialLoginController;
use App\Http\Controllers\Api\VideoStreamController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{id}', [CourseController::class, 'show'])->whereNumber('id');
Route::get('/courses/{id}/curriculum', [CourseCurriculumController::class, 'show'])->whereNumber('id');
Route::get('/courses/{course}/reviews', [\App\Http\Controllers\Api\CourseReviewController::class, 'index'])->whereNumber('course');
Route::get('/courses/{course}/rating-summary', [\App\Http\Controllers\Api\CourseReviewController::class, 'summary'])->whereNumber('course');
Route::get('/settings', [SettingController::class, 'getSettings']);

// ── Video Streaming (Range-request aware, auth handled inside controller) ──
Route::get('/lessons/{lesson}/stream', [VideoStreamController::class, 'stream'])->whereNumber('lesson');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
Route::post('/auth/google', [SocialLoginController::class, 'google']);
Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail']);
Route::post('/verify-reset-code', [PasswordResetController::class, 'verifyCode']);
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
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markOneAsRead']);
    Route::delete('/notifications', [NotificationController::class, 'destroyAll']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
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
        Route::get('/my-courses/{courseId}/sections/{section}/certificate', [CertificateController::class, 'section'])->whereNumber('courseId')->whereNumber('section');
        Route::get('/certificates/{id}/download', [CertificateController::class, 'downloadPdf'])->whereNumber('id');
        Route::get('/courses/{course}/quiz', [QuizController::class, 'show'])->whereNumber('course');
        Route::post('/courses/{course}/quiz/submit', [QuizController::class, 'submit'])->whereNumber('course');
        Route::get('/lessons/{lesson}/quiz', [QuizController::class, 'showLesson'])->whereNumber('lesson');
        Route::post('/lessons/{lesson}/quiz/submit', [QuizController::class, 'submitLesson'])->whereNumber('lesson');
        Route::get('/my-quiz-attempts', [QuizController::class, 'attempts']);
        Route::get('/my-courses/{course}/quiz-status', [QuizController::class, 'status'])->whereNumber('course');
        Route::post('/lessons/{lesson}/complete', [LessonProgressController::class, 'complete'])->whereNumber('lesson');
        Route::delete('/lessons/{lesson}/complete', [LessonProgressController::class, 'destroy'])->whereNumber('lesson');

        Route::post('/courses/{course}/reviews', [\App\Http\Controllers\Api\CourseReviewController::class, 'store'])->whereNumber('course');
        Route::post('/courses/{course}/review', [\App\Http\Controllers\Api\CourseReviewController::class, 'upsert'])->whereNumber('course');
    });

    // Review actions — accessible to owner (student) or admin; policy enforces ownership
    Route::put('/reviews/{review}', [\App\Http\Controllers\Api\CourseReviewController::class, 'update'])->whereNumber('review');
    Route::delete('/reviews/{review}', [\App\Http\Controllers\Api\CourseReviewController::class, 'destroy'])->whereNumber('review');
    Route::post('/reviews/{review}/helpful', [\App\Http\Controllers\Api\CourseReviewController::class, 'toggleHelpful'])->whereNumber('review');
    Route::post('/reviews/{review}/report', [\App\Http\Controllers\Api\CourseReviewController::class, 'report'])->whereNumber('review');

    Route::middleware('role:instructor')->group(function (): void {
        Route::get('/instructor/dashboard', [InstructorPortalController::class, 'dashboard']);
        Route::get('/instructor/courses', [InstructorPortalController::class, 'courses']);
        Route::get('/instructor/courses/{course}', [InstructorPortalController::class, 'course'])->whereNumber('course');
        Route::get('/instructor/courses/{course}/curriculum', [InstructorPortalController::class, 'curriculum'])->whereNumber('course');
        Route::get('/instructor/courses/{course}/students', [InstructorPortalController::class, 'students'])->whereNumber('course');
        Route::get('/instructor/courses/{course}/quiz-results', [InstructorPortalController::class, 'quizResults'])->whereNumber('course');

        Route::post('/instructor/sections', [CourseSectionController::class, 'store']);
        Route::put('/instructor/sections/{id}', [CourseSectionController::class, 'update'])->whereNumber('id');
        Route::delete('/instructor/sections/{id}', [CourseSectionController::class, 'destroy'])->whereNumber('id');
        Route::post('/instructor/lessons', [LessonController::class, 'store']);
        Route::put('/instructor/lessons/{id}', [LessonController::class, 'update'])->whereNumber('id');
        Route::post('/instructor/lessons/{id}/upload-video', [LessonController::class, 'uploadVideo'])->whereNumber('id');
        Route::delete('/instructor/lessons/{id}', [LessonController::class, 'destroy'])->whereNumber('id');

        Route::get('/instructor/courses/{course}/quiz', [AdminQuizController::class, 'show'])->whereNumber('course');
        Route::post('/instructor/courses/{course}/quiz', [AdminQuizController::class, 'store'])->whereNumber('course');
        Route::get('/instructor/lessons/{lesson}/quiz', [AdminQuizController::class, 'showLesson'])->whereNumber('lesson');
        Route::post('/instructor/lessons/{lesson}/quiz', [AdminQuizController::class, 'storeLesson'])->whereNumber('lesson');
        Route::put('/instructor/quizzes/{quiz}', [AdminQuizController::class, 'update'])->whereNumber('quiz');
        Route::delete('/instructor/quizzes/{quiz}', [AdminQuizController::class, 'destroy'])->whereNumber('quiz');
        Route::post('/instructor/quizzes/{quiz}/questions', [AdminQuizController::class, 'storeQuestion'])->whereNumber('quiz');
        Route::put('/instructor/quiz-questions/{question}', [AdminQuizController::class, 'updateQuestion'])->whereNumber('question');
        Route::delete('/instructor/quiz-questions/{question}', [AdminQuizController::class, 'destroyQuestion'])->whereNumber('question');
        Route::post('/instructor/quiz-questions/{question}/options', [AdminQuizController::class, 'storeOption'])->whereNumber('question');
        Route::put('/instructor/quiz-options/{option}', [AdminQuizController::class, 'updateOption'])->whereNumber('option');
        Route::delete('/instructor/quiz-options/{option}', [AdminQuizController::class, 'destroyOption'])->whereNumber('option');
    });

    Route::middleware('role:admin')->group(function (): void {
        Route::put('/admin/settings', [SettingController::class, 'updateSettings']);
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::post('/admin/users', [AdminUserController::class, 'store']);
        Route::get('/admin/users/{user}', [AdminUserController::class, 'show'])->whereNumber('user');
        Route::put('/admin/users/{user}/status', [AdminUserController::class, 'updateStatus'])->whereNumber('user');
        Route::put('/admin/users/{user}/role', [AdminUserController::class, 'updateRole'])->whereNumber('user');
        Route::apiResource('/admin/instructors', InstructorController::class);
        Route::get('/admin/dashboard', [AdminDashboardController::class, 'index']);
        Route::get('/admin/certificates', [AdminCertificateController::class, 'index']);
        Route::get('/admin/courses/{course}/quiz', [AdminQuizController::class, 'show'])->whereNumber('course');
        Route::post('/admin/courses/{course}/quiz', [AdminQuizController::class, 'store'])->whereNumber('course');
        Route::get('/admin/lessons/{lesson}/quiz', [AdminQuizController::class, 'showLesson'])->whereNumber('lesson');
        Route::post('/admin/lessons/{lesson}/quiz', [AdminQuizController::class, 'storeLesson'])->whereNumber('lesson');
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
        Route::post('/admin/lessons/{id}/upload-video', [LessonController::class, 'uploadVideo'])->whereNumber('id');
        Route::delete('/admin/lessons/{id}', [LessonController::class, 'destroy'])->whereNumber('id');

        // ── Contact Messages ────────────────────────────────────────────
        Route::get('/admin/contact-messages', [ContactMessageController::class, 'index']);
        Route::get('/admin/contact-messages/{contactMessage}', [ContactMessageController::class, 'show']);
        Route::post('/admin/contact-messages/{contactMessage}/reply', [ContactMessageController::class, 'reply']);
        Route::patch('/admin/contact-messages/{contactMessage}', [ContactMessageController::class, 'update']);
        Route::delete('/admin/contact-messages/{contactMessage}', [ContactMessageController::class, 'destroy']);

        // ── Admin Chat Rooms ────────────────────────────────────────────
        Route::apiResource('/admin/chat-rooms', \App\Http\Controllers\Api\AdminChatRoomController::class);

        // ── Admin Monitoring ────────────────────────────────────────────
        Route::get('/admin/activity', [\App\Http\Controllers\Api\AdminActivityController::class, 'index'])->middleware('admin');
    });

    // ── Chat Routes ────────────────────────────────────────────
    Route::middleware('subscribed')->group(function () {
        Route::get('/chat/rooms', [\App\Http\Controllers\Api\ChatController::class, 'getRooms']);
        Route::post('/chat/send', [\App\Http\Controllers\Api\ChatController::class, 'sendMessage']);
        Route::get('/chat/messages', [\App\Http\Controllers\Api\ChatController::class, 'getMessages']);
        Route::post('/chat/messages/{message}/reaction', [\App\Http\Controllers\Api\ChatController::class, 'toggleReaction'])->whereNumber('message');
    });
});
