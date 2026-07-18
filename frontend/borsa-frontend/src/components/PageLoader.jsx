import React from 'react';

export default function PageLoader() {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
        {/* Outer pulse ring */}
        <div 
          className="position-absolute rounded-circle"
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid rgba(117, 255, 158, 0.2)',
            animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
        {/* Inner spinning border */}
        <div 
          className="spinner-border" 
          style={{ color: 'var(--primary-color)', width: '3rem', height: '3rem', borderWidth: '3px' }} 
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
      
      <p className="mt-4 font-mono-data text-uppercase" style={{ color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '0.1em', fontSize: '13px' }}>
        جاري تحميل البيانات...
      </p>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
