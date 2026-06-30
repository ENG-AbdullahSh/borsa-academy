import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function ReviewCard({ review, onEdit, onDelete }) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const isOwner = user?.id === review.user_id;

  const getAvatarUrl = (user) => {
    if (!user) return 'https://ui-avatars.com/api/?name=User&background=random';
    if (user.avatar) {
      if (user.avatar.startsWith('http')) return user.avatar;
      return `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/storage/${user.avatar}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  };

  return (
    <div 
      className="p-4 rounded-3 mb-4" 
      style={{ 
        backgroundColor: isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className="d-flex gap-3 align-items-center">
          <img 
            src={getAvatarUrl(review.user)} 
            alt={review.user?.name} 
            className="rounded-circle object-cover"
            style={{ width: '48px', height: '48px', border: '2px solid rgba(255,255,255,0.1)' }}
          />
          <div>
            <h4 className="text-white h6 m-0 fw-bold d-flex align-items-center gap-2" style={{ fontFamily: 'var(--font-sans)' }}>
              {review.user?.name}
              {review.is_verified && (
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#75ff9e', fontVariationSettings: "'FILL' 1" }} title="طالب مسجل">
                  verified
                </span>
              )}
            </h4>
            <div className="d-flex align-items-center gap-2 mt-1">
              <div className="d-flex" style={{ direction: 'ltr' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star}
                    className="material-symbols-outlined" 
                    style={{ 
                      fontSize: '14px', 
                      color: review.rating >= star ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                      fontVariationSettings: review.rating >= star ? "'FILL' 1" : "'FILL' 0"
                    }}
                  >
                    star
                  </span>
                ))}
              </div>
              <span className="text-muted" style={{ fontSize: '12px' }}>•</span>
              <span className="text-muted" style={{ fontSize: '12px' }}>{formatDate(review.created_at)}</span>
              {review.created_at !== review.updated_at && (
                <span className="text-muted fst-italic" style={{ fontSize: '11px' }}>(مُعدل)</span>
              )}
            </div>
          </div>
        </div>
        
        {isOwner && (
          <div className="dropdown">
            <button 
              className="btn btn-link text-muted p-1 text-decoration-none d-flex align-items-center justify-content-center" 
              data-bs-toggle="dropdown"
              style={{ opacity: isHovered ? 1 : 0.5, transition: 'opacity 0.2s ease' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark shadow" style={{ backgroundColor: '#1a1f24', border: '1px solid rgba(255,255,255,0.1)' }}>
              <li>
                <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-white" onClick={() => onEdit(review)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                  تعديل التقييم
                </button>
              </li>
              <li>
                <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" onClick={() => onDelete(review.id)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  حذف التقييم
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {review.title && (
        <h5 className="text-white fw-bold mb-2" style={{ fontSize: '16px', fontFamily: 'var(--font-sans)' }}>
          {review.title}
        </h5>
      )}
      
      <p className="text-white" style={{ fontSize: '14px', lineHeight: 1.8, opacity: 0.9 }}>
        {review.review}
      </p>

      {/* Helpful & Report buttons */}
      <div className="d-flex align-items-center gap-3 mt-3">
        <button className="btn btn-link text-muted p-0 text-decoration-none d-flex align-items-center gap-1 hover-text-white" style={{ fontSize: '13px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>thumb_up</span>
          مفيد {review.helpful_count > 0 && `(${review.helpful_count})`}
        </button>
        <button className="btn btn-link text-muted p-0 text-decoration-none d-flex align-items-center gap-1 hover-text-white" style={{ fontSize: '13px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>flag</span>
          إبلاغ
        </button>
      </div>
    </div>
  );
}
