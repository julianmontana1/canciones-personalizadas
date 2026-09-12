import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, RefreshCw, Search, Download, Trash2, Play, Pause,
  Clock, Globe, Music, Key, FileAudio, AlertCircle, Copy, Check,
  LogOut, ArrowLeft, Settings, Users, PlusCircle, CheckCircle2, Lock,
  Zap, Heart, Moon, Cake, FlaskConical, Gauge, SlidersHorizontal, RotateCcw,
  Layers, PlayCircle
} from 'lucide-react';
import { PLANS as FACTORY_PLANS } from '../plans.js';
import { GENRE_PRESETS } from '../data/genrePresets.js';

// Labels & help text for the admin-editable per-plan limits. Order here drives
// render order in the "Límites de Planes" tab.
const PLAN_LIMIT_FIELDS = [
  { key: 'songs', label: 'Canciones incluidas', help: 'Cuántas canciones puede crear un código de este plan.' },
  { key: 'maxPhotos', label: 'Fotos máx. por video', help: 'Fotos que se pueden subir en una sola creación de video.' },
  { key: 'maxVideoClips', label: 'Clips de video máx. por video', help: 'Videos propios que se pueden subir como material en una sola creación de video.' },
  { key: 'maxVideoProjects', label: 'Videos que se pueden crear (por cuenta)', help: 'Total de videos terminados que un código puede crear en toda su cuenta, repartidos entre las canciones que elija.' },
  { key: 'maxUploadBytesMB', label: 'Peso máx. combinado (MB)', help: 'Suma máxima de fotos + videos subidos en una sola creación de video.' }
];

const PLAN_ORDER = ['solo', 'trio', 'quinteto'];

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

// One QA demo per genre in the "Explora Estilos" gallery — a quick way to hear
// how the current prompt-building logic (genreProfiles.js) sounds across every
// style at once, not just the 3 curated public ones above. Built from the same
// GENRE_PRESETS list the public gallery uses, so it never drifts out of sync.
const GENRE_DEMO_CONTENT = {
  dormir: { names: 'Sofía', references: 'Sofía tiene 2 años y cada noche le cuesta conciliar el sueño después de un día lleno de energía jugando con sus bloques de colores y su peluche conejo llamado "Copito". Su mamá quiere una nana suave que hable de las estrellas que la cuidan, del conejito que también se va a dormir, y que termine repitiendo su nombre bajito como arrullo final.' },
  infantil: { names: 'los niños del salón de Kínder B', references: 'Es la fiesta de fin de año del salón de Kínder B: hay globos de colores, piñata, y todos los niños quieren bailar y saltar. Quiero una canción súper animada y pegajosa que invite a moverse, aplaudir y girar en círculo, con un coro fácil de repetir para que hasta los más pequeños lo canten.' },
  cumpleanosinfantil: { names: 'Valentina, que cumple 5 años', references: 'Valentina cumple 5 años y quiere una fiesta con torta de unicornio, globos rosados y muchos amigos del colegio. Quiero una canción de cumpleaños bien alegre, con su nombre repetido en el coro, que hable de soplar las velitas y pedir un deseo, con un ritmo bailable para que todos los niños bailen alrededor de la torta.' },
  infantilclasica: { names: 'los nietos de la abuela Rosario', references: 'La abuela Rosario quiere cantarles a sus nietos una canción con ese estilo clásico y tierno de toda la vida, como las que ella escuchaba de pequeña. Que hable de jugar en el parque, de la merienda de las cuatro, y de lo mucho que los quiere, con un tono educativo y cariñoso, fácil de tararear.' },
  infantilmoderna: { names: 'Mateo, de 7 años', references: 'Mateo tiene 7 años y le encantan los videojuegos, los superhéroes y bailar canciones pegajosas con sus amigos. Quiero una canción infantil con ritmo actual y moderno, divertida y con energía, que hable de ser valiente como su superhéroe favorito y de jugar sin parar toda la tarde.' },
  rondas: { names: 'los niños del jardín "Arcoíris"', references: 'En el jardín infantil "Arcoíris" quieren una ronda nueva para cantar en círculo tomados de la mano, como las de toda la vida pero con una historia propia: un sol que se levanta, animalitos que saludan, y un final donde todos aplauden y se ríen juntos.' },
  cumpleanos: { names: 'Don Alberto, que cumple 60 años', references: 'Don Alberto cumple 60 años y toda su familia se reunió para celebrarlo con una parrillada en el patio de su casa. Es un hombre alegre al que le gusta bailar y contar chistes. Quiero una canción de cumpleaños festiva que invite a bailar, que agradezca su ejemplo de vida, y repita su nombre en el coro con mucha alegría.' },
  banda: { names: 'el ingeniero Fernando', references: 'Fernando acaba de graduarse como ingeniero después de años de sacrificio, madrugando entre el trabajo y la universidad. Su familia quiere sorprenderlo con una canción de banda potente, con trompetas y tambora desde el primer segundo, que hable de su esfuerzo, de las noches sin dormir, y que invite a todos a brindar y bailar por su logro.' },
  salsa: { names: 'Julián y Daniela', references: 'Julián y Daniela se conocieron bailando salsa en una fiesta de barrio hace un año y desde entonces no han dejado de bailar juntos cada fin de semana. Quiero una salsa brava con trompetas vivas y piano montuno, que cuente esa química en la pista de baile y termine invitando a todos a bailar pegados al ritmo.' },
  salsarosa: { names: 'Camila', references: 'Después de tres años de novios, quiero dedicarle a Camila una salsa romántica y suave que hable de lo que ha significado tenerla a mi lado: sus abrazos después de un mal día, sus risas contagiosas, y las ganas de seguir construyendo una vida juntos. Que sea dulce pero bailable, ideal para un baile lento de pareja.' },
  mariachi: { names: 'Doña Guadalupe', references: 'Doña Guadalupe cumple 50 años de casada con el amor de su vida y su familia quiere sorprenderla con un mariachi tradicional, con trompetas y violines, que hable de una vida entera de amor, de las canas que ganaron juntos, y de lo orgullosos que están sus hijos de ese ejemplo.' },
  vallenato: { names: 'Andrés', references: 'Andrés se va a ir a vivir a otra ciudad por trabajo y quiere despedirse de sus amigos de toda la vida con un vallenato que cuente las parrandas, los cuentos hasta el amanecer, y la promesa de que la amistad sigue igual de fuerte aunque la distancia los separe. Que tenga acordeón protagonista y una historia bien contada, como debe ser un vallenato.' },
  carranga: { names: 'el profesor Hernán, que se jubila', references: 'El profesor Hernán se jubila después de 30 años enseñando en la escuela veredal. Sus antiguos alumnos, ya adultos, quieren regalarle una carranga alegre con guitarra campesina y guacharaca que hable de su paciencia, de todo lo que les enseñó, y de la huella que dejó en el pueblo.' },
  cumbia: { names: 'la familia Ramírez en su reunión anual', references: 'Cada año la familia Ramírez se reúne en la finca de la abuela para bailar y comer sancocho hasta tarde. Quiero una cumbia sabrosa con acordeón y ritmo tropical que hable de esas reuniones, del sancocho al fogón, y que invite a todos —chiquitos y grandes— a salir a bailar en la mitad del patio.' },
  balada: { names: 'Laura', references: 'Quiero dedicarle a Laura, mi esposa, una balada emotiva por nuestro décimo aniversario de bodas. Que hable de cómo empezamos con casi nada y construimos una familia juntos, de las noches difíciles en las que ella nunca me soltó la mano, y de las ganas de seguir envejeciendo a su lado. Piano acústico y cuerdas, muy sentida.' },
  bolero: { names: 'Doña Elena', references: 'Doña Elena perdió a su esposo hace un año después de 45 años de matrimonio. Sus hijos quieren regalarle un bolero nostálgico con guitarra requinto que hable de un amor que sigue vivo en el recuerdo, de los bailes en la sala de la casa, y del consuelo de saber que ese amor no se olvida.' },
  bachata: { names: 'Diego y Valentina', references: 'Diego conoció a Valentina en un viaje a la playa y desde ese fin de semana no ha dejado de pensar en ella. Quiero una bachata romántica e íntima, con guitarra dominicana, que cuente ese flechazo repentino, las ganas de volver a verla, y la invitación a bailar bachata pegados esta vez.' },
  pop: { names: 'Camila, que se gradúa de la universidad', references: 'Camila se gradúa esta semana después de cinco años de esfuerzo, trabajando y estudiando al mismo tiempo. Su familia quiere un pop latino moderno, melódico y pegadizo, que celebre su disciplina, sus ganas de comerse el mundo, y que suene como el inicio de un nuevo capítulo lleno de posibilidades.' },
  acustico: { names: 'Sebastián', references: 'Sebastián quiere pedirle matrimonio a su novia de 6 años este fin de semana y quiere una canción acústica íntima, solo guitarra de palo y voz cálida, que cuente su historia desde el primer café que compartieron hasta hoy, terminando con la pregunta "¿te casas conmigo?" en el último verso.' },
  reggaeton: { names: 'el grupo de amigas para su viaje a la playa', references: 'Un grupo de seis amigas se va de viaje a la playa para celebrar que todas terminaron sus estudios. Quieren un reggaetón bailable y con actitud, dembow marcado, que hable de disfrutar sin reglas, de la amistad de años, y que suene perfecto para bailar en la arena con las luces del atardecer.' },
  reggae: { names: 'Tomás, antes de un viaje largo', references: 'Tomás se va de viaje varios meses a recorrer el mundo antes de empezar a trabajar. Quiere un reggae relajado con bajo profundo y sabor caribeño que hable de libertad, de dejar el estrés atrás, y de disfrutar cada momento del camino sin apuro.' },
  rock: { names: 'la banda de garaje "Los Nocturnos"', references: 'Cuatro amigos llevan tocando juntos desde el colegio en una banda de garaje llamada "Los Nocturnos" y por fin van a tocar en su primer bar. Quieren un rock con guitarras eléctricas potentes y batería viva que hable de nunca rendirse, de ensayar hasta tarde en el garaje, y de perseguir el sueño de subirse a un escenario.' },
  rap: { names: 'Kevin, que superó momentos difíciles', references: 'Kevin viene de un barrio difícil y logró salir adelante estudiando de noche mientras trabajaba de día. Quiere un rap con flow y actitud, beats boom-bap, que cuente su historia de superación, las caídas de las que se levantó, y el orgullo de ver hoy a su familia con la cabeza en alto.' },
  lofi: { names: 'Ana, en sus noches de estudio', references: 'Ana estudia medicina y pasa largas noches despierta preparando exámenes. Quiere una canción lo-fi relajada y nostálgica, estilo vinilo, que le acompañe esas noches de estudio, hablando de la calma antes de un gran esfuerzo y la promesa de que todo ese sacrificio va a valer la pena.' },
  electronica: { names: 'el equipo de la startup, el día que cerraron su primera inversión', references: 'Un pequeño equipo de cinco personas lleva dos años construyendo su startup desde un apartamento y hoy cerraron su primera ronda de inversión. Quieren una canción electrónica enérgica, con sintetizadores que suban de intensidad, que celebre ese logro y la energía de seguir soñando en grande.' },
  jinglecorporativo: { names: 'Panadería "El Buen Trigo"', references: 'La panadería familiar "El Buen Trigo" cumple 20 años en el barrio y quiere un jingle corporativo pegajoso y profesional para usar en sus redes sociales, que hable del pan recién horneado cada madrugada, del cariño con que atienden a los vecinos de siempre, y que termine repitiendo el nombre del negocio de forma memorable.' },
  villancico: { names: 'la familia Torres en su primera Navidad en la casa nueva', references: 'La familia Torres estrena casa nueva y quiere celebrar su primera Navidad ahí reunidos con abuelos, tíos y primos. Quieren un villancico cálido y festivo, con esa alegría tradicional decembrina, que hable de la familia reunida alrededor del árbol, del olor a natilla y buñuelos, y de agradecer estar todos juntos.' }
};

const GENRE_DEMO_DURATION_SEC = 60;

const MOOD_ACCENT_CLASS = {
  infantil: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  celebracion: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  amor: 'bg-rose-500/10 border-rose-500/20 text-rose-400'
};

const GENRE_DEMOS = GENRE_PRESETS.map((g) => ({
  id: g.id,
  label: g.name,
  icon: g.icon,
  accentClass: MOOD_ACCENT_CLASS[g.mood] || MOOD_ACCENT_CLASS.celebracion,
  style: g.name,
  names: GENRE_DEMO_CONTENT[g.id]?.names || g.name,
  references: GENRE_DEMO_CONTENT[g.id]?.references || `Una canción de muestra en el estilo "${g.name}".`,
  duration: GENRE_DEMO_DURATION_SEC
}));

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
  const [newCodePlan, setNewCodePlan] = useState('solo');
  const [codeSuccessMsg, setCodeSuccessMsg] = useState('');

  // Settings state
  const [settingsData, setSettingsData] = useState({ hasKey: false, maskedKey: '' });
  const [newApiKey, setNewApiKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Plan limits state (per account type: solo/trio/quinteto)
  const [effectivePlans, setEffectivePlans] = useState(null); // live from server, or null while loading
  const [planEdits, setPlanEdits] = useState({}); // { [planKey]: { songs, maxPhotos, maxVideoClips, maxVideoProjects, maxUploadBytesMB } }
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [savingPlanKey, setSavingPlanKey] = useState(null);
  const [planSuccessMsg, setPlanSuccessMsg] = useState('');
  const [planError, setPlanError] = useState('');

  // Quota state
  const [quota, setQuota] = useState(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);
  const [quotaError, setQuotaError] = useState('');

  // Demos state
  const [demoStates, setDemoStates] = useState({}); // { [demoId]: { loading, result, error } }
  const [cooldowns, setCooldowns] = useState({}); // { [demoId]: timestamp } — per-demo, not global, now that there are 30
  const [now, setNow] = useState(Date.now());
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });

  // Initial loads
  useEffect(() => {
    fetchHistory();
    fetchCodes();
    fetchSettings();
    fetchQuota();
    fetchPlans();

    const audio = audioRef.current;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
    };
  }, [adminKey]);

  // Cooldown ticker (only runs while at least one demo's cooldown is active)
  useEffect(() => {
    if (!Object.values(cooldowns).some((until) => until > Date.now())) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [cooldowns]);

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

  // Turns a plan's effective (bytes-based) limits into the editable draft shape
  // this tab's inputs use — same fields, but maxUploadBytes shown/edited in MB.
  const draftFromPlan = (plan) => ({
    songs: String(plan.songs ?? ''),
    maxPhotos: String(plan.maxPhotos ?? ''),
    maxVideoClips: String(plan.maxVideoClips ?? ''),
    maxVideoProjects: String(plan.maxVideoProjects ?? ''),
    maxUploadBytesMB: String(Math.round((plan.maxUploadBytes ?? 0) / (1024 * 1024)))
  });

  // Fetch Plan Limits (factory defaults merged with any admin overrides)
  const fetchPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await fetch('/api/admin/plans', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.ok) {
        const data = await res.json();
        setEffectivePlans(data.plans);
        const drafts = {};
        for (const key of PLAN_ORDER) {
          if (data.plans[key]) drafts[key] = draftFromPlan(data.plans[key]);
        }
        setPlanEdits(drafts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handlePlanFieldChange = (planKey, field, value) => {
    setPlanEdits((prev) => ({
      ...prev,
      [planKey]: { ...prev[planKey], [field]: value }
    }));
  };

  // Save one plan's edited limits
  const handleSavePlan = async (planKey) => {
    setPlanSuccessMsg('');
    setPlanError('');
    setSavingPlanKey(planKey);

    const draft = planEdits[planKey] || {};
    const patch = {
      songs: parseInt(draft.songs, 10),
      maxPhotos: parseInt(draft.maxPhotos, 10),
      maxVideoClips: parseInt(draft.maxVideoClips, 10),
      maxVideoProjects: parseInt(draft.maxVideoProjects, 10),
      maxUploadBytes: Math.round((parseFloat(draft.maxUploadBytesMB) || 0) * 1024 * 1024)
    };

    if (Object.values(patch).some((v) => !Number.isFinite(v) || v < 0)) {
      setPlanError('Todos los valores deben ser números válidos y no negativos.');
      setSavingPlanKey(null);
      return;
    }

    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ planKey, patch })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEffectivePlans(data.plans);
        setPlanEdits((prev) => ({ ...prev, [planKey]: draftFromPlan(data.plans[planKey]) }));
        setPlanSuccessMsg(`¡Límites de "${data.plans[planKey].label}" actualizados!`);
        setTimeout(() => setPlanSuccessMsg(''), 4000);
      } else {
        setPlanError(data.error || 'Error al guardar los límites.');
      }
    } catch (err) {
      setPlanError('Error al contactar con el servidor.');
    } finally {
      setSavingPlanKey(null);
    }
  };

  // Reset one plan's limits back to the hardcoded factory defaults
  const handleResetPlan = async (planKey) => {
    if (!window.confirm(`¿Restablecer "${FACTORY_PLANS[planKey]?.label}" a sus valores de fábrica?`)) return;
    setPlanSuccessMsg('');
    setPlanError('');
    setSavingPlanKey(planKey);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ planKey, reset: true })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEffectivePlans(data.plans);
        setPlanEdits((prev) => ({ ...prev, [planKey]: draftFromPlan(data.plans[planKey]) }));
        setPlanSuccessMsg(`"${data.plans[planKey].label}" restablecido a valores de fábrica.`);
        setTimeout(() => setPlanSuccessMsg(''), 4000);
      } else {
        setPlanError(data.error || 'Error al restablecer.');
      }
    } catch (err) {
      setPlanError('Error al contactar con el servidor.');
    } finally {
      setSavingPlanKey(null);
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
          maxSongs: parseInt(newCodeMaxSongs, 10),
          plan: newCodePlan === 'custom' ? null : newCodePlan
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

  // Actually calls the generation endpoint and updates state for one demo —
  // shared by the manual per-demo button and the "Generar todos" batch runner
  // below. The batch runner deliberately does NOT wait out each demo's own
  // cooldown between calls (that cooldown exists so a human reviewing results
  // one at a time doesn't accidentally re-trigger the same one, not to pace a
  // deliberate batch run) — it still sets the cooldown afterward though.
  const generateOneDemo = async (demo) => {
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
        setCooldowns((prev) => ({ ...prev, [demo.id]: Date.now() + COOLDOWN_MS }));
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

  // Manual single-click generation — respects that demo's own cooldown
  const handleGenerateDemo = async (demo) => {
    if (now < (cooldowns[demo.id] || 0) || isBatchRunning) return;
    await generateOneDemo(demo);
  };

  // Sequentially generates every genre demo that doesn't already have a result
  // in this session, with a short pause between calls so requests don't pile up
  // back-to-back — not a hard rate limit, just good manners toward the API.
  const handleGenerateAllGenreDemos = async () => {
    if (isBatchRunning) return;
    const pending = GENRE_DEMOS.filter((d) => !demoStates[d.id]?.result);
    if (pending.length === 0) return;

    setIsBatchRunning(true);
    setBatchProgress({ done: 0, total: pending.length });

    for (const demo of pending) {
      await generateOneDemo(demo);
      setBatchProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setIsBatchRunning(false);
  };

  // One demo card — shared by the 3 public demos and the per-genre QA demos,
  // which only differ in how `icon` is shaped (a lucide component vs. an emoji).
  const renderDemoCard = (demo) => {
    const state = demoStates[demo.id] || {};
    const isDisabled = state.loading || now < (cooldowns[demo.id] || 0) || isBatchRunning;

    return (
      <div key={demo.id} className="glass-panel rounded-2xl border border-gray-800 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${demo.accentClass}`}>
            {typeof demo.icon === 'string' ? <span className="text-lg">{demo.icon}</span> : <demo.icon className="w-5 h-5" />}
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
          {state.loading ? 'Generando en ElevenLabs...' : now < (cooldowns[demo.id] || 0) ? `Espera ${Math.ceil(((cooldowns[demo.id] || 0) - now) / 1000)}s...` : 'Generar Demo'}
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
      <div className="flex items-center gap-2 border-b border-gray-800 pb-1 overflow-x-auto flex-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
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
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
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
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
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
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuración & API Key</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'plans'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Límites de Planes</span>
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
          <div className="relative glass-panel rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
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
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0b0f19] to-transparent pointer-events-none" />
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
              Genera códigos para tus clientes según el plan que compraron — cada plan trae su propio límite de duración, acceso a video y fotos.
            </p>

            {codeSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{codeSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateCode} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
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
                  Plan
                </label>
                <select
                  value={newCodePlan}
                  onChange={(e) => setNewCodePlan(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="solo">Solo · 1 canción, sin video, 2 min</option>
                  <option value="trio">Pack 3 · 1 video con hasta 3 fotos, 3 min</option>
                  <option value="quinteto">Pack 5 · 2 videos con hasta 5 fotos/clips, 4 min</option>
                  <option value="custom">Personalizado / Ilimitado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Límite de Canciones
                </label>
                {newCodePlan === 'custom' ? (
                  <select
                    value={newCodeMaxSongs}
                    onChange={(e) => setNewCodeMaxSongs(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="1">1 canción (Prueba)</option>
                    <option value="3">3 canciones</option>
                    <option value="5">5 canciones</option>
                    <option value="10">10 canciones</option>
                    <option value="-1">♾️ Ilimitado (Personal)</option>
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-400">
                    {(effectivePlans || FACTORY_PLANS)[newCodePlan].songs} canción{(effectivePlans || FACTORY_PLANS)[newCodePlan].songs > 1 ? 'es' : ''} (definido por el plan — editable en "Límites de Planes")
                  </div>
                )}
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
          <div className="relative glass-panel rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-900/90 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Código</th>
                  <th className="py-3.5 px-4 font-semibold">Etiqueta / Descripción</th>
                  <th className="py-3.5 px-4 font-semibold">Plan</th>
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
                        {c.plan && FACTORY_PLANS[c.plan] ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 font-semibold">
                            {(effectivePlans || FACTORY_PLANS)[c.plan].label}
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-700/30 text-gray-400 border border-gray-600/30 font-semibold">
                            Personalizado
                          </span>
                        )}
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
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0b0f19] to-transparent pointer-events-none" />
          </div>
        </div>
      )}

      {/* TAB: DEMOS & MEDICIÓN DE CONSUMO */}
      {activeTab === 'demos' && (
        <div className="space-y-8">
          <div>
            <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-start gap-3 mb-4">
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">Demos Públicas (Muestras Reales)</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Las 3 que se muestran en la sección "Muestras Reales" de la página principal. Cada botón queda bloqueado 5
                  minutos después de generar, para revisar el consumo exacto en tu panel de ElevenLabs antes de la siguiente.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {DEMOS.map((demo) => renderDemoCard(demo))}
            </div>
          </div>

          <div>
            <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white">Demos por Género ({GENRE_DEMOS.length} estilos)</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Una demo de QA por cada estilo de "Explora Estilos", para escuchar cómo suena el motor de prompts actual en
                    todos los géneros de una vez. No son públicas — solo para revisar calidad aquí.
                  </p>
                  {isBatchRunning && (
                    <p className="text-xs font-semibold text-amber-300 mt-2">
                      ⏳ Generando {batchProgress.done}/{batchProgress.total}...
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateAllGenreDemos}
                disabled={isBatchRunning}
                className={`flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isBatchRunning
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-md'
                }`}
              >
                {isBatchRunning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlayCircle className="w-3.5 h-3.5" />
                )}
                <span>{isBatchRunning ? `Generando (${batchProgress.done}/${batchProgress.total})` : 'Generar todos los géneros'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {GENRE_DEMOS.map((demo) => renderDemoCard(demo))}
            </div>
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

      {/* TAB 4: PLAN LIMITS (songs, photos, video clips, videos that can be created — per account type) */}
      {activeTab === 'plans' && (
        <div className="max-w-4xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-amber-400" />
              <span>Límites por Tipo de Cuenta</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Ajusta cuántas canciones, fotos y videos incluye cada plan, y cuántos videos terminados puede crear un
              código en total (repartidos entre las canciones que elija). Los cambios aplican de inmediato a los códigos
              existentes de ese plan — nunca se le quita a una canción ya generada lo que ya tenía.
            </p>
          </div>

          {planSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{planSuccessMsg}</span>
            </div>
          )}
          {planError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{planError}</span>
            </div>
          )}

          {isLoadingPlans && !effectivePlans ? (
            <p className="text-xs text-gray-500">Cargando límites de planes...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PLAN_ORDER.map((planKey) => {
                const plan = effectivePlans?.[planKey];
                const draft = planEdits[planKey];
                if (!plan || !draft) return null;
                const isSaving = savingPlanKey === planKey;
                const factory = FACTORY_PLANS[planKey];
                const isOverridden = PLAN_LIMIT_FIELDS.some(({ key }) =>
                  key === 'maxUploadBytesMB'
                    ? plan.maxUploadBytes !== factory.maxUploadBytes
                    : plan[key] !== factory[key]
                );

                return (
                  <div key={planKey} className="glass-panel p-5 rounded-3xl border border-gray-800 shadow-xl space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{plan.label}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">Plan: {planKey}</p>
                      </div>
                      {isOverridden && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex-shrink-0">
                          Editado
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {PLAN_LIMIT_FIELDS.map(({ key, label, help }) => (
                        <div key={key}>
                          <label className="block text-[11px] font-semibold text-gray-300 mb-1" title={help}>
                            {label}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={draft[key]}
                            onChange={(e) => handlePlanFieldChange(planKey, key, e.target.value)}
                            className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSavePlan(planKey)}
                        disabled={isSaving}
                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Guardar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetPlan(planKey)}
                        disabled={isSaving || !isOverridden}
                        title="Restablecer a valores de fábrica"
                        className="px-3 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-xl transition-all disabled:opacity-30"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
