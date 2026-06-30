import { useState } from 'react';
import { courseImage } from '../utils/courseDisplay';

export default function ReviewModal({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(initialData?.title || '');
  const [review, setReview] = useState(initialData?.review || '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    onSubmit({ rating, title, review: review.trim() || null });
  };

  const isSubmitDisabled = rating === 0 || isSubmitting;

  return (
    <div className="modal-backdrop" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', direction: 'rtl'
    }}>
      <div className="glass-card rounded-4 p-0 w-100 position-relative overflow-hidden" style={{ maxWidth: '600px', animation: 'slideUp 0.3s ease-out' }}>
        
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="h5 text-white fw-bold m-0" style={{ fontFamily: 'var(--font-sans)' }}>
            {initialData ? 'تعديل التقييم' : 'كتابة تقييم'}
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-link text-muted p-0 text-decoration-none d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4 text-center">
            <p className="text-muted mb-2 fw-semibold" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>ما هو تقييمك العام؟</p>
            <div className="d-flex align-items-center justify-content-center gap-2" style={{ direction: 'ltr' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="btn btn-link p-0 text-decoration-none"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <span 
                    className="material-symbols-outlined" 
                    style={{ 
                      fontSize: '36px', 
                      color: (hoverRating || rating) >= star ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                      fontVariationSettings: (hoverRating || rating) >= star ? "'FILL' 1" : "'FILL' 0",
                      transition: 'color 0.2s ease'
                    }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
            {rating === 0 && <small className="text-danger mt-2 d-block">يرجى تحديد عدد النجوم</small>}
          </div>

          <div className="mb-3">
            <label className="form-label text-white fw-semibold" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>عنوان التقييم (اختياري)</label>
            <input 
              type="text" 
              className="form-control bg-transparent text-white" 
              placeholder="مثال: دورة ممتازة ومفيدة جداً"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              style={{ borderColor: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-white fw-semibold d-flex justify-content-between" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
              <span>تفاصيل التقييم (اختياري)</span>
              <span className="font-mono-data text-muted" style={{ fontSize: '12px' }}>
                {review.length} / 1000 حرف
              </span>
            </label>
            <textarea 
              className="form-control bg-transparent text-white" 
              placeholder="شاركنا رأيك بالتفصيل حول محتوى الدورة، طريقة الشرح، وما استفدته..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={5}
              maxLength={1000}
              style={{ borderColor: 'rgba(255,255,255,0.15)', borderRadius: '8px', resize: 'none' }}
            ></textarea>
          </div>

          {/* Footer */}
          <div className="d-flex align-items-center justify-content-end gap-3 mt-4 pt-4 border-top" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <button 
              type="button" 
              className="btn btn-link text-muted text-decoration-none fw-semibold"
              onClick={onClose}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              disabled={isSubmitDisabled}
              className="btn px-4 py-2 fw-bold"
              style={{ 
                backgroundColor: isSubmitDisabled ? 'rgba(255,255,255,0.1)' : '#75ff9e', 
                color: isSubmitDisabled ? 'rgba(255,255,255,0.4)' : '#003918', 
                borderRadius: '8px', 
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s ease'
              }}
            >
              {isSubmitting ? 'جاري الإرسال...' : (initialData ? 'تحديث التقييم' : 'إرسال التقييم')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
