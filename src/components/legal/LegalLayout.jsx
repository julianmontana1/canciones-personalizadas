import React from 'react';
import Sparkle from '../Sparkle';

// Shared visual card used by every clause/section across the three legal pages.
export const LegalSection = ({ icon: Icon, title, children, accent = 'text-purple-400' }) => (
  <div className="glass-panel rounded-3xl border border-gray-800/80 p-6 sm:p-8">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center flex-shrink-0">
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <h2 className="text-base sm:text-lg font-bold text-white">{title}</h2>
    </div>
    <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
      {children}
    </div>
  </div>
);

const LEGAL_PAGES = [
  { hash: '#/terminos', label: 'Términos y Condiciones' },
  { hash: '#/reembolsos', label: 'Política de Reembolsos' },
  { hash: '#/privacidad', label: 'Política de Privacidad' }
];

// Shared page shell (header + ambient background + cross-links to the other two legal
// pages + back-to-home button) so Terms/Refunds/Privacy only need to supply content.
export default function LegalLayout({ eyebrow = 'Documento Legal', title, intro, currentHash, onNavigate, children }) {
  return (
    <div className="min-h-screen bg-[#070913] text-gray-100 relative overflow-hidden">
      <div className="fixed top-12 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkle className="w-3.5 h-3.5 text-pink-400" animation="animate-twinkle" />
            <span>{eyebrow}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto">
            {intro}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('')}
            className="text-xs font-semibold text-purple-300 hover:text-pink-300 transition-colors"
          >
            ← Volver al inicio
          </button>
        </div>

        {children}

        {/* Cross-links to the other legal pages */}
        <div className="pt-6 border-t border-gray-900 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
          {LEGAL_PAGES.map((page) => (
            <button
              key={page.hash}
              type="button"
              onClick={() => onNavigate(page.hash)}
              className={`transition-colors ${
                currentHash === page.hash
                  ? 'text-white font-semibold'
                  : 'text-gray-500 hover:text-purple-300'
              }`}
            >
              {page.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
