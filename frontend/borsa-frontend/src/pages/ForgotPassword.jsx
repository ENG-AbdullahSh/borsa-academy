import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
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

const getErrorMessage = (err, fallback) => {
  const firstError = Object.values(err.data?.errors || {}).flat().find(Boolean);
  return firstError || err.data?.message || err.message || fallback;
};

export default function ForgotPassword() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const sendCode = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: apiHeaders(null, true),
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await readJsonResponse(res);

      setMessage(data.message || 'تم إرسال كود الاستعادة إلى بريدك الإلكتروني.');
      setStep('code');
      setResendTimer(60);
      setCodeDigits(['', '', '', '', '', '']);
    } catch (err) {
      setError(getErrorMessage(err, 'حدث خطأ أثناء إرسال الكود. حاول مرة أخرى.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newDigits = [...codeDigits];
    newDigits[index] = value.slice(-1);
    setCodeDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newDigits = [...codeDigits];
        newDigits[index - 1] = '';
        setCodeDigits(newDigits);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    if (/^\d{6}$/.test(pastedData)) {
      setCodeDigits(pastedData.split(''));
      document.getElementById('digit-5')?.focus();
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError('');
    
    const fullCode = codeDigits.join('');

    if (fullCode.length < 6) {
      setError('يرجى إدخال الكود المكون من 6 أرقام بشكل كامل.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/verify-reset-code`, {
        method: 'POST',
        headers: apiHeaders(null, true),
        body: JSON.stringify({ email: email.trim(), token: fullCode }),
      });
      const data = await readJsonResponse(res);

      setMessage(data.message || 'تم التحقق من الكود. اختر كلمة مرور جديدة.');
      setStep('password');
    } catch (err) {
      setError(getErrorMessage(err, 'الكود غير صحيح أو انتهت صلاحيته.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');

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
      const fullCode = codeDigits.join('');
      await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: apiHeaders(null, true),
        body: JSON.stringify({
          email: email.trim(),
          token: fullCode,
          password,
          password_confirmation: passwordConfirmation,
        }),
      }).then(readJsonResponse);

      setStep('success');
      setTimeout(() => navigate('/signin', { replace: true }), 2500);
    } catch (err) {
      setError(getErrorMessage(err, 'تعذر تحديث كلمة المرور. حاول مرة أخرى.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-identity">
        <div className="auth-identity-inner">
          <div className="auth-logo-img-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '36px', flexDirection: 'row-reverse' }}>
            <img src={settings.logo_path ? `http://127.0.0.1:8000/storage/${settings.logo_path}` : borsaLogo} alt={settings.academy_name || 'بورصة أكاديمي'} className="auth-logo-img brand-logo-animated" style={{ borderRadius: '8px' }} />
            <span className="brand-text-glowing" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>
              {settings.academy_name || 'بورصة أكاديمي'}
            </span>
          </div>
          <div className="auth-logo-underline" />
          <p className="auth-tagline">
            استعد وصولك إلى الحساب بخطوات آمنة: بريدك الإلكتروني، كود تحقق، ثم كلمة مرور جديدة.
          </p>

          <ul className="auth-features">
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">إرسال كود تحقق إلى بريد Gmail أو البريد المسجل</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">إدخال الكود داخل المنصة دون مغادرة الصفحة</span>
            </li>
            <li className="auth-feature-item">
              <span className="auth-feature-bullet"><CheckIcon /></span>
              <span className="auth-feature-text">تعيين كلمة مرور جديدة وإلغاء الجلسات القديمة</span>
            </li>
          </ul>

          <div className="auth-identity-divider" />
          <span className="auth-identity-brand-sub">{settings.academy_name || 'Borsa Academy'} · Account Recovery</span>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-box">
          {step === 'success' ? (
            <div className="auth-success">
              <div className="auth-success-icon">
                <SuccessIcon />
              </div>
              <h4>تم تحديث كلمة المرور بنجاح</h4>
              <p>سيتم تحويلك إلى صفحة تسجيل الدخول خلال لحظات.</p>
            </div>
          ) : (
            <>
              <div className="auth-form-header">
                <img
                  src={settings.logo_path ? `http://127.0.0.1:8000/storage/${settings.logo_path}` : borsaLogo}
                  alt={settings.academy_name || 'Borsa Academy'}
                  className="mx-auto mb-4"
                  style={{ maxHeight: '55px', borderRadius: '8px', filter: 'drop-shadow(0 0 12px rgba(0, 230, 118, 0.25))' }}
                />
                <div className="auth-stepper" aria-label="خطوات استعادة كلمة المرور">
                  <span className={step === 'email' ? 'active' : ''}>البريد</span>
                  <span className={step === 'code' ? 'active' : ''}>الكود</span>
                  <span className={step === 'password' ? 'active' : ''}>كلمة المرور</span>
                </div>
                <h1 className="auth-form-title">
                  {step === 'email' && 'استعادة كلمة المرور'}
                  {step === 'code' && 'أدخل كود التحقق'}
                  {step === 'password' && 'كلمة مرور جديدة'}
                </h1>
                <p className="auth-form-subtitle">
                  {step === 'email' && 'أدخل البريد الإلكتروني المرتبط بحسابك وسنرسل لك كود استعادة آمن.'}
                  {step === 'code' && `أرسلنا كود الاستعادة إلى ${email}. أدخله هنا للمتابعة.`}
                  {step === 'password' && 'تم التحقق من الكود. اختر كلمة مرور قوية لحسابك.'}
                </p>
              </div>

              {message && <div className="auth-info-banner">{message}</div>}
              {error && <div className="auth-error-banner">{error}</div>}

              {step === 'email' && (
                <form onSubmit={sendCode} noValidate>
                  <div className="auth-field mb-6">
                    <label className="auth-label" htmlFor="forgot-email">البريد الإلكتروني</label>
                    <input
                      id="forgot-email"
                      type="email"
                      className="auth-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <button type="submit" className="auth-cta-btn" disabled={loading}>
                    {loading && <span className="auth-spinner" />}
                    {loading ? 'جارٍ إرسال الكود...' : 'إرسال كود الاستعادة'}
                  </button>
                </form>
              )}

              {step === 'code' && (
                <form onSubmit={verifyCode} noValidate>
                  <div className="auth-field mb-6">
                    <label className="auth-label text-center block mb-4">كود التحقق (6 أرقام)</label>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', direction: 'ltr' }}>
                      {codeDigits.map((digit, index) => (
                        <input
                          key={index}
                          id={`digit-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          className="auth-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                          style={{
                            width: '45px',
                            height: '50px',
                            textAlign: 'center',
                            fontSize: '24px',
                            padding: '0',
                            borderRadius: '8px',
                          }}
                          required
                        />
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="auth-cta-btn" disabled={loading}>
                    {loading && <span className="auth-spinner" />}
                    {loading ? 'جارٍ التحقق...' : 'التحقق من الكود'}
                  </button>

                  <div className="mt-4 text-center">
                    {resendTimer > 0 ? (
                      <p className="text-sm text-slate-400">
                        يمكنك إعادة إرسال الكود بعد <span className="text-[#00E676] font-bold">{resendTimer}</span> ثانية
                      </p>
                    ) : (
                      <button 
                        type="button" 
                        className="text-sm text-[#00E676] hover:text-white transition-colors bg-transparent border-none cursor-pointer" 
                        onClick={sendCode} 
                        disabled={loading}
                      >
                        إعادة إرسال الكود
                      </button>
                    )}
                  </div>
                </form>
              )}

              {step === 'password' && (
                <form onSubmit={resetPassword} noValidate>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="new-password">كلمة المرور الجديدة</label>
                    <div className="auth-password-control">
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        className="auth-input auth-password-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(current => !current)}>
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-field mb-6 mt-4">
                    <label className="auth-label" htmlFor="new-password-confirmation">تأكيد كلمة المرور</label>
                    <div className="auth-password-control">
                      <input
                        id="new-password-confirmation"
                        type={showPasswordConfirmation ? 'text' : 'password'}
                        className="auth-input auth-password-input bg-[#0B0F19] border-white/5 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                        value={passwordConfirmation}
                        onChange={e => setPasswordConfirmation(e.target.value)}
                        required
                        minLength={8}
                      />
                      <button type="button" className="auth-password-toggle" onClick={() => setShowPasswordConfirmation(current => !current)}>
                        {showPasswordConfirmation ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="auth-cta-btn" disabled={loading}>
                    {loading && <span className="auth-spinner" />}
                    {loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور الجديدة'}
                  </button>
                </form>
              )}

              <p className="auth-switch mt-4 text-center">
                تذكرت كلمة المرور؟ <Link to="/signin">العودة لتسجيل الدخول</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
