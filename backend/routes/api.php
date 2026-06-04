<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use Illuminate\Support\Facades\Route;

Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{id}', [CourseController::class, 'show'])->whereNumber('id');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:admin')->group(function (): void {
        Route::get('/admin/test', function () {
            return response()->json([
                'message' => 'Admin route access confirmed.',
            ]);
        });

        Route::post('/admin/courses', [CourseController::class, 'store']);
        Route::put('/admin/courses/{id}', [CourseController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/courses/{id}', [CourseController::class, 'destroy'])->whereNumber('id');
    });
});
