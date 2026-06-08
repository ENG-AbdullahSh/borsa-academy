<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Lang;

class CustomResetPassword extends ResetPassword
{
    /**
     * Build the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        if (static::$toMailCallback) {
            return call_user_func(static::$toMailCallback, $notifiable, $this->token);
        }

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $url = $frontendUrl . '/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject(Lang::get('إعادة تعيين كلمة المرور - أكاديمية البورصة'))
            ->greeting('مرحباً،')
            ->line(Lang::get('لقد تلقيت هذه الرسالة لأننا تلقينا طلب إعادة تعيين كلمة المرور لحسابك.'))
            ->action(Lang::get('إعادة تعيين كلمة المرور'), $url)
            ->line(Lang::get('سوف تنتهي صلاحية رابط إعادة التعيين هذا خلال :count دقيقة.', ['count' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire')]))
            ->line(Lang::get('إذا لم تقم بطلب إعادة تعيين كلمة المرور، فلا حاجة لاتخاذ أي إجراء إضافي.'))
            ->salutation("مع تحياتنا،\nأكاديمية البورصة");
    }
}
