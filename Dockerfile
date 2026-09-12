# Multi-stage Docker build for SerenatIA
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./
RUN npm ci

# Copy source code and build production assets
COPY . .
RUN npm run build

# Production runner image
#
# Debian ("bookworm-slim"), not Alpine: the story-video renderer uses
# @remotion/renderer, which drives a headless Chromium — Remotion explicitly does
# not support Alpine/musl libc for this, only glibc-based distros.
FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# ffmpeg: used internally by @remotion/renderer to mux the rendered story-video's
# audio/video into the final MP4.
# The rest: shared libraries headless Chromium needs to run at all on a minimal
# Debian image (no desktop environment installed).
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and backend assets. `src/video` is included (unlike the
# rest of `src/`) because the story-video renderer bundles that composition with
# @remotion/bundler at render time — it needs the real source, not just the
# compiled `dist` output.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/src/video ./src/video
COPY --from=builder /app/.env.example ./.env.example

# Pre-download Remotion's headless Chromium into the image at build time, so the
# first customer video isn't the one waiting on (or failing due to) a runtime
# download.
RUN node -e "import('@remotion/renderer').then(m => m.ensureBrowser()).then(() => console.log('Chrome Headless Shell ready')).catch((e) => { console.error(e); process.exit(1); })"

EXPOSE 3001

# Run server (serves both API and frontend on port 3001)
CMD ["node", "server/index.js"]
