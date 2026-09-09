# 📓 Bitácora de Desarrollo: SongCraft AI

**Proyecto:** Generador de Canciones Personalizadas con ElevenLabs  
**Fecha:** Septiembre 2026  
**Autor:** Julián Montaña  
**Repositorio GitHub:** [https://github.com/julianmontana1/canciones-personalizadas](https://github.com/julianmontana1/canciones-personalizadas)  
**Estado Actual:** MVP Completo, Funcional y Desplegado en Control de Versiones

---

## 🎯 1. Resumen Ejecutivo y Alcance del Proyecto

El objetivo principal de este proyecto fue diseñar, desarrollar y desplegar una plataforma web comercial, estructurada y fluida para la generación de canciones personalizadas a medida utilizando Inteligencia Artificial a través del modelo `music_v2` de **ElevenLabs**.

### 🌟 Pilares del Sistema:
1. **Experiencia de Usuario Simplificada**: Interfaz atractiva y moderna donde el usuario final solo necesita ingresar sus nombres, recuerdos y seleccionar su género musical (o dictarlo por voz) para obtener una canción única con vocales e instrumental en formato MP3 de alta fidelidad.
2. **Panel de Control y Auditoría (Superadmin)**: Registro exhaustivo de cada canción generada con la IP real del cliente, fecha y hora exacta, identificador de ElevenLabs, reproductor en línea y descarga del archivo MP3 guardado en el servidor.
3. **Control Comercial por Códigos de Acceso**: Sistema de cuotas donde cada cliente o usuario utiliza un código asignado con un número específico de canciones permitidas (ej. 1 canción, 5 canciones o ilimitado).
4. **Demos con Instrumentos Reales**: Biblioteca de 13 muestras de audio de 10 segundos grabadas en estudio para que los clientes puedan escuchar el ritmo e instrumentación real antes de generar su canción.
5. **Seguridad y Privacidad**: Ocultamiento total de la API Key para los usuarios finales, persistencia contra recargas accidentales en el navegador y protección de claves secretas en el control de versiones (Git).

---

## 📅 2. Cronología de Desarrollo e Iteraciones

### 🔹 Fase 1: Arquitectura Base y Creación del MVP
- **Requerimiento inicial**: Sitio web para crear canciones usando la API de ElevenLabs con parámetros de nombres, referencias, duración y género musical.
- **Implementación**:
  - Inicialización del proyecto con **React 19**, **Vite** y **Tailwind CSS v4**.
  - Servidor backend en **Node.js** y **Express** para evitar problemas de CORS, capturar la IP del cliente y almacenar los archivos de audio de forma persistente.
  - Creación del reproductor de audio personalizado con animaciones de ondas sonoras (`SongPlayer.jsx`).
  - Creación de banner temático ilustrado en alta resolución para el encabezado (`hero-banner.jpg`).

### 🔹 Fase 2: Segmentación de Vistas (Usuario vs. Superadmin)
- **Requerimiento**: Crear dos vistas independientes: una para el usuario (generar y descargar de inmediato sin historial) y otra para el Superadmin (auditoría completa con IP, fecha, hora, ID de ElevenLabs y archivo MP3).
- **Implementación**:
  - `UserView.jsx`: Flujo limpio y enfocado exclusivamente en la creación y descarga.
  - `AdminView.jsx`: Acceso protegido por contraseña (`admin123`) con métricas, tabla de auditoría, reproductor MP3 integrado y opción de borrado.
  - Endpoint `POST /api/generate`: Captura automática de `x-forwarded-for` o socket IP y almacenamiento del archivo en `server/storage/songs/`.

### 🔹 Fase 3: Transcripción por Voz, Demos de 10s y Control de Códigos
- **Requerimiento**:
  - Permitir enviar audio/voz para rellenar los campos automáticamente.
  - Hacer transparente la API Key (solo editable desde Superadmin).
  - Incluir demos de 10 segundos por género.
  - Evitar recargas involuntarias que oculten la descarga.
  - Crear un sistema de códigos de acceso con cuotas (ej: 1 canción, 5 canciones e ilimitado).
- **Implementación**:
  - **Asistente de Voz**: Integración de la Web Speech API con procesamiento de lenguaje natural (`parseSpokenSongPrompt`) que extrae destinatario, género, duración y anécdotas de la voz del usuario.
  - **Módulo de Códigos**: Almacenamiento en `server/data/codes.json` con validación en tiempo real (`/api/codes/validate`) y seguimiento del consumo (`used` / `maxSongs`).
  - **Historial Aislado por Código**: El usuario puede ver únicamente sus canciones generadas con su código sin exponer datos de otros clientes.
  - **Protección de Recarga**: Persistencia en `localStorage` del reproductor y creación de botón prominente con descarga mediante Blob URL directa.
  - **Centralización de API Key**: Pestaña de configuración en Superadmin para actualizar la API Key de ElevenLabs y contraseña del sistema.

### 🔹 Fase 4: Instrumentos Reales y Nuevas Categorías Musicales
- **Requerimiento**: Reemplazar los sintetizadores robóticos por sonidos reales y añadir categorías infantiles (música infantil, canción de dormir), salsa, mariachi y banda sinaloense.
- **Implementación**:
  - Descarga e integración de **13 archivos MP3 grabados en estudio** en `public/audio/samples/`.
  - Creación del reproductor de estudio (`genreAudioSynthesizer.js`) con salto al clímax de la canción y desvanecimiento progresivo (*fade-out*) exacto a los 10 segundos.
  - Filtro por categorías visuales: *Para Niños*, *Regional & Fiesta*, *Pop & Romántico*, *Urbano & Rock*.
  - Actualización del reconocedor de voz para identificar automáticamente las nuevas categorías.

### 🔹 Fase 5: Publicación en GitHub y Buenas Prácticas
- **Requerimiento**: Subir el repositorio a GitHub (`julianmontana1/canciones-personalizadas`).
- **Implementación**:
  - Configuración estricta de `.gitignore` para omitir `.env`, `settings.json` (clave de ElevenLabs) y `history.json`.
  - Creación de archivos de plantilla `settings.example.json` y `.env.example`.
  - Publicación y sincronización de la rama `main` en GitHub.

---

## 🏗️ 3. Arquitectura del Software

```
CancionesPersonalizadas/
├── public/
│   ├── audio/samples/           # 13 clips de audio de estudio reales (MP3)
│   ├── hero-banner.jpg          # Ilustración artística del estudio virtual
│   └── favicon.svg              # Icono vectorial musical
├── server/
│   ├── index.js                 # Servidor Express, API REST, captura de IP y proxy ElevenLabs
│   ├── data/
│   │   ├── codes.json           # Códigos de acceso y saldo de canciones
│   │   ├── settings.json        # Configuración central (API Key y contraseña admin - gitignored)
│   │   ├── settings.example.json# Plantilla de configuración
│   │   └── history.json         # Base de datos local de canciones auditadas (gitignored)
│   └── storage/
│       └── songs/               # Almacenamiento local de archivos .mp3 creados
├── src/
│   ├── components/
│   │   ├── Navbar.jsx           # Barra de navegación y conmutador de vista
│   │   ├── UserView.jsx         # Vista comercial de usuario (código, voz, géneros, form)
│   │   ├── SongPlayer.jsx       # Reproductor visual con ondas y descarga por Blob
│   │   ├── VoiceAssistantModal.jsx # Modal de dictado y extracción por voz
│   │   ├── AdminView.jsx        # Panel Superadmin (Auditoría, Códigos, Configuración)
│   │   └── AdminLoginModal.jsx  # Modal de autenticación con clave de administración
│   ├── utils/
│   │   ├── genreAudioSynthesizer.js # Reproductor de muestras de 10s con fade-out
│   │   └── speechRecognition.js     # Motor de reconocimiento de voz y parser
│   ├── App.jsx                  # Estado global y enrutamiento entre vistas
│   └── index.css                # Estilos globales con Tailwind CSS v4 y animaciones
├── .env.example                 # Variables de entorno de ejemplo
├── .gitignore                   # Exclusiones de seguridad para Git
├── README.md                    # Documentación principal del repositorio
├── BITACORA.md                  # Bitácora detallada en Markdown
├── BITACORA.html                # Bitácora interactiva en HTML
└── package.json                 # Dependencias y scripts de ejecución
```

---

## 🔑 4. Credenciales y Códigos de Prueba Preconfigurados

### Acceso al Panel de Superadmin
- **URL**: Clic en botón **"Superadmin"** en la esquina superior derecha o footer.
- **Contraseña por defecto**: `admin123` (Modificable en la pestaña *Configuración*).

### Códigos de Acceso para Clientes

| Código | Límite | Estado | Descripción |
| :--- | :--- | :--- | :--- |
| `TEST-1SONG-7A9B` | **1 canción** | Activo | Código de prueba unitaria. Se bloquea al completarse |
| `VIP-5SONGS-K3M8` | **5 canciones** | Activo | Paquete estándar para clientes. Muestra saldo restante |
| `MASTER-UNLIMITED-PRO` | **♾️ Ilimitado** | Activo | Acceso maestro sin límite de canciones |

---

## 🎼 5. Catálogo de Géneros Musicales y Muestras de Estudio

| ID | Género | Categoría | Instrumentación / Atmósfera | Muestra de Estudio (10s) |
| :--- | :--- | :--- | :--- | :--- |
| `infantil` | Música Infantil / Niños | Para Niños | Alegre, juguetona, pegadiza | `public/audio/samples/infantil.mp3` |
| `dormir` | Canción de Dormir / Nana | Para Niños | Piano sereno, caja de música, arrullo | `public/audio/samples/dormir.mp3` |
| `salsa` | Salsa Brava / Caribeña | Regional & Fiesta | Trompetas vivas, congas y piano montuno | `public/audio/samples/salsa.mp3` |
| `mariachi` | Mariachi Tradicional | Regional & Fiesta | Trompetas mexicanas, violines y guitarrón | `public/audio/samples/mariachi.mp3` |
| `banda` | Banda Sinaloense | Regional & Fiesta | Tuba, tambora y metales norteños | `public/audio/samples/banda.mp3` |
| `cumbia` | Cumbia / Fiesta | Regional & Fiesta | Acordeón latino y percusión bailable | `public/audio/samples/cumbia.mp3` |
| `pop` | Pop Latino Moderno | Pop & Romántico | Melódico, enérgico y actual | `public/audio/samples/pop.mp3` |
| `balada` | Balada Romántica | Pop & Romántico | Piano acústico, cuerdas emotivas | `public/audio/samples/balada.mp3` |
| `acustico` | Acústico Íntimo | Pop & Romántico | Guitarra de palo y calidez vocal | `public/audio/samples/acustico.mp3` |
| `reggaeton` | Reggaetón / Urbano | Urbano & Rock | Dembow bailable y bajos potentes | `public/audio/samples/reggaeton.mp3` |
| `rock` | Rock / Pop Rock | Urbano & Rock | Guitarras eléctricas y batería viva | `public/audio/samples/rock.mp3` |
| `lofi` | Lo-Fi Chill Hop | Urbano & Rock | Bossa nova relajada con textura vinilo | `public/audio/samples/lofi.mp3` |
| `electronica` | Electrónica / EDM | Urbano & Rock | Sintetizadores y beat de fiesta | `public/audio/samples/electronica.mp3` |

---

## 📡 6. Endpoints de la API Backend (Puerto 3001)

### Públicos / Usuario:
- `GET /api/health`: Comprueba la disponibilidad del servidor y hora UTC.
- `GET /api/codes/validate?code={CODE}`: Valida si el código existe y calcula el cupo disponible.
- `GET /api/codes/my-songs?code={CODE}`: Retorna únicamente el historial de canciones de ese código.
- `POST /api/generate`: Genera la canción, descuenta saldo, almacena el MP3 y devuelve la URL de audio.
- `GET /api/storage/songs/:filename`: Servicio de streaming de audio con soporte para `audio/mpeg` y `Accept-Ranges`.

### Privados / Superadmin (Requieren cabecera `x-admin-key: {PASSWORD}`):
- `POST /api/admin/verify`: Valida la contraseña del administrador.
- `GET /api/admin/history`: Devuelve la lista completa de canciones con IP de origen, fecha y hora.
- `DELETE /api/admin/history/:id`: Elimina un registro de la auditoría y borra el archivo MP3 del servidor.
- `GET /api/admin/codes`: Lista todos los códigos de acceso, uso y límites.
- `POST /api/admin/codes`: Crea un nuevo código de acceso con cupo personalizado.
- `DELETE /api/admin/codes/:code`: Elimina un código de acceso.
- `GET /api/admin/settings`: Obtiene el estado de configuración (clave de ElevenLabs enmascarada).
- `POST /api/admin/settings`: Actualiza la API Key de ElevenLabs o cambia la contraseña del Superadmin.

---

## 🚀 7. Manual de Operación y Comandos

### Para Iniciar el Sistema:
1. **Iniciar Servidor Backend:**
   ```bash
   npm run server
   ```
   *(Escuchando en http://localhost:3001)*

2. **Iniciar Frontend Web:**
   ```bash
   npm run dev
   ```
   *(Disponible en http://localhost:5173)*

### Para Probar una Creación Completa:
1. Abrir `http://localhost:5173`.
2. Ingresar el código `VIP-5SONGS-K3M8` y hacer clic en **Aplicar**.
3. Presionar **"Dictar por Voz"** o escribir destinatario y anécdotas.
4. Seleccionar un estilo musical y pulsar **"Demo 10s"** para escuchar la muestra.
5. Hacer clic en **"Generar Canción con ElevenLabs"**.
6. Escuchar la canción con el visualizador de ondas y hacer clic en **"Descargar Canción MP3"**.
7. Ir a **Superadmin** (clave `admin123`) para verificar que tu IP y canción quedaron auditadas en el servidor.
