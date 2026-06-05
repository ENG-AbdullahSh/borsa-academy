import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';
import borsaLogo from '../assets/Borsa Academy.jpeg';

/* ── SVG helpers ─────────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg className="auth-feature-bullet-icon" viewBox="0 0 16 16">
    <polyline points="2.5,8.5 6.5,12.5 13.5,3.5" />
  </svg>
);

const SuccessIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 38, height: 38, stroke: '#00E676', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
    <polyline points="4,13 9,18 20,7" />
  </svg>
);

/* ── Feature list data ───────────────────────────────────────────── */
const FEATURES = [
  'وصول كامل لكورسات العملات الرقمية والفوركس',
  'لوحة تحكم ذكية لمتابعة وتحليل أدائك',
  'مجتمع تفاعلي وجلسات حية مع خبراء السوق',
];

const getLoginErrorMessage = (error) => {
  if (error?.status === 422) {
    return 'بيانات الدخول غير صحيحة.';
  }

  if (error?.status === 403) {
    return 'هذا الحساب غير نشط.';
  }

  return 'تعذر تسجيل الدخول. تأكد من تشغيل الخادم وحاول مرة أخرى.';
};

const getRedirectPath = (role, fromPath) => {
  if (role === 'admin') {
    return fromPath && fromPath !== '/signin' ? fromPath : '/admin';
  }

  if (role === 'student') {
    return '/masari';
  }

  return '/';
};

/* ═══════════════════════════════════════════════════════════════════
   SignIn Page
═══════════════════════════════════════════════════════════════════ */
export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('يرجى تعبئة جميع الحقول المطلوبة.');
      return;
    }
    setLoading(true);

    try {
      const result = await login({ email, password });
      const redirectPath = getRedirectPath(result.user?.role, location.state?.from?.pathname);

      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate(redirectPath, { replace: true }), 700);
    } catch (err) {
      setLoading(false);
      setError(getLoginErrorMessage(err));
    }
  };

  return (
    <div className="auth-wrapper">

      {/* ══════════ RIGHT — Identity Panel ══════════ */}
      <div className="auth-identity">
        <div className="auth-identity-inner">

          {/* Brand */}
          <div className="auth-logo-img-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: 'row-reverse' }}>
            <img src={borsaLogo} alt="بورصة أكاديمي" className="auth-logo-img brand-logo-animated" />
            <span className="brand-text-glowing" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>
              بورصة أكاديمي
            </span>
          </div>
          <div className="auth-logo-underline" />
          <p className="auth-tagline">
            بوابتك الاحترافية لتعلم التداول وتحليل الأسواق المالية
            بدقة متناهية وأدوات مؤسسية ذكية.
          </p>

          {/* Feature highlights */}
          <ul className="auth-features">
            {FEATURES.map((text, i) => (
              <li key={i} className="auth-feature-item">
                <span className="auth-feature-bullet">
                  <CheckIcon />
                </span>
                <span className="auth-feature-text">{text}</span>
              </li>
            ))}
          </ul>

          {/* Bottom accent */}
          <div className="auth-identity-divider" />
          <span className="auth-identity-brand-sub">Borsa Academy · Pro Platform</span>
        </div>
      </div>

      {/* ══════════ LEFT — Form Panel ══════════ */}
      <div className="auth-form-panel">
        <div className="auth-form-box">

          {success ? (
            /* ── Success state ── */
            <div className="auth-success">
              <div className="auth-success-icon">
                <SuccessIcon />
              </div>
              <h4>تم التحقق بنجاح!</h4>
              <p>جارٍ فتح محطة التداول الآمنة…</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="auth-form-header">
                <img 
                  src={borsaLogo} 
                  alt="Borsa Academy" 
                  className="mx-auto mb-4" 
                  style={{ maxHeight: '55px', filter: 'drop-shadow(0 0 12px rgba(0, 230, 118, 0.25))' }} 
                />
                <h1 className="auth-form-title">مرحباً بك مجدداً</h1>
                <p className="auth-form-subtitle">
                  الرجاء إدخال بياناتك للوصول إلى حسابك
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="auth-error-banner">{error}</div>
              )}

              <form onSubmit={handleSubmit} noValidate>

                {/* Email */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signin-email">
                    البريد الإلكتروني
                  </label>
                  <input
                    id="signin-email"
                    type="email"
                    className="auth-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                    placeholder="operator@borsa.io"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Password */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signin-password">
                    كلمة المرور
                  </label>
                  <input
                    id="signin-password"
                    type="password"
                    className="auth-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {/* Remember + Forgot row */}
                <div className="auth-utils-row flex items-center justify-between mt-2 mb-6">
                  <label className="auth-remember flex items-center gap-2 cursor-pointer select-none" htmlFor="signin-remember">
                    <input
                      id="signin-remember"
                      type="checkbox"
                      className="w-4 h-4 accent-[#00E676] cursor-pointer"
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                    />
                    <span className="auth-remember-label text-[13px] text-slate-400 hover:text-slate-300 transition-colors">تذكرني</span>
                  </label>
                  <button
                    type="button"
                    className="auth-forgot text-[13px] text-slate-500 hover:text-[#00E676] bg-transparent border-none cursor-pointer transition-colors"
                    id="signin-forgot"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>

                {/* CTA */}
                <button
                  id="signin-submit"
                  type="submit"
                  className="auth-cta-btn hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-[0_0_20px_rgba(0,230,118,0.4)]"
                  disabled={loading}
                >
                  {loading && <span className="auth-spinner" />}
                  {loading ? 'جارٍ التحقق…' : 'دخول آمن'}
                </button>

              </form>

              {/* Switch to Sign Up */}
              <p className="auth-switch">
                ليس لديك حساب؟{' '}
                <Link to="/signup" id="goto-signup">أنشئ حسابك الآن</Link>
              </p>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
