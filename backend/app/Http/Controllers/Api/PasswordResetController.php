<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\ResetPasswordCode;
use App\Mail\PasswordChangedNotification;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    private const GENERIC_CODE_MESSAGE = 'إذا كان البريد مسجلاً لدينا، سيتم إرسال كود استعادة كلمة المرور إلى بريدك الإلكتروني.';

    public function sendResetLinkEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        // Always return generic message to prevent email enumeration
        if (!$user) {
            return response()->json([
                'message' => self::GENERIC_CODE_MESSAGE,
            ]);
        }

        // Check if there's an existing valid rate limit, we might want to let them resend after 60 seconds
        // But the rate limiting here is for *guessing* the code, not for resending.
        // The resend is usually limited too, but the user specifically asked to limit the wrong code attempts.

        // Generate a random 6-digit code
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        // Save or update the code in the password_reset_tokens table
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => $code,
                'created_at' => Carbon::now()
            ]
        );

        // Send the email
        Mail::to($user->email)->send(new ResetPasswordCode($code));

        return response()->json([
            'message' => self::GENERIC_CODE_MESSAGE,
        ]);
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
        ]);

        $key = 'reset_attempts:' . $validated['email'];

        // Allow max 5 attempts, lockout for 15 minutes (900 seconds)
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = ceil($seconds / 60);
            return response()->json([
                'message' => "لقد أدخلت الكود بشكل خاطئ عدة مرات. يرجى المحاولة مرة أخرى بعد {$minutes} دقيقة.",
            ], 429);
        }

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->where('token', $validated['token'])
            ->first();

        if (!$record || Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            RateLimiter::hit($key, 15 * 60); // Log a failed attempt
            return response()->json([
                'message' => 'الكود غير صحيح أو انتهت صلاحيته.',
            ], 422);
        }

        return response()->json([
            'message' => 'تم التحقق من الكود بنجاح.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $key = 'reset_attempts:' . $validated['email'];

        // Also check rate limit here just in case they bypass verify endpoint
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = ceil($seconds / 60);
            return response()->json([
                'message' => "لقد أدخلت الكود بشكل خاطئ عدة مرات. يرجى المحاولة مرة أخرى بعد {$minutes} دقيقة.",
            ], 429);
        }

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->where('token', $validated['token'])
            ->first();

        if (!$record || Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            RateLimiter::hit($key, 15 * 60);
            return response()->json([
                'message' => 'الكود غير صحيح أو انتهت صلاحيته.',
            ], 422);
        }

        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            return response()->json([
                'message' => 'المستخدم غير موجود.',
            ], 422);
        }

        // Update user password
        $user->forceFill([
            'password' => Hash::make($validated['password']),
            'remember_token' => Str::random(60),
        ])->save();

        // Delete all user tokens
        $user->tokens()->delete();

        // Delete the reset token record
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        // Clear rate limiter upon success
        RateLimiter::clear($key);

        event(new PasswordReset($user));

        // Send security notification email
        Mail::to($user->email)->send(new PasswordChangedNotification());

        return response()->json([
            'message' => 'تمت إعادة تعيين كلمة المرور بنجاح.',
        ]);
    }
}
