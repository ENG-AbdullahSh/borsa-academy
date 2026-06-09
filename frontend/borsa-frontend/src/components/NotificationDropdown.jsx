import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiBell, FiCheckCircle, FiMail, FiMessageSquare, FiInfo } from 'react-icons/fi';
import { useNotifications } from '../context/NotificationContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Picks a contextual icon based on the notification title text.
 * Keeps the icon purely presentational — no backend changes needed.
 */
function NotifIcon({ title = '' }) {
  const t = title.toLowerCase();
  const style = { flexShrink: 0, marginTop: '2px' };

  if (t.includes('رسالة') || t.includes('contact'))
    return <FiMail size={15} color="#81cfff" style={style} />;

  if (t.includes('رد') || t.includes('reply'))
    return <FiMessageSquare size={15} color="#00E676" style={style} />;

  return <FiInfo size={15} color="#94A3B8" style={style} />;
}

// ─── Animation variants ────────────────────────────────────────────────────────

const dropdownVariants = {
  hidden : { opacity: 0, scale: 0.95, y: -8,  transformOrigin: 'top left'  },
  visible: { opacity: 1, scale: 1,    y: 0,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit   : { opacity: 0, scale: 0.95, y: -6,
    transition: { duration: 0.15, ease: 'easeIn' } },
};

const listVariants = {
  visible: { transition: { staggerChildren: 0.045 } },
};

const itemVariants = {
  hidden : { opacity: 0, x: 8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function NotificationDropdown({ open, onToggle, onClose }) {
  const navigate   = useNavigate();
  const wrapperRef = useRef(null);

  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleItemClick = (notif) => {
    markAsRead(notif.id);
    onClose();
    navigate(notif.action_url || '/notifications');
  };

  return (
    <div className="position-relative" ref={wrapperRef}>
      {/* ── Bell Button ── */}
      <button
        onClick={onToggle}
        aria-label="الإشعارات"
        aria-expanded={open}
        style={{
          background:     'transparent',
          border:         'none',
          position:       'relative',
          padding:        '8px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          cursor:         'pointer',
          color:          '#F1F5F9',
          borderRadius:   '50%',
        }}
      >
        {/* Pulse wrapper — only active when there are unread items */}
        <span className={unreadCount > 0 ? 'bell-has-unread' : ''}>
          <FiBell size={22} />
        </span>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            style={{
              position:        'absolute',
              top:             '3px',
              right:           '4px',
              minWidth:        '17px',
              height:          '17px',
              padding:         '0 3px',
              background:      '#00E676',
              borderRadius:    '9px',
              border:          '2px solid #0B0F19',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        '9px',
              fontWeight:      '800',
              color:           '#003918',
              lineHeight:      1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* ── Dropdown Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position:            'absolute',
              top:                 'calc(100% + 10px)',
              left:                '0',
              width:               '340px',
              background:          'rgba(11, 15, 25, 0.92)',
              backdropFilter:      'blur(20px)',
              WebkitBackdropFilter:'blur(20px)',
              border:              '1px solid rgba(255,255,255,0.08)',
              borderRadius:        '18px',
              boxShadow:           '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,230,118,0.04)',
              overflow:            'hidden',
              zIndex:              1050,
              direction:           'rtl',
            }}
          >
            {/* Header */}
            <div style={{
              padding:      '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display:      'flex',
              justifyContent:'space-between',
              alignItems:   'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiBell size={15} color="#00E676" />
                <h3 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: '700' }}>
                  الإشعارات
                </h3>
                {unreadCount > 0 && (
                  <span style={{
                    background:   'rgba(0,230,118,0.12)',
                    border:       '1px solid rgba(0,230,118,0.25)',
                    borderRadius: '20px',
                    color:        '#00E676',
                    fontSize:     '10px',
                    fontWeight:   '700',
                    padding:      '1px 8px',
                  }}>
                    {unreadCount} جديد
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border:     'none',
                    color:      '#00E676',
                    fontSize:   '12px',
                    cursor:     'pointer',
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '4px',
                    padding:    '4px 8px',
                    borderRadius: '6px',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,230,118,0.08)'}
                  onMouseOut={(e)  => e.currentTarget.style.background = 'none'}
                >
                  <FiCheckCircle size={13} />
                  قراءة الكل
                </button>
              )}
            </div>

            {/* Body */}
            <div
              className="notif-scroll"
              style={{ maxHeight: '320px', overflowY: 'auto' }}
            >
              {notifLoading ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                    style={{ display: 'inline-block', width: '22px', height: '22px',
                             border: '2px solid rgba(0,230,118,0.2)',
                             borderTopColor: '#00E676', borderRadius: '50%' }}
                  />
                  <p style={{ color: '#64748B', fontSize: '12px', marginTop: '10px', marginBottom: 0 }}>
                    جاري التحميل...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#475569' }}>
                  <FiBell size={28} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>لا توجد إشعارات حالياً</p>
                </div>
              ) : (
                <motion.div variants={listVariants} initial="hidden" animate="visible">
                  {notifications.slice(0, 6).map((notif) => (
                    <motion.div
                      key={notif.id}
                      variants={itemVariants}
                      onClick={() => handleItemClick(notif)}
                      style={{
                        padding:      '13px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background:   notif.isUnread ? 'rgba(0,230,118,0.04)' : 'transparent',
                        cursor:       'pointer',
                        display:      'flex',
                        gap:          '10px',
                        alignItems:   'flex-start',
                        transition:   'background 0.15s',
                      }}
                      whileHover={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      {/* Type icon */}
                      <div style={{
                        width:          '32px',
                        height:         '32px',
                        flexShrink:     0,
                        borderRadius:   '8px',
                        background:     'rgba(255,255,255,0.04)',
                        border:         '1px solid rgba(255,255,255,0.06)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                      }}>
                        <NotifIcon title={notif.title} />
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <h4 style={{
                            margin:     0,
                            fontSize:   '12.5px',
                            fontWeight: '700',
                            color:      notif.isUnread ? '#fff' : '#CBD5E1',
                            whiteSpace: 'nowrap',
                            overflow:   'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth:   '180px',
                          }}>
                            {notif.title}
                          </h4>
                          <span style={{ fontSize: '10px', color: '#475569', flexShrink: 0 }}>
                            {notif.time}
                          </span>
                        </div>
                        <p style={{
                          margin:              0,
                          fontSize:            '11.5px',
                          color:               '#64748B',
                          lineHeight:          '1.5',
                          display:             '-webkit-box',
                          WebkitLineClamp:     2,
                          WebkitBoxOrient:     'vertical',
                          overflow:            'hidden',
                        }}>
                          {notif.description}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {notif.isUnread && <div className="notif-unread-dot" style={{ marginTop: '4px' }} />}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding:    '11px 16px',
              borderTop:  '1px solid rgba(255,255,255,0.05)',
              textAlign:  'center',
              background: 'rgba(0,0,0,0.15)',
            }}>
              <button
                onClick={() => { onClose(); navigate('/notifications'); }}
                style={{
                  background: 'none',
                  border:     'none',
                  color:      '#00E676',
                  fontSize:   '12.5px',
                  fontWeight: '600',
                  cursor:     'pointer',
                  padding:    '2px 0',
                }}
              >
                عرض كل الإشعارات ←
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
