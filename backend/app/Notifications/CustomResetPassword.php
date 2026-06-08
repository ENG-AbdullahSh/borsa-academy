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
    public function toMail($notifiable): MailMessage
    {
        if (static::$toMailCallback) {
            return call_user_func(static::$toMailCallback, $notifiable, $this->token);
        }

        $query = http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
        $url = rtrim(config('app.frontend_url'), '/').'/reset-password?'.$query;

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
