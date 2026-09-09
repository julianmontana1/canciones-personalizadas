import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { createSpeechRecognizer, parseSpokenSongPrompt } from '../utils/speechRecognition';

export default function VoiceAssistantModal({ isOpen, onClose, onApplyParsedData }) {
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const recognizerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [isOpen]);

  const startListening = () => {
    setError('');
    setLiveTranscript('');
    setParsedData(null);

    const rec = createSpeechRecognizer({
      onResult: (text) => {
        setLiveTranscript(text);
        const parsed = parseSpokenSongPrompt(text);
        setParsedData(parsed);
      },
      onError: (err) => {
        setError('Error en micrófono o permiso denegado: ' + err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      }
    });

    if (rec) {
      try {
        rec.start();
        setIsRecording(true);
        recognizerRef.current = rec;
      } catch (e) {
        console.error("Error starting speech recognition:", e);
      }
    }
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {}
      recognizerRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleApply = () => {
    if (parsedData) {
      onApplyParsedData(parsedData);
    } else if (liveTranscript) {
      onApplyParsedData({
        names: '',
        references: liveTranscript,
        style: '',
        duration: 60
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel-glow max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-purple-500/40 shadow-2xl relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Asistente de Dictado por Voz</span>
          </div>
          <h3 className="text-xl font-bold text-white">Háblale a la IA</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Di para quién es la canción, qué historia o recuerdos incluir y el estilo que te gusta.
          </p>
        </div>

        {/* Recording Animation & Button */}
        <div className="flex flex-col items-center justify-center my-6">
          <button
            type="button"
            onClick={toggleRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative ${
              isRecording
                ? 'bg-gradient-to-tr from-rose-500 to-pink-600 shadow-xl shadow-rose-600/40 scale-105'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/30 hover:scale-105'
            }`}
          >
            {isRecording && (
              <span className="absolute inset-0 rounded-full animate-ping bg-rose-500/40 pointer-events-none" />
            )}
            {isRecording ? (
              <Mic className="w-9 h-9 text-white animate-pulse" />
            ) : (
              <MicOff className="w-8 h-8 text-gray-200" />
            )}
          </button>

          <span className="text-xs font-semibold mt-3 text-gray-300">
            {isRecording ? '🔴 Escuchando... Habla ahora' : 'Toca para reanudar grabación'}
          </span>
        </div>

        {/* Real-time transcript box */}
        <div className="bg-gray-950/70 border border-gray-800 rounded-2xl p-4 min-h-[90px] max-h-36 overflow-y-auto text-xs sm:text-sm text-gray-300 font-normal">
          {liveTranscript ? (
            <p className="leading-relaxed">"{liveTranscript}"</p>
          ) : (
            <p className="text-gray-500 italic text-center pt-5">
              Ejemplo: "Quiero una balada para mi prometida Andrea, celebrando 3 años juntos y el viaje a París, de 60 segundos..."
            </p>
          )}
        </div>

        {/* Extracted fields preview */}
        {parsedData && (
          <div className="mt-4 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-1.5 text-xs">
            <span className="font-semibold text-purple-300 block mb-1">
              ✨ Campos autodetectados:
            </span>
            {parsedData.names && (
              <div className="text-gray-300">
                <strong className="text-purple-400">👤 Nombres:</strong> {parsedData.names}
              </div>
            )}
            {parsedData.style && (
              <div className="text-gray-300">
                <strong className="text-purple-400">🎵 Estilo:</strong> {parsedData.style}
              </div>
            )}
            {parsedData.duration && (
              <div className="text-gray-300">
                <strong className="text-purple-400">⏱️ Duración:</strong> {parsedData.duration} seg
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs sm:text-sm font-medium transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!liveTranscript}
            className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-900/40 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Rellenar Campos</span>
          </button>
        </div>

      </div>
    </div>
  );
}
