<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    private const GENERIC_LINK_MESSAGE = 'إذا كان البريد مسجلاً لدينا، سيتم إرسال رابط استعادة كلمة المرور';

    /**
     * Send a reset link without revealing whether the account exists.
     */
    public function sendResetLinkEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        Password::broker()->sendResetLink([
            'email' => $validated['email'],
        ]);

        return response()->json([
            'message' => self::GENERIC_LINK_MESSAGE,
        ]);
    }

    /**
     * Reset the password and invalidate both the token and active API sessions.
     */
    public function reset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::broker()->reset(
            $validated,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'رابط استعادة كلمة المرور غير صالح أو منتهي الصلاحية.',
            ], 422);
        }

        return response()->json([
            'message' => 'تمت إعادة تعيين كلمة المرور بنجاح.',
        ]);
    }
}
