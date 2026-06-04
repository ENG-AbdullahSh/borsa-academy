import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SkeletonLoader from '../components/SkeletonLoader';

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

const TiltCard = ({ children, className = '' }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={`masari-card rounded-4 position-relative overflow-hidden h-100 ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ transform: "translateZ(30px)", height: '100%', pointerEvents: "none" }}>
        {/* We add pointer-events: none here and reset it on children to prevent jitter */}
        <div style={{ pointerEvents: "auto", height: '100%' }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

const Masari = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        .masari-card {
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
        }
        
        .masari-card:hover, .masari-card:focus-within {
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

        .recharts-tooltip-wrapper {
          outline: none !important;
          transition: transform 0.15s ease-out !important;
        }

        /* Custom Bento Grid */
        .bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        
        @media (min-width: 768px) {
          .bento-grid {
            grid-template-columns: repeat(3, 1fr);
            grid-auto-rows: minmax(180px, auto);
          }
          .md-col-span-2 { grid-column: span 2; }
          .md-row-span-2 { grid-row: span 2; }
        }
      `}</style>

      <div className="min-vh-100 position-relative pb-5" style={{ backgroundColor: '#0B0F19', direction: 'rtl' }}>
        <div className="container" style={{ paddingTop: '100px', maxWidth: '1200px' }}>
          
          <header className="mb-5 text-right">
            <h1 className="fw-bold text-white mb-2" style={{ fontFamily: 'var(--font-sans)', fontSize: '32px' }}>
              مساري التعليمي
            </h1>
            <p className="text-muted m-0" style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', maxWidth: '600px' }}>
              لوحة تحكم تفاعلية بتقنية 3D Tilt لمتابعة مقاييس التداول وأداء المحفظة الاستثمارية.
            </p>
          </header>

          <div className="bento-grid mb-5">
            {isLoading ? (
              <>
                <SkeletonLoader className="h-100 w-100 md-col-span-2 md-row-span-2" />
                <SkeletonLoader className="h-100 w-100" />
                <SkeletonLoader className="h-100 w-100" />
                <SkeletonLoader className="h-100 w-100" />
                <SkeletonLoader className="h-100 w-100 md-col-span-2" />
              </>
            ) : (
              <>
                {/* Main Performance Analytics Card (Spans 2 cols, 2 rows) */}
                <TiltCard className="p-4 md-col-span-2 md-row-span-2">
                  <div className="d-flex align-items-center gap-2 mb-4">
                    <span className="material-symbols-outlined" style={{ color: '#00e676', fontSize: '24px' }}>insights</span>
                    <h3 className="h5 fw-bold text-white m-0" style={{ fontFamily: 'var(--font-sans)' }}>
                      تحليلات الأداء (Performance Analytics)
                    </h3>
                  </div>
                  
                  <div style={{ width: '100%', height: '350px', direction: 'ltr' }}>
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
                          axisLine={false} tickLine={false} dy={10}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.4)" 
                          tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'var(--font-mono)' }} 
                          axisLine={false} tickLine={false} dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0, 230, 118, 0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                        <Line 
                          type="monotone" dataKey="hours" stroke="#00E676" strokeWidth={3} 
                          dot={{ r: 4, fill: '#0B0F19', stroke: '#00E676', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#00E676', stroke: '#fff', strokeWidth: 2, style: { filter: 'url(#neonGlow)' } }}
                          style={{ filter: 'url(#neonGlow)' }}
                          animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TiltCard>

                {/* Trading Metrics Card */}
                <TiltCard className="p-4">
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="masari-icon-wrapper d-flex align-items-center justify-content-center rounded-circle" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(129, 207, 255, 0.1)', color: '#81cfff' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>monitoring</span>
                    </div>
                  </div>
                  <h4 className="fw-bold text-white m-0 mb-1 font-mono-data" style={{ fontSize: '28px' }}>+٢٤.٥٪</h4>
                  <p className="text-muted mb-3 font-mono-data" style={{ fontSize: '13px' }}>عائد الاستثمار الأسبوعي</p>
                  <div className="d-flex justify-content-between text-white font-mono-data mb-2" style={{ fontSize: '11px' }}>
                    <span>الهدف الشهري</span>
                    <span style={{ color: '#00e676' }}>٨٠٪</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '99px' }}>
                    <div style={{ width: '80%', height: '100%', backgroundColor: '#00e676', boxShadow: '0 0 8px rgba(0, 230, 118, 0.4)', borderRadius: '99px' }} />
                  </div>
                </TiltCard>

                {/* Live Gold/BTC Mock Tracks */}
                <TiltCard className="p-4">
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="masari-icon-wrapper d-flex align-items-center justify-content-center rounded-circle" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255, 213, 79, 0.1)', color: '#ffd54f' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>currency_bitcoin</span>
                    </div>
                  </div>
                  <h4 className="fw-bold text-white m-0 mb-1 font-mono-data d-flex align-items-baseline gap-1" style={{ fontSize: '24px', direction: 'ltr' }}>
                    $64,230 <span style={{ fontSize: '14px', color: '#00e676' }}>+1.2%</span>
                  </h4>
                  <p className="text-muted m-0 font-mono-data" style={{ fontSize: '13px' }}>سعر البيتكوين المباشر</p>
                  <div className="mt-4 d-flex align-items-baseline gap-1 font-mono-data" style={{ direction: 'ltr' }}>
                    <span className="text-white fw-bold" style={{ fontSize: '20px' }}>$2,340</span>
                    <span style={{ fontSize: '12px', color: '#ff5252' }}>-0.4%</span>
                    <span className="text-muted ms-2" style={{ fontSize: '12px', direction: 'rtl' }}>الذهب</span>
                  </div>
                </TiltCard>

                {/* Recent Deals */}
                <TiltCard className="p-4 md-col-span-2">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="material-symbols-outlined" style={{ color: '#81cfff', fontSize: '24px' }}>receipt_long</span>
                    <h3 className="h6 fw-bold text-white m-0" style={{ fontFamily: 'var(--font-sans)' }}>
                      أحدث الصفقات (Recent Deals)
                    </h3>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center p-2 rounded-3 hover-glow-subtle" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px', backgroundColor: 'rgba(0,230,118,0.1)', color: '#00e676' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call_made</span>
                        </div>
                        <div>
                          <p className="m-0 text-white font-mono-data" style={{ fontSize: '14px' }}>شراء BTC/USDT</p>
                          <p className="m-0 text-muted" style={{ fontSize: '11px' }}>منذ ساعتين</p>
                        </div>
                      </div>
                      <span className="fw-bold font-mono-data" style={{ color: '#00e676', fontSize: '14px', direction: 'ltr' }}>+$450.00</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 rounded-3 hover-glow-subtle" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255,82,82,0.1)', color: '#ff5252' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call_received</span>
                        </div>
                        <div>
                          <p className="m-0 text-white font-mono-data" style={{ fontSize: '14px' }}>بيع ETH/USDT</p>
                          <p className="m-0 text-muted" style={{ fontSize: '11px' }}>أمس</p>
                        </div>
                      </div>
                      <span className="fw-bold font-mono-data" style={{ color: '#ff5252', fontSize: '14px', direction: 'ltr' }}>-$120.00</span>
                    </div>
                  </div>
                </TiltCard>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default Masari;
