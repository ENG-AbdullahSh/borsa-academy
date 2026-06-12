<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>استعادة كلمة المرور - Borsa Academy</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0B0F19; margin: 0; padding: 40px 0; -webkit-font-smoothing: antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0B0F19;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #161C2D; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,230,118,0.05); border: 1px solid rgba(255,255,255,0.05);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px; background-color: #161C2D;">
                            <h1 style="color: #00E676; margin: 0; font-size: 32px; letter-spacing: 1px; text-transform: uppercase;">
                                Borsa <span style="color: #ffffff;">Academy</span>
                            </h1>
                            <div style="height: 3px; width: 60px; background-color: #00E676; margin: 15px auto 0; border-radius: 2px; box-shadow: 0 0 10px rgba(0,230,118,0.5);"></div>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center;">
                            <h2 style="color: #ffffff; margin-top: 0; font-size: 24px; font-weight: 600;">استعادة كلمة المرور</h2>
                            
                            <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                لقد تلقينا طلباً لاستعادة كلمة المرور الخاصة بحسابك في أكاديمية البورصة. يرجى استخدام الكود أدناه لإكمال العملية:
                            </p>
                            
                            <!-- OTP Code -->
                            <div style="background-color: #0B0F19; border: 1px solid rgba(0, 230, 118, 0.3); border-radius: 8px; padding: 20px; margin: 0 auto 30px; display: inline-block;">
                                <span style="font-size: 36px; font-weight: bold; color: #00E676; letter-spacing: 8px; font-family: monospace;">
                                    {{ $code }}
                                </span>
                            </div>
                            
                            <p style="color: #94A3B8; font-size: 14px; margin-bottom: 35px;">
                                هذا الكود صالح لمدة <strong style="color: #ffffff;">60 دقيقة</strong> فقط.
                            </p>

                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <a href="{{ env('FRONTEND_URL', 'http://localhost:5173') }}/forgot-password" 
                                           style="display: inline-block; background-color: #00E676; color: #0B0F19; text-decoration: none; font-size: 16px; font-weight: bold; padding: 15px 40px; border-radius: 6px; box-shadow: 0 0 15px rgba(0, 230, 118, 0.4);">
                                            إعادة تعيين كلمة المرور
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #0d121e; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                            <p style="color: #64748B; font-size: 13px; margin: 0 0 10px;">
                                إذا لم تطلب تغيير كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان. حسابك لا يزال محمياً.
                            </p>
                            <p style="color: #475569; font-size: 12px; margin: 0;">
                                &copy; {{ date('Y') }} Borsa Academy. جميع الحقوق محفوظة.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
