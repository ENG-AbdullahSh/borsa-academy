import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { FiTrash2, FiBell, FiCheckCircle, FiMessageSquare, FiAward, FiBookOpen, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function getNotificationGroup(notif) {
  if (!notif) return 'system';
  
  const type = (notif.type || '').toLowerCase();
  const category = (notif.category || '').toLowerCase();

  // 1. Achievement
  if (
    type === 'achievement' ||
    category === 'achievement' ||
    type === 'certificate' ||
    category === 'certificate' ||
    type.startsWith('certificate.') ||
    type === 'course.finished'
  ) {
    return 'achievement';
  }

  // 2. Course
  if (
    type === 'course' ||
    category === 'course' ||
    type === 'lesson' ||
    category === 'lesson' ||
    type === 'quiz' ||
    category === 'quiz' ||
    type === 'live_session' ||
    category === 'live_session' ||
    type.startsWith('course.') ||
    type.startsWith('lesson.') ||
    type.startsWith('quiz.') ||
    type.startsWith('live_session.')
  ) {
    return 'course';
  }

  // 3. System
  return 'system';
}

export default function NotificationsPage() {
  const { notifications, markAllAsRead, markAsRead, deleteNotification, deleteAllNotifications } = useNotifications();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return getNotificationGroup(n) === filter;
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0B0F19',
      paddingTop: '100px',
      paddingBottom: '60px',
      direction: 'rtl',
      fontFamily: 'var(--font-sans, "Cairo", sans-serif)',
      color: '#F1F5F9'
    }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '12px', 
              background: 'rgba(0, 230, 118, 0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(0, 230, 118, 0.2)'
            }}>
              <FiBell size={24} color="#00E676" />
            </div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#fff' }}>كل الإشعارات</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={markAllAsRead}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94A3B8',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#00E676'}
              onMouseOut={(e) => e.currentTarget.style.color = '#94A3B8'}
            >
              <FiCheckCircle />
              تحديد الكل كمقروء
            </button>
            {notifications.length > 0 && (
              <button
                onClick={deleteAllNotifications}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(239,68,68,0.22)',
                  color: '#FCA5A5',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#EF4444';
                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#FCA5A5';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <FiTrash2 />
                حذف كل الإشعارات
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'course', label: 'الكورسات' },
            { id: 'system', label: 'النظام' },
            { id: 'achievement', label: 'الإنجازات' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: filter === f.id ? '1px solid #00E676' : '1px solid rgba(255,255,255,0.1)',
                background: filter === f.id ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
                color: filter === f.id ? '#00E676' : '#94A3B8',
                fontSize: '14px',
                fontWeight: filter === f.id ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <FiBell size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p style={{ fontSize: '18px' }}>لا توجد إشعارات هنا</p>
            </div>
          ) : (
            filteredNotifications.map(notif => {
              const group = getNotificationGroup(notif);
              const isReply = notif.title && notif.title.includes('رد');
              const isAchievement = group === 'achievement';
              const isCourse = group === 'course';
              const isSystem = group === 'system';
              
              let icon = <FiBell size={18} color="#94A3B8" />;
              let iconBg = 'rgba(255, 255, 255, 0.05)';
              let iconBorder = '1px solid rgba(255,255,255,0.1)';
              let borderLeft = '1px solid rgba(255,255,255,0.05)';

              if (isReply) {
                icon = <FiMessageSquare size={18} color="#00E676" />;
                iconBg = 'rgba(0, 230, 118, 0.1)';
                iconBorder = '1px solid rgba(0, 230, 118, 0.2)';
                borderLeft = '4px solid #00E676';
              } else if (isAchievement) {
                icon = <FiAward size={18} color="#FFD700" />;
                iconBg = 'rgba(255, 215, 0, 0.1)';
                iconBorder = '1px solid rgba(255, 215, 0, 0.3)';
                borderLeft = '4px solid #FFD700';
              } else if (isCourse) {
                icon = <FiBookOpen size={18} color="#3B82F6" />;
                iconBg = 'rgba(59, 130, 246, 0.1)';
                iconBorder = '1px solid rgba(59, 130, 246, 0.2)';
                borderLeft = '4px solid #3B82F6';
              } else if (isSystem) {
                icon = <FiInfo size={18} color="#A855F7" />;
                iconBg = 'rgba(168, 85, 247, 0.1)';
                iconBorder = '1px solid rgba(168, 85, 247, 0.2)';
                borderLeft = '4px solid #A855F7';
              }
              
              const handleNotificationClick = () => {
                markAsRead(notif.id);
                if (notif.action_url) {
                  navigate(notif.action_url);
                }
              };

              return (
                <div 
                  key={notif.id}
                  onClick={handleNotificationClick}
                  className={isAchievement ? 'achievement-pulse' : ''}
                  style={isAchievement ? {
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  } : {
                    background: notif.isUnread ? 'rgba(17, 24, 39, 0.9)' : 'rgba(17, 24, 39, 0.4)',
                    border: notif.isUnread ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                    borderLeft: borderLeft,
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isAchievement && (
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '100px',
                      height: '100px',
                      background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0) 70%)',
                      pointerEvents: 'none'
                    }} />
                  )}

                  <div style={{
                    width: '40px',
                    height: '40px',
                    flexShrink: 0,
                    borderRadius: '10px',
                    background: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: iconBorder,
                    zIndex: 1
                  }}>
                    {icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: notif.isUnread ? '#fff' : '#E2E8F0', fontWeight: '800' }}>
                        {notif.title}
                      </h3>
                      <span style={{ fontSize: '12px', color: '#64748B', flexShrink: 0 }}>{notif.time}</span>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      color: '#94A3B8', 
                      fontSize: '14px', 
                      lineHeight: '1.6',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden' 
                    }}>
                      {notif.description || notif.message}
                    </p>
                    {isAchievement && notif.action_url && (
                      <div style={{ marginTop: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#FFD700',
                          fontSize: '13px',
                          fontWeight: '600',
                          background: 'rgba(255, 215, 0, 0.1)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 215, 0, 0.2)'
                        }}>
                          <FiAward size={14} />
                          عرض الشهادة
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748B',
                      padding: '8px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'transparent'; }}
                    aria-label="حذف الإشعار"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
