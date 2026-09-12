# 🎵 SerenatIA — Canciones Personalizadas con Inteligencia Artificial

Plataforma web para crear y vender canciones personalizadas con IA. El cliente
cuenta su historia, elige un género y una duración, y recibe una canción original
en minutos — lista para descargar en MP3 o convertir en video vertical para
WhatsApp, Instagram Reels o TikTok.

**En producción:** [canciones.montanadev.space](https://canciones.montanadev.space/)

---

## 🌟 Qué hace

### Para el cliente
- **25 géneros musicales**, filtrables por ocasión: 💕 Amor y Amistad · 🎉 Celebración · 👶 Infantil.
  Cada uno con una ficha técnica muy detallada (instrumentos, técnicas de ejecución,
  composición del coro, sonidos de fondo) — ver [`GENEROS.md`](GENEROS.md).
- **Asistente en 4 pasos**: dedicatoria → género → historia → duración y voz.
- **Selector de voz**: masculina, femenina, ambas (a dúo) o cualquiera.
- **Dictado por voz** para no tener que escribir la historia.
- **Demos de 10 segundos** por género antes de componer.
- **Creador de video vertical (9:16)** con hasta 5 fotos, efecto Ken Burns y
  **karaoke sincronizado palabra por palabra con la letra real de la canción**.
- **Mis Creaciones**: historial por código de acceso, con el prompt original y la
  opción de "Crear a partir de esta" para reutilizar la historia en otro género.
- **Descarga con nombre descriptivo**: `camila-salsa-90-seg-sep10.mp3`.

### Panel de Superadmin
- Auditoría de canciones (IP, fecha, ID de generación, reproductor y descarga).
- Gestión de códigos de acceso con límite de canciones.
- Consulta de cuota de créditos en vivo del proveedor de IA.
- Generador de demos que no consume códigos de cliente.

### Páginas legales
Términos y Condiciones, Política de Reembolsos y Política de Privacidad, bajo
marco legal colombiano (Ley 1480 y Ley 1581), en `#/terminos`, `#/reembolsos` y
`#/privacidad`.

---

## 🎚️ Calidad de audio

Tres capas trabajando juntas:

1. **Prompts hiper-específicos por género.** No se envía "salsa" sino el montuno
   en octavas, el abanico de timbales, el coro a tres voces en terceras y el
   ambiente de salón de baile. Ver [`GENEROS.md`](GENEROS.md).
2. **Máxima calidad de archivo**: se solicita MP3 a 320 kbps / 48 kHz.
3. **Normalización de loudness en el servidor** (`server/audioLimiter.js`): todas
   las canciones salen a `-14 LUFS` con techo de `-1.5 dBTP`, lo que evita el
   sonido "aplastado" o distorsionado en voces y coros, y hace que suenen
   parejas entre sí.

---

## 🔐 Seguridad

- Contraseña de Superadmin **hasheada** (scrypt + salt, comparación timing-safe).
  No hay contraseña por defecto: la primera vez se genera una aleatoria y se
  imprime una sola vez en los logs.
- **Rate limiting** en login, validación de códigos, generación y video.
- **Cabeceras de seguridad** con `helmet` (CSP, X-Frame-Options, etc.).
- **CORS restringido** al dominio de producción.
- El contenedor escucha solo en `127.0.0.1` — el acceso público es exclusivamente
  a través del túnel de Cloudflare.
- Filtro de lenguaje ofensivo y manejo automático de referencias con derechos de
  autor **antes** de gastar créditos.

---

## 🚀 Instalación

### 1. Clonar e instalar
```bash
git clone https://github.com/julianmontana1/canciones-personalizadas.git
cd canciones-personalizadas
npm install
```

Requiere **Node.js 22+** y **ffmpeg** instalado en el sistema (se usa para
normalizar el audio y convertir los videos a MP4).

### 2. Variables de entorno
Crea un archivo `.env` basado en `.env.example`:
```env
PORT=3001
ELEVENLABS_API_KEY=tu_api_key_aqui
```

La contraseña de Superadmin **no tiene valor por defecto**: al iniciar el servidor
por primera vez se genera una aleatoria y se imprime una sola vez en los logs.
Guárdala en ese momento (o cámbiala luego desde el panel de Configuración). Si
prefieres fijarla tú, agrega `ADMIN_PASSWORD=tu_clave` antes del primer arranque.

### 3. Desarrollo
```bash
npm run server   # Backend Express  → http://localhost:3001
npm run dev      # Frontend Vite    → http://localhost:5173
```

### 4. Producción (Docker)
```bash
docker compose up -d --build
```
El contenedor sirve el frontend compilado y la API en el puerto 3001, expuesto
solo a `127.0.0.1`. El acceso público se hace mediante Cloudflare Tunnel.

---

## 🔑 Códigos de acceso

Los códigos de acceso se crean y gestionan desde el panel de Superadmin.
Consulta al administrador para obtener uno.

---

## 🗂️ Estructura

```
server/
  index.js              API Express, rutas y middlewares
  auth.js               Hasheo y verificación de contraseña
  genreProfiles.js      Los 25 perfiles de género y el constructor de prompts
  elevenLabsMusic.js    Llamada a la API de música + reintento por contenido protegido
  multipart.js          Parser de la respuesta multipart (audio + metadata)
  lyricsFromTimestamps.js  Letra real + timestamps por palabra → líneas de karaoke
  audioLimiter.js       Normalización de loudness y true peak
  contentFilter.js      Filtro de lenguaje ofensivo
src/
  components/           Vistas de usuario, admin, wizard, video y páginas legales
  video/                Composición Remotion del video vertical
  utils/                Filtros de mood, nombres de archivo, reconocimiento de voz
```

---

## 🛠️ Tecnologías

- **Frontend**: React 19, Vite, Tailwind CSS v4, Remotion (video), Lucide Icons,
  Web Speech API, Web Audio API
- **Backend**: Node.js 22, Express 5, helmet, express-rate-limit, ffmpeg
- **IA**: ElevenLabs Music API (`music_v2`, endpoint `/v1/music/detailed` con
  timestamps por palabra para el karaoke)

---

## 📓 Documentación adicional

- [`GENEROS.md`](GENEROS.md) — catálogo completo de los 25 géneros con su ficha
  técnica y un ejemplo de prompt real.
- [`BITACORA.md`](BITACORA.md) / [`BITACORA.html`](BITACORA.html) — bitácora
  histórica de las primeras fases de desarrollo.

---

## 📄 Licencia

MIT © 2026 Julián Montaña
