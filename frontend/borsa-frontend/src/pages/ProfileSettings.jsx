import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCamera, FiEye, FiEyeOff, FiLock, FiUser } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  minLength,
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
          className="profile-input profile-password-input"
          placeholder="••••••••"
          required
          minLength={minLength}
          autoComplete={autoComplete}
          dir="ltr"
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
    </div>
  );
}

export default function ProfileSettings() {
  const { user, token, fetchCurrentUser } = useAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [name, setName] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsUpdatingProfile(true);

    try {
      let avatarPath = user?.avatar;

      if (profileImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', profileImageFile);
        uploadFormData.append('directory', 'avatars');

        const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: uploadFormData,
        });
        const uploadData = await readJsonResponse(uploadResponse);

        if (uploadData.path) {
          avatarPath = uploadData.path;
        }
      }

      const payload = new FormData();
      payload.append('_method', 'PUT');
      payload.append('name', name);

      if (avatarPath) {
        payload.append('profile_image', avatarPath);
      }

      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'POST',
        headers: apiHeaders(token),
        body: payload,
      });
      const data = await readJsonResponse(response);

      if (data.user) await fetchCurrentUser(token);

      showToast('تم تحديث البيانات بنجاح');
    } catch (error) {
      if (error.status === 422 && error.data?.errors) {
        showToast(Object.values(error.data.errors).flat().join('\n'), 'error');
      } else {
        showToast(error.message || 'فشل تحديث البيانات', 'error');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
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
      showToast('تم تغيير كلمة المرور بنجاح');
    } catch (error) {
      if (error.status === 422 && error.data?.errors) {
        showToast(Object.values(error.data.errors).flat().join('\n'), 'error');
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

            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-name">الاسم</label>
              <input
                id="profile-name"
                type="text"
                className="profile-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="الاسم الكامل"
                autoComplete="name"
                required
              />
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
