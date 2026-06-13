import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import echo from '../utils/echo';

export default function ChatComponent({ chatRoomId, roomName = "غرفة الدردشة", isLive = false }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const chatContainerRef = useRef(null);
  const wasNearBottomRef = useRef(true);
  const isFirstLoad = useRef(true);
  const prevMessagesCountRef = useRef(0);
  const prevLastMessageIdRef = useRef(null);
  const [replyToMessage, setReplyToMessage] = useState(null);

  // دالة التمرير إلى رسالة معينة مع تأثير وميض بصري (Highlight)
  const scrollToMessage = (msgId) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // وميض فقاعة الرسالة
      const bubble = element.querySelector('.message-bubble');
      if (bubble) {
        bubble.classList.add('highlight-message-bubble');
        setTimeout(() => {
          bubble.classList.remove('highlight-message-bubble');
        }, 2000);
      }
    }
  };

  // عمل Scroll تلقائي لأحدث رسالة داخل الحاوية فقط دون التأثير على الصفحة الخارجية
  const scrollToBottom = (behavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: behavior
      });
    }
  };

  // مراقبة التمرير لتحديد ما إذا كان المستخدم قريباً من القاع
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // إذا كان البعد عن القاع أقل من 100 بكسل
    const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
    wasNearBottomRef.current = nearBottom;
  };

  // تصفير حالة التحميل الأول ومراجع الرسائل عند تغيير الغرفة
  useEffect(() => {
    isFirstLoad.current = true;
    wasNearBottomRef.current = true;
    prevMessagesCountRef.current = 0;
    prevLastMessageIdRef.current = null;
  }, [chatRoomId]);

  // التمرير التلقائي الفوري لأسفل عند تحميل الرسائل لأول مرة واكتمال التحميل
  useEffect(() => {
    if (!isLoading && messages.length > 0 && isFirstLoad.current) {
      scrollToBottom('auto');
      isFirstLoad.current = false;
      prevMessagesCountRef.current = messages.length;
      const lastMessage = messages[messages.length - 1];
      prevLastMessageIdRef.current = lastMessage ? lastMessage.id : null;
    }
  }, [isLoading, messages]);

  // معالجة التمرير فقط عند استقبال أو إرسال رسائل جديدة حقيقية
  useEffect(() => {
    if (messages.length > 0 && !isFirstLoad.current) {
      const lastMessage = messages[messages.length - 1];
      const lastMessageId = lastMessage ? lastMessage.id : null;

      // هل هناك رسالة جديدة حقيقية دخلت المحادثة؟
      const isNewMessageArrived =
        messages.length > prevMessagesCountRef.current ||
        (lastMessageId !== null && lastMessageId !== prevLastMessageIdRef.current);

      if (isNewMessageArrived) {
        const isLastMessageMe = lastMessage && lastMessage.sender_id === user?.id;

        // التمرير لأسفل فقط إذا كان المستخدم قريباً من القاع أو هو من كتب الرسالة بنفسه
        if (wasNearBottomRef.current || isLastMessageMe) {
          scrollToBottom('smooth');
        }
      }

      // تحديث المراجع للرسائل الحالية
      prevMessagesCountRef.current = messages.length;
      prevLastMessageIdRef.current = lastMessageId;
    }
  }, [messages, user?.id]);

  // جلب الرسائل من السيرفر عند تغيير الغرفة وتثبيت قنوات التحديث (WebSockets أو Polling)
  useEffect(() => {
    if (!chatRoomId) return;

    let intervalId = null;

    const fetchMessages = async (showLoading = false) => {
      try {
        if (showLoading) setIsLoading(true);
        const token = localStorage.getItem('borsa_auth_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        
        const response = await fetch(`${apiUrl}/chat/messages?chat_room_id=${chatRoomId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        
        const data = await response.json();
        if (data.status === 'success') {
          const fetchedMessages = Array.isArray(data.data?.data) ? data.data.data : [];
          const reversed = fetchedMessages.reverse();
          
          setMessages((prevMessages) => {
            // الاحتفاظ بأي رسائل قيد الإرسال (Optimistic)
            const optimisticMessages = prevMessages.filter(m => m.isOptimistic);
            
            // دمج الرسائل الجديدة مع الرسائل قيد الإرسال التي لم يتم حفظها بعد في قاعدة البيانات
            const merged = [...reversed];
            optimisticMessages.forEach((optMsg) => {
              // إذا لم تكن الرسالة قيد الإرسال موجودة بالفعل ضمن الرسائل المسترجعة من السيرفر، نحتفظ بها
              const alreadySaved = reversed.some(
                m => m.sender_id === optMsg.sender_id && 
                     m.message === optMsg.message && 
                     Math.abs(new Date(m.created_at) - new Date(optMsg.created_at)) < 10000
              );
              if (!alreadySaved) {
                merged.push(optMsg);
              }
            });
            return merged;
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };

    fetchMessages(true);

    if (echo.isMock) {
      // آلية سحب دوري ذكية كبديل محلي عند تعطيل الـ WebSockets
      intervalId = setInterval(() => {
        fetchMessages(false);
      }, 3000);
    } else {
      // الاشتراك في القناة الخاصة بهذه الغرفة (WebSockets)
      const channelName = `chat-room.${chatRoomId}`;
      echo.private(channelName)
        .listen('MessageSent', (e) => {
          setMessages((prevMessages) => {
            // منع تكرار الرسائل إذا استلمناها عبر الـ Echo
            if (prevMessages.find(m => m.id === e.id)) return prevMessages;
            return [...prevMessages, e];
          });
        });
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (!echo.isMock) {
        const channelName = `chat-room.${chatRoomId}`;
        echo.leaveChannel(channelName);
      }
    };
  }, [chatRoomId]);

  // دالة إرسال الرسالة (Optimistic UI)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    const parentMsg = replyToMessage;
    
    setNewMessage(''); // مسح الـ Input فوراً
    setReplyToMessage(null); // مسح حالة الرد فوراً

    // 1. إضافة الرسالة للواجهة فوراً ليراها الطالب بدون تأخير
    const optimisticMsg = {
      id: Date.now(), // ID وهمي مؤقت
      message: messageText,
      sender_id: user?.id,
      chat_room_id: chatRoomId,
      sender: { name: user?.name, email: user?.email },
      created_at: new Date().toISOString(),
      isOptimistic: true, // لمعرفة أنها قيد الإرسال
      parent_id: parentMsg ? parentMsg.id : null,
      parent: parentMsg ? {
        id: parentMsg.id,
        message: parentMsg.message,
        sender: parentMsg.sender ? { name: parentMsg.sender.name } : null
      } : null
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    // 2. إرسالها للسيرفر في الخلفية
    try {
      const token = localStorage.getItem('borsa_auth_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_room_id: chatRoomId,
          message: messageText,
          parent_id: parentMsg ? parentMsg.id : null
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        // استبدال الرسالة الوهمية بالرسالة الحقيقية من السيرفر
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data.data : m));
      } else {
        // فشل الإرسال: حذف الرسالة الوهمية
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };

  return (
    <div className="d-flex flex-column w-100 h-100 overflow-hidden shadow rounded-4" style={{ backgroundColor: '#111417', border: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: 'var(--font-sans)' }} dir="rtl">
      
      {/* 1. رأس الشات */}
      <div className="flex-shrink-0 d-flex align-items-center px-4 py-3" style={{ backgroundColor: '#151719', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="d-flex align-items-center justify-content-center fw-bold rounded-circle shadow-sm text-dark" style={{ width: '42px', height: '42px', background: isLive ? 'linear-gradient(135deg, #ff4444, #cc0000)' : 'linear-gradient(135deg, #00E676, #00BFA5)', fontSize: '16px' }}>
          {isLive ? '🔴' : roomName.charAt(0)}
        </div>
        <div className="ms-0 me-3">
          <h6 className="mb-0 text-white fw-bold" style={{ fontSize: '15px' }}>{roomName}</h6>
          <small className="text-success d-flex align-items-center gap-1.5 mt-0.5" style={{ fontSize: '11px' }}>
            <span className="rounded-circle animate-pulse" style={{ display: 'inline-block', width: '7px', height: '7px', backgroundColor: '#00E676' }}></span>
            متصل
          </small>
        </div>
      </div>

      <style>{`
        @keyframes highlightPulse {
          0% { background-color: rgba(0, 230, 118, 0.4); border-color: #00E676; box-shadow: 0 0 15px rgba(0, 230, 118, 0.4); }
          100% { }
        }
        .highlight-message-bubble {
          animation: highlightPulse 2s ease-out;
        }
        .reply-btn {
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          cursor: pointer;
          font-size: 15px !important;
          color: #94A3B8 !important;
        }
        .message-row:hover .reply-btn {
          opacity: 1;
        }
        .reply-btn:hover {
          transform: scale(1.2) rotate(-15deg);
          color: #00E676 !important;
        }
        .reply-quote:hover {
          background-color: rgba(0, 0, 0, 0.4) !important;
          opacity: 0.9;
        }
      `}</style>

      {/* 2. مساحة الرسائل */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-grow-1 p-4 overflow-auto d-flex flex-column gap-3 custom-scrollbar" 
        style={{ backgroundColor: '#0b0e11' }}
      >
        {isLoading ? (
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted gap-2">
            <span style={{ fontSize: '48px', opacity: 0.4 }}>💬</span>
            <p style={{ fontSize: '14px' }}>لا توجد رسائل سابقة. كن أول من يكتب!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            
            return (
              <div 
                key={msg.id || idx} 
                id={msg.id ? `msg-${msg.id}` : undefined} 
                className={`d-flex w-100 ${isMe ? 'justify-content-end' : 'justify-content-start'} message-row align-items-center gap-2`}
              >
                {/* زر الرد في حال كانت الرسالة لـ Me (يظهر على اليسار) */}
                {isMe && !msg.isOptimistic && (
                  <button 
                    onClick={() => setReplyToMessage(msg)}
                    className="btn reply-btn p-1 border-0 bg-transparent"
                    title="رد على الرسالة"
                  >
                    ↩
                  </button>
                )}

                <div 
                  className="px-4 py-2.5 shadow-sm message-bubble position-relative"
                  style={{
                    maxWidth: '75%',
                    backgroundColor: isMe ? 'rgba(0, 230, 118, 0.1)' : '#191c1f',
                    color: isMe ? '#75ff9e' : '#F8FAFC',
                    border: isMe ? '1px solid rgba(0, 230, 118, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    opacity: msg.isOptimistic ? 0.6 : 1,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease'
                  }}
                >
                  {!isMe && (
                    <div className="fw-bold mb-1" style={{ fontSize: '11px', color: '#00E676' }}>
                      {msg.sender?.name || 'مستخدم'}
                    </div>
                  )}

                  {/* الرسالة الأصلية المقتبسة في حال الرد */}
                  {msg.parent && (
                    <div 
                      onClick={() => scrollToMessage(msg.parent.id)}
                      className="px-3 py-1.5 mb-2 rounded reply-quote"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderRight: '3px solid #00E676',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div className="fw-bold text-success" style={{ fontSize: '10.5px' }}>
                        {msg.parent.sender?.name || 'مستخدم'}
                      </div>
                      <div className="text-muted text-truncate" style={{ maxWidth: '100%' }}>
                        {msg.parent.message}
                      </div>
                    </div>
                  )}

                  <p className="mb-0 text-white" style={{ fontSize: '14.5px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
                    {msg.message}
                  </p>
                  <div className="text-end mt-1.5 opacity-50" style={{ fontSize: '9px', color: '#94A3B8' }}>
                    {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* زر الرد في حال كانت الرسالة للآخرين (يظهر على اليمين) */}
                {!isMe && !msg.isOptimistic && (
                  <button 
                    onClick={() => setReplyToMessage(msg)}
                    className="btn reply-btn p-1 border-0 bg-transparent"
                    title="رد على الرسالة"
                  >
                    ↩
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3. صندوق الإدخال */}
      <div className="flex-shrink-0 p-3" style={{ backgroundColor: '#111417', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        {/* شريط معاينة الرد */}
        {replyToMessage && (
          <div 
            className="d-flex align-items-center justify-content-between px-3 py-2 mb-2 rounded-3 text-white animate-fade-in" 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.04)', 
              borderRight: '4px solid #00E676', 
              fontSize: '13px' 
            }}
          >
            <div className="overflow-hidden">
              <div className="fw-bold text-success" style={{ fontSize: '11px' }}>
                رد على: {replyToMessage.sender?.name || 'مستخدم'}
              </div>
              <div className="text-muted text-truncate" style={{ fontSize: '12px' }}>
                {replyToMessage.message}
              </div>
            </div>
            <button 
              onClick={() => setReplyToMessage(null)}
              className="btn btn-sm text-muted p-0 border-0 bg-transparent"
              style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="d-flex align-items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="form-control custom-input py-2.5 px-4 rounded-3 text-white"
            style={{
              fontSize: '14px',
              backgroundColor: '#191c1f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              direction: 'rtl',
              textAlign: 'right'
            }}
            dir="rtl"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn d-flex align-items-center justify-content-center"
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: '#00E676',
              color: '#111',
              borderRadius: '8px',
              border: 'none',
              transition: 'all 0.2s ease',
              opacity: !newMessage.trim() ? 0.5 : 1
            }}
          >
            <svg style={{ width: '18px', height: '18px', transform: 'rotate(-90deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </form>
      </div>

    </div>
  );
}
