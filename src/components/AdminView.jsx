import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, RefreshCw, Search, Download, Trash2, Play, Pause,
  Clock, Globe, Music, Key, FileAudio, AlertCircle, Copy, Check,
  LogOut, ArrowLeft, Settings, Users, PlusCircle, CheckCircle2, Lock,
  Zap, Heart, Moon, Cake, FlaskConical, Gauge
} from 'lucide-react';

// Fixed demo scripts used to measure ElevenLabs credit consumption per genre/duration.
const DEMOS = [
  {
    id: 'demo-a-pedida-novia',
    label: 'Demo A · Pedida de Novia',
    icon: Heart,
    accentClass: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    style: 'Balada Romántica',
    names: 'Andrés para Camila',
    references: 'Andrés conoció a Camila hace 3 meses en la fila de un café en Bogotá, un día que llovía muy fuerte; a ella se le cayeron los libros, él la ayudó a recogerlos y terminaron hablando dos horas sin darse cuenta. Desde esa tarde no han dejado de hablar todos los días: han ido a cine, a caminar por el parque, y ella siempre se ríe de sus chistes malos. Él quiere sorprenderla pidiéndole que sean novios oficialmente. Que la canción cuente ese primer encuentro bajo la lluvia, lo nervioso que estaba ese día, y cómo en estos 3 meses se dio cuenta de que quiere algo serio con ella. Que termine con la pregunta directa "Camila, ¿quieres ser mi novia?" en el coro final, con un tono íntimo que va creciendo hasta un cierre emotivo y esperanzador.',
    duration: 90
  },
  {
    id: 'demo-b-nana-martina',
    label: 'Demo B · Nana para Martina',
    icon: Moon,
    accentClass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    style: 'Canción de Dormir / Nana',
    names: 'Martina',
    references: 'Hoy Martina tuvo un día enorme: fue al parque con su papá y su mamá, se subió al columpio más alto que pudo, encontró un perrito café y le puso de nombre "Nube", pintó un dibujo de una casa con un sol gigante para pegarlo en la nevera, y en la tarde se rió muchísimo jugando con su abuela a las escondidas. Ahora ya cenó, se puso su pijama de estrellas y es hora de dormir. Quiero una nana suave que primero recuerde con cariño esas aventuras del día (el perrito, el columpio, el dibujo), y que después vaya bajando el ritmo poco a poco hasta quedar casi en un susurro, hablando de que las estrellas y los ángeles la van a cuidar toda la noche, que mañana habrá más aventuras, y que papá y mamá la aman muchísimo. Que termine repitiendo suavecito su nombre, "Martina", como arrullo final.',
    duration: 180
  },
  {
    id: 'demo-c-cumple-papa',
    label: 'Demo C · Cumpleaños de Papá',
    icon: Cake,
    accentClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    style: 'Banda Sinaloense',
    names: 'Don Roberto',
    references: 'Hoy es el cumpleaños de Don Roberto y toda la familia se reunió en su casa: sus hijos, sus nietos y hasta llegó su hermano desde Medellín para sorprenderlo. Es un hombre trabajador que toda la vida madrugó para sacar adelante a su familia, y hoy quieren que se relaje, la pase bien y sienta cuánto lo quieren. Quiero una canción de banda bien animada, con trompetas y tambora fuerte desde el inicio, que hable de agradecerle todo su esfuerzo, que lo invite a bailar y a tomarse un trago con los suyos, y que en el coro repita su nombre "Roberto" deseándole un feliz cumpleaños con mucha fiesta y muchos años más de vida.',
    duration: 60
  }
];

const COOLDOWN_MS = 5 * 60 * 1000;

export default function AdminView({ adminKey, onLogout, onBackToUser }) {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'codes' | 'settings'

  // Audit state
  const [songs, setSongs] = useState([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Audio player in table
  const [activeSongId, setActiveSongId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  // Codes state
  const [codes, setCodes] = useState([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeLabel, setNewCodeLabel] = useState('');
  const [newCodeMaxSongs, setNewCodeMaxSongs] = useState('5');
  const [codeSuccessMsg, setCodeSuccessMsg] = useState('');

  // Settings state
  const [settingsData, setSettingsData] = useState({ hasKey: false, maskedKey: '' });
  const [newApiKey, setNewApiKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Quota state
  const [quota, setQuota] = useState(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);
  const [quotaError, setQuotaError] = useState('');

  // Demos state
  const [demoStates, setDemoStates] = useState({}); // { [demoId]: { loading, result, error } }
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Initial loads
  useEffect(() => {
    fetchHistory();
    fetchCodes();
    fetchSettings();
    fetchQuota();

    const audio = audioRef.current;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
    };
  }, [adminKey]);

  // Cooldown ticker (only runs while a cooldown is active)
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  // Fetch History
  const fetchHistory = async () => {
    setIsLoadingSongs(true);
    try {
      const res = await fetch('/api/admin/history', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      setSongs(data.songs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  // Fetch Codes
  const fetchCodes = async () => {
    setIsLoadingCodes(true);
    try {
      const res = await fetch('/api/admin/codes', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCodes(false);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.ok) {
        const data = await res.json();
        setSettingsData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle audio in table
  const togglePlaySong = (song) => {
    const audio = audioRef.current;
    if (activeSongId === song.id && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.src = song.audioUrl;
      audio.play().then(() => {
        setActiveSongId(song.id);
        setIsPlaying(true);
      }).catch((e) => console.error("Audio error", e));
    }
  };

  // Delete song
  const handleDeleteSong = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta canción y su archivo MP3 del servidor?')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/history/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey }
      });
      if (res.ok) {
        if (activeSongId === id) {
          audioRef.current.pause();
          setIsPlaying(false);
          setActiveSongId(null);
        }
        setSongs((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  // Create Code
  const handleCreateCode = async (e) => {
    e.preventDefault();
    setCodeSuccessMsg('');
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          code: newCodeName,
          label: newCodeLabel,
          maxSongs: parseInt(newCodeMaxSongs, 10)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewCodeName('');
        setNewCodeLabel('');
        setCodeSuccessMsg(`¡Código ${data.code.code} creado exitosamente!`);
        fetchCodes();
        setTimeout(() => setCodeSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'Error al crear código');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  // Delete Code
  const handleDeleteCode = async (codeStr) => {
    if (!window.confirm(`¿Eliminar el código ${codeStr}?`)) return;
    try {
      const res = await fetch(`/api/admin/codes/${encodeURIComponent(codeStr)}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey }
      });
      if (res.ok) {
        setCodes((prev) => prev.filter((c) => c.code !== codeStr));
      }
    } catch (e) {
      alert('Error al borrar');
    }
  };

  // Generate random code helper
  const handleGenerateRandomCode = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 4; i++) part1 += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 4; i++) part2 += letters.charAt(Math.floor(Math.random() * letters.length));
    setNewCodeName(`SONG-${part1}-${part2}`);
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSuccessMsg('');
    setSettingsError('');

    try {
      const payload = {};
      if (newApiKey.trim()) payload.elevenlabsApiKey = newApiKey.trim();
      if (newPassword.trim()) payload.newAdminPassword = newPassword.trim();

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsSuccessMsg('¡Configuración actualizada con éxito!');
        setNewApiKey('');
        setNewPassword('');
        fetchSettings();
        setTimeout(() => setSettingsSuccessMsg(''), 4000);
      } else {
        setSettingsError(data.error || 'Error al guardar');
      }
    } catch (err) {
      setSettingsError('Error al contactar con el servidor.');
    }
  };

  // Fetch live ElevenLabs quota
  const fetchQuota = async () => {
    setIsLoadingQuota(true);
    setQuotaError('');
    try {
      const res = await fetch('/api/admin/quota', {
        headers: { 'x-admin-key': adminKey }
      });
      const data = await res.json();
      if (res.ok) {
        setQuota(data);
      } else {
        setQuota(null);
        setQuotaError(data.error || 'No se pudo consultar la cuota.');
      }
    } catch (err) {
      setQuota(null);
      setQuotaError('Error al contactar con el servidor.');
    } finally {
      setIsLoadingQuota(false);
    }
  };

  // Generate a demo song
  const handleGenerateDemo = async (demo) => {
    if (now < cooldownUntil) return;

    setDemoStates((prev) => ({
      ...prev,
      [demo.id]: { ...(prev[demo.id] || {}), loading: true, error: '' }
    }));

    try {
      const res = await fetch('/api/admin/demo/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          demoId: demo.id,
          names: demo.names,
          references: demo.references,
          style: demo.style,
          duration: demo.duration
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDemoStates((prev) => ({
          ...prev,
          [demo.id]: { loading: false, error: '', result: data }
        }));
        const until = Date.now() + COOLDOWN_MS;
        setCooldownUntil(until);
        setNow(Date.now());
        fetchHistory();
        fetchQuota();
      } else {
        setDemoStates((prev) => ({
          ...prev,
          [demo.id]: { loading: false, error: data.error || 'Error al generar la demo', result: prev[demo.id]?.result }
        }));
      }
    } catch (err) {
      setDemoStates((prev) => ({
        ...prev,
        [demo.id]: { loading: false, error: 'Error de conexión con el servidor', result: prev[demo.id]?.result }
      }));
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered list
  const filteredSongs = songs.filter((song) => {
    const q = searchTerm.toLowerCase();
    return (
      song.names?.toLowerCase().includes(q) ||
      song.ip?.toLowerCase().includes(q) ||
      song.elevenlabsId?.toLowerCase().includes(q) ||
      song.code?.toLowerCase().includes(q) ||
      song.style?.toLowerCase().includes(q)
    );
  });

  const uniqueIps = new Set(songs.map((s) => s.ip)).size;

  const formatDate = (isoStr) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full w-max border border-amber-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Panel de Control • Superadmin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Administración Central
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Auditoría de canciones con IP y fecha, gestión de códigos de acceso y configuración de ElevenLabs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToUser}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 text-xs font-medium transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Vista Usuario</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 text-rose-400 text-xs font-medium transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Bloquear</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs in Superadmin */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'audit'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Auditoría de Canciones ({songs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('codes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'codes'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Control de Códigos ({codes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('demos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'demos'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Demos & Consumo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuración & API Key</span>
        </button>
      </div>

      {/* TAB 1: AUDIT OF GENERATED SONGS */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Canciones</span>
                <div className="text-2xl sm:text-3xl font-bold text-white mt-1">{songs.length}</div>
                <span className="text-[11px] text-gray-500 mt-0.5 block">Guardadas en servidor</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Music className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">IPs Únicas</span>
                <div className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">{uniqueIps}</div>
                <span className="text-[11px] text-gray-500 mt-0.5 block">Clientes distintos</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Globe className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Última Creación</span>
                <div className="text-sm font-semibold text-teal-300 mt-1 line-clamp-1">
                  {songs[0] ? formatDate(songs[0].timestamp) : 'Sin actividad aún'}
                </div>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  {songs[0] ? `Código: ${songs[0].code || 'N/A'}` : 'Esperando peticiones'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por IP, código, nombre, género o ID de ElevenLabs..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900/90 border border-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="button"
              onClick={fetchHistory}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSongs ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          {/* History Table */}
          <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-900/90 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Fecha y Hora</th>
                    <th className="py-3.5 px-4 font-semibold">IP Cliente</th>
                    <th className="py-3.5 px-4 font-semibold">Código Usado</th>
                    <th className="py-3.5 px-4 font-semibold">ID ElevenLabs</th>
                    <th className="py-3.5 px-4 font-semibold">Detalles Canción</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Reproductor</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-gray-300">
                  {filteredSongs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500 text-sm">
                        {isLoadingSongs ? 'Cargando registros...' : 'No se encontraron canciones.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSongs.map((song) => {
                      const isCurrentPlaying = activeSongId === song.id && isPlaying;
                      return (
                        <tr key={song.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-mono text-xs text-white">
                              {formatDate(song.timestamp)}
                            </div>
                            <span className="text-[10px] text-gray-500">ID: {song.id}</span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-700/60 font-mono text-xs text-amber-300">
                              <Globe className="w-3 h-3 text-amber-400" />
                              <span>{song.ip}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(song.ip, `ip-${song.id}`)}
                                className="text-gray-500 hover:text-gray-300 ml-1"
                                title="Copiar IP"
                              >
                                {copiedId === `ip-${song.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono text-xs text-purple-300 px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/40">
                              {song.code || 'Directo'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-950/30 border border-purple-800/30 font-mono text-xs text-purple-300">
                              <Key className="w-3 h-3 text-purple-400" />
                              <span className="max-w-[100px] truncate" title={song.elevenlabsId}>
                                {song.elevenlabsId}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(song.elevenlabsId, `el-${song.id}`)}
                                className="text-gray-500 hover:text-gray-300 ml-1"
                              >
                                {copiedId === `el-${song.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-white truncate" title={song.names}>
                              {song.names}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              <span className="text-purple-400">{song.style}</span> • {song.duration}s
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-center">
                            <button
                              type="button"
                              onClick={() => togglePlaySong(song)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                isCurrentPlaying
                                  ? 'bg-purple-600 text-white animate-pulse'
                                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                              }`}
                            >
                              {isCurrentPlaying ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 fill-white" />
                                  <span>Pausar</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-white" />
                                  <span>Escuchar</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={song.audioUrl}
                                download={song.filename}
                                className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 hover:text-emerald-200"
                                title="Descargar MP3"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteSong(song.id)}
                                className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-400 hover:text-rose-200"
                                title="Eliminar registro y MP3"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCESS CODES MANAGEMENT */}
      {activeTab === 'codes' && (
        <div className="space-y-6">
          {/* Create Code Card */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              <span>Crear Nuevo Código de Acceso</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Genera códigos para tus clientes o pruebas con un límite específico de canciones (1, 5 o ilimitado).
            </p>

            {codeSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{codeSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateCode} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Código
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                    placeholder="Ej: CLIENTE-VIP-01"
                    required
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-[11px]"
                    title="Generar código aleatorio"
                  >
                    🎲
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Descripción / Cliente
                </label>
                <input
                  type="text"
                  value={newCodeLabel}
                  onChange={(e) => setNewCodeLabel(e.target.value)}
                  placeholder="Ej: Para María Rodríguez"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Límite de Canciones
                </label>
                <select
                  value={newCodeMaxSongs}
                  onChange={(e) => setNewCodeMaxSongs(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="1">1 canción (Prueba)</option>
                  <option value="3">3 canciones</option>
                  <option value="5">5 canciones (Pack Estándar)</option>
                  <option value="10">10 canciones</option>
                  <option value="-1">♾️ Ilimitado (Personal)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
              >
                Crear Código
              </button>
            </form>
          </div>

          {/* Codes Table */}
          <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Códigos Activos en el Sistema</h4>
              <button
                type="button"
                onClick={fetchCodes}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCodes ? 'animate-spin' : ''}`} />
                <span>Refrescar</span>
              </button>
            </div>

            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-900/90 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Código</th>
                  <th className="py-3.5 px-4 font-semibold">Etiqueta / Descripción</th>
                  <th className="py-3.5 px-4 font-semibold">Uso / Límite</th>
                  <th className="py-3.5 px-4 font-semibold">Estado</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {codes.map((c) => {
                  const isExhausted = c.maxSongs !== -1 && c.used >= c.maxSongs;
                  const isUnlimited = c.maxSongs === -1;

                  return (
                    <tr key={c.code} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-amber-300 bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-700">
                          <span>{c.code}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(c.code, `code-${c.code}`)}
                            className="text-gray-500 hover:text-gray-300 ml-1"
                          >
                            {copiedId === `code-${c.code}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-white font-medium">
                        {c.label || '-'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold">
                            {c.used} / {isUnlimited ? '♾️' : c.maxSongs}
                          </span>
                          {!isUnlimited && (
                            <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isExhausted ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (c.used / c.maxSongs) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isUnlimited ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                            Ilimitado
                          </span>
                        ) : isExhausted ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                            Agotado
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                            Activo
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCode(c.code)}
                          className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-400 hover:text-rose-200"
                          title="Eliminar código"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: DEMOS & MEDICIÓN DE CONSUMO */}
      {activeTab === 'demos' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Genera 1 demo a la vez, con 5 minutos de espera entre cada una</h3>
              <p className="text-xs text-gray-400 mt-1">
                Cada botón queda bloqueado 5 minutos después de generar una demo, para que puedas revisar el consumo exacto en tu
                panel de ElevenLabs antes de la siguiente. Los créditos "Antes/Después" que ves aquí vienen de la cuota real de tu cuenta.
              </p>
              {now < cooldownUntil && (
                <p className="text-xs font-semibold text-amber-300 mt-2">
                  ⏳ Próxima demo disponible en {Math.floor((cooldownUntil - now) / 60000)}:{String(Math.floor(((cooldownUntil - now) % 60000) / 1000)).padStart(2, '0')}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {DEMOS.map((demo) => {
              const state = demoStates[demo.id] || {};
              const Icon = demo.icon;
              const isDisabled = state.loading || now < cooldownUntil;

              return (
                <div key={demo.id} className="glass-panel rounded-2xl border border-gray-800 p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${demo.accentClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{demo.label}</div>
                      <div className="text-[11px] text-gray-400">{demo.style} • {demo.duration}s</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-400 bg-gray-950 border border-gray-800 rounded-xl p-3 space-y-1.5">
                    <div><span className="text-gray-500">Para:</span> <span className="text-gray-200">{demo.names}</span></div>
                    <div><span className="text-gray-500">Historia enviada:</span> <span className="text-gray-300">{demo.references}</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerateDemo(demo)}
                    disabled={isDisabled}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isDisabled
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-md'
                    }`}
                  >
                    {state.loading ? 'Generando en ElevenLabs...' : 'Generar Demo'}
                  </button>

                  {state.error && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{state.error}</span>
                    </div>
                  )}

                  {state.result && (
                    <div className="space-y-2.5 pt-2 border-t border-gray-800">
                      <audio controls src={state.result.song.audioUrl} className="w-full h-9" />
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-gray-950 border border-gray-800">
                          <div className="text-[9px] uppercase text-gray-500">Antes</div>
                          <div className="text-xs font-bold text-gray-300">{state.result.quotaBefore?.used?.toLocaleString('es-CO') ?? '—'}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-950 border border-gray-800">
                          <div className="text-[9px] uppercase text-gray-500">Después</div>
                          <div className="text-xs font-bold text-gray-300">{state.result.quotaAfter?.used?.toLocaleString('es-CO') ?? '—'}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                          <div className="text-[9px] uppercase text-emerald-500">Consumidos</div>
                          <div className="text-xs font-bold text-emerald-300">
                            {state.result.creditsUsed != null ? state.result.creditsUsed.toLocaleString('es-CO') : '—'}
                          </div>
                        </div>
                      </div>
                      <a
                        href={state.result.song.audioUrl}
                        download={state.result.song.filename}
                        className="flex items-center justify-center gap-2 py-1.5 text-[11px] text-emerald-400 hover:text-emerald-200"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar MP3</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS & ELEVENLABS API KEY */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>Cuota Disponible en ElevenLabs</span>
              </h3>
              <button
                type="button"
                onClick={fetchQuota}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuota ? 'animate-spin' : ''}`} />
                <span>Refrescar</span>
              </button>
            </div>

            {quotaError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{quotaError}</span>
              </div>
            )}

            {quota && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Plan</span>
                  <div className="text-sm font-bold text-white capitalize mt-0.5">{quota.tier || '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Usados</span>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">{quota.used?.toLocaleString('es-CO') ?? '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Disponibles</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{quota.remaining?.toLocaleString('es-CO') ?? '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Límite Total</span>
                  <div className="text-sm font-bold text-gray-300 mt-0.5">{quota.limit?.toLocaleString('es-CO') ?? '—'}</div>
                </div>
                {quota.remaining != null && quota.limit != null && (
                  <div className="col-span-2 sm:col-span-4">
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${quota.remaining / quota.limit < 0.15 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
                      />
                    </div>
                    {quota.resetAt && (
                      <p className="text-[11px] text-gray-500 mt-1.5">
                        Se reinicia: {formatDate(quota.resetAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!quota && !quotaError && (
              <p className="text-xs text-gray-500">Consultando cuota en ElevenLabs...</p>
            )}

            <p className="text-[11px] text-gray-500">
              Este pool es compartido por todos los que usan la misma API Key (workspace), incluidos tus clientes en producción.
            </p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>Configuración de Servidor y ElevenLabs</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                La API Key configurada aquí se utiliza de forma transparente para todas las generaciones de los usuarios.
              </p>
            </div>

            {settingsSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{settingsSuccessMsg}</span>
              </div>
            )}

            {settingsError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{settingsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* ElevenLabs API Key */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  ElevenLabs API Key (Activa)
                </label>
                <div className="mb-2 text-xs text-gray-400 flex items-center gap-2">
                  <span>Estado actual:</span>
                  {settingsData.hasKey ? (
                    <span className="font-mono text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      Configurada ({settingsData.maskedKey})
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                      No configurada (usando modo demo)
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="Ingresa nueva API Key (xi-...)"
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Deja vacío si no deseas cambiar la clave actual.
                </p>
              </div>

              {/* Admin Password Change */}
              <div className="pt-2 border-t border-gray-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cambiar Contraseña de Superadmin</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña (mínimo 4 caracteres)"
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
              >
                Guardar Configuración
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
