import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import { FieldError } from '../components/FormValidation';
import { hasValidationErrors, invalidClass, invalidProps, normalizeLaravelErrors, validateFields, validators } from '../utils/validation';
import '../styles/auth.css';
import borsaLogo from '../assets/Borsa Academy.jpeg';

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

export default function ResetPassword() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const values = { password, password_confirmation: passwordConfirmation };
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

  const validateAndSet = (nextValues = values) => {
    const nextErrors = validateFields(nextValues, schema);
    setFieldErrors(nextErrors);
    return nextErrors;
  };

  const handleBlur = (field) => () => {
    setTouched((current) => ({ ...current, [field]: true }));
    setFieldErrors((current) => ({
      ...current,
      [field]: validateFields(values, { [field]: schema[field] })[field] || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ password: true, password_confirmation: true });

    const nextErrors = validateAndSet();
    if (hasValidationErrors(nextErrors)) return;

    if (!password || !passwordConfirmation) {
      setError('يرجى تعبئة جميع الحقول المطلوبة.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: apiHeaders(null, true),
        body: JSON.stringify({ 
          token,
          email,
          password,
          password_confirmation: passwordConfirmation
        }),
      });

      await readJsonResponse(res);

      setSuccess(true);
      setTimeout(() => navigate('/signin', { replace: true }), 3000);
    } catch (err) {
      const firstError = Object.values(err.data?.errors || {}).flat().find(Boolean);
      const serverErrors = normalizeLaravelErrors(err);
      if (Object.keys(serverErrors).length) {
        setFieldErrors(serverErrors);
        setTouched({ password: true, password_confirmation: true });
        return;
      }
      setError(firstError || err.message || 'حدث خطأ ما. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* ══════════ RIGHT — Identity Panel ══════════ */}
      <div className="auth-identity">
        <div className="auth-identity-inner">
          <div className="auth-logo-img-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: 'row-reverse' }}>
            <img src={settings.logo_path ? `http://127.0.0.1:8000/storage/${settings.logo_path}` : borsaLogo} alt={settings.academy_name || "بورصة أكاديمي"} className="auth-logo-img brand-logo-animated" style={{ borderRadius: '8px' }} />
            <span className="brand-text-glowing" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>
              {settings.academy_name || 'بورصة أكاديمي'}
            </span>
          </div>
          <div className="auth-logo-underline" />
          <p className="auth-tagline">
            تعيين كلمة مرور جديدة آمنة
          </p>

          <ul className="auth-features">
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">استخدم 8 أحرف على الأقل</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">تجنب كلمات المرور الشائعة أو السهلة</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">احتفظ بكلمة المرور في مكان آمن</span>
            </li>
          </ul>

          <div className="auth-identity-divider" />
          <span className="auth-identity-brand-sub">{settings.academy_name || 'Borsa Academy'} · Secure Reset</span>
        </div>
      </div>

      {/* ══════════ LEFT — Form Panel ══════════ */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          {success ? (
            <div className="auth-success">
              <div className="auth-success-icon">
                <SuccessIcon />
              </div>
              <h4>تم تعيين كلمة المرور بنجاح!</h4>
              <p>سيتم تحويلك إلى صفحة تسجيل الدخول...</p>
            </div>
          ) : (
            <>
              <div className="auth-form-header">
                <h1 className="auth-form-title">إعادة تعيين كلمة المرور</h1>
                <p className="auth-form-subtitle">
                  أدخل كلمة المرور الجديدة لحسابك: {email}
                </p>
              </div>

              {error && <div className="auth-error-banner">{error}</div>}
              
              {!token || !email ? (
                 <div className="auth-error-banner">رابط إعادة التعيين غير صالح أو منتهي الصلاحية.</div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reset-password">
                      كلمة المرور الجديدة
                    </label>
                    <div className="auth-password-control">
                      <input
                        id="reset-password"
                        type={showPassword ? 'text' : 'password'}
                        className={`auth-input auth-password-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]${invalidClass(touched.password && fieldErrors.password)}`}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          if (touched.password || touched.password_confirmation) {
                            validateAndSet({ ...values, password: e.target.value });
                          }
                        }}
                        onBlur={handleBlur('password')}
                        required
                        minLength={8}
                        {...invalidProps(touched.password && fieldErrors.password, 'reset-password-error')}
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    <FieldError id="reset-password-error" message={touched.password && fieldErrors.password} />
                  </div>

                  <div className="auth-field mb-6 mt-4">
                    <label className="auth-label" htmlFor="reset-password-confirm">
                      تأكيد كلمة المرور الجديدة
                    </label>
                    <div className="auth-password-control">
                      <input
                        id="reset-password-confirm"
                        type={showPasswordConfirmation ? 'text' : 'password'}
                        className={`auth-input auth-password-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]${invalidClass(touched.password_confirmation && fieldErrors.password_confirmation)}`}
                        placeholder="••••••••••••"
                        value={passwordConfirmation}
                        onChange={e => {
                          setPasswordConfirmation(e.target.value);
                          if (touched.password_confirmation) {
                            validateAndSet({ ...values, password_confirmation: e.target.value });
                          }
                        }}
                        onBlur={handleBlur('password_confirmation')}
                        required
                        minLength={8}
                        {...invalidProps(touched.password_confirmation && fieldErrors.password_confirmation, 'reset-password-confirm-error')}
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowPasswordConfirmation((current) => !current)}
                        aria-label={showPasswordConfirmation ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'}
                      >
                        {showPasswordConfirmation ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    <FieldError id="reset-password-confirm-error" message={touched.password_confirmation && fieldErrors.password_confirmation} />
                  </div>

                  <button
                    type="submit"
                    className="auth-cta-btn hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-[0_0_20px_rgba(0,230,118,0.4)]"
                    disabled={loading}
                  >
                    {loading && <span className="auth-spinner" />}
                    {loading ? 'جارٍ التحديث…' : 'حفظ كلمة المرور'}
                  </button>
                </form>
              )}

              <p className="auth-switch mt-4 text-center">
                العودة إلى <Link to="/signin">تسجيل الدخول</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
