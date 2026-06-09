import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const TOKEN_KEY    = 'borsa_auth_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function authFetch(path, options = {}) {
  const token = getToken();
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

/** Converts a UTC ISO timestamp to a short Arabic relative-time label. */
function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diffMs  = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 1)  return 'الآن';
  if (diffMin < 60) return `قبل ${diffMin} دقيقة`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `قبل ${diffHr} ساعة`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return 'قبل يوم واحد';
  if (diffDay < 30)  return `قبل ${diffDay} أيام`;

  return new Intl.DateTimeFormat('ar-EG', { month: 'short', day: 'numeric' }).format(
    new Date(isoString),
  );
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  reload: () => {},
  addNotification: () => {},
});

export const useNotifications = () => useContext(NotificationContext);
export const useNotification = () => useContext(NotificationContext);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const [toast, setToast]                 = useState(null);

  // Keep a stable ref to the previous unread count so we can trigger toast for new arrivals
  const prevUnreadRef = useRef(0);

  // ── Fetch full notification list ─────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!getToken()) return;   // Guest — do nothing

    setLoading(true);
    try {
      const res  = await authFetch('/notifications');
      if (!res.ok) { setLoading(false); return; }

      const json = await res.json();
      const raw  = Array.isArray(json.data) ? json.data : [];

      const normalized = raw.map((n) => ({
        id:         n.id,
        type:       n.type        || 'system',
        title:      n.title       || 'إشعار',
        description: n.message    || '',
        time:       formatRelativeTime(n.created_at),
        action_url: n.action_url  || null,
        certificate_url: n.certificate_url || null,
        isUnread:   !n.is_read,
      }));

      const count = typeof json.unread_count === 'number'
        ? json.unread_count
        : normalized.filter((n) => n.isUnread).length;

      // If new unread notifications arrived, show a toast for the latest one
      if (count > prevUnreadRef.current && normalized.length > 0) {
        const newest = normalized.find((n) => n.isUnread);
        if (newest) triggerToast(newest);
      }
      prevUnreadRef.current = count;

      setNotifications(normalized);
      setUnreadCount(count);
    } catch {
      // Silently fail — the UI degrades gracefully
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll the lightweight unread-count endpoint every 60 s ───────────────
  useEffect(() => {
    fetchNotifications(); // initial load

    const pollCount = async () => {
      if (!getToken()) return;
      try {
        const res  = await authFetch('/notifications/unread-count');
        if (!res.ok) return;
        const json = await res.json();
        const next = json.unread_count ?? 0;

        // If the count grew, reload the full list to surface new items
        if (next > prevUnreadRef.current) {
          fetchNotifications();
        } else {
          prevUnreadRef.current = next;
          setUnreadCount(next);
        }
      } catch { /* silent */ }
    };

    const interval = setInterval(pollCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Mark a single notification as read ──────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);

    try {
      await authFetch('/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
    } catch { /* optimistic — ignore */ }
  }, []);

  // ── Mark ALL notifications as read ──────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    setUnreadCount(0);
    prevUnreadRef.current = 0;

    try {
      await authFetch('/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ all: true }),
      });
    } catch { /* optimistic — ignore */ }
  }, []);

  // ── Toast helper ────────────────────────────────────────────────────────
  const triggerToast = useCallback((notification) => {
    setToast(notification);
    setTimeout(() => setToast(null), 5000);
  }, []);

  const addNotification = useCallback((notification) => {
    setToast({
      title: notification.title || (notification.type === 'success' ? 'نجاح' : 'إشعار'),
      description: notification.message || notification.description || '',
      time: notification.time || 'الآن',
    });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // ── Delete a single notification ────────────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    setNotifications((prev) => {
      const notifToDelete = prev.find((n) => n.id === id);
      if (notifToDelete && notifToDelete.isUnread) {
        setUnreadCount((c) => Math.max(0, c - 1));
        prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);
      }
      return prev.filter((n) => n.id !== id);
    });

    try {
      const res = await authFetch(`/notifications/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addNotification({ title: 'نجاح', message: 'تم حذف الإشعار بنجاح', type: 'success' });
      }
    } catch { /* optimistic — ignore */ }
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        reload: fetchNotifications,
        addNotification,
      }}
    >
      {children}

      {/* ── Glassmorphic Toast ── */}
      <div
        style={{
          position:            'fixed',
          top:                 toast ? '24px' : '-120px',
          left:                '24px',
          opacity:             toast ? 1 : 0,
          transition:          'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex:              9999,
          background:          'rgba(17, 24, 39, 0.85)',
          backdropFilter:      'blur(16px)',
          WebkitBackdropFilter:'blur(16px)',
          border:              '1px solid rgba(0, 230, 118, 0.2)',
          borderLeft:          '4px solid #00E676',
          borderRadius:        '12px',
          padding:             '16px 20px',
          boxShadow:           '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,230,118,0.1)',
          display:             'flex',
          flexDirection:       'column',
          gap:                 '6px',
          minWidth:            '300px',
          maxWidth:            '400px',
          direction:           'rtl',
          fontFamily:          'var(--font-sans, "Cairo", sans-serif)',
          pointerEvents:       toast ? 'auto' : 'none',
        }}
      >
        {toast && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ color: '#00E676', fontSize: '15px' }}>{toast.title}</strong>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>{toast.time}</span>
            </div>
            <p style={{ margin: 0, color: '#E2E8F0', fontSize: '13.5px', lineHeight: '1.5' }}>
              {toast.description}
            </p>
          </>
        )}
      </div>
    </NotificationContext.Provider>
  );
};
