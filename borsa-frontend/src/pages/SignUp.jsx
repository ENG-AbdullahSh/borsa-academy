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
   SignUp Page
═══════════════════════════════════════════════════════════════════ */
export default function SignUp() {
  const navigate = useNavigate();

  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirm]   = useState('');
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
              <h4>تم إنشاء حسابك بنجاح!</h4>
              <p>مرحباً بك في بورصة أكاديمي — جارٍ توجيهك لتسجيل الدخول…</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="auth-form-header">
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
                    className="auth-input rtl-input"
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
                    className="auth-input"
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
                  <input
                    id="signup-password"
                    type="password"
                    className="auth-input"
                    placeholder="••••••••  (8 أحرف على الأقل)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-confirm">
                    تأكيد كلمة المرور
                  </label>
                  <input
                    id="signup-confirm"
                    type="password"
                    className="auth-input"
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
                </div>

                {/* Terms Agreement */}
                <label className="auth-terms" htmlFor="signup-terms">
                  <input
                    id="signup-terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                  />
                  <span className="auth-terms-label">
                    أوافق على{' '}
                    <a href="#terms" onClick={e => e.preventDefault()}>شروط الخدمة</a>
                    {' '}و{' '}
                    <a href="#privacy" onClick={e => e.preventDefault()}>سياسة الخصوصية</a>
                  </span>
                </label>

                {/* CTA */}
                <button
                  id="signup-submit"
                  type="submit"
                  className="auth-cta-btn"
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
