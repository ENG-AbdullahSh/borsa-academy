<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use App\Services\TelegramService;
class AuthController extends Controller
{
public function register(
    RegisterRequest $request,
    TelegramService $telegramService
): JsonResponse {

    $validated = $request->validated();

    // فحص الإيميل عن طريق بايثون
    $result = $telegramService->checkEmail(
        $validated['email']
    );


    // فشل الاتصال بالخدمة
    if (!$result['success']) {
        return response()->json([
            'message' => 'حدث خطأ أثناء التحقق من البريد الإلكتروني.'
        ], 422);
    }


    // الإيميل غير مسجل في فالدكس
    if (!$result['registered']) {
        return response()->json([
            'message' => 'يرجى التسجيل في شركة فالدكس أولاً، وبعدها قم بالتسجيل هنا للحصول على الكورسات.'
        ], 422);
    }


    // الإيميل مسجل في فالدكس -> إنشاء الحساب
    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'role' => 'student',
        'status' => 'active',
    ]);


    $admins = User::where('role', 'admin')->get();

    Notification::send(
        $admins,
        new \App\Notifications\NewUserRegisteredAdminNotification($user)
    );


    return response()->json([
        'message' => 'Registered successfully.',
        'user' => $user,
        'token' => $user->createToken('api-token')->plainTextToken,
        'token_type' => 'Bearer',
    ], 201);
}
    // public function register(RegisterRequest $request): JsonResponse
    // {
    //     $validated = $request->validated();

    //     $user = User::create([
    //         'name' => $validated['name'],
    //         'email' => $validated['email'],
    //         'password' => Hash::make($validated['password']),
    //         'role' => 'student',
    //         'status' => 'active',
    //     ]);

    //     $admins = User::where('role', 'admin')->get();
    //     \Illuminate\Support\Facades\Notification::send($admins, new \App\Notifications\NewUserRegisteredAdminNotification($user));

    //     return response()->json([
    //         'message' => 'Registered successfully.',
    //         'user' => $user,
    //         'token' => $user->createToken('api-token')->plainTextToken,
    //         'token_type' => 'Bearer',
    //     ], 201);
    // }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::where('email', $credentials['email'])->first();

        if (! $user) {
            return response()->json([
                'message' => 'لا يوجد حساب بهذا البريد الإلكتروني، يرجى إنشاء حساب جديد',
                'code' => 'ACCOUNT_NOT_FOUND',
            ], 404);
        }

        if (! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
                'code' => 'INVALID_CREDENTIALS',
            ], 422);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'هذا الحساب غير مفعل أو موقوف',
                'code' => $user->status === 'suspended'
                    ? 'ACCOUNT_SUSPENDED'
                    : 'ACCOUNT_INACTIVE',
            ], 403);
        }

        return response()->json([
            'message' => 'Logged in successfully.',
            'user' => $user,
            'token' => $user->createToken('api-token')->plainTextToken,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'user' => array_merge($user->toArray(), [
                'avatar_url' => $user->avatar_url,
            ]),
        ]);
    }

    public function redirectToGoogle()
    {
        $clientId = config('services.google.client_id');
        $redirectUri = config('services.google.redirect');

        if (! $clientId || ! $redirectUri) {
            return redirect($this->frontendAuthUrl([
                'google_error' => 'GOOGLE_NOT_CONFIGURED',
            ]));
        }

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'access_type' => 'offline',
            'prompt' => 'select_account',
        ]);

        return redirect('https://accounts.google.com/o/oauth2/v2/auth?' . $query);
    }

    public function handleGoogleCallback(Request $request)
    {
        if ($request->filled('error')) {
            return redirect($this->frontendAuthUrl([
                'google_error' => $request->query('error'),
            ]));
        }

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');
        $redirectUri = config('services.google.redirect');

        if (! $request->filled('code') || ! $clientId || ! $clientSecret || ! $redirectUri) {
            return redirect($this->frontendAuthUrl([
                'google_error' => 'GOOGLE_NOT_CONFIGURED',
            ]));
        }

        $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'code' => $request->query('code'),
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirectUri,
        ]);

        if (! $tokenResponse->ok() || ! $tokenResponse->json('access_token')) {
            return redirect($this->frontendAuthUrl([
                'google_error' => 'GOOGLE_TOKEN_EXCHANGE_FAILED',
            ]));
        }

        $googleUserResponse = Http::withToken($tokenResponse->json('access_token'))
            ->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if (! $googleUserResponse->ok() || ! $googleUserResponse->json('email')) {
            return redirect($this->frontendAuthUrl([
                'google_error' => 'GOOGLE_PROFILE_FAILED',
            ]));
        }

        $profile = $googleUserResponse->json();

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
            return redirect($this->frontendAuthUrl([
                'google_error' => $user->status === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_INACTIVE',
            ]));
        }

        if ($isNewUser) {
            $admins = User::where('role', 'admin')->get();
            Notification::send($admins, new \App\Notifications\NewUserRegisteredAdminNotification($user));
        }

        return redirect($this->frontendAuthUrl([
            'token' => $user->createToken('api-token')->plainTextToken,
            'token_type' => 'Bearer',
        ]));
    }

    private function frontendAuthUrl(array $query = []): string
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

        return $frontendUrl . '/signin' . (empty($query) ? '' : '?' . http_build_query($query));
    }
}
