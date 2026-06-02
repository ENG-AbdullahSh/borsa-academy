import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_CHART_DATA = [
  { day: 'السبت', hours: 2 },
  { day: 'الأحد', hours: 1.5 },
  { day: 'الاثنين', hours: 4 },
  { day: 'الثلاثاء', hours: 3 },
  { day: 'الأربعاء', hours: 2.5 },
  { day: 'الخميس', hours: 5 },
  { day: 'الجمعة', hours: 1 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-3" style={{ 
        border: '1px solid rgba(0, 230, 118, 0.4)', 
        backgroundColor: 'rgba(11, 15, 25, 0.85)', 
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 230, 118, 0.15)'
      }}>
        <p className="text-white m-0 mb-1 fw-bold font-mono-data" style={{ fontSize: '14px', direction: 'rtl' }}>{label}</p>
        <p className="m-0 font-mono-data d-flex align-items-center gap-1 justify-content-end" style={{ color: '#00e676', fontSize: '15px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
          {payload[0].value} ساعات
        </p>
      </div>
    );
  }
  return null;
};

const Masari = () => {
  return (
    <>
      {/* Embedded Custom Styles for Premium Glassmorphism & Hover Effects */}
      <style>{`
        .masari-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
        }
        
        .masari-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 230, 118, 0.4);
          box-shadow: 0 10px 30px rgba(0, 230, 118, 0.15), inset 0 0 20px rgba(0, 230, 118, 0.05);
        }
        
        .masari-card:hover .masari-icon-wrapper {
          background-color: rgba(0, 230, 118, 0.15) !important;
          color: #00e676 !important;
          box-shadow: 0 0 15px rgba(0, 230, 118, 0.4);
          transform: scale(1.05);
        }
        
        .masari-icon-wrapper {
          transition: all 0.3s ease;
        }

        /* Chart Tooltip Custom Animation */
        .recharts-tooltip-wrapper {
          outline: none !important;
          transition: transform 0.15s ease-out !important;
        }
      `}</style>

      <div className="min-vh-100 position-relative pb-5" style={{ backgroundColor: '#0B0F19', direction: 'rtl' }}>
        <div className="container" style={{ paddingTop: '100px', maxWidth: '1200px' }}>
          
          {/* Header Section */}
          <header className="mb-5 text-right">
            <h1 className="fw-bold text-white mb-2" style={{ fontFamily: 'var(--font-sans)', fontSize: '32px' }}>
              مساري التعليمي
            </h1>
            <p className="text-muted m-0" style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', maxWidth: '600px' }}>
              تابع مستوى تقدمك، ساعات الدراسة، والشهادات التي أنجزتها في بورصة أكاديمي.
            </p>
          </header>

          {/* Metric Cards Grid */}
          <div className="row g-4 mb-5">
            {/* Card 1: Enrolled Courses */}
            <div className="col-12 col-md-4">
              <div className="masari-card p-4 rounded-4 position-relative overflow-hidden h-100">
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div className="masari-icon-wrapper d-flex align-items-center justify-content-center rounded-circle" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(129, 207, 255, 0.1)', color: '#81cfff' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>school</span>
                  </div>
                </div>
                <h4 className="fw-bold text-white m-0 mb-1 font-mono-data" style={{ fontSize: '28px' }}>٤</h4>
                <p className="text-muted mb-3 font-mono-data" style={{ fontSize: '13px' }}>الكورسات المسجلة</p>
                
                <div className="d-flex justify-content-between text-white font-mono-data mb-2" style={{ fontSize: '11px' }}>
                  <span>معدل الإنجاز العام</span>
                  <span style={{ color: '#00e676' }}>٦٥٪</span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '99px' }}>
                  <div style={{ width: '65%', height: '100%', backgroundColor: '#00e676', boxShadow: '0 0 8px rgba(0, 230, 118, 0.4)', borderRadius: '99px' }} />
                </div>
              </div>
            </div>

            {/* Card 2: Total Watch Time */}
            <div className="col-12 col-md-4">
              <div className="masari-card p-4 rounded-4 position-relative overflow-hidden h-100">
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div className="masari-icon-wrapper d-flex align-items-center justify-content-center rounded-circle" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255, 171, 145, 0.1)', color: '#ffab91' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>schedule</span>
                  </div>
                </div>
                <h4 className="fw-bold text-white m-0 mb-1 font-mono-data d-flex align-items-baseline gap-1" style={{ fontSize: '28px' }}>
                  ٢٨ <span className="text-muted" style={{ fontSize: '14px' }}>ساعة</span>
                </h4>
                <p className="text-muted m-0 font-mono-data" style={{ fontSize: '13px' }}>إجمالي ساعات المشاهدة</p>
              </div>
            </div>

            {/* Card 3: Completed Certificates */}
            <div className="col-12 col-md-4">
              <div className="masari-card p-4 rounded-4 position-relative overflow-hidden h-100">
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div className="masari-icon-wrapper d-flex align-items-center justify-content-center rounded-circle" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255, 213, 79, 0.1)', color: '#ffd54f' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>workspace_premium</span>
                  </div>
                </div>
                <h4 className="fw-bold text-white m-0 mb-1 font-mono-data" style={{ fontSize: '28px' }}>٢</h4>
                <p className="text-muted mb-3 font-mono-data" style={{ fontSize: '13px' }}>الشهادات المكتملة</p>
                
                <div className="d-flex flex-wrap gap-2">
                  <div className="badge d-flex align-items-center gap-1" style={{ backgroundColor: 'rgba(255, 213, 79, 0.15)', color: '#ffd54f', border: '1px solid rgba(255, 213, 79, 0.3)', padding: '6px 10px', fontSize: '11px', fontFamily: 'var(--font-sans)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>star</span> أساسيات التداول
                  </div>
                  <div className="badge d-flex align-items-center gap-1" style={{ backgroundColor: 'rgba(255, 213, 79, 0.15)', color: '#ffd54f', border: '1px solid rgba(255, 213, 79, 0.3)', padding: '6px 10px', fontSize: '11px', fontFamily: 'var(--font-sans)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>star</span> البرايس أكشن
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Chart Section */}
          <section className="masari-card p-4 rounded-4">
            <div className="d-flex align-items-center gap-2 mb-4">
              <span className="material-symbols-outlined" style={{ color: '#00e676', fontSize: '24px' }}>insights</span>
              <h3 className="h5 fw-bold text-white m-0" style={{ fontFamily: 'var(--font-sans)' }}>
                نشاطك الدراسي الأسبوعي (بالساعات)
              </h3>
            </div>
            
            <div style={{ width: '100%', height: '350px', direction: 'ltr' }}>
              {MOCK_CHART_DATA && MOCK_CHART_DATA.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_CHART_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00E676" floodOpacity="0.8" />
                      </filter>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    
                    <XAxis 
                      dataKey="day" 
                      stroke="rgba(255,255,255,0.4)" 
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'var(--font-sans)' }} 
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.4)" 
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'var(--font-mono)' }} 
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                    />
                    
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0, 230, 118, 0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                    
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#00E676" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#0B0F19', stroke: '#00E676', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#00E676', stroke: '#fff', strokeWidth: 2, style: { filter: 'url(#neonGlow)' } }}
                      style={{ filter: 'url(#neonGlow)' }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default Masari;
