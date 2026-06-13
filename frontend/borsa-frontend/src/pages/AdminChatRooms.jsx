import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders } from '../utils/api';

export default function AdminChatRooms() {
  const { user, token } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'group',
    audience_type: 'all',
    course_id: '',
    scheduled_at: '',
    is_live: false,
    start_now: false,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/chat-rooms`, {
        headers: apiHeaders(token)
      });
      const data = await response.json();
      if (data.status === 'success') {
        setChatRooms(data.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/courses`, {
        headers: apiHeaders(token)
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCourses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRooms();
      fetchCourses();
    }
  }, [token]);

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      // Convert UTC time from server to local time for the input
      let localScheduled = '';
      if (room.scheduled_at) {
        const d = new Date(room.scheduled_at);
        // toISOString gives UTC, subtract offset to get local
        const offset = d.getTimezoneOffset() * 60000;
        localScheduled = new Date(d.getTime() - offset).toISOString().slice(0, 16);
      }
      setFormData({
        name: room.name || '',
        type: room.type || 'group',
        audience_type: room.audience_type || 'all',
        course_id: room.course_id || '',
        scheduled_at: localScheduled,
        is_live: room.is_live || false,
        start_now: false,
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        type: 'group',
        audience_type: 'all',
        course_id: '',
        scheduled_at: '',
        is_live: false,
        start_now: false,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRoom
        ? `${API_BASE_URL}/admin/chat-rooms/${editingRoom.id}`
        : `${API_BASE_URL}/admin/chat-rooms`;

      const method = editingRoom ? 'PUT' : 'POST';

      const payload = { ...formData };
      if (payload.audience_type !== 'course_id') {
        payload.course_id = null;
      }

      // If "start now" is checked, set scheduled_at to now
      if (payload.start_now) {
        payload.scheduled_at = new Date().toISOString();
        payload.is_live = true;
      } else if (payload.scheduled_at) {
        // Convert local time to UTC ISO string for the server
        payload.scheduled_at = new Date(payload.scheduled_at).toISOString();
      } else {
        payload.scheduled_at = null;
      }

      delete payload.start_now;

      const response = await fetch(url, {
        method,
        headers: apiHeaders(token, true),
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.status === 'success') {
        setShowModal(false);
        fetchRooms();
        showToast(editingRoom ? 'تم تحديث الغرفة بنجاح' : 'تم إنشاء الغرفة وإضافة المشتركين بنجاح');
      } else {
        const errMsg = data.errors
          ? Object.values(data.errors).flat().join(' | ')
          : (data.message || 'حدث خطأ');
        showToast(errMsg, 'danger');
      }
    } catch (error) {
      console.error('Error saving chat room:', error);
      showToast('حدث خطأ أثناء الحفظ', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الغرفة؟')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/chat-rooms/${id}`, {
        method: 'DELETE',
        headers: apiHeaders(token)
      });
      const data = await response.json();
      if (data.status === 'success') {
        fetchRooms();
        showToast('تم حذف الغرفة');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const formatLocalTime = (utcStr) => {
    if (!utcStr) return null;
    return new Date(utcStr).toLocaleString('ar-EG');
  };

  return (
    <div className="container-fluid py-4" dir="rtl">

      {/* Toast */}
      {toast && (
        <div
          className={`alert alert-${toast.type} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`}
          style={{ zIndex: 9999, minWidth: '300px', textAlign: 'center' }}
        >
          {toast.msg}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white fw-bold m-0" style={{ fontFamily: 'var(--font-sans)' }}>
          إدارة غرف الدردشة والبث
        </h2>
        <button className="btn btn-success px-4" onClick={() => handleOpenModal()}>
          + إنشاء غرفة جديدة
        </button>
      </div>

      <div className="card bg-dark border-secondary text-white">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" />
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="text-center py-5 text-muted">لا توجد غرف دردشة بعد.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <tr>
                    <th className="px-4 py-3">اسم الغرفة</th>
                    <th className="px-4 py-3">النوع</th>
                    <th className="px-4 py-3">الجمهور المستهدف</th>
                    <th className="px-4 py-3">الحالة</th>
                    <th className="px-4 py-3">موعد البدء (مجدول)</th>
                    <th className="px-4 py-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {chatRooms.map(room => (
                    <tr key={room.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="px-4 py-3 fw-semibold">{room.name || '-'}</td>
                      <td className="px-4 py-3">
                        {room.type === 'global' ? <span className="badge bg-primary">عامة</span> :
                          room.type === 'group' ? <span className="badge bg-info text-dark">مجموعة</span> :
                            <span className="badge bg-secondary">خاصة</span>}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {room.audience_type === 'all' ? 'الجميع' :
                          room.audience_type === 'course_id' ? `كورس: ${room.course?.title || room.course_id}` :
                            'مستخدمين محددين'}
                      </td>
                      <td className="px-4 py-3">
                        {room.is_live
                          ? <span className="badge bg-danger">🔴 بث مباشر</span>
                          : room.scheduled_at
                            ? <span className="badge bg-warning text-dark">مجدول</span>
                            : <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>عادي</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-muted" style={{ fontSize: '13px' }}>
                        {formatLocalTime(room.scheduled_at) || <span className="text-muted">غير مجدول</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button className="btn btn-sm btn-outline-info me-2" onClick={() => handleOpenModal(room)}>تعديل</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(room.id)}>حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-secondary" style={{ backgroundColor: '#1a1d21' }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-white">
                  {editingRoom ? '✏️ تعديل الغرفة' : '➕ إنشاء غرفة جديدة'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">

                  {/* Name */}
                  <div className="mb-3">
                    <label className="form-label text-white">اسم الغرفة</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ backgroundColor: '#2a2d31', color: '#fff', border: '1px solid #444' }}
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Type */}
                  <div className="mb-3">
                    <label className="form-label text-white">نوع الغرفة</label>
                    <select
                      className="form-select"
                      style={{ backgroundColor: '#2a2d31', color: '#fff', border: '1px solid #444' }}
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="group">مجموعة (Group Chat)</option>
                      <option value="global">عامة (للجميع)</option>
                    </select>
                  </div>

                  {/* Audience */}
                  <div className="mb-3">
                    <label className="form-label text-white">الجمهور المستهدف</label>
                    <select
                      className="form-select"
                      style={{ backgroundColor: '#2a2d31', color: '#fff', border: '1px solid #444' }}
                      value={formData.audience_type}
                      onChange={(e) => setFormData({ ...formData, audience_type: e.target.value })}
                    >
                      <option value="all">جميع المستخدمين</option>
                      <option value="course_id">طلاب كورس محدد</option>
                      <option value="specific_users">مستخدمين محددين</option>
                    </select>
                  </div>

                  {/* Course selector */}
                  {formData.audience_type === 'course_id' && (
                    <div className="mb-3">
                      <label className="form-label text-white">اختر الكورس</label>
                      <select
                        className="form-select"
                        style={{ backgroundColor: '#2a2d31', color: '#fff', border: '1px solid #444' }}
                        required
                        value={formData.course_id}
                        onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                      >
                        <option value="">-- اختر الكورس --</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <hr style={{ borderColor: '#444' }} />

                  {/* Live / Scheduling options */}
                  <p className="text-white fw-semibold mb-3">📅 الجدولة والبث</p>

                  {/* Start now toggle */}
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="startNow"
                      checked={formData.start_now}
                      onChange={(e) => setFormData({ ...formData, start_now: e.target.checked, is_live: e.target.checked, scheduled_at: '' })}
                    />
                    <label className="form-check-label text-white ms-2" htmlFor="startNow">
                      🔴 <strong>بدء بث مباشر الآن فوراً</strong>
                    </label>
                  </div>

                  {/* Scheduled time - only if not start_now */}
                  {!formData.start_now && (
                    <div className="mb-3">
                      <label className="form-label text-white">موعد البث / الدردشة (اختياري)</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        style={{ backgroundColor: '#2a2d31', color: '#fff', border: '1px solid #444' }}
                        value={formData.scheduled_at}
                        onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                      />
                      <small className="text-muted d-block mt-1">
                        الوقت بتوقيتك المحلي • سيُرسل إشعار للطلاب قبل الموعد بـ 30 دقيقة تلقائياً
                      </small>
                    </div>
                  )}

                  {formData.start_now && (
                    <div className="alert alert-success py-2" style={{ fontSize: '13px' }}>
                      ✅ سيتم فتح الغرفة فوراً وإخطار جميع المشتركين بأن البث مباشر الآن.
                    </div>
                  )}

                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-success px-4">
                    {formData.start_now ? '🔴 بدء البث الآن' : 'حفظ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
