import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import axios from 'axios';

const EMPTY_SECTION_FORM = {
  title: '',
  order: '',
};

const EMPTY_LESSON_FORM = {
  section_id: '',
  title: '',
  description: '',
  video_url: '',
  pdf_url: '',
  duration_minutes: '',
  order: '',
  is_preview: false,
};

function validationMessage(error, fallback) {
  if (error?.data?.errors) {
    return Object.values(error.data.errors).flat().join(' ');
  }

  return error?.message || fallback;
}

function sectionPayload(form, courseId) {
  return {
    course_id: Number(courseId),
    title: form.title.trim(),
    order: form.order === '' ? 0 : Number(form.order),
  };
}

function lessonPayload(form, fallbackSectionId) {
  const duration = String(form.duration_minutes ?? '').trim();
  const payload = {
    section_id: Number(form.section_id || fallbackSectionId),
    title: form.title.trim(),
    description: form.description.trim() || null,
    video_url: form.video_url.trim() || null,
    pdf_url: form.pdf_url.trim() || null,
    order: form.order === '' ? 0 : Number(form.order),
    is_preview: Boolean(form.is_preview),
  };

  if (duration !== '') {
    payload.duration_minutes = Number(duration);
  }

  return payload;
}

function lessonToForm(lesson) {
  return {
    section_id: lesson.section_id || '',
    title: lesson.title || '',
    description: lesson.description || '',
    video_url: lesson.video_url || '',
    pdf_url: lesson.pdf_url || '',
    duration_minutes: lesson.duration_minutes ?? '',
    order: lesson.order ?? '',
    is_preview: Boolean(lesson.is_preview),
  };
}

export default function AdminCurriculum({ courseId: fixedCourseId = '', scope = 'admin' }) {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(String(fixedCourseId || ''));
  const [curriculum, setCurriculum] = useState(null);
  const [sectionForm, setSectionForm] = useState(EMPTY_SECTION_FORM);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON_FORM);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [sectionEditForm, setSectionEditForm] = useState(EMPTY_SECTION_FORM);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonEditForm, setLessonEditForm] = useState(EMPTY_LESSON_FORM);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lessonVideoFile, setLessonVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [lessonPdfFile, setLessonPdfFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(() => Date.now());

  const headers = useMemo(() => apiHeaders(token), [token]);
  const apiScope = `${API_BASE_URL}/${scope}`;
  const sections = curriculum?.sections || [];
  const selectedCourse = courses.find((course) => String(course.id) === String(selectedCourseId));
  const firstSectionId = sections[0]?.id || '';

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.setTimeout(() => {
      setMessage((current) => (current?.text === text ? null : current));
    }, 5000);
  };

  const loadCurriculum = useCallback(async (courseId, signal) => {
    if (!courseId || !token) return;

    setLoadingCurriculum(true);

    try {
      const response = await fetch(`${apiScope}/courses/${courseId}/curriculum`, {
        headers,
        signal,
      });
      const payload = await readJsonResponse(response);
      setCurriculum(payload.data || null);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setCurriculum(null);
        showMessage('error', validationMessage(error, 'تعذر تحميل منهج الدورة.'));
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingCurriculum(false);
      }
    }
  }, [apiScope, headers, token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const controller = new AbortController();

    const loadCourses = async () => {
      setLoadingCourses(true);

      try {
        const response = await fetch(
          fixedCourseId
            ? `${apiScope}/courses/${fixedCourseId}`
            : `${apiScope}/courses?per_page=100`,
          {
          headers,
          signal: controller.signal,
          },
        );
        const payload = await readJsonResponse(response);
        const apiCourses = fixedCourseId
          ? (payload.data ? [payload.data] : [])
          : (Array.isArray(payload.data) ? payload.data : []);

        setCourses(apiCourses);
        setSelectedCourseId(String(fixedCourseId || apiCourses[0]?.id || ''));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCourses([]);
          showMessage('error', validationMessage(error, 'تعذر تحميل الكورسات.'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCourses(false);
        }
      }
    };

    Promise.resolve().then(loadCourses);

    return () => controller.abort();
  }, [apiScope, fixedCourseId, headers, token]);

  useEffect(() => {
    if (!selectedCourseId || !token) {
      return undefined;
    }

    const controller = new AbortController();
    Promise.resolve().then(() => loadCurriculum(selectedCourseId, controller.signal));

    return () => controller.abort();
  }, [loadCurriculum, refreshKey, selectedCourseId, token]);

  const refreshCurriculum = () => setRefreshKey((current) => current + 1);

  const handleVideoFileChange = (event) => {
    const file = event.target.files[0];
    setLessonVideoFile(file || null);

    if (file && file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const durationSeconds = video.duration;
        if (durationSeconds && !isNaN(durationSeconds)) {
          const durationMinutes = Math.round(durationSeconds / 60);
          setLessonForm((prev) => ({
            ...prev,
            duration_minutes: durationMinutes > 0 ? String(durationMinutes) : '1',
          }));
        }
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    }
  };

  const createSection = async (event) => {
    event.preventDefault();
    if (!selectedCourseId) return;

    setSubmitting(true);

    try {
      const response = await fetch(`${apiScope}/sections`, {
        method: 'POST',
        headers: apiHeaders(token, true),
        body: JSON.stringify(sectionPayload(sectionForm, selectedCourseId)),
      });
      await readJsonResponse(response);
      setSectionForm(EMPTY_SECTION_FORM);
      showMessage('success', 'تمت إضافة القسم بنجاح.');
      refreshCurriculum();
    } catch (error) {
      showMessage('error', validationMessage(error, 'تعذر إضافة القسم.'));
    } finally {
      setSubmitting(false);
    }
  };

  const saveSection = async (sectionId) => {
    setSubmitting(true);

    try {
      const response = await fetch(`${apiScope}/sections/${sectionId}`, {
        method: 'PUT',
        headers: apiHeaders(token, true),
        body: JSON.stringify(sectionPayload(sectionEditForm, selectedCourseId)),
      });
      await readJsonResponse(response);
      setEditingSectionId(null);
      showMessage('success', 'تم تحديث القسم.');
      refreshCurriculum();
    } catch (error) {
      showMessage('error', validationMessage(error, 'تعذر تحديث القسم.'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSection = async (sectionId) => {
    setSubmitting(true);

    try {
      const response = await fetch(`${apiScope}/sections/${sectionId}`, {
        method: 'DELETE',
        headers,
      });
      await readJsonResponse(response);
      showMessage('success', 'تم حذف القسم والدروس المرتبطة به.');
      refreshCurriculum();
    } catch (error) {
      showMessage('error', validationMessage(error, 'تعذر حذف القسم.'));
    } finally {
      setSubmitting(false);
    }
  };

  const createLesson = async (event) => {
    event.preventDefault();
    const sectionId = lessonForm.section_id || firstSectionId;

    if (!sectionId) {
      showMessage('error', 'أضف قسماً قبل إضافة الدروس.');
      return;
    }

    if (!lessonVideoFile) {
      showMessage('error', 'يرجى رفع ملف فيديو قبل إضافة الدرس.');
      return;
    }

    setSubmitting(true);

    try {
      setUploadProgress(0);

      const formData = new FormData();
      const payload = lessonPayload(lessonForm, sectionId);
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined) {
          const value = typeof payload[key] === 'boolean' ? (payload[key] ? 1 : 0) : payload[key];
          formData.append(key, value);
        }
      });
      formData.append('video', lessonVideoFile);
      if (lessonPdfFile) {
        formData.append('pdf', lessonPdfFile);
      }

      await axios.post(`${apiScope}/lessons`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || progressEvent.loaded;
          if (total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
            setUploadProgress(percentCompleted);
          }
        }
      });

      setLessonForm({ ...EMPTY_LESSON_FORM, section_id: sectionId });
      setLessonVideoFile(null);
      setLessonPdfFile(null);
      setUploadProgress(null);
      setFileInputKey(Date.now()); // Reset file input element
      showMessage('success', 'تمت إضافة الدرس والملفات بنجاح.');
      refreshCurriculum();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response ? validationMessage(error.response, 'تعذر إضافة الدرس.') : 'تعذر إضافة الدرس.';
      showMessage('error', errorMsg);
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const saveLesson = async (lessonId) => {
    setSubmitting(true);

    try {
      const response = await fetch(`${apiScope}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: apiHeaders(token, true),
        body: JSON.stringify(lessonPayload(lessonEditForm, lessonEditForm.section_id)),
      });
      await readJsonResponse(response);
      setEditingLessonId(null);
      showMessage('success', 'تم تحديث الدرس.');
      refreshCurriculum();
    } catch (error) {
      showMessage('error', validationMessage(error, 'تعذر تحديث الدرس.'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLesson = async (lessonId) => {
    setSubmitting(true);

    try {
      const response = await fetch(`${apiScope}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers,
      });
      await readJsonResponse(response);
      showMessage('success', 'تم حذف الدرس.');
      refreshCurriculum();
    } catch (error) {
      showMessage('error', validationMessage(error, 'تعذر حذف الدرس.'));
    } finally {
      setSubmitting(false);
    }
  };

  const moveLesson = async (section, index, direction) => {
    const lessons = section.lessons || [];
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const currentLesson = lessons[index];
    const targetLesson = lessons[targetIndex];
    const currentOrder = Number(currentLesson.order ?? index);
    const targetOrder = Number(targetLesson.order ?? targetIndex);

    setSubmitting(true);

    try {
      await Promise.all([
        fetch(`${apiScope}/lessons/${currentLesson.id}`, {
          method: 'PUT',
          headers: apiHeaders(token, true),
          body: JSON.stringify({ order: targetOrder === currentOrder ? targetIndex : targetOrder }),
        }).then(readJsonResponse),
        fetch(`${apiScope}/lessons/${targetLesson.id}`, {
          method: 'PUT',
          headers: apiHeaders(token, true),
          body: JSON.stringify({ order: targetOrder === currentOrder ? index : currentOrder }),
        }).then(readJsonResponse),
      ]);

      showMessage('success', 'تم تحديث ترتيب الدروس.');
      refreshCurriculum();
    } catch (error) {
      showMessage('error', validationMessage(error, 'تعذر إعادة ترتيب الدروس.'));
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingSection = (section) => {
    setEditingSectionId(section.id);
    setSectionEditForm({
      title: section.title || '',
      order: section.order ?? '',
    });
  };

  const startEditingLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setLessonEditForm(lessonToForm(lesson));
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ direction: 'rtl' }}>
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3">
        <div>
          <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px', fontFamily: 'var(--font-sans)' }}>إدارة المحتوى التعليمي</h1>
          <p className="text-muted m-0" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
            أنشئ أقسام الدورة ودروسها ورتب المحتوى الذي يظهر للطلاب.
          </p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2">
          {!fixedCourseId && (
            <select
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="form-select custom-input"
              disabled={loadingCourses}
              style={{ minWidth: '280px' }}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          )}
          <button type="button" onClick={refreshCurriculum} className="btn btn-secondary-cta px-4" disabled={!selectedCourseId || loadingCurriculum}>
            تحديث
          </button>
        </div>
      </div>

      {message && (
        <div
          className="rounded-3 px-4 py-3"
          style={{
            color: message.type === 'success' ? '#75ff9e' : '#fecaca',
            background: message.type === 'success' ? 'rgba(0,230,118,0.08)' : 'rgba(255,82,82,0.08)',
            border: `1px solid ${message.type === 'success' ? 'rgba(0,230,118,0.24)' : 'rgba(255,82,82,0.24)'}`,
            fontSize: '14px',
          }}
        >
          {message.text}
        </div>
      )}

      <section className="glass-card p-4 rounded-3">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2 mb-4">
          <div>
            <h2 className="h5 text-white fw-bold m-0">إضافة قسم</h2>
            <p className="text-muted m-0" style={{ fontSize: '12px' }}>
              {selectedCourse ? `الكورس المحدد: ${selectedCourse.title}` : 'اختر كورساً لإدارة منهجه.'}
            </p>
          </div>
        </div>
        <form onSubmit={createSection} className="row g-3 align-items-end">
          <div className="col-12 col-lg-8">
            <label className="form-label text-muted" style={{ fontSize: '12px' }}>عنوان القسم</label>
            <input
              value={sectionForm.title}
              onChange={(event) => setSectionForm({ ...sectionForm, title: event.target.value })}
              className="form-control custom-input"
              required
              maxLength={255}
              placeholder="مثال: الوحدة الأولى - أساسيات التداول"
            />
          </div>
          <div className="col-6 col-lg-2">
            <label className="form-label text-muted" style={{ fontSize: '12px' }}>الترتيب</label>
            <input
              value={sectionForm.order}
              onChange={(event) => setSectionForm({ ...sectionForm, order: event.target.value })}
              type="number"
              min="0"
              className="form-control custom-input"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>
          <div className="col-6 col-lg-2">
            <button type="submit" className="btn btn-primary-cta w-100 fw-bold" disabled={!selectedCourseId || submitting}>
              إضافة
            </button>
          </div>
        </form>
      </section>

      <section className="glass-card p-4 rounded-3">
        <h2 className="h5 text-white fw-bold mb-4">إضافة درس</h2>
        <form onSubmit={createLesson} className="row g-3">
          <div className="col-12 col-lg-4">
            <label className="form-label text-muted" style={{ fontSize: '12px' }}>القسم</label>
            <select
              value={lessonForm.section_id || firstSectionId}
              onChange={(event) => setLessonForm({ ...lessonForm, section_id: event.target.value })}
              className="form-select custom-input"
              required
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>{section.title}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-lg-5">
            <label className="form-label text-muted" style={{ fontSize: '12px' }}>عنوان الدرس</label>
            <input
              value={lessonForm.title}
              onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })}
              className="form-control custom-input"
              required
              maxLength={255}
            />
          </div>
          <div className="col-6 col-lg-3">
            <label className="form-label text-muted" style={{ fontSize: '12px' }}>المدة بالدقائق</label>
            <input
              value={lessonForm.duration_minutes}
              onChange={(event) => setLessonForm({ ...lessonForm, duration_minutes: event.target.value })}
              type="number"
              min="1"
              className="form-control custom-input"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>
          <div className="col-12">
            <label className="form-label text-muted" style={{ fontSize: '12px' }}>الوصف</label>
            <textarea
              value={lessonForm.description}
              onChange={(event) => setLessonForm({ ...lessonForm, description: event.target.value })}
              className="form-control custom-input"
              rows={2}
            />
          </div>
          <div className="col-12 col-lg-5">
            <label className="form-label text-muted" style={{ fontSize: '12px' }}>رابط الفيديو (خارجي)</label>
            <input
              value={lessonForm.video_url}
              onChange={(event) => setLessonForm({ ...lessonForm, video_url: event.target.value })}
              className="form-control custom-input"
              placeholder="https://..."
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>

          {/* ── Video file upload ── */}
          <div className="col-12 col-lg-5">
            <label className="form-label text-muted" style={{ fontSize: '12px' }}>
              رفع ملف فيديو
              <span style={{ color: '#ffb4b4', marginRight: '4px' }}>(إجباري · حتى 500MB)</span>
            </label>
            <label
              htmlFor={`video-file-${fileInputKey}`}
              aria-required="true"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '10px 14px',
                borderRadius: '8px',
                border: lessonVideoFile
                  ? '1px solid rgba(117,255,158,0.4)'
                  : '1px dashed rgba(255,255,255,0.15)',
                background: lessonVideoFile
                  ? 'rgba(117,255,158,0.06)'
                  : 'rgba(255,255,255,0.03)',
                transition: 'border-color 0.2s, background 0.2s',
                minHeight: '42px',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '20px', color: lessonVideoFile ? '#75ff9e' : '#64748b', flexShrink: 0 }}
              >
                {lessonVideoFile ? 'check_circle' : 'video_file'}
              </span>
              <span style={{
                fontSize: '13px',
                color: lessonVideoFile ? '#75ff9e' : '#94a3b8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                direction: 'ltr',
              }}>
                {lessonVideoFile ? lessonVideoFile.name : 'اختر ملف فيديو...'}
              </span>
              {lessonVideoFile && (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '16px', color: '#ef4444', marginRight: 'auto', flexShrink: 0 }}
                  onClick={(e) => { e.preventDefault(); setLessonVideoFile(null); setFileInputKey(Date.now()); }}
                  title="إزالة الملف"
                >
                  cancel
                </span>
              )}
            </label>
            <input
              id={`video-file-${fileInputKey}`}
              key={fileInputKey}
              type="file"
              accept="video/*"
              onChange={handleVideoFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* ── PDF file upload ── */}
          <div className="col-12 col-lg-5">
            <label className="form-label text-muted" style={{ fontSize: '12px' }}>
              رفع ملف PDF
              <span style={{ color: '#64748b', marginRight: '4px' }}>(اختياري)</span>
            </label>
            <label
              htmlFor={`pdf-file-${fileInputKey}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '10px 14px',
                borderRadius: '8px',
                border: lessonPdfFile
                  ? '1px solid rgba(56,189,248,0.4)'
                  : '1px dashed rgba(255,255,255,0.15)',
                background: lessonPdfFile
                  ? 'rgba(56,189,248,0.06)'
                  : 'rgba(255,255,255,0.03)',
                transition: 'border-color 0.2s, background 0.2s',
                minHeight: '42px',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '20px', color: lessonPdfFile ? '#38bdf8' : '#64748b', flexShrink: 0 }}
              >
                {lessonPdfFile ? 'check_circle' : 'picture_as_pdf'}
              </span>
              <span style={{
                fontSize: '13px',
                color: lessonPdfFile ? '#38bdf8' : '#94a3b8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                direction: 'ltr',
              }}>
                {lessonPdfFile ? lessonPdfFile.name : 'اختر ملف PDF...'}
              </span>
              {lessonPdfFile && (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '16px', color: '#ef4444', marginRight: 'auto', flexShrink: 0 }}
                  onClick={(e) => { e.preventDefault(); setLessonPdfFile(null); setFileInputKey(Date.now()); }}
                  title="إزالة الملف"
                >
                  cancel
                </span>
              )}
            </label>
            <input
              id={`pdf-file-${fileInputKey}`}
              key={`pdf-${fileInputKey}`}
              type="file"
              accept=".pdf"
              onChange={(event) => setLessonPdfFile(event.target.files[0] || null)}
              style={{ display: 'none' }}
            />
          </div>
          <div className="col-6 col-lg-1">
            <label className="form-label text-muted" style={{ fontSize: '12px' }}>الترتيب</label>
            <input
              value={lessonForm.order}
              onChange={(event) => setLessonForm({ ...lessonForm, order: event.target.value })}
              type="number"
              min="0"
              className="form-control custom-input"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>
          <div className="col-6 col-lg-1 d-flex align-items-end">
            <label className="d-flex align-items-center gap-2 text-muted mb-2" style={{ fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={lessonForm.is_preview}
                onChange={(event) => setLessonForm({ ...lessonForm, is_preview: event.target.checked })}
                style={{ accentColor: '#75ff9e' }}
              />
              معاينة
            </label>
          </div>
          {uploadProgress !== null && (
            <div className="col-12">
              <div className="progress bg-dark" style={{ height: '22px', borderRadius: '8px', overflow: 'hidden' }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated bg-success fw-bold"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%`, transition: 'width 0.1s ease', fontSize: '12px', lineHeight: '22px' }}
                  aria-valuenow={uploadProgress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  جاري رفع الملفات: {uploadProgress}%
                </div>
              </div>
            </div>
          )}
          <div className="col-12">
            <button type="submit" className="btn btn-primary-cta px-4 py-2 fw-bold" disabled={!firstSectionId || submitting || (uploadProgress !== null && uploadProgress < 100)}>
              إضافة الدرس
            </button>
          </div>
        </form>
      </section>

      <section className="glass-card p-4 rounded-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="h5 text-white fw-bold m-0">منهج الكورس</h2>
            <p className="text-muted m-0" style={{ fontSize: '12px' }}>استخدم الأسهم لتغيير ترتيب الدروس داخل القسم.</p>
          </div>
          {loadingCurriculum && <span className="text-muted">جاري التحميل...</span>}
        </div>

        {sections.length === 0 ? (
          <div className="py-5 text-center text-muted">لا توجد أقسام لهذا الكورس بعد.</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {sections.map((section) => (
              <div key={section.id} className="rounded-3 border p-3" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
                  {editingSectionId === section.id ? (
                    <div className="row g-2 flex-grow-1">
                      <div className="col-12 col-lg-8">
                        <input
                          value={sectionEditForm.title}
                          onChange={(event) => setSectionEditForm({ ...sectionEditForm, title: event.target.value })}
                          className="form-control custom-input"
                        />
                      </div>
                      <div className="col-6 col-lg-2">
                        <input
                          value={sectionEditForm.order}
                          onChange={(event) => setSectionEditForm({ ...sectionEditForm, order: event.target.value })}
                          type="number"
                          className="form-control custom-input"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>
                      <div className="col-6 col-lg-2 d-flex gap-2">
                        <button type="button" className="btn btn-primary-cta btn-sm flex-fill" onClick={() => saveSection(section.id)} disabled={submitting}>حفظ</button>
                        <button type="button" className="btn btn-secondary-cta btn-sm flex-fill" onClick={() => setEditingSectionId(null)} disabled={submitting}>إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="h6 text-white fw-bold mb-1">{section.title}</h3>
                        <span className="font-mono-data text-muted" style={{ fontSize: '12px' }}>ترتيب القسم: {section.order}</span>
                      </div>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-sm btn-edit-course px-3" onClick={() => startEditingSection(section)}>تعديل</button>
                        <button type="button" className="btn btn-sm btn-delete-course px-3" onClick={() => deleteSection(section.id)} disabled={submitting}>حذف</button>
                      </div>
                    </>
                  )}
                </div>

                <div className="table-responsive">
                  <table className="table table-dark table-hover table-borderless m-0 align-middle">
                    <thead>
                      <tr style={{ fontSize: '12px', color: '#bacbb9', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th>الدرس</th>
                        <th className="text-center">المدة</th>
                        <th className="text-center">معاينة</th>
                        <th className="text-center">الترتيب</th>
                        <th className="text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(section.lessons || []).length === 0 ? (
                        <tr><td colSpan="5" className="text-center text-muted py-4">لا توجد دروس داخل هذا القسم.</td></tr>
                      ) : (section.lessons || []).map((lesson, index) => (
                        <tr key={lesson.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td>
                            {editingLessonId === lesson.id ? (
                              <div className="d-flex flex-column gap-2">
                                <input
                                  value={lessonEditForm.title}
                                  onChange={(event) => setLessonEditForm({ ...lessonEditForm, title: event.target.value })}
                                  className="form-control custom-input"
                                />
                                <textarea
                                  value={lessonEditForm.description}
                                  onChange={(event) => setLessonEditForm({ ...lessonEditForm, description: event.target.value })}
                                  className="form-control custom-input"
                                  rows={2}
                                />
                                <div className="row g-2">
                                  <div className="col-12 col-lg-6">
                                    <input
                                      value={lessonEditForm.video_url}
                                      onChange={(event) => setLessonEditForm({ ...lessonEditForm, video_url: event.target.value })}
                                      className="form-control custom-input"
                                      placeholder="رابط الفيديو"
                                      style={{ direction: 'ltr', textAlign: 'left' }}
                                    />
                                  </div>
                                  <div className="col-12 col-lg-6">
                                    <input
                                      value={lessonEditForm.pdf_url}
                                      onChange={(event) => setLessonEditForm({ ...lessonEditForm, pdf_url: event.target.value })}
                                      className="form-control custom-input"
                                      placeholder="رابط PDF"
                                      style={{ direction: 'ltr', textAlign: 'left' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex flex-column">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="text-white fw-bold">{lesson.title}</span>
                                  {lesson.is_published ? (
                                    <span
                                      className="px-2 py-0.5 rounded-pill"
                                      style={{
                                        color: '#75ff9e',
                                        background: 'rgba(117,255,158,0.08)',
                                        border: '1px solid rgba(117,255,158,0.2)',
                                        fontSize: '10px',
                                        fontWeight: '600'
                                      }}
                                    >
                                      منشور
                                    </span>
                                  ) : (
                                    <span
                                      className="px-2 py-0.5 rounded-pill"
                                      style={{
                                        color: '#ffd54f',
                                        background: 'rgba(255,213,79,0.08)',
                                        border: '1px solid rgba(255,213,79,0.2)',
                                        fontSize: '10px',
                                        fontWeight: '600'
                                      }}
                                      title="يحتاج إضافة اختبار وتفعيله ليتم نشره للطلاب"
                                    >
                                      مسودة
                                    </span>
                                  )}
                                </div>
                                <span className="text-muted mb-2" style={{ fontSize: '12px' }}>{lesson.description || 'لا يوجد وصف.'}</span>
                                <div className="d-flex gap-2 mt-1">
                                  {lesson.video_url && (
                                    <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm d-flex align-items-center gap-1 p-1 px-2 text-white" style={{ fontSize: '11px', backgroundColor: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)' }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#00e676' }}>play_circle</span>
                                      معاينة الفيديو
                                    </a>
                                  )}
                                  {lesson.pdf_url && (
                                    <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm d-flex align-items-center gap-1 p-1 px-2 text-white" style={{ fontSize: '11px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#38bdf8' }}>download</span>
                                      تحميل PDF
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="text-center">
                            {editingLessonId === lesson.id ? (
                              <input
                                value={lessonEditForm.duration_minutes}
                                onChange={(event) => setLessonEditForm({ ...lessonEditForm, duration_minutes: event.target.value })}
                                type="number"
                                min="1"
                                className="form-control custom-input"
                                style={{ width: '90px', direction: 'ltr', textAlign: 'left' }}
                              />
                            ) : (
                              <span className="font-mono-data text-muted">{lesson.duration_minutes} د</span>
                            )}
                          </td>
                          <td className="text-center">
                            {editingLessonId === lesson.id ? (
                              <input
                                type="checkbox"
                                checked={lessonEditForm.is_preview}
                                onChange={(event) => setLessonEditForm({ ...lessonEditForm, is_preview: event.target.checked })}
                                style={{ accentColor: '#75ff9e' }}
                              />
                            ) : (
                              <span className="material-symbols-outlined" style={{ color: lesson.is_preview ? '#75ff9e' : '#6b7280' }}>
                                {lesson.is_preview ? 'visibility' : 'visibility_off'}
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            {editingLessonId === lesson.id ? (
                              <input
                                value={lessonEditForm.order}
                                onChange={(event) => setLessonEditForm({ ...lessonEditForm, order: event.target.value })}
                                type="number"
                                min="0"
                                className="form-control custom-input"
                                style={{ width: '90px', direction: 'ltr', textAlign: 'left' }}
                              />
                            ) : (
                              <span className="font-mono-data text-muted">{lesson.order}</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2 justify-content-center flex-wrap">
                              {editingLessonId === lesson.id ? (
                                <>
                                  <button type="button" className="btn btn-sm btn-primary-cta px-3" onClick={() => saveLesson(lesson.id)} disabled={submitting}>حفظ</button>
                                  <button type="button" className="btn btn-sm btn-secondary-cta px-3" onClick={() => setEditingLessonId(null)} disabled={submitting}>إلغاء</button>
                                </>
                              ) : (
                                <>
                                  <button type="button" className="btn btn-sm btn-secondary-cta px-2" onClick={() => moveLesson(section, index, -1)} disabled={index === 0 || submitting}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>keyboard_arrow_up</span>
                                  </button>
                                  <button type="button" className="btn btn-sm btn-secondary-cta px-2" onClick={() => moveLesson(section, index, 1)} disabled={index === (section.lessons || []).length - 1 || submitting}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>keyboard_arrow_down</span>
                                  </button>
                                  <button type="button" className="btn btn-sm btn-edit-course px-3" onClick={() => startEditingLesson(lesson)}>تعديل</button>
                                  <button type="button" className="btn btn-sm btn-delete-course px-3" onClick={() => deleteLesson(lesson.id)} disabled={submitting}>حذف</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
