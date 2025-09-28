import React, { useState, useEffect, useRef } from 'react';

const LoadingScreen = ({
  isLoading = true,
  logoSrc = null,
  logoText = 'LOGO',
}) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [velocity, setVelocity] = useState({ x: 2, y: 1.5 });
  const logoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isLoading) return;

    const container = containerRef.current;
    const logo = logoRef.current;

    if (!container || !logo) return;

    // Store dimensions once
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const logoWidth = logo.offsetWidth;
    const logoHeight = logo.offsetHeight;

    const animate = () => {
      setPosition((prevPosition) => {
        let newX = prevPosition.x + velocity.x;
        let newY = prevPosition.y + velocity.y;
        let newVelX = velocity.x;
        let newVelY = velocity.y;

        // Bounce off walls (with corrected boundaries)
        if (newX <= 0 || newX + logoWidth >= containerWidth) {
          newVelX = -newVelX;
          newX = Math.max(0, Math.min(containerWidth - logoWidth, newX));
        }

        if (newY <= 0 || newY + logoHeight >= containerHeight) {
          newVelY = -newVelY;
          newY = Math.max(0, Math.min(containerHeight - logoHeight, newY));
        }

        setVelocity({ x: newVelX, y: newVelY });

        return { x: newX, y: newY };
      });
    };

    const intervalId = setInterval(animate, 16); // ~60fps
    return () => clearInterval(intervalId);
  }, [isLoading, velocity]);

  if (!isLoading) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Bouncing Logo */}
      <div
        ref={logoRef}
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '500px',
          height: '330px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: logoSrc ? 'transparent' : '#fff', // Transparent for images, white for text
          borderRadius: logoSrc ? '0' : '12px', // No border radius for images
          boxShadow: logoSrc ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.3)', // No shadow for images
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          fontSize: '24px',
          color: '#333',
          userSelect: 'none',
          transition: 'transform 0.1s ease-out',
        }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="Logo"
            style={{
              maxWidth: '380px',
              maxHeight: '280px',
              objectFit: 'contain',
            }}
            draggable={false}
          />
        ) : (
          <span>{logoText}</span>
        )}
      </div>

      {/* Loading Text */}
      <div
        style={{
          color: '#ffffff',
          fontSize: '28px',
          fontFamily: "'Orbitron', 'Courier New', monospace",
          fontWeight: '500',
          letterSpacing: '3px',
          textAlign: 'center',
          textTransform: 'uppercase',
          animation: 'subtlePulse 2s ease-in-out infinite',
        }}
      >
        LOADING...
      </div>

      {/* Clean CSS Animation */}
      <style>{`
        @keyframes subtlePulse {
          0%,
          100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }

        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
};

export default LoadingScreen;
