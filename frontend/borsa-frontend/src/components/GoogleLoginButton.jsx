import { useEffect, useRef, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

/* ── SVG Google Logo (الألوان الرسمية لـ Google) ──────────────── */
const GoogleLogo = () => <FcGoogle size={20} />;

const GOOGLE_GSI_URL = 'https://accounts.google.com/gsi/client';

export default function GoogleLoginButton({
  onSuccess,
  onError,
  text = 'signin_with',
  disabled = false,
}) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const overlayRef     = useRef(null);   // حاوية زر Google الحقيقي (شفاف)
  const [isLoading, setIsLoading] = useState(false);

  /* ── تهيئة Google GSI وتصيير الزر الشفاف ─────────────────────── */
  useEffect(() => {
    if (disabled || !overlayRef.current || !googleClientId) return undefined;

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !overlayRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response?.credential) {
            onError?.(new Error('تعذر استلام بيانات حساب جوجل. حاول مرة أخرى.'));
            setIsLoading(false);
            return;
          }
          setIsLoading(true);
          try {
            await onSuccess?.(response.credential);
          } catch (err) {
            onError?.(err);
            setIsLoading(false);
          }
        },
      });

      /* نصيّر زر Google داخل الـ overlay الشفاف بعرض الحاوية الفعلي */
      overlayRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(overlayRef.current, {
        type:           'standard',
        theme:          'filled_black',
        size:           'large',
        text,
        shape:          'rectangular',
        logo_alignment: 'left',
        width: Math.min(440, overlayRef.current.parentElement?.offsetWidth || 440),
      });
    };

    /* إذا كانت مكتبة Google محمّلة مسبقاً */
    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => { cancelled = true; };
    }

    /* إذا كان الـ script موجود لكن لم يكتمل التحميل */
    const existingScript = document.querySelector(`script[src="${GOOGLE_GSI_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', renderGoogleButton);
      return () => {
        cancelled = true;
        existingScript.removeEventListener('load', renderGoogleButton);
      };
    }

    /* إضافة script جديد */
    const script = document.createElement('script');
    script.src   = GOOGLE_GSI_URL;
    script.async = true;
    script.defer = true;
    script.onload  = renderGoogleButton;
    script.onerror = () => {
      if (!cancelled) {
        onError?.(new Error('تعذر تحميل تسجيل الدخول بجوجل. تحقق من الاتصال وحاول مرة أخرى.'));
      }
    };
    document.head.appendChild(script);

    return () => { cancelled = true; };
  }, [disabled, googleClientId, onError, onSuccess, text]);

  /* ── حالة عدم ضبط الـ Client ID ─────────────────────────────── */
  if (!googleClientId) {
    return (
      <div className="auth-google-disabled">
        تسجيل الدخول بجوجل يحتاج ضبط VITE_GOOGLE_CLIENT_ID في ملف .env
      </div>
    );
  }

  const label = text === 'signup_with'
    ? 'إنشاء حساب باستخدام Google'
    : 'تسجيل الدخول باستخدام Google';

  return (
    /*
     * الهيكل:
     * ┌──────────────────────────────────┐
     * │  زرنا المخصص (بصري فقط)         │  ← pointer-events: none
     * ├──────────────────────────────────┤
     * │  زر Google الشفاف (overlayRef)   │  ← position:absolute, opacity~0, يستقبل الكليكات
     * └──────────────────────────────────┘
     */
    <div className="auth-google-outer" style={{ position: 'relative' }}>

      {/* الزر المخصص — بصري فقط، لا يستقبل النقرات */}
      <div
        className={`auth-google-custom-btn${disabled || isLoading ? ' auth-google-custom-btn--disabled' : ''}`}
        aria-hidden="true"
      >
        {isLoading ? (
          <span className="auth-google-spinner" />
        ) : (
          <span className="auth-google-icon-wrap">
            <GoogleLogo />
          </span>
        )}
        <span className="auth-google-label">
          {isLoading ? 'جارٍ الاتصال بـ Google…' : label}
        </span>
      </div>

      {/* زر Google الحقيقي — شفاف، يغطي الزر المخصص بالكامل، يستقبل النقرات */}
      {!isLoading && !disabled && (
        <div
          ref={overlayRef}
          aria-label={label}
          style={{
            position:   'absolute',
            inset:       0,
            opacity:     0.01,       /* شفاف تقريباً لكن قابل للنقر */
            overflow:   'hidden',
            cursor:     'pointer',
          }}
        />
      )}
    </div>
  );
}
