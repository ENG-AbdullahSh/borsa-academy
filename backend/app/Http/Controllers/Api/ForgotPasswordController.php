<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Exception;

class ForgotPasswordController extends Controller
{
    /**
     * Send OTP to the user's email (log it locally).
     */
    public function sendOtp(Request $request): JsonResponse
    {
        try {
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
            
            // Generate 6-digit random code
            $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            
            // Expiration time: 15 minutes from now
            $expiresAt = Carbon::now()->addMinutes(15);

            // Store or update the OTP in password_reset_otps table
            DB::table('password_reset_otps')->updateOrInsert(
                ['email' => $email],
                [
                    'code' => $code,
                    'created_at' => Carbon::now(),
                    'expires_at' => $expiresAt,
                ]
            );

            // Log the email and OTP code (backup / offline testing)
            Log::info('--- Forgot Password OTP ---');
            Log::info("To: {$email}");
            Log::info("Code: {$code}");
            Log::info("Expires At: {$expiresAt}");
            Log::info('---------------------------');

            // إرسال البريد الإلكتروني الفعلي عبر Gmail SMTP بتنسيق HTML احترافي ومظلم
            $htmlContent = '
            <div dir="rtl" style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 40px 20px; text-align: right; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); direction: rtl;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #00E676; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">Borsa Academy</h2>
                    <div style="width: 50px; height: 3px; background-color: #00E676; margin: 10px auto 0; border-radius: 2px;"></div>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0; margin-bottom: 24px;">مرحباً،</p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0; margin-bottom: 30px;">
                    لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في <strong>منصة بورصة أكاديمي</strong>. يرجى استخدام رمز التحقق (OTP) التالي لإكمال العملية:
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
                
                <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
                    إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.
                </p>
                
                <p style="font-size: 14px; color: #00E676; font-weight: 600; margin-top: 20px; margin-bottom: 0;">
                    مع تحيات،<br>
                    فريق عمل Borsa Academy
                </p>
            </div>
            ';

            Mail::html(
                $htmlContent,
                function ($message) use ($email) {
                    $message->to($email)
                            ->subject('إعادة تعيين كلمة المرور - Borsa Academy');
                }
            );

            return response()->json([
                'success' => true,
                'message' => 'تم إرسال كود التحقق إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد أو مجلد Spam.',
            ]);

        } catch (Exception $e) {
            Log::error("Error in sendOtp: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة لاحقاً.',
            ], 500);
        }
    }

    /**
     * Reset the password using the OTP code.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|exists:users,email',
                'code' => 'required|string|size:6',
                'password' => 'required|string|min:8|confirmed',
            ], [
                'email.required' => 'البريد الإلكتروني مطلوب.',
                'email.email' => 'البريد الإلكتروني غير صالح.',
                'email.exists' => 'البريد الإلكتروني غير مسجل لدينا.',
                'code.required' => 'كود التحقق مطلوب.',
                'code.size' => 'يجب أن يتكون الكود من 6 أرقام.',
                'password.required' => 'كلمة المرور الجديدة مطلوبة.',
                'password.min' => 'يجب أن لا تقل كلمة المرور عن 8 أحرف.',
                'password.confirmed' => 'تأكيد كلمة المرور غير متطابق.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $email = $request->input('email');
            $code = $request->input('code');

            // Find the OTP record
            $record = DB::table('password_reset_otps')
                ->where('email', $email)
                ->where('code', $code)
                ->first();

            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'كود التحقق غير صحيح.',
                ], 422);
            }

            // Check expiration
            if (Carbon::now()->greaterThan(Carbon::parse($record->expires_at))) {
                return response()->json([
                    'success' => false,
                    'message' => 'انتهت صلاحية كود التحقق (الرمز صالح لمدة 15 دقيقة فقط).',
                ], 422);
            }

            // Update user password
            $user = User::where('email', $email)->first();
            if ($user) {
                $user->password = Hash::make($request->input('password'));
                $user->save();
            }

            // Delete the OTP record to prevent reuse
            DB::table('password_reset_otps')->where('email', $email)->delete();

            return response()->json([
                'success' => true,
                'message' => 'تمت إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
            ]);

        } catch (Exception $e) {
            Log::error("Error in resetPassword: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة لاحقاً.',
            ], 500);
        }
    }

    /**
     * Verify the OTP code.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|exists:users,email',
                'code' => 'required|string|size:6',
            ], [
                'email.required' => 'البريد الإلكتروني مطلوب.',
                'email.email' => 'البريد الإلكتروني غير صالح.',
                'email.exists' => 'البريد الإلكتروني غير مسجل لدينا.',
                'code.required' => 'كود التحقق مطلوب.',
                'code.size' => 'يجب أن يتكون الكود من 6 أرقام.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $email = $request->input('email');
            $code = $request->input('code');

            $record = DB::table('password_reset_otps')
                ->where('email', $email)
                ->where('code', $code)
                ->first();

            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'كود التحقق غير صحيح.',
                ], 422);
            }

            if (Carbon::now()->greaterThan(Carbon::parse($record->expires_at))) {
                return response()->json([
                    'success' => false,
                    'message' => 'انتهت صلاحية كود التحقق.',
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'تم التحقق من الكود بنجاح.',
            ]);

        } catch (Exception $e) {
            Log::error("Error in verifyOtp: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة لاحقاً.',
            ], 500);
        }
    }
}
