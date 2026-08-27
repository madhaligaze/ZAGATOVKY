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

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Railway передаёт свой порт через PORT; локально по умолчанию 8080
ENV PORT=8080
# Адрес API для проксирования /sitemap.xml. Значение по умолчанию обязательно:
# пустая переменная превратилась бы в «proxy_pass ;», и nginx не стартовал бы
# вовсе — то есть из-за карты сайта легла бы вся витрина.
ENV BACKEND_URL=https://zagatovky-backend-production.up.railway.app

# Подставляем только свои переменные, чтобы envsubst не тронул $uri и $host
ENV NGINX_ENVSUBST_FILTER='(PORT|BACKEND_URL)'

EXPOSE 8080
