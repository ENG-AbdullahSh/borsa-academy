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
  const [reviewTitle, setReviewTitle] = useState('');
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
          setReviewTitle(payload.user_review.title || '');
          setReviewBody(payload.user_review.review || '');
        } else {
          setUserReview(null);
          setUserRating(0);
          setReviewTitle('');
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
      title: reviewTitle,
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

  return (
    <div className="mt-5" style={{ direction: 'rtl' }}>
      <h2 className="h4 fw-bold text-white mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'var(--font-sans)' }}>
        <span className="material-symbols-outlined" style={{ color: '#F59E0B' }}>star</span>
        تقييمات الطلاب
      </h2>

      {/* Summary Section (Coursera Style) */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-md-4 text-center d-flex flex-column justify-content-center align-items-center">
          <div className="display-3 fw-bold text-white mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
            {summary.average_rating > 0 ? summary.average_rating.toFixed(1) : '0.0'}
          </div>
          <div className="d-flex align-items-center gap-1 mb-2" style={{ direction: 'ltr' }}>
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
                    fontSize: '24px', 
                    color: isFilled ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                    fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0"
                  }}
                >
                  {icon}
                </span>
              );
            })}
          </div>
          <p className="text-muted fw-semibold" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
            {summary.total_reviews} تقييم
          </p>
        </div>

        <div className="col-12 col-md-8">
          {summary.distribution.map((dist) => (
            <div key={dist.rating} className="d-flex align-items-center gap-3 mb-2" style={{ fontSize: '14px' }}>
              <div className="d-flex align-items-center gap-1" style={{ width: '70px', direction: 'ltr' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#F59E0B', fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-muted font-mono-data">{dist.rating}</span>
              </div>
              <div className="grow" style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${dist.percentage}%`, 
                    backgroundColor: '#F59E0B', 
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-out'
                  }} 
                />
              </div>
              <div className="font-mono-data text-muted" style={{ width: '40px', textAlign: 'left' }}>
                {dist.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rate this course section */}
      {canReview && isAuthenticated && (
        <div className="glass-card p-4 rounded-3 mb-5">
          <h3 className="h5 text-white fw-bold mb-3" style={{ fontFamily: 'var(--font-sans)' }}>
            {userReview ? 'تعديل تقييمك لهذه الدورة (Update Review)' : 'تقييم هذه الدورة (Rate this course)'}
          </h3>
          <form onSubmit={handleInlineSubmit}>
            <div className="mb-3 text-center text-sm-start">
              <p className="text-muted mb-2" style={{ fontSize: '14px' }}>ما هو تقييمك العام؟</p>
              <div className="d-flex align-items-center gap-1 justify-content-center justify-content-sm-start" style={{ direction: 'ltr' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(star)}
                  >
                    <span 
                      className="material-symbols-outlined" 
                      style={{ 
                        fontSize: '32px', 
                        color: (hoverRating || userRating) >= star ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                        fontVariationSettings: (hoverRating || userRating) >= star ? "'FILL' 1" : "'FILL' 0",
                        transition: 'color 0.15s ease'
                      }}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <input 
                type="text" 
                className="form-control bg-dark text-white border-secondary" 
                placeholder="عنوان التقييم (اختياري)"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                maxLength={100}
                style={{ borderRadius: '8px', fontSize: '14px' }}
              />
            </div>

            <div className="mb-3">
              <textarea 
                className="form-control bg-dark text-white border-secondary" 
                placeholder="اكتب مراجعتك هنا... (اختياري)"
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                rows={3}
                maxLength={1000}
                style={{ borderRadius: '8px', fontSize: '14px', resize: 'none' }}
              ></textarea>
            </div>

            <div className="d-flex justify-content-end">
              <button 
                type="submit" 
                disabled={userRating === 0 || isSubmitting}
                className="btn px-4 py-2 fw-bold"
                style={{ 
                  backgroundColor: userRating === 0 || isSubmitting ? 'rgba(255,255,255,0.1)' : '#75ff9e', 
                  color: userRating === 0 || isSubmitting ? 'rgba(255,255,255,0.4)' : '#003918', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSubmitting ? 'جاري الإرسال...' : (userReview ? 'تحديث التقييم' : 'إرسال التقييم')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review Actions & Filters */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <select 
          className="form-select bg-transparent text-white border"
          style={{ width: 'auto', borderColor: 'rgba(255,255,255,0.1)', fontSize: '14px' }}
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
        <div className="alert alert-danger" style={{ backgroundColor: 'rgba(220,53,69,0.1)', color: '#ff6b6b', border: 'none' }}>
          {error}
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {loading && reviews.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined text-muted" style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-5 glass-card rounded-3">
            <span className="material-symbols-outlined text-muted mb-3" style={{ fontSize: '48px' }}>reviews</span>
            <p className="text-muted m-0">لا توجد تقييمات حتى الآن. كن أول من يقيّم هذه الدورة!</p>
          </div>
        ) : (
          <>
            {reviews.map(review => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                onEdit={handleOpenModal} 
                onDelete={handleDeleteReview}
              />
            ))}
            {hasMore && (
              <div className="text-center mt-4">
                <button 
                  className="btn btn-link text-white text-decoration-none border"
                  onClick={loadMore}
                  disabled={loading}
                  style={{ borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 24px' }}
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
