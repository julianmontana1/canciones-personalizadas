import React, { useState } from 'react';
import { Key, Sparkles, AlertTriangle, CheckCircle2, History, RefreshCw, ChevronRight, Music, ShieldCheck } from 'lucide-react';
import Sparkle from './Sparkle';

export default function AccessCodeTopBar({
  accessCode,
  setAccessCode,
  codeInfo,
  codeError,
  isValidatingCode,
  validateCode,
  createdSongsCount = 0,
  onOpenHistory
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputCode, setInputCode] = useState(accessCode || '');

  const handleApply = (e) => {
    if (e) e.preventDefault();
    if (!inputCode.trim()) return;
    validateCode(inputCode.trim().toUpperCase());
    setIsEditing(false);
  };

  const handleQuickCode = (c) => {
    setInputCode(c);
    setAccessCode(c);
    validateCode(c);
    setIsEditing(false);
  };

  const hasCredits = codeInfo?.valid && !codeInfo?.isExhausted;

  return (
    <aside
      aria-label="Estado de código y créditos"
      className="w-full relative z-40 bg-gradient-to-r from-[#170f35] via-[#0d1024] to-[#1f0f35] border-b-2 border-pink-500/40 shadow-xl shadow-purple-950/60 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Code Status, Credits & Highlighted Badge */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-lg ${
              hasCredits
                ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-300 shadow-emerald-950/50'
                : 'bg-amber-950/80 border-amber-400/50 text-amber-300 shadow-amber-950/50'
            }`}>
              <Key className="w-5 h-5 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-pink-300 flex items-center gap-1">
                  <span>Código de Acceso:</span>
                </span>

                {codeInfo?.valid && !isEditing ? (
                  <>
                    <span className="font-mono font-black text-xs sm:text-sm bg-purple-950/90 text-white px-2.5 py-0.5 rounded-lg border border-purple-400/50 shadow-inner uppercase tracking-widest">
                      {codeInfo.code}
                    </span>
                    
                    {/* Glowing Credits Badge */}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-md flex items-center gap-1.5 ${
                      hasCredits
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-emerald-900/30'
                        : 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-rose-900/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${hasCredits ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                      {codeInfo.remaining === 'unlimited'
                        ? 'CRÉDITOS: ♾️ ILIMITADOS'
                        : `CRÉDITOS: ${codeInfo.remaining} DE ${codeInfo.maxSongs} CANCIONES`}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setInputCode(accessCode);
                        setIsEditing(true);
                      }}
                      className="text-xs font-semibold text-purple-300 hover:text-white underline underline-offset-2 ml-1"
                    >
                      Cambiar código
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                    <span>⚠️ Sin código activo (Ingresa uno para recargar créditos)</span>
                  </span>
                )}

                {!codeInfo?.valid && (
                  <button
                    type="button"
                    onClick={() => document.getElementById('precios')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-xs font-semibold text-purple-300 hover:text-white underline underline-offset-2"
                  >
                    ¿No tienes uno? Ver planes ↓
                  </button>
                )}
              </div>

              {/* Subtitle helper */}
              <p className="text-[11px] text-gray-300/90 truncate mt-0.5 font-medium">
                {hasCredits
                  ? '✅ Tienes créditos activos para componer canciones y generar videos.'
                  : codeInfo?.isExhausted
                    ? '❌ Has utilizado todos los créditos de este código. Ingresa otro para continuar.'
                    : 'Ingresa tu código o activa uno de prueba para componer.'}
              </p>
            </div>
          </div>

          {/* Right: Code Input Form + Ultra-Highlighted MIS CANCIONES CREADAS Button */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-between lg:justify-end flex-shrink-0">
            {(!codeInfo?.valid || isEditing) && (
              <form onSubmit={handleApply} className="flex items-center gap-1.5 w-full sm:w-auto">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="INGRESA CÓDIGO"
                  className="px-3 py-1.5 bg-black/80 border-2 border-pink-500/50 rounded-xl text-xs text-white font-mono uppercase placeholder-gray-500 focus:outline-none focus:border-pink-400 w-full sm:w-48 shadow-inner"
                  autoFocus={isEditing}
                />
                <button
                  type="submit"
                  disabled={isValidatingCode || !inputCode.trim()}
                  className="min-h-11 px-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex-shrink-0 flex items-center gap-1"
                >
                  {isValidatingCode ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="min-h-11 px-2.5 rounded-xl bg-gray-800 text-gray-300 hover:text-white text-xs"
                  >
                    Cancelar
                  </button>
                )}
              </form>
            )}

            {/* Demo codes shortcut */}
            {!codeInfo?.valid && !isEditing && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-gray-400 text-[10px]">Demo:</span>
                <button
                  type="button"
                  onClick={() => handleQuickCode('TEST-1SONG-7A9B')}
                  className="px-2 py-0.5 rounded-lg bg-gray-900 border border-purple-500/40 text-purple-300 hover:text-white font-mono text-[10px]"
                >
                  1 Canción
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCode('DEMO-PACK5-7R1L')}
                  className="px-2 py-0.5 rounded-lg bg-gray-900 border border-pink-500/40 text-pink-300 hover:text-white font-mono text-[10px]"
                >
                  5 Canciones
                </button>
              </div>
            )}

            {/* Ultra-Prominent Title Button: MIS CANCIONES CREADAS */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="relative px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-pink-900/60 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border-2 border-pink-400/50 shimmer-effect flex-shrink-0"
              title="Abrir catálogo de canciones creadas"
            >
              <Music className="w-4 h-4 text-yellow-200" />
              <span className="tracking-wider text-white">MIS CANCIONES CREADAS</span>
              <span className="px-2 py-0.5 rounded-full bg-white text-gray-950 font-black text-xs shadow-md">
                {createdSongsCount}
              </span>
              <Sparkle className="w-3 h-3 text-yellow-200 absolute -top-1 -right-1" animation="animate-twinkle" />
            </button>
          </div>

        </div>

        {/* Code Error Warning Banner if any */}
        {codeError && (
          <div className="mt-2.5 p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{codeError}</span>
            </div>
            <button
              type="button"
              onClick={() => handleQuickCode('TEST-1SONG-7A9B')}
              className="text-[11px] underline text-white font-bold"
            >
              Activar código demo (1 Canción)
            </button>
          </div>
        )}

      </div>
    </aside>
  );
}
