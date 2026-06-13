import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import echo from '../utils/echo';

export default function ChatComponent({ chatRoomId, roomName = "غرفة الدردشة", isLive = false }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // عمل Scroll تلقائي لأحدث رسالة
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // جلب الرسائل من السيرفر عند تغيير الغرفة
  useEffect(() => {
    if (!chatRoomId) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        
        const response = await fetch(`${apiUrl}/chat/messages?chat_room_id=${chatRoomId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        
        const data = await response.json();
        if (data.status === 'success') {
          const fetchedMessages = Array.isArray(data.data?.data) ? data.data.data : [];
          setMessages(fetchedMessages.reverse()); // عكس الترتيب لتظهر القديمة فوق والحديثة تحت
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

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

    return () => {
      echo.leaveChannel(channelName);
    };
  }, [chatRoomId]);

  // دالة إرسال الرسالة (Optimistic UI)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage(''); // مسح الـ Input فوراً

    // 1. إضافة الرسالة للواجهة فوراً ليراها الطالب بدون تأخير
    const optimisticMsg = {
      id: Date.now(), // ID وهمي مؤقت
      message: messageText,
      sender_id: user?.id,
      chat_room_id: chatRoomId,
      sender: { name: user?.name, email: user?.email },
      created_at: new Date().toISOString(),
      isOptimistic: true // لمعرفة أنها قيد الإرسال
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    // 2. إرسالها للسيرفر في الخلفية
    try {
      const token = localStorage.getItem('token');
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
          message: messageText
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
    // الحاوية الأساسية للشات: Flexbox Column يملأ الارتفاع المتاح
    <div className={`flex flex-col w-full h-full overflow-hidden shadow-2xl border-[#2F2F2F] bg-[#1E1E1E] text-gray-200 font-sans ${isLive ? 'border-x border-b rounded-b-xl' : 'border rounded-xl'}`} dir="rtl">
      
      {/* 1. رأس الشات (Flex Shrink 0 ليظل ثابتاً في الأعلى) */}
      <div className="flex-shrink-0 flex items-center px-6 py-4 bg-[#121212] border-b border-[#2F2F2F] shadow-sm z-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00E676] to-[#00BFA5] flex items-center justify-center text-white font-bold text-lg shadow-inner">
          {roomName.charAt(0)}
        </div>
        <div className="mr-4">
          <h2 className="text-lg font-semibold tracking-wide text-white">{roomName}</h2>
          <p className="text-xs text-green-400 mt-0.5 flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#00E676] ml-1.5 animate-pulse"></span>
            متصل
          </p>
        </div>
      </div>

      {/* 2. مساحة الرسائل (Flex Grow 1 للتمدد و Overflow للـ Scroll) */}
      <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-[#1E1E1E] to-[#181818] scrollbar-thin scrollbar-thumb-[#2F2F2F] scrollbar-track-transparent">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00E676]"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
            <svg style={{ width: '64px', height: '64px' }} className="opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            <p>لا توجد رسائل سابقة. كن أول من يكتب!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            
            return (
              <div key={msg.id || idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] sm:max-w-[75%] px-5 py-3 rounded-2xl shadow-sm relative transition-all duration-200 ${
                    isMe 
                      ? 'bg-gradient-to-br from-[#00E676] to-[#00C853] text-[#0a1f11] rounded-tl-sm' 
                      : 'bg-[#2D2D2D] text-gray-200 border border-[#3A3A3A] rounded-tr-sm'
                  } ${msg.isOptimistic ? 'opacity-70' : 'opacity-100'}`}
                >
                  {!isMe && (
                    <div className="text-[11px] font-bold text-[#00E676] mb-1 opacity-90 tracking-wide">
                      {msg.sender?.name || 'مستخدم'}
                    </div>
                  )}
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap word-break">
                    {msg.message}
                  </p>
                  <div className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-[#05140b] opacity-70' : 'text-gray-400 opacity-80'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. صندوق الإدخال (Flex Shrink 0 ليظل ثابتاً في الأسفل) */}
      <div className="flex-shrink-0 p-4 bg-[#121212] border-t border-[#2F2F2F]">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="flex-grow bg-[#1E1E1E] border border-[#2F2F2F] text-gray-200 text-sm rounded-xl py-3.5 px-5 focus:outline-none focus:ring-1 focus:ring-[#00E676] focus:border-[#00E676] transition-all placeholder-gray-500 shadow-inner"
            dir="auto"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-[#00E676] text-[#121212] disabled:opacity-50 disabled:bg-[#2D2D2D] disabled:text-gray-500 hover:bg-[#00C853] transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-[#00E676]"
          >
            <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </form>
      </div>

    </div>
  );
}
