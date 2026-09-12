import React from 'react';

// The official SerenatIA isotipo — seven audio-waveform bars with a spark above
// the tallest one, from brandsystem/SerenatIA Brand System.dc.html. `variant`
// picks the gradient: 'dark' (magenta→violeta) for use on dark surfaces,
// 'light' (deep pink→purple) for use on light surfaces.
export default function BrandMark({ className = 'w-8 h-8', variant = 'dark', withSpark = true }) {
  const gradientId = `serenatia-mark-${variant}`;
  const [from, to] = variant === 'light' ? ['#DB2777', '#7C3AED'] : ['#EC4899', '#A855F7'];

  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="3" y1="52" x2="61" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradientId})`}>
        <rect x="3" y="24" width="5" height="16" rx="2.5" />
        <rect x="12" y="17" width="5" height="30" rx="2.5" />
        <rect x="21" y="10" width="5" height="44" rx="2.5" />
        <rect x="30" y="20" width="5" height="24" rx="2.5" />
        <rect x="39" y="12" width="5" height="40" rx="2.5" />
        <rect x="48" y="22" width="5" height="20" rx="2.5" />
        <rect x="57" y="27" width="5" height="10" rx="2.5" />
      </g>
      {withSpark && (
        <path
          d="M23.5 0 L24.9 4.2 L29 5.6 L24.9 7 L23.5 11.2 L22.1 7 L18 5.6 L22.1 4.2 Z"
          fill={variant === 'light' ? from : '#F9A8D4'}
        />
      )}
    </svg>
  );
}
