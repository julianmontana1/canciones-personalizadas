import React from 'react';

/**
 * Sparkle icon component with smooth twinkle animation and glow
 */
export default function Sparkle({
  className = 'w-4 h-4 text-pink-400',
  animation = 'animate-twinkle',
  style = {}
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${className} ${animation} transition-all duration-300 pointer-events-none inline-block`}
      style={style}
    >
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

/**
 * Floating sparkle cluster for hero, cards or banners
 */
export function SparkleCluster({ className = '' }) {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <Sparkle className="w-3.5 h-3.5 text-pink-300 absolute -top-1 -left-2" animation="animate-twinkle" />
      <Sparkle className="w-2 h-2 text-purple-300 absolute top-3 -right-3" animation="animate-twinkle-delay-1" />
      <Sparkle className="w-2.5 h-2.5 text-amber-300 absolute -bottom-2 right-1" animation="animate-twinkle-delay-2" />
    </div>
  );
}
