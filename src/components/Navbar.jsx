import React from 'react';
import { Music, ShieldCheck, Sparkles, User } from 'lucide-react';

export default function Navbar({ currentView, onSelectView, isAdminAuthenticated }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectView('user')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
              <Music className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-300">
                SongCraft AI
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                ElevenLabs
              </span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">Canciones personalizadas a medida</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-gray-900/90 rounded-xl border border-gray-800">
          <button
            onClick={() => onSelectView('user')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentView === 'user'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Crear Canción</span>
          </button>

          <button
            onClick={() => onSelectView('admin')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentView === 'admin'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md shadow-amber-900/40'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Superadmin</span>
            {isAdminAuthenticated && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950"></span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
