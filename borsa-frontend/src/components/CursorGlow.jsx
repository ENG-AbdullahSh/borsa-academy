import React, { useEffect, useState } from 'react';

export default function CursorGlow() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100] opacity-30 mix-blend-screen"
      style={{
        background: `radial-gradient(600px circle at ${coords.x}px ${coords.y}px, rgba(117, 255, 158, 0.08), transparent 45%)`,
      }}
    />
  );
}
