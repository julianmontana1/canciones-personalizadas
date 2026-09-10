import React from 'react';
import { Music, ShieldCheck, Sparkles, User, ArrowLeft } from 'lucide-react';
import Sparkle from './Sparkle';

export default function Navbar({ currentView, onSelectView, isAdminAuthenticated }) {
  const scrollToSection = (id) => {
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#0d1020] rounded-[10px] flex items-center justify-center">
                <Music className="w-5 h-5 text-pink-400 group-hover:rotate-6 transition-transform" />
              </div>
            </div>
            <Sparkle className="w-2.5 h-2.5 text-pink-300 absolute -top-1 -right-1" animation="animate-twinkle" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Serenat<span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">IA</span>
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
            <button
              type="button"
              onClick={() => scrollToSection('hero')}
              className="hover:text-white transition-colors duration-200"
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('como-funciona')}
              className="hover:text-white transition-colors duration-200"
            >
              Cómo funciona
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('estilos')}
              className="hover:text-white transition-colors duration-200"
            >
              Estilos
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('ejemplos')}
              className="hover:text-white transition-colors duration-200"
            >
              Ejemplos
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('precios')}
              className="hover:text-white transition-colors duration-200"
            >
              Precios
            </button>
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
          
          {/* Prominent Superadmin View Switcher */}
          {currentView === 'admin' ? (
            <button
              type="button"
              onClick={() => onSelectView('user')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-900/40 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la App</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectView('admin')}
              className={`px-2.5 sm:px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-0 sm:gap-2 shadow-sm ${
                isAdminAuthenticated
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                  : 'bg-gray-900/80 border-gray-800 text-gray-300 hover:text-white hover:border-gray-700'
              }`}
              title="Ir al panel Superadmin"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Superadmin</span>
              {isAdminAuthenticated && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950 animate-pulse ml-1.5 sm:ml-0" title="Sesión activa"></span>
              )}
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

        </div>

      </div>
    </header>
  );
}
