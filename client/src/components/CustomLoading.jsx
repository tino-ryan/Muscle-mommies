import { useEffect, useRef } from 'react';

export default function CustomLoading({ userName, onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 300;

    let animationFrameId;
    let angle = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background: Soft thrift store beige
      ctx.fillStyle = '#f8f1e9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rotating rack (circle with hangers)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 80;
      ctx.strokeStyle = '#4a4039';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Hangers (simple lines)
      for (let i = 0; i < 6; i++) {
        const hangerAngle = angle + (i * Math.PI) / 3;
        const hangerX = centerX + Math.cos(hangerAngle) * radius;
        const hangerY = centerY + Math.sin(hangerAngle) * radius;
        ctx.beginPath();
        ctx.moveTo(hangerX - 10, hangerY);
        ctx.lineTo(hangerX + 10, hangerY);
        ctx.stroke();
      }

      // Clothes (rectangles fading in)
      const clothes = ['Tee', 'Jeans', 'Jacket'];
      clothes.forEach((item, i) => {
        const clothAngle = angle + (i * Math.PI) / 3 + Math.PI / 6;
        const clothX = centerX + Math.cos(clothAngle) * (radius + 20);
        const clothY = centerY + Math.sin(clothAngle) * (radius + 20);
        const opacity = Math.sin(angle + i) * 0.5 + 0.5; // Fade effect
        ctx.fillStyle = `rgba(75, 60, 57, ${opacity})`; // Dark brown clothes
        ctx.fillRect(clothX - 15, clothY - 30, 30, 40);
        // Deal text
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.font = '12px Helvetica Neue';
        ctx.fillText(
          `$${Math.floor(Math.random() * 20 + 10)} ${item}`,
          clothX,
          clothY + 40
        );
      });

      angle += 0.03; // Slow rotation
      if (angle > Math.PI * 2) angle -= Math.PI * 2;

      // Welcome text after a few loops
      if (angle > Math.PI * 1.5) {
        ctx.fillStyle = '#4a4039';
        ctx.font = '16px Helvetica Neue';
        ctx.textAlign = 'center';
        ctx.fillText(
          `Browsing for you, ${userName || 'ThriftSeeker'}…`,
          centerX,
          50
        );
      }

      animationFrameId = requestAnimationFrame(animate);

      // Complete after ~5-6 seconds (10 full rotations)
      if (angle > Math.PI * 10 && onComplete) onComplete();
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [userName, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        margin: '0 auto',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    />
  );
}
