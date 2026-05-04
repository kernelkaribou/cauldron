# Build React frontend
FROM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Build Express backend
FROM node:22-bookworm-slim AS backend
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npm run build && npm prune --omit=dev

# Production image
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends tini gosu && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=backend /app/dist /app/dist
COPY --from=backend /app/node_modules /app/node_modules
COPY --from=backend /app/migrations /app/migrations
COPY --from=frontend /app/dist /app/public
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PORT=8090 DATA_DIR=/data NODE_ENV=production
EXPOSE 8090
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:8090/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["tini", "--"]
CMD ["/app/entrypoint.sh"]
