import React, { useState } from 'react';
import { Sparkles, User, ArrowLeft, Menu, X } from 'lucide-react';
import Sparkle from './Sparkle';
import BrandMark from './BrandMark';

const NAV_LINKS = [
  { id: 'hero', label: 'Inicio' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'estilos', label: 'Estilos' },
  { id: 'ejemplos', label: 'Ejemplos' },
  { id: 'precios', label: 'Precios' }
];

export default function Navbar({ currentView, onSelectView }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    if (currentView !== 'user') {
      onSelectView('user');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800/80 bg-[#080a14]/90 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        
        {/* Logo SerenatIA */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group flex-shrink-0" 
          onClick={() => {
            onSelectView('user');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[#140A1C] border border-[#2A1A3A] p-1.5 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform duration-300">
              <BrandMark className="w-full h-full" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl tracking-tight text-white">
                <span className="font-bold">Serenat</span><span className="font-light">IA</span>
              </span>
              {currentView === 'admin' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Panel Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">Canciones que tocan el corazón</p>
          </div>
        </div>

        {/* Navigation Links (only shown in user view) */}
        {currentView === 'user' ? (
          <nav className="hidden lg:flex items-center space-x-7 text-sm font-medium text-gray-300">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="hover:text-white transition-colors duration-200"
              >
                {link.label}
              </button>
            ))}
          </nav>
        ) : currentView === 'admin' ? (
          <div className="hidden sm:block text-xs text-gray-400 font-mono">
            Modo Superadministrador • Gestión de Códigos & Solicitudes
          </div>
        ) : (
          <div className="hidden sm:block text-xs text-gray-400 font-mono">
            Documento Legal
          </div>
        )}

        {/* Action Buttons & View Switcher */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          
          {/* No entry point to the admin panel is shown on the user-facing side —
              it's reached only via its own secret URL. This button only appears
              once you're already inside it, to get back to the public app. */}
          {currentView === 'admin' && (
            <button
              type="button"
              onClick={() => onSelectView('user')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-900/40 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la App</span>
            </button>
          )}

          {/* Direct CTA (only in user view) */}
          {currentView === 'user' && (
            <button
              type="button"
              onClick={() => scrollToSection('crear-cancion')}
              className="relative px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-purple-900/40 hover:shadow-purple-600/50 hover:scale-105 active:scale-95 transition-all duration-300 shimmer-effect flex items-center gap-0 sm:gap-2"
            >
              <Sparkle className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-pink-200" animation="animate-twinkle" />
              <span className="hidden sm:inline">Crear mi canción</span>
            </button>
          )}

          {/* Mobile menu toggle (only in user view, where the nav links live) */}
          {currentView === 'user' && (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden min-h-11 min-w-11 flex items-center justify-center rounded-xl border border-gray-800 bg-gray-900/80 text-gray-300 hover:text-white transition-all"
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

        </div>

      </div>

      {/* Mobile nav panel */}
      {currentView === 'user' && isMobileMenuOpen && (
        <nav className="lg:hidden border-t border-gray-800/80 bg-[#080a14]/95 backdrop-blur-xl px-4 py-2">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollToSection(link.id)}
              className="w-full min-h-11 flex items-center text-left text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
