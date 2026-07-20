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
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(
        RegisterRequest $request,
        TelegramService $telegramService
    ): JsonResponse {
        $validated = $request->validated();

        // فحص الإيميل عن طريق بايثون
        $result = $telegramService->checkEmail($validated['email']);

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
            'email_verified_at' => null,
        ]);

        $admins = User::where('role', 'admin')->get();
        Notification::send(
            $admins,
            new \App\Notifications\NewUserRegisteredAdminNotification($user)
        );

        // توليد رمز التحقق (OTP) المكون من 6 أرقام
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = Carbon::now()->addMinutes(15);

        // حفظ كود التحقق في قاعدة البيانات
        DB::table('email_verification_otps')->updateOrInsert(
            ['email' => $user->email],
            [
                'code' => $code,
                'expires_at' => $expiresAt,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        );

        // طباعة الكود في السجلات للاختبار المحلي
        Log::info('--- Email Verification OTP ---');
        Log::info("To: {$user->email}");
        Log::info("Code: {$code}");
        Log::info("Expires At: {$expiresAt}");
        Log::info('------------------------------');

        // إرسال البريد الإلكتروني الفعلي
        try {
            $htmlContent = '
            <div dir="rtl" style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 40px 20px; text-align: right; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); direction: rtl;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #00E676; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">Borsa Academy</h2>
                    <div style="width: 50px; height: 3px; background-color: #00E676; margin: 10px auto 0; border-radius: 2px;"></div>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0; margin-bottom: 24px;">مرحباً ' . htmlspecialchars($user->name) . '،</p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0; margin-bottom: 30px;">
                    شكراً لتسجيلك في <strong>منصة بورصة أكاديمي</strong>. لتأكيد حسابك وتفعيله، يرجى إدخال رمز التحقق (OTP) التالي:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; background-color: rgba(0, 230, 118, 0.08); border: 2px dashed #00E676; color: #00E676; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 15px 40px; border-radius: 12px; box-shadow: 0 0 20px rgba(0, 230, 118, 0.15); direction: ltr;">
                        ' . $code . '
                    </div>
                </div>
                
                <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 30px;">
                    ⚠️ <strong>تنبيه أمني:</strong> هذا الرمز صالح لمدة <strong>15 دقيقة فقط</strong>. لا تشارك هذا الرمز مع أي شخص لحماية حسابك.
                </p>
                
                <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 30px 0;">
                
                <p style="font-size: 14px; color: #00E676; font-weight: 600; margin-top: 20px; margin-bottom: 0;">
                    مع تحيات،<br>
                    فريق عمل Borsa Academy
                </p>
            </div>
            ';

            Mail::html($htmlContent, function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('تأكيد الحساب - Borsa Academy');
            });
        } catch (Exception $e) {
            Log::error("Failed to send verification email to {$user->email}: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الحساب بنجاح. يرجى إدخال رمز التحقق (OTP) المرسل إلى بريدك الإلكتروني لتفعيل الحساب.',
            'email' => $user->email,
        ], 201);
    }

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

        if ($user->email_verified_at === null) {
            return response()->json([
                'message' => 'يرجى التحقق من بريدك الإلكتروني أولاً لتفعيل الحساب.',
                'code' => 'EMAIL_NOT_VERIFIED',
                'email' => $user->email,
            ], 403);
        }

        return response()->json([
            'message' => 'Logged in successfully.',
            'user' => $user,
            'token' => $user->createToken('api-token')->plainTextToken,
            'token_type' => 'Bearer',
        ]);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|size:6',
        ], [
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'email.email' => 'البريد الإلكتروني غير صالح.',
            'email.exists' => 'البريد الإلكتروني غير مسجل لدينا.',
            'code.required' => 'رمز التحقق مطلوب.',
            'code.size' => 'يجب أن يتكون رمز التحقق من 6 أرقام.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $request->input('email');
        $code = $request->input('code');

        $record = DB::table('email_verification_otps')
            ->where('email', $email)
            ->where('code', $code)
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'رمز التحقق غير صحيح.',
            ], 422);
        }

        if (Carbon::now()->greaterThan(Carbon::parse($record->expires_at))) {
            return response()->json([
                'success' => false,
                'message' => 'انتهت صلاحية رمز التحقق (الرمز صالح لمدة 15 دقيقة فقط).',
            ], 422);
        }

        $user = User::where('email', $email)->first();
        if ($user) {
            $user->email_verified_at = Carbon::now();
            $user->save();
        }

        // Delete the used code
        DB::table('email_verification_otps')->where('email', $email)->delete();

        // Issue token
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'تم تفعيل حسابك بنجاح.',
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function resendVerificationOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ], [
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'email.email' => 'البريد الإلكتروني غير صالح.',
            'email.exists' => 'البريد الإلكتروني غير مسجل لدينا.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $request->input('email');
        $user = User::where('email', $email)->first();

        if ($user->email_verified_at !== null) {
            return response()->json([
                'success' => false,
                'message' => 'هذا الحساب مفعل بالفعل.',
            ], 400);
        }

        // Generate new code
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = Carbon::now()->addMinutes(15);

        DB::table('email_verification_otps')->updateOrInsert(
            ['email' => $email],
            [
                'code' => $code,
                'expires_at' => $expiresAt,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        );

        Log::info('--- Email Verification OTP (Resend) ---');
        Log::info("To: {$email}");
        Log::info("Code: {$code}");
        Log::info("Expires At: {$expiresAt}");
        Log::info('---------------------------------------');

        try {
            $htmlContent = '
            <div dir="rtl" style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 40px 20px; text-align: right; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); direction: rtl;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #00E676; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">Borsa Academy</h2>
                    <div style="width: 50px; height: 3px; background-color: #00E676; margin: 10px auto 0; border-radius: 2px;"></div>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0; margin-bottom: 24px;">مرحباً ' . htmlspecialchars($user->name) . '،</p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0; margin-bottom: 30px;">
                    لقد تلقينا طلباً لإعادة إرسال رمز التحقق الخاص بحسابك في <strong>منصة بورصة أكاديمي</strong>. يرجى استخدام رمز التحقق (OTP) التالي:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; background-color: rgba(0, 230, 118, 0.08); border: 2px dashed #00E676; color: #00E676; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 15px 40px; border-radius: 12px; box-shadow: 0 0 20px rgba(0, 230, 118, 0.15); direction: ltr;">
                        ' . $code . '
                    </div>
                </div>
                
                <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 30px;">
                    ⚠️ <strong>تنبيه أمني:</strong> هذا الرمز صالح لمدة <strong>15 دقيقة فقط</strong>. لا تشارك هذا الرمز مع أي شخص لحماية حسابك.
                </p>
                
                <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 30px 0;">
                
                <p style="font-size: 14px; color: #00E676; font-weight: 600; margin-top: 20px; margin-bottom: 0;">
                    مع تحيات،<br>
                    فريق عمل Borsa Academy
                </p>
            </div>
            ';

            Mail::html($htmlContent, function ($message) use ($email) {
                $message->to($email)
                        ->subject('إعادة إرسال رمز التحقق - Borsa Academy');
            });
        } catch (Exception $e) {
            Log::error("Failed to resend verification email to {$email}: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إعادة إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح.',
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
