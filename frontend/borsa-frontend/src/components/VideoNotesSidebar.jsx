import React, { useState, useEffect } from 'react';

export default function VideoNotesSidebar({ videoRef, courseId = 'default', lessonId = '1' }) {
  const storageKey = `borsa_notes_${courseId}_${lessonId}`;
  
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [activeTimestamp, setActiveTimestamp] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // Load notes on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch(e) {
        console.error('Failed to parse notes');
      }
    }
  }, [storageKey]);

  // Save notes on update
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes, storageKey]);

  // Time formatter
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const h = Math.floor(m / 60);
    if (h > 0) {
      return `${h}:${(m % 60).toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFocus = () => {
    if (!isTyping && videoRef?.current) {
      setActiveTimestamp(videoRef.current.currentTime);
      setIsTyping(true);
    }
  };

  const handleChange = (e) => {
    setCurrentNote(e.target.value);
    if (e.target.value === '') {
      setIsTyping(false);
    } else if (!isTyping && videoRef?.current) {
      setActiveTimestamp(videoRef.current.currentTime);
      setIsTyping(true);
    }
  };

  const saveNote = () => {
    if (currentNote.trim() === '') return;
    
    const newNote = {
      id: Date.now().toString(),
      timestamp: activeTimestamp,
      text: currentNote.trim(),
      date: new Date().toISOString()
    };
    
    setNotes(prev => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp));
    setCurrentNote('');
    setIsTyping(false);
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const jumpToTime = (time) => {
    if (videoRef?.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  return (
    <div className="video-notes-sidebar glass-card rounded-3 d-flex flex-column h-100" style={{ minHeight: '380px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Header */}
      <div className="p-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <h3 className="h6 text-white fw-bold mb-0 d-flex align-items-center gap-2" style={{ fontFamily: 'var(--font-sans)' }}>
          <span className="material-symbols-outlined" style={{ color: '#00e676', fontSize: '20px' }}>edit_note</span>
          ملاحظات المحاضرة
        </h3>
      </div>

      {/* Input Area */}
      <div className="p-3 border-bottom position-relative" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="font-mono-data fw-semibold text-white d-flex align-items-center gap-1" style={{ fontSize: '11px', backgroundColor: 'rgba(0, 230, 118, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 230, 118, 0.3)', color: '#00e676', direction: 'ltr' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>schedule</span>
            {isTyping ? `${formatTime(activeTimestamp)}` : '00:00'}
          </span>
          <span className="font-mono-data text-muted" style={{ fontSize: '10px' }}>
            {currentNote.length}/500
          </span>
        </div>
        
        <textarea 
          className="form-control custom-input font-mono-data text-white mb-2 custom-scrollbar"
          placeholder="دوّن ملاحظاتك هنا..."
          value={currentNote}
          onChange={handleChange}
          onFocus={handleFocus}
          maxLength={500}
          rows="3"
          style={{ resize: 'none', fontSize: '12px', backgroundColor: 'rgba(11, 14, 17, 0.5)', borderColor: isTyping ? 'rgba(0, 230, 118, 0.3)' : 'var(--outline-color)' }}
        />
        
        <div className="d-flex justify-content-end">
          <button 
            onClick={saveNote}
            disabled={currentNote.trim() === ''}
            className="btn btn-sm fw-bold d-flex align-items-center gap-1 interactive-btn" 
            style={{ 
              backgroundColor: currentNote.trim() ? '#00e676' : 'rgba(255,255,255,0.05)', 
              color: currentNote.trim() ? '#0b0e11' : 'rgba(255,255,255,0.3)', 
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.3s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>save</span>
            حفظ
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center text-muted" style={{ opacity: 0.6 }}>
            <span className="material-symbols-outlined mb-2" style={{ fontSize: '32px' }}>speaker_notes_off</span>
            <p className="font-mono-data m-0" style={{ fontSize: '12px' }}>لا توجد ملاحظات مسجلة بعد</p>
          </div>
        ) : (
          notes.map((note) => (
            <div 
              key={note.id} 
              className="note-card p-3 rounded border hover-glow-subtle position-relative"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onClick={() => jumpToTime(note.timestamp)}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span 
                  className="font-mono-data fw-bold text-white d-inline-flex align-items-center gap-1 note-timestamp-badge"
                  style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(129, 207, 255, 0.15)', color: '#81cfff', border: '1px solid rgba(129, 207, 255, 0.3)', transition: 'all 0.2s ease', direction: 'ltr' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>play_circle</span>
                  {formatTime(note.timestamp)}
                </span>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="btn p-0 border-0 text-muted note-delete-btn"
                  style={{ transition: 'color 0.2s ease' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                </button>
              </div>
              <p className="m-0 text-white font-mono-data" style={{ fontSize: '12px', lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {note.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
