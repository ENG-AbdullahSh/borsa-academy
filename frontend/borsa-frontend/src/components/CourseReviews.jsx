import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import ReviewCard from './ReviewCard';
import ReviewModal from './ReviewModal';

export default function CourseReviews({ courseId, enrollment, canReview }) {
  const { token, isAuthenticated } = useAuth();
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest'); // newest, highest, lowest, helpful
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // User review state
  const [userReview, setUserReview] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewBody, setReviewBody] = useState('');

  const fetchReviews = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }
      const currentPage = reset ? 1 : page;
      const response = await fetch(
        `${API_BASE_URL}/courses/${courseId}/reviews?sort=${sort}&page=${currentPage}`,
        {
          headers: apiHeaders(token),
        }
      );
      const payload = await readJsonResponse(response);
      if (payload.success) {
        const paginatedReviews = payload.reviews || payload.data;
        setReviews(prev => reset ? paginatedReviews.data : [...prev, ...paginatedReviews.data]);
        setHasMore(paginatedReviews.current_page < paginatedReviews.last_page);
        if (!reset) setPage(p => p + 1);

        setSummary({
          average_rating: payload.average_rating,
          total_reviews: payload.ratings_count,
          distribution: payload.summary_distribution,
        });

        if (payload.user_review) {
          setUserReview(payload.user_review);
          setUserRating(payload.user_review.rating || 0);
          setReviewBody(payload.user_review.review || '');
        } else {
          setUserReview(null);
          setUserRating(0);
          setReviewBody('');
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, sort, page, token]);

  useEffect(() => {
    fetchReviews(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, courseId, token]);

  const handleSortChange = (e) => {
    setSort(e.target.value);
  };

  const loadMore = () => {
    fetchReviews();
  };

  const handleOpenModal = (review = null) => {
    setEditingReview(review);
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReview(null);
  };

  const handleSubmitReview = async (reviewData) => {
    if (!isAuthenticated || !token) return;
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/review`, {
        method: 'POST',
        headers: apiHeaders(token, true),
        body: JSON.stringify(reviewData)
      });

      const payload = await readJsonResponse(response);

      if (response.ok) {
        handleCloseModal();
        fetchReviews(true);
      } else {
        setError(payload.message || 'حدث خطأ أثناء حفظ التقييم');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    if (userRating === 0) return;
    await handleSubmitReview({
      rating: userRating,
      title: '', // Minimal inline form has no title
      review: reviewBody,
    });
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: apiHeaders(token)
      });
      
      if (response.ok) {
        fetchReviews(true);
      }
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  if (!summary) return null;

  // Business logic messages for Rate Course Section when review is disabled
  let disabledMessage = '';
  if (!isAuthenticated) {
    disabledMessage = 'يرجى تسجيل الدخول للتقييم.';
  } else if (!canReview) {
    disabledMessage = 'يجب إكمال الدورة بنسبة 100% لكتابة تقييم.';
  }

  const isFormDisabled = !isAuthenticated || !canReview;

  return (
    <div className="mt-5" style={{ direction: 'rtl' }}>
      {/* Top Section: Summary & Rate Course Cards Side-by-Side */}
      <div className="row g-4 mb-5">
        {/* Left Card: Student Rating Distribution Card */}
        <div className="col-12 col-lg-6">
          <div 
            className="p-4 rounded-3 h-100 border" 
            style={{ 
              backgroundColor: '#111417', 
              borderColor: 'rgba(255,255,255,0.06)'
            }}
          >
            <div className="d-flex align-items-center h-100">
              {/* Progress Bars (Right Sub-column in RTL) */}
              <div style={{ width: '60%', paddingLeft: '15px' }}>
                <h3 className="h6 text-white fw-bold mb-3 text-end" style={{ fontFamily: 'var(--font-sans)', fontSize: '15px' }}>
                  تقييمات الطلاب
                </h3>
                {summary.distribution.map((dist) => (
                  <div key={dist.rating} className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: '13px' }}>
                    <span className="text-muted text-end" style={{ width: '40px', fontSize: '13px' }}>
                      {dist.rating === 1 ? 'نجمة' : 'نجوم'}
                    </span>
                    <div className="flex-grow-1" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${dist.percentage}%`, 
                          backgroundColor: '#F59E0B', 
                          borderRadius: '3px',
                          transition: 'width 0.5s ease-out'
                        }} 
                      />
                    </div>
                    <span className="font-mono-data text-muted text-start" style={{ width: '35px' }}>
                      {dist.percentage}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Vertical Divider */}
              <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'stretch', margin: '0 10px' }}></div>

              {/* Score Display (Left Sub-column in RTL) */}
              <div style={{ width: '40%' }} className="d-flex flex-column align-items-center justify-content-center text-center">
                <div className="display-4 fw-bold text-white mb-2" style={{ fontFamily: 'var(--font-sans)', fontSize: '52px', lineHeight: 1 }}>
                  {summary.average_rating > 0 ? summary.average_rating.toFixed(1) : '0.0'}
                </div>
                <div className="d-flex align-items-center gap-0.5 mb-2" style={{ direction: 'ltr' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const fullStars = Math.floor(summary.average_rating);
                    const hasHalfStar = (summary.average_rating % 1) >= 0.5;
                    let icon = 'star';
                    let isFilled = false;
                    
                    if (star <= fullStars) {
                      isFilled = true;
                    } else if (star === fullStars + 1 && hasHalfStar) {
                      icon = 'star_half';
                      isFilled = true;
                    }
                    
                    return (
                      <span 
                        key={star}
                        className="material-symbols-outlined" 
                        style={{ 
                          fontSize: '18px', 
                          color: isFilled ? '#F59E0B' : 'rgba(255,255,255,0.15)',
                          fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0"
                        }}
                      >
                        {icon}
                      </span>
                    );
                  })}
                </div>
                <p className="text-muted fw-normal m-0" style={{ fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
                  ({summary.total_reviews} تقييم)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Rate This Course Card */}
        <div className="col-12 col-lg-6">
          <div 
            className="p-4 rounded-3 h-100 border text-center d-flex flex-column justify-content-between" 
            style={{ 
              backgroundColor: '#111417', 
              borderColor: 'rgba(255,255,255,0.06)'
            }}
          >
            <div>
              <h3 className="h6 text-white fw-bold m-0" style={{ fontFamily: 'var(--font-sans)', fontSize: '15px' }}>
                قيم هذه الدورة
              </h3>
              <p className="text-muted mt-1 mb-3" style={{ fontSize: '12px' }}>
                ماذا رأيك في هذه الدورة؟
              </p>

              {/* Clickable Rating Stars */}
              <div className="d-flex align-items-center gap-1 justify-content-center mb-3" style={{ direction: 'ltr' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    onMouseEnter={() => !isFormDisabled && setHoverRating(star)}
                    onMouseLeave={() => !isFormDisabled && setHoverRating(0)}
                    onClick={() => !isFormDisabled && setUserRating(star)}
                    disabled={isFormDisabled}
                    style={{ cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                  >
                    <span 
                      className="material-symbols-outlined" 
                      style={{ 
                        fontSize: '28px', 
                        color: (hoverRating || userRating) >= star ? '#F59E0B' : 'rgba(255,255,255,0.15)',
                        fontVariationSettings: (hoverRating || userRating) >= star ? "'FILL' 1" : "'FILL' 0",
                        transition: 'color 0.15s ease'
                      }}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>

              {/* Textarea comment */}
              <div className="mb-3">
                <textarea 
                  className="form-control text-white border-0" 
                  placeholder={isFormDisabled ? disabledMessage : "اكتب تعليقك (اختياري)"}
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  disabled={isFormDisabled}
                  style={{ 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    resize: 'none',
                    backgroundColor: '#181d22',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                ></textarea>
              </div>
            </div>

            {/* Centered green submit button */}
            <div className="d-flex justify-content-center">
              <button 
                type="submit" 
                onClick={handleInlineSubmit}
                disabled={userRating === 0 || isSubmitting || isFormDisabled}
                className="btn px-5 py-2 fw-bold"
                style={{ 
                  backgroundColor: userRating === 0 || isSubmitting || isFormDisabled ? 'rgba(255,255,255,0.06)' : '#75ff9e', 
                  color: userRating === 0 || isSubmitting || isFormDisabled ? 'rgba(255,255,255,0.3)' : '#003918', 
                  borderRadius: '24px',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Actions & Filters - Left aligned filter dropdown */}
      <div className="d-flex justify-content-end mb-4">
        <select 
          className="form-select bg-dark text-white border"
          style={{ 
            width: 'auto', 
            borderColor: 'rgba(255,255,255,0.08)', 
            fontSize: '13px',
            backgroundColor: '#111417',
            padding: '6px 36px 6px 12px',
            borderRadius: '6px'
          }}
          value={sort}
          onChange={handleSortChange}
        >
          <option value="newest" className="bg-dark">الأحدث</option>
          <option value="highest" className="bg-dark">الأعلى تقييماً</option>
          <option value="lowest" className="bg-dark">الأقل تقييماً</option>
          <option value="helpful" className="bg-dark">الأكثر فائدة</option>
        </select>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" style={{ backgroundColor: 'rgba(220,53,69,0.1)', color: '#ff6b6b', border: 'none', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Reviews List Grid Layout */}
      <div className="reviews-list">
        {loading && reviews.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined text-muted" style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-5 rounded-3 border" style={{ backgroundColor: '#111417', borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="material-symbols-outlined text-muted mb-3" style={{ fontSize: '48px' }}>reviews</span>
            <p className="text-muted m-0" style={{ fontSize: '14px' }}>لا توجد تقييمات حتى الآن. كن أول من يقيّم هذه الدورة!</p>
          </div>
        ) : (
          <>
            <div className="row g-4">
              {reviews.map(review => (
                <div key={review.id} className="col-12 col-md-6 col-lg-4">
                  <ReviewCard 
                    review={review} 
                    onEdit={handleOpenModal} 
                    onDelete={handleDeleteReview}
                  />
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-5">
                <button 
                  className="btn text-white text-decoration-none border px-4 py-2"
                  onClick={loadMore}
                  disabled={loading}
                  style={{ 
                    borderColor: 'rgba(255,255,255,0.08)', 
                    borderRadius: '8px',
                    fontSize: '13px',
                    backgroundColor: 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {loading ? 'جاري التحميل...' : 'عرض المزيد'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitReview}
          initialData={editingReview}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
