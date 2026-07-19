import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiShield, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useSettings } from '../../context/SettingsContext';
import { FieldError } from '../../components/FormValidation';
import {
  hasValidationErrors,
  invalidClass,
  invalidProps,
  normalizeLaravelErrors,
  validateFields,
  validators,
} from '../../utils/validation';
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
  <div className="auth-success" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
    <div
      className="auth-success-icon"
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
      تمت إعادة التعيين بنجاح! 🎉
    </h4>
    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
      تم تحديث كلمة المرور بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول خلال لحظات…
    </p>
    <button
      type="button"
      className="auth-cta-btn mt-4"
      style={{ maxWidth: 220, margin: '1.5rem auto 0' }}
      onClick={onRedirect}
    >
      الذهاب لتسجيل الدخول
    </button>
  </div>
);

export default function ResetPassword() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  /* ─── Email: from router state or manual entry ────────────────── */
  const [email, setEmail] = useState(location.state?.email || '');
  const needsEmail = !location.state?.email;

  /* ─── OTP digits ──────────────────────────────────────────────── */
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const digitRefs = useRef([]);

  /* ─── Password fields ─────────────────────────────────────────── */
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  /* ─── UI state ────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  /* ─── Auto-redirect on success ────────────────────────────────── */
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/signin', { replace: true }), 3000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  /* ─── Validation schema ───────────────────────────────────────── */
  const values = { password, password_confirmation: passwordConfirm };
  const schema = {
    password: [
      validators.required('كلمة المرور مطلوبة.'),
      validators.minLength(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.'),
    ],
    password_confirmation: [
      validators.required('تأكيد كلمة المرور مطلوب.'),
      validators.sameAs('password', 'كلمتا المرور غير متطابقتين.'),
    ],
  };

  const revalidate = (nextValues = values) => {
    const errs = validateFields(nextValues, schema);
    setFieldErrors(errs);
    return errs;
  };

  /* ─── OTP digit handlers ──────────────────────────────────────── */
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

  /* ─── Submit ──────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const code = digits.join('');

    // Client-side guard: OTP
    if (code.length < 6) {
      setError('يرجى إدخال كود التحقق المكون من 6 أرقام بالكامل.');
      return;
    }

    // Client-side guard: email (when entered manually)
    if (needsEmail && !email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    // Client-side guard: passwords
    setTouched({ password: true, password_confirmation: true });
    const errs = revalidate();
    if (hasValidationErrors(errs)) return;

    setLoading(true);

    try {
      await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: apiHeaders(null, true),
        body: JSON.stringify({
          email: email.trim(),
          code,
          password,
          password_confirmation: passwordConfirm,
        }),
      }).then(readJsonResponse);

      setSuccess(true);
    } catch (err) {
      // Map Laravel field errors
      const serverErrors = normalizeLaravelErrors(err);
      if (Object.keys(serverErrors).length) {
        setFieldErrors(serverErrors);
        setTouched({ password: true, password_confirmation: true });
        // Surface a human-readable top-level message too
        const firstMsg = Object.values(serverErrors)[0];
        setError(firstMsg || 'يرجى تصحيح الأخطاء أدناه.');
        return;
      }
      const firstField = Object.values(err.data?.errors || {}).flat().find(Boolean);
      setError(firstField || err.data?.message || err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Render ──────────────────────────────────────────────────── */
  return (
    <div className="auth-wrapper">
      {/* ══ Identity panel (left/right based on RTL) ══════════════ */}
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
            تعيين كلمة مرور جديدة آمنة لحسابك في منصة بورصة أكاديمي.
          </p>

          <ul className="auth-features">
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">استخدم 8 أحرف على الأقل</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">امزج بين الأرقام والأحرف والرموز</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">لا تستخدم نفس كلمة المرور القديمة</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">كود التحقق صالح لمدة 15 دقيقة فقط</span>
            </li>
          </ul>

          <div className="auth-identity-divider" />
          <span className="auth-identity-brand-sub">
            {settings.academy_name || 'Borsa Academy'} · Secure Reset
          </span>
        </div>
      </div>

      {/* ══ Form panel ════════════════════════════════════════════ */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          {success ? (
            <SuccessScreen onRedirect={() => navigate('/signin', { replace: true })} />
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
                  <FiShield size={26} color="#00E676" />
                </div>
                <h1 className="auth-form-title">إعادة تعيين كلمة المرور</h1>
                <p className="auth-form-subtitle">
                  أدخل كود التحقق المرسل إلى بريدك الإلكتروني ثم اختر كلمة مرور جديدة.
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

              <form onSubmit={handleSubmit} noValidate>
                {/* ── Email field (shown only when not passed via state) ── */}
                {needsEmail && (
                  <div className="auth-field mb-4">
                    <label className="auth-label" htmlFor="reset-email">
                      البريد الإلكتروني
                    </label>
                    <input
                      id="reset-email"
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

                {/* ── OTP: 6 individual digit boxes ─────────────────── */}
                <div className="auth-field mb-5">
                  <label className="auth-label text-center d-block mb-3">
                    كود التحقق (6 أرقام)
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
                        id={`otp-digit-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        onPaste={i === 0 ? handlePaste : undefined}
                        disabled={loading}
                        className="auth-input"
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
                        aria-label={`رقم ${i + 1} من كود التحقق`}
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
                    يمكنك لصق الكود مباشرة في الخانة الأولى
                  </p>
                </div>

                {/* ── New password ───────────────────────────────────── */}
                <div className="auth-field mb-4">
                  <label className="auth-label" htmlFor="new-password">
                    كلمة المرور الجديدة
                  </label>
                  <div className="auth-password-control">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`auth-input auth-password-input${invalidClass(
                        touched.password && fieldErrors.password,
                      )}`}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (touched.password || touched.password_confirmation) {
                          revalidate({ ...values, password: e.target.value });
                        }
                      }}
                      onBlur={() => {
                        setTouched((t) => ({ ...t, password: true }));
                        revalidate();
                      }}
                      disabled={loading}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      {...invalidProps(
                        touched.password && fieldErrors.password,
                        'new-password-error',
                      )}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  <FieldError
                    id="new-password-error"
                    message={touched.password && fieldErrors.password}
                  />
                </div>

                {/* ── Confirm password ───────────────────────────────── */}
                <div className="auth-field mb-6">
                  <label className="auth-label" htmlFor="confirm-password">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <div className="auth-password-control">
                    <input
                      id="confirm-password"
                      type={showPasswordConfirm ? 'text' : 'password'}
                      className={`auth-input auth-password-input${invalidClass(
                        touched.password_confirmation && fieldErrors.password_confirmation,
                      )}`}
                      placeholder="••••••••••••"
                      value={passwordConfirm}
                      onChange={(e) => {
                        setPasswordConfirm(e.target.value);
                        if (touched.password_confirmation) {
                          revalidate({ ...values, password_confirmation: e.target.value });
                        }
                      }}
                      onBlur={() => {
                        setTouched((t) => ({ ...t, password_confirmation: true }));
                        revalidate();
                      }}
                      disabled={loading}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      {...invalidProps(
                        touched.password_confirmation && fieldErrors.password_confirmation,
                        'confirm-password-error',
                      )}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPasswordConfirm((v) => !v)}
                      aria-label={
                        showPasswordConfirm ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'
                      }
                    >
                      {showPasswordConfirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  <FieldError
                    id="confirm-password-error"
                    message={touched.password_confirmation && fieldErrors.password_confirmation}
                  />
                </div>

                {/* ── Submit ─────────────────────────────────────────── */}
                <button
                  type="submit"
                  id="reset-password-submit"
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
                      جارٍ تعيين كلمة المرور…
                    </>
                  ) : (
                    'تعيين كلمة المرور الجديدة'
                  )}
                </button>
              </form>

              <p className="auth-switch mt-4 text-center">
                تذكرت كلمة المرور؟{' '}
                <Link to="/signin">تسجيل الدخول</Link>
              </p>
              <p className="auth-switch text-center" style={{ marginTop: '0.4rem' }}>
                لم تستلم الكود؟{' '}
                <Link to="/forgot-password">طلب كود جديد</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
