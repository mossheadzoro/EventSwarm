

"use client";

import { useEffect, useRef, useState } from "react";

export default function StarfieldBackground() {
  const starsRef = useRef<HTMLDivElement[]>([]);
  const mouse = useRef({ x: 0, y: 0 });

  const [stars, setStars] = useState<any[]>([]);

  // Generate stars client side
  useEffect(() => {
    const generated = Array.from({ length: 120 }).map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      depth: Math.random() * 4 + 1
    }));
    setStars(generated);
  }, []);

  // Track mouse globally
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) - 0.5;
      mouse.current.y = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Animate stars (Fixed Memory Leak)
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      starsRef.current.forEach((star, i) => {
        if (!star) return;

        const depth = stars[i]?.depth || 1;
        const moveX = mouse.current.x * depth * 30;
        const moveY = mouse.current.y * depth * 30;

        star.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup prevents the infinite loop stack
    return () => cancelAnimationFrame(animationFrameId);
  }, [stars]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#070b12]">
      {/* galaxy glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_60%)] border-none"/>

      {/* bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-[radial-gradient(circle_at_bottom,rgba(168,85,247,0.45),transparent_70%)] border-none" />

      {/* vignette */}
      <div className="absolute inset-0 bg-linear-to-b from-[#0a1017]/70 via-transparent to-[#0a1017]" />

      {/* stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          ref={(el: any) => (starsRef.current[i] = el)}
          className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-70"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`
          }}
        />
      ))}
    </div>
  );
}