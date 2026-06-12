<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Lang;

class CustomResetPassword extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        if (static::$toMailCallback) {
            return call_user_func(static::$toMailCallback, $notifiable, $this->token);
        }

        return (new MailMessage)
            ->subject(Lang::get('كود استعادة كلمة المرور - أكاديمية البورصة'))
            ->greeting('مرحباً،')
            ->line(Lang::get('استخدم الكود التالي داخل المنصة لإعادة تعيين كلمة المرور:'))
            ->line($this->token)
            ->line(Lang::get('تنتهي صلاحية هذا الكود خلال :count دقيقة.', ['count' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire')]))
            ->line(Lang::get('إذا لم تطلب استعادة كلمة المرور، يمكنك تجاهل هذه الرسالة.'))
            ->salutation("مع تحياتنا،\nأكاديمية البورصة");
    }
}
