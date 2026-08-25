# ─── Сборка витрины ───────────────────────────────────────────────────────────
FROM node:22-slim AS build

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Vite вшивает VITE_* в бандл на этапе сборки, поэтому это build-args,
# а не переменные рантайма. В Railway задаются как build-time variables.
ARG VITE_API_BASE_URL
ARG VITE_MEDIA_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MEDIA_BASE_URL=$VITE_MEDIA_BASE_URL

RUN pnpm build

# ─── Раздача ──────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
