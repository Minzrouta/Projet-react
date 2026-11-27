# --- build ---
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# "production" branche l'API, "mock" produit la version bouchonnée autonome
ARG MODE=production
RUN npm run build -- --mode $MODE

# --- service statique ---
FROM nginx:alpine
# l'image nginx remplace ${API_URL} au démarrage (dossier templates)
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV API_URL=http://host.docker.internal:8080
EXPOSE 80
