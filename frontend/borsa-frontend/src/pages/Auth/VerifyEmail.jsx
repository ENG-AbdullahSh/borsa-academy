import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMail, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../../utils/api';
import '../../styles/auth.css';
import borsaLogo from '../../assets/Borsa Academy.jpeg';

/* ── SVG helpers ─────────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg className="auth-feature-bullet-icon" viewBox="0 0 16 16">
    <polyline points="2.5,8.5 6.5,12.5 13.5,3.5" />
  </svg>
);

const SuccessScreen = ({ onRedirect }) => (
  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(0,230,118,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
        animation: 'pulse 2s infinite',
      }}
    >
      <FiCheckCircle size={40} color="#00E676" />
    </div>
    <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem' }}>
      تم تفعيل حسابك بنجاح! 🎉
    </h4>
    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
      مرحباً بك! جارٍ تحويلك إلى لوحة التحكم…
    </p>
    <button
      type="button"
      className="auth-cta-btn mt-4"
      style={{ maxWidth: 220, margin: '1.5rem auto 0' }}
      onClick={onRedirect}
    >
      الذهاب للوحة التحكم
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   VerifyEmail Page
═══════════════════════════════════════════════════════════════════ */
export default function VerifyEmail() {
  const { settings } = useSettings();
  const { fetchCurrentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /* ─── Email from router state or manual ────────────────────────── */
  const [email, setEmail] = useState(location.state?.email || '');
  const needsEmail = !location.state?.email;

  /* ─── OTP digits ──────────────────────────────────────────────── */
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const digitRefs = useRef([]);

  /* ─── Countdown resend timer ──────────────────────────────────── */
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  /* ─── UI state ─────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  /* ─── Countdown effect ─────────────────────────────────────────── */
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  /* ─── Auto-redirect on success ─────────────────────────────────── */
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/student-dashboard', { replace: true }), 2500);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  /* ─── OTP digit handlers ───────────────────────────────────────── */
  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < 5) digitRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prev = [...digits];
      prev[index - 1] = '';
      setDigits(prev);
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      setDigits(pasted.split(''));
      digitRefs.current[5]?.focus();
    }
  };

  /* ─── Submit verify ────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResendMsg('');

    const code = digits.join('');
    if (code.length < 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام بالكامل.');
      return;
    }
    if (needsEmail && !email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    setLoading(true);
    try {
      const data = await fetch(`${API_BASE_URL}/verify-email`, {
        method: 'POST',
        headers: apiHeaders(null, true),
        body: JSON.stringify({ email: email.trim(), code }),
      }).then(readJsonResponse);

      // Persist auth state using the returned token
      if (data.token) {
        await fetchCurrentUser(data.token);
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err?.data?.errors
          ? Object.values(err.data.errors).flat().find(Boolean)
          : err?.data?.message || err?.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      );
    } finally {
      setLoading(false);
    }
  };

  /* ─── Resend OTP ───────────────────────────────────────────────── */
  const handleResend = async () => {
    if (!canResend || resending) return;
    setResendMsg('');
    setError('');
    setResending(true);
    try {
      await fetch(`${API_BASE_URL}/resend-verification-otp`, {
        method: 'POST',
        headers: apiHeaders(null, true),
        body: JSON.stringify({ email: email.trim() }),
      }).then(readJsonResponse);

      setResendMsg('تم إعادة إرسال رمز التحقق بنجاح. يرجى مراجعة بريدك الإلكتروني.');
      setCountdown(60);
      setCanResend(false);
      setDigits(['', '', '', '', '', '']);
      digitRefs.current[0]?.focus();
    } catch (err) {
      setError(err?.data?.message || 'فشل إعادة إرسال الرمز. يرجى المحاولة لاحقاً.');
    } finally {
      setResending(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="auth-wrapper">
      {/* ══ Identity panel ══════════════════════════════════════════ */}
      <div className="auth-identity">
        <div className="auth-identity-inner">
          <div
            className="auth-logo-img-wrapper"
            style={{ display: 'flex', alignItems: 'center', gap: '20px', flexDirection: 'row-reverse' }}
          >
            <img
              src={
                settings.logo_path
                  ? `http://127.0.0.1:8000/storage/${settings.logo_path}`
                  : borsaLogo
              }
              alt={settings.academy_name || 'بورصة أكاديمي'}
              className="auth-logo-img brand-logo-animated"
              style={{ borderRadius: '8px' }}
            />
            <span
              className="brand-text-glowing"
              style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}
            >
              {settings.academy_name || 'بورصة أكاديمي'}
            </span>
          </div>
          <div className="auth-logo-underline" />
          <p className="auth-tagline">
            تحقق من بريدك الإلكتروني لتفعيل حسابك والبدء في رحلة التعلم.
          </p>

          <ul className="auth-features">
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">راجع صندوق الوارد أو مجلد Spam</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">الرمز صالح لمدة 15 دقيقة فقط</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">يمكنك لصق الرمز في الخانة الأولى مباشرة</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">إعادة الإرسال متاحة بعد 60 ثانية</span>
            </li>
          </ul>

          <div className="auth-identity-divider" />
          <span className="auth-identity-brand-sub">
            {settings.academy_name || 'Borsa Academy'} · Email Verification
          </span>
        </div>
      </div>

      {/* ══ Form panel ══════════════════════════════════════════════ */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          {success ? (
            <SuccessScreen onRedirect={() => navigate('/student-dashboard', { replace: true })} />
          ) : (
            <>
              {/* Header */}
              <div className="auth-form-header">
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(0,230,118,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}
                >
                  <FiMail size={26} color="#00E676" />
                </div>
                <h1 className="auth-form-title">تفعيل الحساب</h1>
                <p className="auth-form-subtitle">
                  أدخل رمز التحقق المكون من 6 أرقام المرسل إلى{' '}
                  {email ? (
                    <strong style={{ color: '#00E676' }}>{email}</strong>
                  ) : (
                    'بريدك الإلكتروني'
                  )}
                </p>
              </div>

              {/* Global error banner */}
              {error && (
                <div
                  className="auth-error-banner d-flex align-items-start gap-2"
                  role="alert"
                  style={{ marginBottom: '1.25rem' }}
                >
                  <FiAlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Resend success message */}
              {resendMsg && (
                <div
                  style={{
                    background: 'rgba(0,230,118,0.08)',
                    border: '1px solid rgba(0,230,118,0.3)',
                    borderRadius: 10,
                    padding: '0.75rem 1rem',
                    color: '#00E676',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  role="status"
                >
                  <FiCheckCircle size={16} />
                  {resendMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Manual email field if not passed via state */}
                {needsEmail && (
                  <div className="auth-field mb-4">
                    <label className="auth-label" htmlFor="verify-email-input">
                      البريد الإلكتروني
                    </label>
                    <input
                      id="verify-email-input"
                      type="email"
                      className="auth-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                      required
                    />
                  </div>
                )}

                {/* OTP: 6 individual digit boxes */}
                <div className="auth-field mb-5">
                  <label className="auth-label text-center d-block mb-3">
                    رمز التحقق (OTP)
                  </label>

                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      justifyContent: 'center',
                      direction: 'ltr',
                    }}
                  >
                    {digits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (digitRefs.current[i] = el)}
                        id={`verify-otp-digit-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        onPaste={i === 0 ? handlePaste : undefined}
                        disabled={loading}
                        className="auth-input"
                        autoFocus={i === 0}
                        style={{
                          width: 46,
                          height: 52,
                          textAlign: 'center',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          padding: 0,
                          borderRadius: '10px',
                          letterSpacing: 0,
                          caretColor: '#00E676',
                          border: digit
                            ? '1.5px solid rgba(0,230,118,0.55)'
                            : '1.5px solid rgba(255,255,255,0.08)',
                          transition: 'border-color 0.2s',
                        }}
                        aria-label={`رقم ${i + 1} من رمز التحقق`}
                      />
                    ))}
                  </div>

                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: '0.78rem',
                      color: '#64748b',
                      marginTop: '0.6rem',
                    }}
                  >
                    يمكنك لصق الرمز مباشرة في الخانة الأولى
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  id="verify-email-submit"
                  className="auth-cta-btn"
                  disabled={loading}
                  style={{
                    boxShadow: '0 0 22px rgba(0,230,118,0.35)',
                    transition: 'all 0.25s',
                  }}
                >
                  {loading ? (
                    <>
                      <span className="auth-spinner" />
                      جارٍ التحقق…
                    </>
                  ) : (
                    'تفعيل الحساب'
                  )}
                </button>
              </form>

              {/* Resend section */}
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                {canResend ? (
                  <button
                    type="button"
                    id="resend-otp-btn"
                    onClick={handleResend}
                    disabled={resending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00E676',
                      cursor: resending ? 'wait' : 'pointer',
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      opacity: resending ? 0.7 : 1,
                    }}
                  >
                    <FiRefreshCw size={15} style={{ animation: resending ? 'spin 1s linear infinite' : 'none' }} />
                    {resending ? 'جارٍ الإرسال…' : 'إعادة إرسال الرمز'}
                  </button>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                    إعادة الإرسال متاحة بعد{' '}
                    <span style={{ color: '#00E676', fontWeight: 600 }}>{countdown}</span> ثانية
                  </p>
                )}
              </div>

              <p className="auth-switch mt-4 text-center">
                لديك حساب بالفعل؟{' '}
                <Link to="/signin">تسجيل الدخول</Link>
              </p>
              <p className="auth-switch text-center" style={{ marginTop: '0.4rem' }}>
                <Link to="/signup">إنشاء حساب جديد</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
