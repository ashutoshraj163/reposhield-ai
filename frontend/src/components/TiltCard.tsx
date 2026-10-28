import { useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  glowColor?: "cyan" | "purple" | "rose" | "emerald" | "amber";
  maxTilt?: number;
}

export function TiltCard({
  children,
  className = "",
  glowColor = "cyan",
  maxTilt = 8,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50, opacity: 0 });

  const glowMap = {
    cyan: "rgba(6, 182, 212, 0.25)",
    purple: "rgba(139, 92, 246, 0.25)",
    rose: "rgba(244, 63, 94, 0.25)",
    emerald: "rgba(16, 185, 129, 0.25)",
    amber: "rgba(245, 158, 11, 0.25)",
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = -((y - centerY) / centerY) * maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;

    setRotateX(tiltX);
    setRotateY(tiltY);
    setGlowPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlowPos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
      }}
      className="transition-transform duration-200 ease-out"
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
        }}
        className={`relative transition-all duration-200 ease-out rounded-2xl ${className}`}
      >
        {/* Specular light tracking */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
          style={{
            opacity: glowPos.opacity,
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowMap[glowColor]}, transparent 70%)`,
          }}
        />
        {children}
      </div>
    </div>
  );
}
