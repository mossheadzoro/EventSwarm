
"use client";

import { useEffect, useRef, useState } from "react";

export default function SwarmBackground() {

  const containerRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement[]>([]);
  const [stars, setStars] = useState<any[]>([]);

  const mouse = useRef({ x: 0, y: 0 });

  // create stars only on client (fix hydration)
  useEffect(() => {

    const s = Array.from({ length: 60 }).map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      depth: Math.random() * 5 + 1
    }));

    setStars(s);

  }, []);

  // mouse tracking
  useEffect(() => {

    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e: MouseEvent) => {
console.log("mouse move");
      const rect = container.getBoundingClientRect();

      mouse.current.x = (e.clientX - rect.left) / rect.width - 0.5;
      mouse.current.y = (e.clientY - rect.top) / rect.height - 0.5;

    };

    container.addEventListener("mousemove", handleMove);

    return () => container.removeEventListener("mousemove", handleMove);

  }, []);

  // animate stars
  useEffect(() => {

    const animate = () => {

      starsRef.current.forEach((star, i) => {

        if (!star) return;

        const depth = stars[i]?.depth || 1;

        const moveX = mouse.current.x * depth * 20;
        const moveY = mouse.current.y * depth * 20;

        star.style.transform = `translate(${moveX}px, ${moveY}px)`;

      });

      requestAnimationFrame(animate);

    };

    animate();

  }, [stars]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >

      {/* main purple glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_60%)]" />

      {/* bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-[radial-gradient(circle_at_bottom,rgba(168,85,247,0.45),transparent_70%)]" />

      {/* vignette */}
      <div className="absolute inset-0 bg-linear-to-b from-[#0a1017]/80 via-transparent to-[#0a1017]" />

      {/* stars */}
      {stars.map((star, i) => (

        <div
          key={i}
          ref={(el: any) => (starsRef.current[i] = el)}
          className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-70 pointer-events-none"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`
          }}
        />

      ))}

    </div>
  );
}