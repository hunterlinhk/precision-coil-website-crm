# Arcwind website + CRM. Build: docker build -t arcwind .   Run: see docker-compose.yml
FROM node:22-bookworm-slim AS build
WORKDIR /app
# better-sqlite3 is a native module
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG SITE_URL=https://www.example.com
ENV SITE_URL=$SITE_URL NEXT_TELEMETRY_DISABLED=1 DATA_DIR=/tmp/build-data
RUN npm run build && npm prune --omit=dev && rm -rf /tmp/build-data

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 DATA_DIR=/data PORT=3000
COPY --from=build /app/package.json /app/next.config.mjs ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
RUN mkdir -p /data && chown -R node:node /data
USER node
VOLUME /data
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
