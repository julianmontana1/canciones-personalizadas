import React from 'react';
import BrandMark from './BrandMark';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SerenatIA] Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070913] flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Brand */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#140A1C] border border-[#2A1A3A] p-3 shadow-lg shadow-purple-500/25">
                <BrandMark className="w-full h-full" />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">
                ¡Ups! Algo salió mal
              </h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                Ocurrió un error inesperado en la aplicación. No te preocupes, 
                tus canciones y datos están seguros. Recarga la página para continuar.
              </p>
            </div>

            {/* Reload Button */}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              Recargar página
            </button>

            {/* Footer hint */}
            <p className="text-[11px] text-gray-600">
              Si el problema persiste, contacta al administrador.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
