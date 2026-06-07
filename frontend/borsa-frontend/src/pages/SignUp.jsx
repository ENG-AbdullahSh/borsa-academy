import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
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

/* ═══════════════════════════════════════════════════════════════════
   SignUp Page
═══════════════════════════════════════════════════════════════════ */
export default function SignUp() {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirm]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('يرجى تعبئة جميع الحقول المطلوبة.');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقتين.');
      return;
    }
    if (password.length < 8) {
      setError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
      return;
    }
    if (!agreed) {
      setError('يجب الموافقة على شروط الخدمة وسياسة الخصوصية للمتابعة.');
      return;
    }

    setLoading(true);
    /* Simulate async registration — replace with real API call */
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate('/signin'), 2000);
    }, 1600);
  };

  return (
    <div className="auth-wrapper">

      {/* ══════════ RIGHT — Identity Panel ══════════ */}
      <div className="auth-identity">
        <div className="auth-identity-inner">

          {/* Brand */}
          <div className="auth-logo-img-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: 'row-reverse' }}>
            <img src={settings.logo_path ? `http://127.0.0.1:8000/storage/${settings.logo_path}` : borsaLogo} alt={settings.academy_name || "بورصة أكاديمي"} className="auth-logo-img brand-logo-animated" style={{ borderRadius: '8px' }} />
            <span className="brand-text-glowing" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>
              {settings.academy_name || 'بورصة أكاديمي'}
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
          <span className="auth-identity-brand-sub">{settings.academy_name || 'Borsa Academy'} · Pro Platform</span>
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
              <h4>تم إنشاء حسابك بنجاح!</h4>
              <p>مرحباً بك في بورصة أكاديمي — جارٍ توجيهك لتسجيل الدخول…</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="auth-form-header">
                <img 
                  src={settings.logo_path ? `http://127.0.0.1:8000/storage/${settings.logo_path}` : borsaLogo} 
                  alt={settings.academy_name || "Borsa Academy"} 
                  className="mx-auto mb-4" 
                  style={{ maxHeight: '55px', borderRadius: '8px', filter: 'drop-shadow(0 0 12px rgba(0, 230, 118, 0.25))' }} 
                />
                <h1 className="auth-form-title">إنشاء حساب جديد</h1>
                <p className="auth-form-subtitle">
                  انضم إلى آلاف المتداولين المحترفين على منصتنا
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="auth-error-banner">{error}</div>
              )}

              <form onSubmit={handleSubmit} noValidate>

                {/* Full Name */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-name">
                    الاسم الكامل
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    className="auth-input rtl-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                    placeholder="محمد أحمد"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-email">
                    البريد الإلكتروني
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    className="auth-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                    placeholder="you@borsa.io"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Password */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-password">
                    كلمة المرور
                  </label>
                  <div className="auth-password-control">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input auth-password-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                      placeholder="••••••••  (8 أحرف على الأقل)"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      aria-pressed={showPassword}
                      aria-controls="signup-password"
                      title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-confirm">
                    تأكيد كلمة المرور
                  </label>
                  <div className="auth-password-control">
                    <input
                      id="signup-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="auth-input auth-password-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      required
                      style={{
                        borderColor: confirmPassword && password !== confirmPassword
                          ? 'rgba(255,82,82,0.5)'
                          : undefined,
                      }}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      aria-pressed={showConfirmPassword}
                      aria-controls="signup-confirm"
                      title={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showConfirmPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {/* Terms Agreement */}
                <label className="auth-terms flex items-start gap-2 mb-6 cursor-pointer select-none mt-2" htmlFor="signup-terms">
                  <input
                    id="signup-terms"
                    type="checkbox"
                    className="w-4 h-4 accent-[#00E676] cursor-pointer mt-1 flex-shrink-0"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                  />
                  <span className="auth-terms-label text-[13px] text-slate-400 leading-relaxed">
                    أوافق على{' '}
                    <a href="#terms" onClick={e => e.preventDefault()} className="text-[#00E676] font-bold no-underline hover:text-[#5effe8] transition-colors">شروط الخدمة</a>
                    {' '}و{' '}
                    <a href="#privacy" onClick={e => e.preventDefault()} className="text-[#00E676] font-bold no-underline hover:text-[#5effe8] transition-colors">سياسة الخصوصية</a>
                  </span>
                </label>

                {/* CTA */}
                <button
                  id="signup-submit"
                  type="submit"
                  className="auth-cta-btn hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-[0_0_20px_rgba(0,230,118,0.4)]"
                  disabled={loading}
                >
                  {loading && <span className="auth-spinner" />}
                  {loading ? 'جارٍ إنشاء الحساب…' : 'إنشاء الحساب المشترك'}
                </button>

              </form>

              {/* Switch to Sign In */}
              <p className="auth-switch">
                تمتلك حساباً بالفعل؟{' '}
                <Link to="/signin" id="goto-signin">سجل الدخول هنا</Link>
              </p>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
