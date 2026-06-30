import { Link } from 'react-router-dom';

// Helper to format numbers like 7800 -> 7.8k
const formatReviewCount = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num;
};

// Helper to render stars: ★★★★☆
const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(
        <span key={i} className="material-symbols-outlined" style={{ fontSize: '14px', color: '#F59E0B', fontVariationSettings: "'FILL' 1" }}>star</span>
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <span key={i} className="material-symbols-outlined" style={{ fontSize: '14px', color: '#F59E0B', fontVariationSettings: "'FILL' 1" }}>star_half</span>
      );
    } else {
      stars.push(
        <span key={i} className="material-symbols-outlined" style={{ fontSize: '14px', color: '#F59E0B', fontVariationSettings: "'FILL' 0" }}>star</span>
      );
    }
  }
  return stars;
};

export default function CourseCard({ course, fallbackImage }) {
  // Use course.average_rating if available, else default to 0
  const rating = Number(course.average_rating ?? course.rating ?? 0);
  const totalReviews = Number(course.total_reviews ?? 0);

  return (
    <Link to={`/courses/${course.id}`} className="text-decoration-none h-100 d-block">
      <div 
        className="course-card-coursera h-100 d-flex flex-column"
        style={{
          backgroundColor: '#1E2228', // Dark theme matching Borsa Academy
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.05)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
        }}
      >
        <div className="position-relative" style={{ height: '160px' }}>
          <img
            src={course.image}
            alt={course.title}
            loading="lazy"
            className="w-100 h-100 object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              if (fallbackImage) e.currentTarget.src = fallbackImage;
            }}
          />
        </div>
        
        <div className="p-3 d-flex flex-column grow">
          <h3 
            className="text-white fw-bold mb-1" 
            style={{ 
              fontSize: '16px', 
              fontFamily: 'var(--font-sans)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
              minHeight: '44.8px' // exactly 2 lines
            }}
          >
            {course.title}
          </h3>
          
          <p className="text-muted mb-2" style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
            {course.instructor || course.instructor_name || 'بورصة أكاديمي'}
          </p>
 
          <div className="mt-auto pt-2 d-flex justify-content-end" style={{ direction: 'ltr' }}>
            <div className="d-flex align-items-center" style={{ gap: '4px' }}>
              <div className="d-flex align-items-center gap-0">
                {renderStars(rating)}
              </div>
              {totalReviews > 0 && (
                <span className="text-white fw-bold font-mono-data" style={{ fontSize: '14px', lineHeight: 1 }}>
                  {rating > 0 ? rating.toFixed(1) : '0.0'}
                </span>
              )}
              <span className="text-muted font-mono-data" style={{ fontSize: '13px' }}>
                ({formatReviewCount(totalReviews)})
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
