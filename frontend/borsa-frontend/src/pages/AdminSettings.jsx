import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../context/SettingsContext';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import { FiUploadCloud, FiImage } from 'react-icons/fi';
import { FieldError } from '../components/FormValidation';
import { hasValidationErrors, invalidClass, invalidProps, normalizeLaravelErrors, validateFields, validators } from '../utils/validation';

const LOGO_MAX_BYTES = 5 * 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

export default function AdminSettings() {
  const { token } = useAuth();
  const { settings, reloadSettings } = useSettings();
  
  const [formData, setFormData] = useState({
    academy_name: '',
    admin_email: '',
    general_description: '',
    logo_path: '',
  });
  
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const fileInputRef = useRef(null);

  const schema = {
    academy_name: [
      validators.required('اسم الأكاديمية مطلوب.'),
      validators.maxLength(255, 'يجب ألا يتجاوز اسم الأكاديمية 255 حرفاً.'),
    ],
    admin_email: [validators.email('صيغة بريد الدعم غير صحيحة.')],
    logo: [
      validators.fileType(LOGO_TYPES, 'صيغة الشعار غير مدعومة. استخدم PNG أو JPG أو SVG.'),
      validators.fileSize(LOGO_MAX_BYTES, 'حجم الشعار يجب ألا يتجاوز 5MB.'),
    ],
  };

  const validateSettings = (nextForm = formData, nextFile = selectedFile) => validateFields(
    { ...nextForm, logo: nextFile },
    schema,
  );

  // Initialize form with global settings once they load
  useEffect(() => {
    if (settings) {
      setFormData({
        academy_name: settings.academy_name || '',
        admin_email: settings.admin_email || '',
        general_description: settings.general_description || '',
        logo_path: settings.logo_path || '',
      });
      if (settings.logo_path) {
        setFilePreview(`${API_BASE_URL.replace('/api', '')}/storage/${settings.logo_path}`);
      }
    }
  }, [settings]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [id]: value };
      if (touched[id]) setErrors(validateSettings(next, selectedFile));
      return next;
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'يرجى اختيار صورة صالحة (PNG, JPG, SVG).' });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
    setTouched((current) => ({ ...current, logo: true }));
    setErrors(validateSettings(formData, file));
  };

  const uploadLogo = async () => {
    if (!selectedFile) return formData.logo_path;

    setIsUploading(true);
    const data = new FormData();
    data.append('file', selectedFile);
    data.append('folder', 'settings');

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data,
      });

      const result = await readJsonResponse(response);
      setIsUploading(false);
      return result.path;
    } catch (error) {
      const serverErrors = normalizeLaravelErrors(error);
      if (Object.keys(serverErrors).length) {
        setErrors(serverErrors);
        setTouched({ academy_name: true, admin_email: true, logo: true });
        return;
      }
      setIsUploading(false);
      console.error('Upload Error:', error);
      throw new Error('فشل رفع شعار الأكاديمية.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setTouched({ academy_name: true, admin_email: true, logo: true });
    const nextErrors = validateSettings();
    setErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) return;

    setIsSaving(true);

    try {
      // 1. Upload new logo if selected
      let finalLogoPath = formData.logo_path;
      if (selectedFile) {
        finalLogoPath = await uploadLogo();
      }

      // 2. Submit Settings Update
      const payload = {
        ...formData,
        logo_path: finalLogoPath,
      };

      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: apiHeaders(token),
        body: JSON.stringify(payload),
      });

      await readJsonResponse(response);
      
      setMessage({ type: 'success', text: 'تم حفظ إعدادات الأكاديمية بنجاح وتحديثها في الموقع.' });
      
      // 3. Reload global settings context
      await reloadSettings();
      setSelectedFile(null);
      setErrors({});
      setTouched({});
      
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء حفظ الإعدادات.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-settings-container" style={{ direction: 'rtl' }}>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>الإعدادات</h1>
          <p className="text-muted m-0" style={{ fontSize: '14px' }}>إعدادات المنصة العامة والهوية البصرية.</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === 'error' ? 'alert-danger bg-danger bg-opacity-10 text-danger border-danger border-opacity-25' : 'alert-success bg-success bg-opacity-10 text-success border-success border-opacity-25'} d-flex align-items-center gap-2`} role="alert">
          <span className="material-symbols-outlined fs-5">{message.type === 'error' ? 'error' : 'check_circle'}</span>
          <span style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          
          {/* Identity & Branding */}
          <div className="col-12 col-xl-8">
            <section className="glass-card p-4 p-md-5 rounded-4 h-100 border-white-5">
              <h2 className="h5 text-white fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'var(--font-sans)' }}>
                <span className="material-symbols-outlined text-primary-glow">branding_watermark</span>
                الهوية البصرية والمعلومات
              </h2>
              
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold" htmlFor="academy_name" style={{ fontSize: '13px' }}>اسم الأكاديمية</label>
                  <input
                    id="academy_name"
                    type="text"
                    className={`form-control custom-input py-3 border-0 rounded-3 text-white${invalidClass(touched.academy_name && errors.academy_name)}`}
                    placeholder="مثال: بورصة أكاديمي"
                    value={formData.academy_name}
                    onChange={handleInputChange}
                    onBlur={() => {
                      setTouched((current) => ({ ...current, academy_name: true }));
                      setErrors(validateSettings());
                    }}
                    required
                    {...invalidProps(touched.academy_name && errors.academy_name, 'settings-academy-name-error')}
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  />
                  <FieldError id="settings-academy-name-error" message={touched.academy_name && errors.academy_name} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold" htmlFor="admin_email" style={{ fontSize: '13px' }}>البريد الإلكتروني للدعم/الإدارة</label>
                  <input
                    id="admin_email"
                    type="email"
                    className={`form-control custom-input py-3 border-0 rounded-3 text-white${invalidClass(touched.admin_email && errors.admin_email)}`}
                    placeholder="support@borsa.io"
                    value={formData.admin_email}
                    onChange={handleInputChange}
                    onBlur={() => {
                      setTouched((current) => ({ ...current, admin_email: true }));
                      setErrors(validateSettings());
                    }}
                    dir="ltr"
                    {...invalidProps(touched.admin_email && errors.admin_email, 'settings-admin-email-error')}
                    style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)' }}
                  />
                  <FieldError id="settings-admin-email-error" message={touched.admin_email && errors.admin_email} />
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label text-muted fw-semibold" htmlFor="general_description" style={{ fontSize: '13px' }}>الوصف العام (يظهر في التذييل)</label>
                <textarea
                  id="general_description"
                  className="form-control custom-input p-3 border-0 rounded-3 text-white"
                  placeholder="اكتب نبذة عن المنصة..."
                  value={formData.general_description}
                  onChange={handleInputChange}
                  rows="3"
                  style={{ background: 'rgba(255,255,255,0.04)', resize: 'vertical' }}
                />
              </div>
            </section>
          </div>

          {/* Logo Upload */}
          <div className="col-12 col-xl-4">
            <section className="glass-card p-4 p-md-5 rounded-4 h-100 border-white-5 d-flex flex-column">
              <h2 className="h5 text-white fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'var(--font-sans)' }}>
                <span className="material-symbols-outlined text-primary-glow">image</span>
                شعار المنصة (Logo)
              </h2>

              <div 
                className="upload-area flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4 rounded-4 position-relative overflow-hidden"
                style={{ 
                  border: '2px dashed rgba(255,255,255,0.1)', 
                  background: 'rgba(255,255,255,0.02)',
                  minHeight: '220px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {filePreview ? (
                  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                    <img 
                      src={filePreview} 
                      alt="Logo Preview" 
                      style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} 
                    />
                    <div className="mt-3 text-muted" style={{ fontSize: '12px' }}>
                      <FiUploadCloud className="me-1" /> انقر لتغيير الصورة
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <FiImage size={42} color="rgba(255,255,255,0.2)" className="mb-3" />
                    <p className="text-muted fw-semibold mb-1" style={{ fontSize: '14px' }}>انقر لرفع الشعار</p>
                    <p className="text-muted mb-0" style={{ fontSize: '11px' }}>PNG, JPG, SVG (Max: 5MB)</p>
                  </div>
                )}
                
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect}
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml" 
                  className="d-none"
                  {...invalidProps(touched.logo && errors.logo, 'settings-logo-error')}
                />
              </div>
              <FieldError id="settings-logo-error" message={touched.logo && errors.logo} />
            </section>
          </div>

        </div>

        {/* Action Row */}
        <div className="mt-4 d-flex justify-content-end border-top pt-4" style={{ borderColor: 'rgba(255,255,255,0.05) !important' }}>
          <button 
            type="submit" 
            className="btn btn-primary-cta px-5 py-3 fw-bold rounded-3 d-flex align-items-center gap-2 shadow-lg"
            disabled={isSaving || isUploading}
            style={{ minWidth: '200px', justifyContent: 'center' }}
          >
            {(isSaving || isUploading) ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined fs-5">save</span>
                حفظ التغييرات
              </>
            )}
          </button>
        </div>
      </form>

    </div>
  );
}
