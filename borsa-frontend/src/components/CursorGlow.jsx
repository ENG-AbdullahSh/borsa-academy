import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CursorGlow = () => {
  const [isHovering, setIsHovering] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };

    const handleMouseOver = (e) => {
      const interactiveElements = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
      const target = e.target;
      const isInteractive = 
        interactiveElements.includes(target.tagName) ||
        target.closest('a') || 
        target.closest('button') ||
        (target.classList && target.classList.contains('masari-card')) ||
        (target.classList && target.classList.contains('interactive'));
        
      setIsHovering(!!isInteractive);
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      style={{
        translateX: cursorXSpring,
        translateY: cursorYSpring,
        position: 'fixed',
        left: 0,
        top: 0,
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: 'rgba(0,230,118,0.15)',
        pointerEvents: 'none',
        zIndex: 9999,
        filter: 'blur(8px)',
      }}
      animate={{
        scale: isHovering ? 1.4 : 1,
        opacity: isHovering ? 0.8 : 0.4,
        filter: isHovering ? 'blur(12px)' : 'blur(8px)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    />
  );
};

export default CursorGlow;
