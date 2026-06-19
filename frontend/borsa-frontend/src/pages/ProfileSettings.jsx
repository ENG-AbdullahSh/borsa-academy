import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCamera, FiEye, FiEyeOff, FiLock, FiUser } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import { FieldError } from '../components/FormValidation';
import { hasValidationErrors, invalidClass, invalidProps, normalizeLaravelErrors, validateFields, validators } from '../utils/validation';

const PROFILE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  minLength,
  error,
  onBlur,
}) {
  const visibilityLabel = visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور';

  return (
    <div className="profile-field">
      <label className="profile-label" htmlFor={id}>{label}</label>
      <div className="profile-password-control">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={`profile-input profile-password-input${invalidClass(error)}`}
          placeholder="••••••••"
          required
          minLength={minLength}
          autoComplete={autoComplete}
          dir="ltr"
          {...invalidProps(error, `${id}-error`)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="profile-password-toggle"
          aria-label={visibilityLabel}
          aria-pressed={visible}
          aria-controls={id}
          title={visibilityLabel}
        >
          {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export default function ProfileSettings() {
  const { user, token, fetchCurrentUser } = useAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [name, setName] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileTouched, setProfileTouched] = useState({});
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState({});
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!user) return undefined;

    let active = true;

    Promise.resolve().then(() => {
      if (!active) return;

      setName(user.name || '');
      setProfileImagePreview(
        user.avatar ? `${API_BASE_URL.replace('/api', '')}/storage/${user.avatar}` : null,
      );
    });

    return () => {
      active = false;
    };
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    window.setTimeout(() => {
      setToast((current) => ({ ...current, show: false }));
    }, 3000);
  };

  const profileSchema = {
    name: [
      validators.required('الاسم مطلوب.'),
      validators.minLength(2, 'يجب ألا يقل الاسم عن حرفين.'),
      validators.maxLength(100, 'يجب ألا يتجاوز الاسم 100 حرف.'),
    ],
    profile_image: [
      validators.fileType(PROFILE_IMAGE_TYPES, 'صيغة الصورة غير مدعومة. استخدم JPEG أو PNG أو JPG أو GIF أو WebP.'),
      validators.fileSize(PROFILE_IMAGE_MAX_BYTES, 'حجم الصورة يجب ألا يتجاوز 4MB.'),
    ],
  };

  const passwordSchema = {
    current_password: [validators.required('كلمة المرور الحالية مطلوبة.')],
    new_password: [
      validators.required('كلمة المرور الجديدة مطلوبة.'),
      validators.minLength(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.'),
    ],
    new_password_confirmation: [
      validators.required('تأكيد كلمة المرور مطلوب.'),
      validators.sameAs('new_password', 'كلمتا المرور غير متطابقتين.'),
    ],
  };

  const profileValues = () => ({ name, profile_image: profileImageFile });
  const passwordValues = () => ({
    current_password: currentPassword,
    new_password: newPassword,
    new_password_confirmation: newPasswordConfirmation,
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
    setProfileTouched((current) => ({ ...current, profile_image: true }));
    setProfileErrors(validateFields({ name, profile_image: file }, profileSchema));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateFields(profileValues(), profileSchema);
    setProfileTouched({ name: true, profile_image: true });
    setProfileErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) return;

    setIsUpdatingProfile(true);

    try {
      const payload = new FormData();
      payload.append('_method', 'PUT');
      payload.append('name', name);

      if (profileImageFile) {
        payload.append('profile_image', profileImageFile);
      }

      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'POST', // Use POST with _method=PUT to support FormData
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          // Do NOT set Content-Type here; fetch will automatically set it to multipart/form-data with the correct boundary
        },
        body: payload,
      });
      const data = await readJsonResponse(response);

      if (data.user) {
        await fetchCurrentUser(token); // Update global auth context
      }

      showToast('تم تحديث البيانات بنجاح');
      setProfileErrors({});
      setProfileTouched({});
    } catch (error) {
      if (error.status === 422 && error.data?.errors) {
        const serverErrors = normalizeLaravelErrors(error);
        setProfileErrors(serverErrors);
        setProfileTouched({ name: true, profile_image: true });
      } else {
        showToast(error.message || 'فشل تحديث البيانات', 'error');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateFields(passwordValues(), passwordSchema);
    setPasswordTouched({
      current_password: true,
      new_password: true,
      new_password_confirmation: true,
    });
    setPasswordErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) return;

    setIsUpdatingPassword(true);

    try {
      const response = await fetch(`${API_BASE_URL}/profile/update-password`, {
        method: 'PUT',
        headers: apiHeaders(token, true),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: newPasswordConfirmation,
        }),
      });

      await readJsonResponse(response);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setPasswordErrors({});
      setPasswordTouched({});
      showToast('تم تغيير كلمة المرور بنجاح');
    } catch (error) {
      if (error.status === 422 && error.data?.errors) {
        const serverErrors = normalizeLaravelErrors(error);
        setPasswordErrors(serverErrors);
        setPasswordTouched({
          current_password: true,
          new_password: true,
          new_password_confirmation: true,
        });
      } else {
        showToast(error.message || 'فشل تغيير كلمة المرور', 'error');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const toastContent = toast.show ? createPortal(
    <div
      className={`profile-toast profile-toast-${toast.type}`}
      role="status"
      aria-live="polite"
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {toast.type === 'success' ? 'check_circle' : 'error'}
      </span>
      <span>{toast.message}</span>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="profile-settings-shell" dir="rtl">
      {toastContent}

      <header className="profile-settings-header">
        <span className="profile-settings-eyebrow">ACCOUNT SETTINGS</span>
        <h1>الملف الشخصي</h1>
        <p>حدّث معلومات حسابك وصورتك الشخصية وإعدادات كلمة المرور.</p>
      </header>

      <div className="profile-settings-grid">
        <section className="profile-settings-card">
          <div className="profile-card-heading">
            <span className="profile-card-icon"><FiUser aria-hidden="true" /></span>
            <div>
              <h2>المعلومات الأساسية</h2>
              <p>البيانات التي تظهر في حسابك وشريط التنقل.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="profile-avatar-section">
              <label htmlFor="profile-upload" className="profile-avatar-control">
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  className="visually-hidden"
                  onChange={handleFileChange}
                  {...invalidProps(profileTouched.profile_image && profileErrors.profile_image, 'profile-image-error')}
                />
                <span className="profile-avatar-preview">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="الصورة الشخصية" />
                  ) : (
                    <FiUser aria-hidden="true" />
                  )}
                </span>
                <span className="profile-avatar-edit" aria-hidden="true">
                  <FiCamera />
                </span>
              </label>
              <div className="profile-avatar-copy">
                <strong>الصورة الشخصية</strong>
                <span>اضغط على الصورة لاختيار ملف جديد.</span>
              </div>
            </div>

            <FieldError id="profile-image-error" message={profileTouched.profile_image && profileErrors.profile_image} />

            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-name">الاسم</label>
              <input
                id="profile-name"
                type="text"
                className={`profile-input${invalidClass(profileTouched.name && profileErrors.name)}`}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (profileTouched.name) {
                    setProfileErrors(validateFields({ name: event.target.value, profile_image: profileImageFile }, profileSchema));
                  }
                }}
                onBlur={() => {
                  setProfileTouched((current) => ({ ...current, name: true }));
                  setProfileErrors(validateFields(profileValues(), profileSchema));
                }}
                placeholder="الاسم الكامل"
                autoComplete="name"
                required
                {...invalidProps(profileTouched.name && profileErrors.name, 'profile-name-error')}
              />
              <FieldError id="profile-name-error" message={profileTouched.name && profileErrors.name} />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-email">البريد الإلكتروني</label>
              <input
                id="profile-email"
                type="email"
                className="profile-input profile-input-disabled"
                value={user?.email || ''}
                disabled
                dir="ltr"
              />
              <span className="profile-field-help">لا يمكن تغيير البريد الإلكتروني من هذه الصفحة.</span>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="btn btn-primary-cta profile-submit-button"
            >
              {isUpdatingProfile && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
              <span>{isUpdatingProfile ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
            </button>
          </form>
        </section>

        <section className="profile-settings-card">
          <div className="profile-card-heading">
            <span className="profile-card-icon"><FiLock aria-hidden="true" /></span>
            <div>
              <h2>تغيير كلمة المرور</h2>
              <p>استخدم كلمة مرور قوية لا تقل عن ثمانية أحرف.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <PasswordInput
              id="profile-current-password"
              label="كلمة المرور الحالية"
              value={currentPassword}
              onChange={setCurrentPassword}
              visible={showCurrent}
              onToggle={() => setShowCurrent((current) => !current)}
              autoComplete="current-password"
              error={passwordTouched.current_password && passwordErrors.current_password}
              onBlur={() => {
                setPasswordTouched((current) => ({ ...current, current_password: true }));
                setPasswordErrors(validateFields(passwordValues(), passwordSchema));
              }}
            />
            <PasswordInput
              id="profile-new-password"
              label="كلمة المرور الجديدة"
              value={newPassword}
              onChange={setNewPassword}
              visible={showNew}
              onToggle={() => setShowNew((current) => !current)}
              autoComplete="new-password"
              minLength={8}
              error={passwordTouched.new_password && passwordErrors.new_password}
              onBlur={() => {
                setPasswordTouched((current) => ({ ...current, new_password: true }));
                setPasswordErrors(validateFields(passwordValues(), passwordSchema));
              }}
            />
            <PasswordInput
              id="profile-confirm-password"
              label="تأكيد كلمة المرور الجديدة"
              value={newPasswordConfirmation}
              onChange={setNewPasswordConfirmation}
              visible={showConfirm}
              onToggle={() => setShowConfirm((current) => !current)}
              autoComplete="new-password"
              minLength={8}
              error={passwordTouched.new_password_confirmation && passwordErrors.new_password_confirmation}
              onBlur={() => {
                setPasswordTouched((current) => ({ ...current, new_password_confirmation: true }));
                setPasswordErrors(validateFields(passwordValues(), passwordSchema));
              }}
            />

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="btn btn-primary-cta profile-submit-button"
            >
              {isUpdatingPassword && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
              <span>{isUpdatingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
