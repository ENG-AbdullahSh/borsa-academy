import React, { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

export default function CinemaVideoPlayer({ videoUrl, src, courseId = 'default', lessonId = '1', innerRef, onVideoEnded }) {
  // containerRef points to the stable wrapper div — Plyr wraps this, not the video directly,
  // which prevents React's virtual DOM from conflicting with Plyr's DOM mutations.
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  // Accept both videoUrl and src props for maximum compatibility with parent components
  const finalUrl = videoUrl || src;

  useEffect(() => {
    console.log('🎬 CinemaVideoPlayer - finalUrl:', finalUrl);
    setHasError(false);
  }, [finalUrl]);

  useEffect(() => {
    // Wait until the container is mounted and we have a URL
    if (!containerRef.current || !finalUrl) return;

    // Find the <video> element inside the container (created by React render)
    const videoEl = containerRef.current.querySelector('video');
    if (!videoEl) return;

    const plyrOptions = {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'settings',
        'pip',
        'fullscreen',
      ],
      settings: ['quality', 'speed'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      muted: false,
      autoplay: false,
      // Disable Plyr's own YouTube/Vimeo detection to keep it in 'video' mode
      youtube: { noCookie: true },
    };

    // Initialise Plyr on the native <video> element
    const player = new Plyr(videoEl, plyrOptions);
    playerRef.current = player;

    // Expose the Plyr instance to the parent component if innerRef is provided
    if (innerRef) {
      if (typeof innerRef === 'function') {
        innerRef(player);
      } else {
        innerRef.current = player;
      }
    }

    // Auto-advance: fire onVideoEnded when the video finishes
    const handleEnded = () => {
      console.log('🎬 Video ended:', finalUrl);
      onVideoEnded?.();
    };
    player.on('ended', handleEnded);

    // Surface a user-friendly error state when the media fails to load
    const handleError = (e) => {
      console.error('🎬 Video source failed to load:', finalUrl, e);
      setHasError(true);
    };
    videoEl.addEventListener('error', handleError);

    return () => {
      // Guard: only remove listener if the element is still live
      try { videoEl.removeEventListener('error', handleError); } catch (_) { /* ignore */ }

      // Destroy Plyr — use try/catch because Plyr may throw if the node is already gone
      try {
        if (playerRef.current) {
          playerRef.current.off('ended', handleEnded);
          playerRef.current.destroy();
          playerRef.current = null;
        }
      } catch (_) { /* ignore */ }

      // Clear parent ref
      if (innerRef) {
        if (typeof innerRef === 'function') innerRef(null);
        else innerRef.current = null;
      }
    };
  }, [finalUrl, innerRef]);

  return (
    <div
      className="w-full relative rounded-lg overflow-hidden shadow-xl bg-black"
      style={{
        '--plyr-color-main': '#00ff7f',
        '--plyr-video-background': '#000000',
        '--plyr-menu-background': 'rgba(15, 23, 42, 0.95)',
        '--plyr-menu-color': '#ffffff',
        '--plyr-menu-radius': '8px',
      }}
    >
      {/* 16:9 wrapper prevents layout collapse while media is loading */}
      <div className="aspect-video w-full flex items-center justify-center">
        {!finalUrl ? (
          // Case 1: No URL provided
          <div className="flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <span className="material-symbols-outlined text-5xl mb-3">videocam_off</span>
            <h5 className="text-white font-bold text-lg mb-1">لا يوجد فيديو</h5>
            <p className="text-sm">رابط الفيديو غير موجود أو غير صالح.</p>
          </div>
        ) : hasError ? (
          // Case 2: URL was provided but the browser failed to fetch/decode it
          <div className="flex flex-col items-center justify-center text-center p-6 text-red-400">
            <span className="material-symbols-outlined text-5xl mb-3">error</span>
            <h5 className="text-white font-bold text-lg mb-1">تعذّر تشغيل الفيديو</h5>
            <p className="text-sm">
              فشل تحميل الفيديو. تحقق من أن الرابط صحيح وأن الخادم يعمل.
            </p>
            <p className="text-xs mt-2 opacity-60 font-mono break-all">{finalUrl}</p>
          </div>
        ) : (
          // Case 3: Valid URL — Plyr will be initialised on this <video> via containerRef
          // crossOrigin="use-credentials" is required when the source is our /api/lessons/{id}/stream
          // endpoint, so the browser sends Sanctum session cookies with Range requests.
          // For external URLs (e.g. sample videos) we omit it to avoid a failed preflight.
          <div ref={containerRef} className="w-full h-full">
            <video
              className="w-full h-full"
              playsInline
              controls
              preload="metadata"
              crossOrigin="use-credentials"
            >
              <source src={finalUrl} type="video/mp4" />
              متصفحك لا يدعم تشغيل الفيديو.
            </video>
          </div>
        )}
      </div>
    </div>
  );
}
