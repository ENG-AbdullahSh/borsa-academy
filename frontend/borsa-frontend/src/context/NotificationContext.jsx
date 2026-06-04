import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'مرحباً بك في بورصة أكاديمي!',
      description: 'يسعدنا انضمامك إلى مجتمع المتداولين المحترفين.',
      time: 'قبل ساعتين',
      type: 'system',
      isUnread: true,
    },
    {
      id: '2',
      title: 'تحديث جديد للمنصة',
      description: 'تم إضافة ميزات جديدة للوحة التحكم الخاصة بك.',
      time: 'قبل 5 ساعات',
      type: 'system',
      isUnread: false,
    },
    {
      id: '3',
      title: 'درس جديد متاح',
      description: 'تم إضافة درس "أساسيات التحليل الفني" في مسارك التعليمي.',
      time: 'قبل يوم واحد',
      type: 'course',
      isUnread: false,
    },
    {
      id: '4',
      title: 'إنجاز جديد! 🏆',
      description: 'لقد أكملت 50% من دورة التداول المتقدمة.',
      time: 'قبل 3 أيام',
      type: 'achievement',
      isUnread: false,
    }
  ]);

  const [toast, setToast] = useState(null);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isUnread: false } : n));
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const triggerToast = useCallback((notification) => {
    setToast(notification);
    setTimeout(() => {
      setToast(null);
    }, 5000); // Hide after 5 seconds
  }, []);

  // Simulate receiving a new notification every 40 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newNotif = {
        id: Date.now().toString(),
        title: 'إشعار مباشر (Live)',
        description: 'تم تحديث بيانات السوق لزوج EUR/USD بنجاح.',
        time: 'الآن',
        type: 'system',
        isUnread: true,
      };
      
      setNotifications(prev => [newNotif, ...prev]);
      triggerToast(newNotif);
      
    }, 40000);

    return () => clearInterval(interval);
  }, [triggerToast]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount: notifications.filter(n => n.isUnread).length,
      markAllAsRead,
      markAsRead,
      deleteNotification
    }}>
      {children}
      
      {/* Premium Glassmorphic Toast Notification UI */}
      <div 
        style={{
          position: 'fixed',
          top: toast ? '24px' : '-100px',
          left: '24px',
          opacity: toast ? 1 : 0,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 9999,
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 230, 118, 0.2)',
          borderLeft: '4px solid #00E676',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0, 230, 118, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: '300px',
          maxWidth: '400px',
          direction: 'rtl',
          fontFamily: 'var(--font-sans, "Cairo", sans-serif)'
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
