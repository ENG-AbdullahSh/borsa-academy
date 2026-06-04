import React from 'react';

const SkeletonLoader = ({ className = '' }) => {
  return (
    <div className={`position-relative overflow-hidden rounded-4 glass-card ${className}`}>
      {/* Background with shimmering gradient */}
      <div 
        className="position-absolute w-100 h-100 skeleton-shimmer" 
        style={{
          background: 'linear-gradient(90deg, rgba(23, 23, 23, 1) 0%, rgba(38, 38, 38, 1) 50%, rgba(23, 23, 23, 1) 100%)',
          backgroundSize: '200% 100%',
        }}
      />
      
      {/* Cyber green aura / pulsing fine lines */}
      <div 
        className="position-absolute w-100 h-100 border rounded-4 pointer-events-none" 
        style={{
          borderColor: 'rgba(0,230,118,0.08)',
          boxShadow: 'inset 0 0 15px rgba(0,230,118,0.05)',
        }}
      />

      {/* Basic structural placeholders */}
      <div className="position-relative p-4 h-100 d-flex flex-column justify-content-between z-1" style={{ zIndex: 1 }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="rounded-circle skeleton-pulse" style={{ width: '48px', height: '48px', backgroundColor: '#262626' }} />
        </div>
        <div>
          <div className="rounded mb-2 skeleton-pulse" style={{ width: '33%', height: '32px', backgroundColor: '#262626' }} />
          <div className="rounded skeleton-pulse" style={{ width: '66%', height: '16px', backgroundColor: '#262626' }} />
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
