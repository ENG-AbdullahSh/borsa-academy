import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

export default function ProfileSettings() {
  const { user, token } = useAuth();

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

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
    if (user) {
      setName(user.name || '');
      setProfileImagePreview(user.avatar ? `${API_BASE_URL.replace('/api', '')}/storage/${user.avatar}` : null);
    }
  }, [user]);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      let avatarPath = user?.avatar;

      if (profileImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', profileImageFile);
        uploadFormData.append('directory', 'avatars');

        const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: uploadFormData,
        });
        const uploadData = await readJsonResponse(uploadRes);
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

      const res = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'POST',
        headers: apiHeaders(token),
        body: payload,
      });

      const data = await readJsonResponse(res);
      
      if (data.user) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        Object.assign(currentUser, data.user);
        localStorage.setItem('user', JSON.stringify(currentUser));
      }

      showToast('تم تحديث البيانات بنجاح', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      if (err.status === 422 && err.data?.errors) {
        const errorMessages = Object.values(err.data.errors).flat().join('\n');
        showToast(errorMessages, 'error');
      } else {
        showToast(err.message || 'فشل تحديث البيانات', 'error');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingPassword(true);

    try {
      const res = await fetch(`${API_BASE_URL}/profile/update-password`, {
        method: 'PUT',
        headers: apiHeaders(token, true),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: newPasswordConfirmation,
        }),
      });

      await readJsonResponse(res);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
      showToast('تم تغيير كلمة المرور بنجاح', 'success');
    } catch (err) {
      if (err.status === 422 && err.data?.errors) {
        const errorMessages = Object.values(err.data.errors).flat().join('\n');
        showToast(errorMessages, 'error');
      } else {
        showToast(err.message || 'فشل تغيير كلمة المرور', 'error');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const ToastComponent = () => {
    if (!toast.show) return null;

    const isSuccess = toast.type === 'success';
    const color = isSuccess ? '#10b981' : '#f43f5e';
    const glow = isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)';

    return createPortal(
      <div
        style={{
          position: 'fixed',
          top: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(20, 20, 20, 0.85)',
          border: `1px solid ${color}`,
          boxShadow: `0 8px 32px ${glow}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 99999,
          animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          maxWidth: '90vw',
          width: 'max-content',
        }}
        className="p-3 rounded-4 text-white d-flex align-items-center gap-3"
      >
        <span className="material-symbols-outlined" style={{ color }}>
          {isSuccess ? 'check_circle' : 'error'}
        </span>
        <span className="fw-medium" style={{ fontSize: '15px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
          {toast.message}
        </span>
        <style>{`
          @keyframes slideDown {
            from { transform: translate(-50%, -20px); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
          }
        `}</style>
      </div>,
      document.body
    );
  };

  return (
    <div className="w-100 position-relative" style={{ maxWidth: '800px', margin: '0 auto', direction: 'rtl' }}>
      <ToastComponent />

      <div className="mb-4">
        <h2 className="h4 text-white fw-bold mb-1">الملف الشخصي</h2>
        <p className="text-muted" style={{ fontSize: '14px' }}>تحديث معلوماتك الشخصية وكلمة المرور.</p>
      </div>

      <div className="glass-card rounded-4 p-4 mb-4">
        <h3 className="h6 text-white fw-bold border-bottom pb-3 mb-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          المعلومات الأساسية
        </h3>
        <form onSubmit={handleProfileSubmit}>
          <div className="mb-4 d-flex align-items-center gap-4">
            <label htmlFor="profile-upload" className="position-relative m-0" style={{ cursor: 'pointer' }}>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleFileChange}
              />
              <div
                className="rounded-circle overflow-hidden border"
                style={{
                  width: '100px',
                  height: '100px',
                  borderColor: 'rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Profile" className="w-100 h-100 object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-muted" style={{ fontSize: '40px' }}>account_circle</span>
                )}
              </div>
              <div className="position-absolute bottom-0 start-0 bg-dark rounded-circle p-1 d-flex" style={{ transform: 'translate(-10%, 10%)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#75ff9e' }}>edit</span>
              </div>
            </label>
            <div>
              <h4 className="h6 text-white mb-1">الصورة الشخصية</h4>
              <p className="text-muted m-0" style={{ fontSize: '12px' }}>اضغط لاختيار صورة جديدة.</p>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted" style={{ fontSize: '13px' }}>الاسم</label>
            <input
              type="text"
              className="form-control custom-input bg-transparent text-white border-secondary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label text-muted" style={{ fontSize: '13px' }}>البريد الإلكتروني</label>
            <input
              type="email"
              className="form-control custom-input bg-transparent text-muted border-secondary"
              value={user?.email || ''}
              disabled
            />
            <div className="form-text text-muted" style={{ fontSize: '11px' }}>لا يمكن تغيير البريد الإلكتروني.</div>
          </div>

          <div className="text-end">
            <button type="submit" disabled={isUpdatingProfile} className="btn btn-primary-cta px-4 py-2 fw-bold">
              {isUpdatingProfile ? <span className="spinner-border spinner-border-sm" /> : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card rounded-4 p-4">
        <h3 className="h6 text-white fw-bold border-bottom pb-3 mb-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          تغيير كلمة المرور
        </h3>
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-4">
            <label className="block text-xs text-zinc-400 mb-1 text-right">كلمة المرور الحالية</label>
            <div className="relative w-full" dir="rtl">
                <input 
                    type={showCurrent ? "text" : "password"} 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required
                    dir="ltr"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 pl-10 pr-3 text-sm text-right focus:outline-none focus:border-emerald-500 text-white" 
                />
                <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-400 focus:outline-none"
                >
                    {showCurrent ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    )}
                </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-zinc-400 mb-1 text-right">كلمة المرور الجديدة</label>
            <div className="relative w-full" dir="rtl">
                <input 
                    type={showNew ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required
                    minLength={8}
                    dir="ltr"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 pl-10 pr-3 text-sm text-right focus:outline-none focus:border-emerald-500 text-white" 
                />
                <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-400 focus:outline-none"
                >
                    {showNew ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    )}
                </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-zinc-400 mb-1 text-right">تأكيد كلمة المرور الجديدة</label>
            <div className="relative w-full" dir="rtl">
                <input 
                    type={showConfirm ? "text" : "password"} 
                    value={newPasswordConfirmation} 
                    onChange={(e) => setNewPasswordConfirmation(e.target.value)} 
                    required
                    minLength={8}
                    dir="ltr"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 pl-10 pr-3 text-sm text-right focus:outline-none focus:border-emerald-500 text-white" 
                />
                <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-400 focus:outline-none"
                >
                    {showConfirm ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    )}
                </button>
            </div>
          </div>

          <div className="text-end">
            <button type="submit" disabled={isUpdatingPassword} className="btn btn-primary-cta px-4 py-2 fw-bold">
              {isUpdatingPassword ? <span className="spinner-border spinner-border-sm" /> : 'تحديث كلمة المرور'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
