<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckActiveSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'غير مصرح لك بالوصول.'], 401);
        }

        // TODO: أضف منطق التحقق من اشتراك المستخدم هنا
        // مثلاً: 
        // $hasActiveSubscription = $user->is_subscribed;
        // أو التحقق من جدول الاشتراكات / الكورسات.
        $hasActiveSubscription = true; // قيمة افتراضية للتوضيح

        if (!$hasActiveSubscription && $user->role !== 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'عذراً، يجب أن يكون لديك اشتراك فعال لتتمكن من الوصول لغرف التداول والمراسلة.'
            ], 403);
        }

        return $next($request);
    }
}
