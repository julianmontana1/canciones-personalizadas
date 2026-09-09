# 🎵 SongCraft AI - Canciones Personalizadas con ElevenLabs

Plataforma web estructurada, moderna y fluida para la creación y venta de canciones personalizadas con Inteligencia Artificial utilizando la API de ElevenLabs Music.

![SongCraft AI Studio](public/hero-banner.jpg)

---

## 🌟 Características Principales

### 🎧 Vista de Usuario
- **13 Géneros Musicales Auténticos**:
  - 🎈 **Para Niños**: Música Infantil / Niños, Canción de Dormir / Nana
  - 🎺 **Regional & Fiesta**: Salsa Brava, Mariachi Tradicional, Banda Sinaloense, Cumbia / Fiesta
  - ✨ **Pop & Romántico**: Pop Latino, Balada Romántica, Acústico Íntimo
  - 🔥 **Urbano & Alternativo**: Reggaetón, Rock / Pop Rock, Lo-Fi Chill Hop, Electrónica / EDM
- **🎧 Demos de 10 Segundos**: Escucha previa con instrumentos y grabaciones de estudio reales antes de componer.
- **🎙️ Dictado por Voz Inteligente**: Asistente con reconocimiento de voz que detecta nombres, géneros y recuerdos hablados.
- **📥 Descarga Directa en MP3**: Descarga con Blob directo de alta fidelidad.
- **💾 Protección de Estado**: Persistencia en `localStorage` para evitar pérdidas al recargar la página.
- **🔒 Privacidad Garantizada**: El usuario no ve registros ni historiales de otros clientes.

### 🛡️ Panel de Superadmin
- **Auditoría Centralizada**: Registro de IP real, fecha y hora exacta, ID de ElevenLabs y reproductor MP3 en vivo en la tabla.
- **Control de Códigos de Acceso**: Creación y administración de códigos con límites de canciones (1, 5, 10 o ilimitado).
- **Gestión de API Key**: Configuración centralizada y transparente de la API Key de ElevenLabs y contraseña de administración.

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/julianmontana1/canciones-personalizadas.git
cd canciones-personalizadas
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` basado en `.env.example`:
```env
PORT=3001
ADMIN_PASSWORD=admin123
ELEVENLABS_API_KEY=tu_api_key_aqui
```

### 4. Iniciar servicios

#### Servidor Backend (Express):
```bash
npm run server
```
*Disponible en `http://localhost:3001`*

#### Frontend (Vite + React):
```bash
npm run dev
```
*Disponible en `http://localhost:5173`*

---

## 🔑 Códigos de Prueba Preconfigurados

| Código | Límite | Tipo |
| :--- | :--- | :--- |
| `TEST-1SONG-7A9B` | 1 Canción | Prueba rápida |
| `VIP-5SONGS-K3M8` | 5 Canciones | Paquete estándar |
| `MASTER-UNLIMITED-PRO` | Ilimitado | Uso personal |

---

## 🛠️ Tecnologías

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Web Speech API, Web Audio API
- **Backend**: Node.js, Express, CORS, Dotenv
- **IA**: ElevenLabs Music API (`music_v2`)

---

## 📓 Bitácora de Desarrollo y Alcance

Para una visión profunda de las fases de desarrollo, decisiones de ingeniería, endpoints y manual de operación:
- Consulta el archivo en Markdown: [`BITACORA.md`](BITACORA.md)
- O abre en tu navegador el reporte visual interactivo: [`BITACORA.html`](BITACORA.html)

---

## 📄 Licencia

MIT © 2026 Julián Montaña
