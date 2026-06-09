import { useEffect, useState, useCallback } from 'react';
import { FiZap, FiAward, FiActivity } from 'react-icons/fi';
import { API_BASE_URL, apiHeaders } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

function formatTimeAgo(isoString) {
  const date = new Date(isoString);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export default function AdminActivityWidget() {
  const { token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/activity`, {
        headers: apiHeaders(token),
      });
      if (!res.ok) return;
      const json = await res.json();
      setActivities((json.data || []).slice(0, 5));
    } catch {
      // silently fail — widget is non-critical
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchActivities();
    // Poll for new activity every 60 seconds
    const interval = setInterval(fetchActivities, 60_000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  return (
    <section
      style={{
        background: 'rgba(17, 24, 39, 0.7)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderLeft: '4px solid #3B82F6',
        borderRadius: '16px',
        padding: '24px',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiActivity size={17} color="#3B82F6" />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: '#fff',
                fontFamily: 'var(--font-sans)',
              }}
            >
              نشاط الطلاب
            </h2>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>
              آخر 5 أحداث مباشرة
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#3B82F6',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            padding: '3px 10px',
            borderRadius: '999px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          ADMIN ONLY
        </span>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <span
            className="spinner-border spinner-border-sm"
            style={{ color: '#3B82F6' }}
          />
        </div>
      ) : activities.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <FiActivity size={32} color="#334155" />
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#475569' }}>
            لا يوجد نشاط بعد
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activities.map((activity) => {
            const isTrophy = activity.icon === 'trophy';
            const iconColor = isTrophy ? '#FFD700' : '#00E676';
            const iconBg = isTrophy
              ? 'rgba(255, 215, 0, 0.1)'
              : 'rgba(0, 230, 118, 0.1)';
            const iconBorder = isTrophy
              ? '1px solid rgba(255, 215, 0, 0.25)'
              : '1px solid rgba(0, 230, 118, 0.2)';

            return (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  background: activity.is_read
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(59, 130, 246, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  transition: 'background 0.2s ease',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    flexShrink: 0,
                    borderRadius: '10px',
                    background: iconBg,
                    border: iconBorder,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isTrophy ? (
                    <FiAward size={17} color={iconColor} />
                  ) : (
                    <FiZap size={17} color={iconColor} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#E2E8F0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {activity.user_name}
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: '11px',
                      color: '#64748B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {activity.course_title}
                  </p>
                </div>

                {/* Time Badge */}
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: '10px',
                    color: '#475569',
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(255,255,255,0.04)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatTimeAgo(activity.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
