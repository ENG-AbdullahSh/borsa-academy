<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\CourseCurriculumController;
use App\Http\Controllers\Api\CourseSectionController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\LessonProgressController;
use Illuminate\Support\Facades\Route;

Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{id}', [CourseController::class, 'show'])->whereNumber('id');
Route::get('/courses/{id}/curriculum', [CourseCurriculumController::class, 'show'])->whereNumber('id');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:student')->group(function (): void {
        Route::post('/enrollments', [EnrollmentController::class, 'store']);
        Route::get('/my-courses', [EnrollmentController::class, 'index']);
        Route::get('/my-courses/{courseId}/progress', [LessonProgressController::class, 'course'])->whereNumber('courseId');
        Route::get('/my-courses/{courseId}', [EnrollmentController::class, 'show'])->whereNumber('courseId');
        Route::get('/my-progress', [LessonProgressController::class, 'index']);
        Route::post('/lessons/{lesson}/complete', [LessonProgressController::class, 'complete'])->whereNumber('lesson');
        Route::delete('/lessons/{lesson}/complete', [LessonProgressController::class, 'destroy'])->whereNumber('lesson');
    });

    Route::middleware('role:admin')->group(function (): void {
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
    });

});
