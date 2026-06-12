<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class SocialLoginController extends Controller
{
    public function google(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'credential' => ['required', 'string'],
        ]);

        $clientId = config('services.google.client_id');

        if (! $clientId) {
            return response()->json([
                'message' => 'تسجيل الدخول بجوجل غير مفعّل حالياً. يرجى ضبط GOOGLE_CLIENT_ID.',
                'code' => 'GOOGLE_NOT_CONFIGURED',
            ], 503);
        }

        $googleResponse = Http::asJson()->get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $validated['credential'],
        ]);

        if (! $googleResponse->ok()) {
            return response()->json([
                'message' => 'تعذر التحقق من حساب جوجل. حاول مرة أخرى.',
                'code' => 'INVALID_GOOGLE_TOKEN',
            ], 422);
        }

        $profile = $googleResponse->json();

        if (($profile['aud'] ?? null) !== $clientId || empty($profile['email'])) {
            return response()->json([
                'message' => 'بيانات حساب جوجل غير صالحة لهذا التطبيق.',
                'code' => 'GOOGLE_AUDIENCE_MISMATCH',
            ], 422);
        }

        $user = User::query()
            ->when($profile['sub'] ?? null, fn ($query, $googleId) => $query->where('google_id', $googleId))
            ->orWhere('email', $profile['email'])
            ->first();

        $isNewUser = false;

        if (! $user) {
            $isNewUser = true;
            $user = User::create([
                'name' => $profile['name'] ?? Str::before($profile['email'], '@'),
                'email' => $profile['email'],
                'google_id' => $profile['sub'] ?? null,
                'avatar' => $profile['picture'] ?? null,
                'email_verified_at' => now(),
                'password' => Hash::make(Str::random(48)),
                'role' => 'student',
                'status' => 'active',
            ]);
        } else {
            $user->forceFill([
                'google_id' => $user->google_id ?: ($profile['sub'] ?? null),
                'avatar' => $user->avatar ?: ($profile['picture'] ?? null),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ])->save();
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'هذا الحساب غير مفعّل أو موقوف.',
                'code' => $user->status === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_INACTIVE',
            ], 403);
        }

        if ($isNewUser) {
            $admins = User::where('role', 'admin')->get();
            Notification::send($admins, new \App\Notifications\NewUserRegisteredAdminNotification($user));
        }

        return response()->json([
            'message' => 'تم تسجيل الدخول بجوجل بنجاح.',
            'user' => $user,
            'token' => $user->createToken('api-token')->plainTextToken,
            'token_type' => 'Bearer',
        ]);
    }
}
