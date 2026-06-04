import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { FiTrash2, FiBell, FiCheckCircle } from 'react-icons/fi';

export default function NotificationsPage() {
  const { notifications, markAllAsRead, markAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
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
            filteredNotifications.map(notif => (
              <div 
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                style={{
                  background: notif.isUnread ? 'rgba(17, 24, 39, 0.9)' : 'rgba(17, 24, 39, 0.4)',
                  border: notif.isUnread ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid rgba(255,255,255,0.05)',
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
                {notif.isUnread && (
                  <div style={{
                    position: 'absolute',
                    top: 0, right: 0, bottom: 0, width: '4px',
                    background: '#00E676',
                    boxShadow: '0 0 10px rgba(0,230,118,0.5)'
                  }} />
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: notif.isUnread ? '#fff' : '#E2E8F0', fontWeight: notif.isUnread ? '700' : '500' }}>
                      {notif.title}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>{notif.time}</span>
                  </div>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px', lineHeight: '1.6' }}>
                    {notif.description}
                  </p>
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
            ))
          )}
        </div>

      </div>
    </div>
  );
}
