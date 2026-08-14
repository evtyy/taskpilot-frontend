# ---- Stage 1: build the static React bundle ----
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first so this layer is cached unless package*.json changes
COPY package*.json ./
RUN npm ci

COPY . .

# The API base URL is baked into the static bundle at build time
# (Vite env vars are compile-time). Override via --build-arg if needed.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Stage 2: serve with nginx ----
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
