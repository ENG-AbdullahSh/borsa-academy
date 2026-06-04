import React, { useRef, useState, useEffect } from 'react';

export default function CinemaVideoPlayer({ src, courseId = 'default', lessonId = '1', innerRef }) {
  const fallbackRef = useRef(null);
  const videoRef = innerRef || fallbackRef;
  const ambientRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const storageKey = `borsa_video_progress_${courseId}_${lessonId}`;

  useEffect(() => {
    // Attempt to resume from localStorage
    const savedTime = localStorage.getItem(storageKey);
    if (savedTime && videoRef.current) {
      videoRef.current.currentTime = parseFloat(savedTime);
      if (ambientRef.current) {
        ambientRef.current.currentTime = parseFloat(savedTime);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync ambient video periodically if it drifts
  const syncAmbient = () => {
    if (ambientRef.current && videoRef.current) {
      if (Math.abs(ambientRef.current.currentTime - videoRef.current.currentTime) > 0.3) {
        ambientRef.current.currentTime = videoRef.current.currentTime;
      }
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current.paused || !isPlaying) {
      videoRef.current.play();
      ambientRef.current?.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      ambientRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      if (dur > 0) {
        setProgress((current / dur) * 100);
      }
      localStorage.setItem(storageKey, current.toString());
      
      // Keep ambient in sync manually to ensure it doesn't drift
      if (ambientRef.current && Math.abs(ambientRef.current.currentTime - current) > 0.25) {
         ambientRef.current.currentTime = current;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    if (ambientRef.current) {
      ambientRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    videoRef.current.volume = val;
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      const restoreVol = volume > 0 ? volume : 1;
      videoRef.current.volume = restoreVol;
      setVolume(restoreVol);
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleMouseMove = () => {
    setIsControlsVisible(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setIsControlsVisible(false);
        setShowSpeedMenu(false);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setIsControlsVisible(false);
      setShowSpeedMenu(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current?.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const speedOptions = [1, 1.25, 1.5, 2];

  return (
    <div 
      ref={containerRef}
      className="cinema-video-container position-relative overflow-hidden w-100"
      style={{ borderRadius: document.fullscreenElement ? '0' : '12px', minHeight: '380px', height: document.fullscreenElement ? '100vh' : 'auto', backgroundColor: '#000', direction: 'ltr' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient Glow Video Element */}
      <video
        ref={ambientRef}
        src={src}
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          filter: 'blur(60px) opacity(0.45)',
          transform: 'scale(1.05)',
          pointerEvents: 'none',
          zIndex: 1,
          objectFit: 'cover'
        }}
        muted
        playsInline
      />

      {/* Main Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{ zIndex: 2, objectFit: 'contain' }}
        controls={false}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={handlePlayPause}
        onSeeked={syncAmbient}
        playsInline
      />

      {/* Play Overlay (Big Center Button) */}
      {!isPlaying && (
        <div 
          onClick={handlePlayPause} 
          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
          style={{ zIndex: 3, cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <div className="d-flex align-items-center justify-content-center border" style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(0,230,118,0.15)', borderColor: 'rgba(0,230,118,0.45)', backdropFilter: 'blur(8px)', transition: 'transform 0.3s' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#00e676', paddingLeft: '4px' }}>play_arrow</span>
          </div>
        </div>
      )}

      {/* Custom Control Bar */}
      <div 
        className={`cinema-controls position-absolute bottom-0 start-0 w-100 p-3 p-md-4 d-flex flex-column gap-2 ${isControlsVisible ? 'controls-visible' : 'controls-hidden'}`}
        style={{ 
          zIndex: 10, 
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
          transition: 'opacity 0.4s ease'
        }}
      >
        
        {/* Progress Bar */}
        <div 
          className="progress-container w-100 d-flex align-items-center" 
          style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.2)', cursor: 'pointer', borderRadius: '4px', position: 'relative' }}
          onClick={handleProgressClick}
        >
          <div 
            className="progress-filled" 
            style={{ 
              width: `${progress}%`, 
              height: '100%', 
              backgroundColor: '#00e676', 
              boxShadow: '0 0 10px rgba(0, 230, 118, 0.6)',
              borderRadius: '4px',
              transition: 'width 0.1s linear'
            }}
          />
        </div>

        {/* Controls Row */}
        <div className="d-flex align-items-center justify-content-between mt-1">
          {/* Left: Play/Pause, Volume, Time */}
          <div className="d-flex align-items-center gap-3 gap-md-4">
            <button onClick={handlePlayPause} className="btn p-0 border-0 text-white d-flex align-items-center interactive-btn">
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            
            <div className="d-flex align-items-center gap-2 group-volume">
              <button onClick={toggleMute} className="btn p-0 border-0 text-white d-flex align-items-center interactive-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                  {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                </span>
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>

            <div className="font-mono-data text-white opacity-75" style={{ fontSize: '13px' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right: Settings / Speed */}
          <div className="d-flex align-items-center gap-3">
            <div className="position-relative">
              <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)} 
                className="btn p-0 border-0 text-white d-flex align-items-center gap-1 interactive-btn"
                style={{ fontSize: '14px', fontWeight: 600 }}
              >
                {playbackRate}x
              </button>

              {/* Speed Menu Dropdown */}
              {showSpeedMenu && (
                <div 
                  className="position-absolute bottom-100 end-0 mb-3 py-2 rounded glass-card"
                  style={{ minWidth: '80px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {speedOptions.map(speed => (
                    <button 
                      key={speed}
                      onClick={() => { setPlaybackRate(speed); setShowSpeedMenu(false); }}
                      className="btn w-100 border-0 text-white text-center py-1 hover-glow-text fw-bold"
                      style={{ fontSize: '13px', backgroundColor: speed === playbackRate ? 'rgba(0, 230, 118, 0.15)' : 'transparent', color: speed === playbackRate ? '#00e676' : 'white' }}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button onClick={toggleFullscreen} className="btn p-0 border-0 text-white d-flex align-items-center interactive-btn">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>fullscreen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
