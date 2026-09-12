import React from 'react';
import { X, Sparkles, FileText, Wand2 } from 'lucide-react';

// Shows the actual dedication/story text that produced a genre's real demo —
// a concrete example of "how to ask" for customers who aren't sure what to
// write in their own song request.
export default function GenreGuideModal({ isOpen, onClose, genre, demo, onUseStyle }) {
  if (!isOpen || !genre || !demo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-w-lg max-h-[100dvh] sm:max-h-[90vh] bg-[#0c0f1f] border border-purple-500/30 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 sm:p-6 border-b border-gray-800 flex items-center justify-between gap-4 bg-[#0e1226]/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-xl flex-shrink-0">
              {genre.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-white truncate">{genre.name}</h3>
              <p className="text-[11px] text-gray-400">Así se creó esta demo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-300">
            <FileText className="w-3.5 h-3.5" />
            <span>Guía de creación</span>
          </div>
          <p className="text-xs text-gray-400 -mt-2">
            Este es el pedido de ejemplo (nombres + historia) que usamos para generar esta demo — escribe el tuyo con ese mismo
            nivel de detalle para obtener el mejor resultado.
          </p>

          <div className="p-4 rounded-2xl bg-gray-950/60 border border-gray-800/80 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Para</span>
              <p className="text-sm text-white font-semibold mt-0.5">{demo.names}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Historia enviada</span>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mt-0.5">{demo.references}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Estilo: {demo.style} • Duración: {demo.duration}s</span>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-[#070914] flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-all"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onUseStyle}
            className="min-h-11 flex items-center gap-1.5 px-5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-pink-900/40 transition-all"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Usar este estilo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
