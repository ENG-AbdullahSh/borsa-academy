import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function AdminReviews() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sort, setSort] = useState('newest'); // newest, reported, highest, lowest
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, label }

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/courses`, {
        headers: apiHeaders(token)
      });
      const payload = await readJsonResponse(response);
      if (payload.success) {
        setCourses(payload.data || payload.courses || []);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  }, [token]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      // For a real app, you'd have an endpoint like GET /admin/reviews?course_id=...
      // Since we didn't explicitly create an all-reviews endpoint in the plan,
      // I am assuming we filter by course if selected.
      if (selectedCourse) {
        const response = await fetch(`${API_BASE_URL}/courses/${selectedCourse}/reviews?sort=${sort}&page=${page}`);
        const payload = await readJsonResponse(response);
        if (payload.success) {
          setReviews(payload.data.data);
          setTotalPages(payload.data.last_page);
        }
      } else {
        // Just clearing if no course is selected for now
        setReviews([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, sort, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchReviews();
    }
  }, [fetchReviews, selectedCourse]);

  const handleDelete = (reviewId, reviewLabel) => {
    setDeleteConfirm({ id: reviewId, label: reviewLabel });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: apiHeaders(token)
      });
      if (response.ok) {
        fetchReviews();
      }
    } catch (err) {
      console.error('Error deleting review:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleVisibility = async (review) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${review.id}`, {
        method: 'PUT',
        headers: apiHeaders(token, true),
        body: JSON.stringify({ is_visible: !review.is_visible })
      });
      if (response.ok) {
        fetchReviews();
      }
    } catch (err) {
      console.error('Error toggling visibility:', err);
    }
  };

  return (
    <>
    <div className="container-fluid py-4" style={{ direction: 'rtl' }}>
      <h2 className="text-white fw-bold mb-4" style={{ fontFamily: 'var(--font-sans)' }}>إدارة التقييمات والمراجعات</h2>

      <div className="glass-card p-4 rounded-3 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label text-muted">تصفية حسب الدورة</label>
            <select 
              className="form-select bg-dark text-white border-secondary"
              value={selectedCourse}
              onChange={(e) => { setSelectedCourse(e.target.value); setPage(1); }}
            >
              <option value="">اختر الدورة...</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label text-muted">ترتيب حسب</label>
            <select 
              className="form-select bg-dark text-white border-secondary"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
            >
              <option value="newest">الأحدث</option>
              <option value="reported">الأكثر إبلاغاً</option>
              <option value="highest">الأعلى تقييماً</option>
              <option value="lowest">الأقل تقييماً</option>
            </select>
          </div>
        </div>
      </div>

      {!selectedCourse ? (
        <div className="text-center py-5 glass-card rounded-3">
          <span className="material-symbols-outlined text-muted mb-3" style={{ fontSize: '48px' }}>reviews</span>
          <p className="text-muted">يرجى اختيار دورة لعرض التقييمات الخاصة بها.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined text-muted" style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-5 glass-card rounded-3">
          <p className="text-muted m-0">لا توجد تقييمات مطابقة.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle" style={{ backgroundColor: 'transparent' }}>
            <thead>
              <tr>
                <th>الطالب</th>
                <th>التقييم</th>
                <th>التعليق</th>
                <th>التاريخ</th>
                <th>الإبلاغات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.id} style={{ opacity: review.is_visible ? 1 : 0.5 }}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <img 
                        src={review.user?.avatar || `https://ui-avatars.com/api/?name=${review.user?.name}&background=random`} 
                        alt={review.user?.name} 
                        className="rounded-circle"
                        style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                      />
                      <span>{review.user?.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1" style={{ color: '#F59E0B' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span>{review.rating}</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    {review.title && <strong className="d-block mb-1">{review.title}</strong>}
                    <div className="text-truncate text-muted" title={review.review}>{review.review}</div>
                  </td>
                  <td className="text-muted" style={{ fontSize: '13px' }}>
                    {new Date(review.created_at).toLocaleDateString('ar-EG')}
                  </td>
                  <td>
                    {review.reported_count > 0 ? (
                      <span className="badge bg-danger">{review.reported_count} إبلاغ</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-warning d-flex align-items-center justify-content-center"
                        onClick={() => toggleVisibility(review)}
                        title={review.is_visible ? "إخفاء" : "إظهار"}
                        style={{ width: '32px', height: '32px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {review.is_visible ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                      <button 
                         className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
                         onClick={() => handleDelete(review.id, review.user?.name ? `تقييم ${review.user.name}` : `تقييم #${review.id}`)}
                         title="حذف نهائي"
                         style={{ width: '32px', height: '32px' }}
                       >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4 gap-2">
          <button 
            className="btn btn-outline-light px-3 py-1"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            السابق
          </button>
          <span className="text-muted d-flex align-items-center px-3 font-mono-data">
            {page} / {totalPages}
          </span>
          <button 
            className="btn btn-outline-light px-3 py-1"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            التالي
          </button>
        </div>
      )}
    </div>

      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        itemName={deleteConfirm?.label}
        itemType="التقييم"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </>
  );
}
