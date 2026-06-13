import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders } from '../utils/api';
import ChatComponent from '../components/ChatComponent';

export default function ChatPage() {
  const { user, token } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchRooms = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
          headers: apiHeaders(token)
        });
        const data = await response.json();
        if (data.status === 'success') {
          setChatRooms(data.data || []);
          if (data.data?.length > 0) {
            // اختيار غرفة البث المباشر تلقائياً إذا وجدت
            const liveRoom = data.data.find(r => r.is_live);
            setSelectedRoomId(liveRoom ? liveRoom.id : data.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, [token]);

  const getRoomName = (room) => {
    if (room.type === 'private') {
      const otherParticipant = room.participants?.find(p => p.user_id !== user?.id);
      return otherParticipant?.user?.name || 'محادثة خاصة';
    }
    return room.name || 'مجموعة';
  };

  const getRoomLabel = (room) => {
    if (room.is_live) return <span className="badge bg-danger ms-1" style={{ fontSize: '10px' }}>🔴 مباشر</span>;
    if (room.scheduled_at) {
      const t = new Date(room.scheduled_at).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' });
      return <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '10px' }}>📅 {t}</span>;
    }
    return null;
  };

  const selectedRoom = chatRooms.find(r => r.id === selectedRoomId);

  return (
    <div className="container-fluid py-5 mt-4" dir="rtl" style={{ maxWidth: '1400px' }}>
      <div className="row g-3">
        
        {/* الشريط الجانبي (Sidebar) */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="rounded-4 h-100 d-flex flex-column" style={{ backgroundColor: '#151719', border: '1px solid #2a2d31' }}>
            <div className="px-4 py-3 border-bottom flex-shrink-0" style={{ borderColor: '#2a2d31' }}>
              <h5 className="mb-0 text-white fw-bold" style={{ fontFamily: 'var(--font-sans)' }}>💬 غرف الدردشة</h5>
            </div>
            <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '75vh' }}>
              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" />
                </div>
              ) : chatRooms.length === 0 ? (
                <div className="text-center py-5 text-muted px-3">
                  <div style={{ fontSize: '40px' }}>💬</div>
                  <p className="mt-2">لا توجد غرف متاحة حالياً</p>
                </div>
              ) : (
                <div className="d-flex flex-column">
                  {chatRooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className="w-100 border-0 d-flex align-items-center gap-3 px-4 py-3 text-start"
                      style={{
                        backgroundColor: selectedRoomId === room.id ? 'rgba(0,230,118,0.08)' : 'transparent',
                        color: selectedRoomId === room.id ? '#00E676' : '#ccc',
                        borderRight: selectedRoomId === room.id ? '3px solid #00E676' : '3px solid transparent',
                        transition: 'all 0.15s ease',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <div
                        className="flex-shrink-0 d-flex align-items-center justify-content-center fw-bold rounded-circle"
                        style={{
                          width: '40px', height: '40px',
                          background: room.is_live ? 'linear-gradient(135deg, #ff4444, #cc0000)' : 'linear-gradient(135deg, #00E676, #00BFA5)',
                          color: '#111', fontSize: '16px',
                        }}
                      >
                        {room.is_live ? '🔴' : getRoomName(room).charAt(0)}
                      </div>
                      <div className="overflow-hidden flex-grow-1">
                        <div className="d-flex align-items-center gap-1">
                          <span className="fw-semibold text-truncate d-block" style={{ fontSize: '14px' }}>
                            {getRoomName(room)}
                          </span>
                          {getRoomLabel(room)}
                        </div>
                        <small className="text-muted" style={{ fontSize: '11px' }}>
                          {room.type === 'private' ? 'خاصة' : room.type === 'global' ? 'عامة' : 'مجموعة'}
                        </small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* مساحة الدردشة الأساسية */}
        <div className="col-12 col-md-8 col-lg-9">
          {selectedRoom ? (
            <div className="d-flex flex-column w-100" style={{ height: '75vh' }}>
              
              {/* البانر الأحمر (Flex Shrink 0 ليظل ثابتاً في الأعلى) */}
              {selectedRoom.is_live && (
                <div
                  className="px-4 py-3 w-100 flex-shrink-0 d-flex align-items-center gap-2 shadow-sm"
                  style={{ 
                    background: 'linear-gradient(135deg, #e53935, #c62828)', 
                    color: '#fff', zIndex: 10,
                    borderTopLeftRadius: '0.75rem', borderTopRightRadius: '0.75rem'
                  }}
                >
                  <span style={{ fontSize: '18px' }} className="animate-pulse">🔴</span>
                  <strong className="tracking-wide">بث مباشر الآن — {getRoomName(selectedRoom)}</strong>
                  <span className="ms-auto" style={{ fontSize: '12px', opacity: 0.9 }}>انضم للمحادثة المباشرة</span>
                </div>
              )}
              
              {/* نافذة الشات (Flex Grow 1 لتأخذ باقي المساحة المتاحة) */}
              <div className="flex-grow-1 w-100 overflow-hidden">
                <ChatComponent
                  chatRoomId={selectedRoomId}
                  roomName={getRoomName(selectedRoom)}
                  isLive={selectedRoom.is_live}
                />
              </div>
              
            </div>
          ) : (
            <div
              className="d-flex flex-column align-items-center justify-content-center rounded-4 w-100"
              style={{ backgroundColor: '#151719', border: '1px solid #2a2d31', height: '75vh' }}
            >
              <div className="text-center text-muted">
                <div style={{ fontSize: '64px', opacity: 0.3 }}>💬</div>
                <h5 className="mt-3">اختر غرفة للبدء</h5>
                <p style={{ fontSize: '13px' }}>ستظهر الغرف المجدولة والبث المباشر هنا</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
