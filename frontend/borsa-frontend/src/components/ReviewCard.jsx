import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function ReviewCard({ review, onEdit, onDelete }) {
  const { user, token, isAuthenticated } = useAuth();
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [isHelpful, setIsHelpful] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isOwner = user?.id === review.user_id;

  const renderAvatar = (user) => {
    if (user?.avatar) {
      const avatarUrl = user.avatar.startsWith('http')
        ? user.avatar
        : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/storage/${user.avatar}`;
      return (
        <img 
          src={avatarUrl} 
          alt={user?.name} 
          className="rounded-circle object-cover"
          style={{ width: '44px', height: '44px', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      );
    }

    const firstChar = user?.name ? user.name.trim().charAt(0) : '?';
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#8b5cf6', // purple
      '#f59e0b', // orange
      '#ec4899', // pink
      '#06b6d4', // cyan
    ];
    let hash = 0;
    if (user?.name) {
      for (let i = 0; i < user.name.length; i++) {
        hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const colorIndex = Math.abs(hash) % colors.length;
    const backgroundColor = colors[colorIndex];

    return (
      <div 
        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
        style={{ 
          width: '44px', 
          height: '44px', 
          backgroundColor,
          fontSize: '16px',
          fontFamily: 'var(--font-sans)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {firstChar}
      </div>
    );
  };

  const getRelativeTimeString = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) {
      if (diffHours === 1) return 'منذ ساعة';
      if (diffHours === 2) return 'منذ ساعتين';
      return `منذ ${diffHours} ساعات`;
    }
    if (diffDays < 7) {
      if (diffDays === 1) return 'أمس';
      if (diffDays === 2) return 'من يومين';
      return `منذ ${diffDays} أيام`;
    }
    if (diffWeeks < 4) {
      if (diffWeeks === 1) return 'منذ أسبوع';
      if (diffWeeks === 2) return 'منذ أسبوعين';
      return `منذ ${diffWeeks} أسابيع`;
    }
    if (diffMonths < 12) {
      if (diffMonths === 1) return 'منذ شهر';
      if (diffMonths === 2) return 'منذ شهرين';
      return `منذ ${diffMonths} أشهر`;
    }
    return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  };

  const handleHelpfulToggle = async () => {
    if (!isAuthenticated || !token) return;
    if (isLiking || isHelpful) return;
    setIsLiking(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reviews/${review.id}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        setHelpfulCount(prev => prev + 1);
        setIsHelpful(true);
      }
    } catch (err) {
      console.error('Error marking review as helpful:', err);
    } finally {
      setIsLiking(false);
    }
  };

  // Mock comment count matching visual layout of screenshot (0, 1, 2 comments)
  const mockCommentCount = review.id ? (review.id % 3) : 0;

  return (
    <div 
      className="p-4 rounded-3 h-100 d-flex flex-column justify-content-between border" 
      style={{ 
        backgroundColor: '#111417',
        borderColor: 'rgba(255,255,255,0.06)',
        transition: 'all 0.2s ease',
        direction: 'rtl'
      }}
    >
      <div>
        {/* Header: User Avatar & Info */}
        <div className="d-flex gap-3 align-items-center mb-3">
          {renderAvatar(review.user)}
          <div>
            <h4 className="text-white h6 m-0 fw-bold" style={{ fontFamily: 'var(--font-sans)', fontSize: '15px' }}>
              {review.user?.name}
            </h4>
            {review.is_verified && (
              <div className="d-flex align-items-center gap-1 mt-1 text-success fw-bold" style={{ fontSize: '11px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#10b981', fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span>طالب موثق</span>
              </div>
            )}
            <span className="text-muted d-block mt-0.5" style={{ fontSize: '11px' }}>
              {getRelativeTimeString(review.created_at)}
            </span>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="d-flex align-items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <span 
              key={star}
              className="material-symbols-outlined" 
              style={{ 
                fontSize: '15px', 
                color: review.rating >= star ? '#F59E0B' : 'rgba(255,255,255,0.15)',
                fontVariationSettings: review.rating >= star ? "'FILL' 1" : "'FILL' 0"
              }}
            >
              star
            </span>
          ))}
        </div>

        {/* Review Title & Body */}
        {review.title && (
          <h5 className="text-white fw-bold mb-2" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
            {review.title}
          </h5>
        )}
        
        <p className="text-white mb-4" style={{ fontSize: '13px', lineHeight: 1.7, opacity: 0.85, fontFamily: 'var(--font-sans)' }}>
          {review.review}
        </p>
      </div>

      {/* Footer: Helpful, Comments and Dropdown */}
      <div 
        className="d-flex align-items-center gap-3 pt-3 mt-auto" 
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button 
          className={`btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1 hover-text-white ${isHelpful ? 'text-white' : 'text-muted'}`}
          style={{ fontSize: '13px' }}
          onClick={handleHelpfulToggle}
          disabled={!isAuthenticated || isHelpful}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: isHelpful ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span>
          <span className="font-mono-data">{helpfulCount}</span>
        </button>

        <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '13px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat_bubble</span>
          <span className="font-mono-data">{mockCommentCount}</span>
        </div>

        {/* Menu vertical / horizontal */}
        <div className="dropdown ms-auto">
          <button 
            className="btn btn-link text-muted p-0 text-decoration-none d-flex align-items-center justify-content-center" 
            data-bs-toggle="dropdown"
            aria-expanded="false"
            style={{ opacity: 0.6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_horiz</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-start dropdown-menu-dark shadow border-0" style={{ backgroundColor: '#1a1f24', border: '1px solid rgba(255,255,255,0.1)' }}>
            {isOwner ? (
              <>
                <li>
                  <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-white" onClick={() => onEdit(review)} style={{ fontSize: '13px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                    تعديل التقييم
                  </button>
                </li>
                <li>
                  <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" onClick={() => onDelete(review.id)} style={{ fontSize: '13px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    حذف التقييم
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button 
                  className="dropdown-item d-flex align-items-center gap-2 py-2 text-white" 
                  style={{ fontSize: '13px' }}
                  onClick={async () => {
                    if (!isAuthenticated) return;
                    try {
                      await fetch(`${import.meta.env.VITE_API_BASE_URL}/reviews/${review.id}/report`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      alert('تم الإبلاغ عن التقييم');
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>flag</span>
                  إبلاغ
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
