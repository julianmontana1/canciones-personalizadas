# Multi-stage Docker build for SongCraft AI
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./
RUN npm ci

# Copy source code and build production assets
COPY . .
RUN npm run build

# Production runner image
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# ffmpeg is used server-side to transcode browser-recorded WebM video into real MP4
RUN apk add --no-cache ffmpeg

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and backend assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/.env.example ./.env.example

EXPOSE 3001

# Run server (serves both API and frontend on port 3001)
CMD ["node", "server/index.js"]
