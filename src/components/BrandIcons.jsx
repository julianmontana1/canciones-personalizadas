import React from 'react';

// A handful of the SerenatIA brand icon set (brandsystem/export/iconos/), kept
// as inline components so they behave exactly like lucide-react icons —
// `currentColor` stroke, sized via `className` — and can drop into the same
// spots. Only the ones actually used in the app are included here; the full
// twelve-icon set lives in the brandsystem folder if more are needed later.

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export function BrandSongIcon({ className = 'w-5 h-5' }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M9 17V5l10-2v12" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="15.5" r="2.5" />
    </svg>
  );
}

export function BrandStoryIcon({ className = 'w-5 h-5' }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M20.5 14.5a3 3 0 0 1-3 3H8.5L3.5 21V6a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3z" />
      <path d="M8 8.5h8" />
      <path d="M8 12.5h5" />
    </svg>
  );
}

export function BrandAiIcon({ className = 'w-5 h-5' }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M11 3l1.7 4.8L17.5 9.5l-4.8 1.7L11 16l-1.7-4.8L4.5 9.5l4.8-1.7z" />
      <path d="M18 15l.8 2.2 2.2.8-2.2.8L18 21l-.8-2.2-2.2-.8 2.2-.8z" />
    </svg>
  );
}

export function BrandDownloadIcon({ className = 'w-5 h-5' }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 3.5v10.5" />
      <path d="M7.8 10.2 12 14.4l4.2-4.2" />
      <path d="M4.5 19h15" />
    </svg>
  );
}
