import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/auth.css';

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
   SignIn Page
═══════════════════════════════════════════════════════════════════ */
export default function SignIn() {
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('يرجى تعبئة جميع الحقول المطلوبة.');
      return;
    }
    setLoading(true);
    /* Simulate async auth — replace with real API call */
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1900);
    }, 1500);
  };

  return (
    <div className="auth-wrapper">

      {/* ══════════ RIGHT — Identity Panel ══════════ */}
      <div className="auth-identity">
        <div className="auth-identity-inner">

          {/* Brand */}
          <div className="auth-logo">بورصة أكاديمي</div>
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
                    className="auth-input"
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
                    className="auth-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {/* Remember + Forgot row */}
                <div className="auth-utils-row">
                  <label className="auth-remember" htmlFor="signin-remember">
                    <input
                      id="signin-remember"
                      type="checkbox"
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                    />
                    <span className="auth-remember-label">تذكرني</span>
                  </label>
                  <button
                    type="button"
                    className="auth-forgot"
                    id="signin-forgot"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>

                {/* CTA */}
                <button
                  id="signin-submit"
                  type="submit"
                  className="auth-cta-btn"
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
