# The game server: Node serving the Estella web export and the A.R.I.E.S. Gemini route
# (scripts/playtest.mjs). Configure it with environment variables; see deploy/.env.example.
# Build context is the repo root, with the export in dist/web (see docs/DEPLOY.md).
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production MSP_HOST=0.0.0.0 MSP_PORT=8070 MSP_BUILD_DIR=/app/web

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY scripts/playtest.mjs scripts/playtest.mjs
COPY deploy/web/ deploy/web/
COPY dist/web/ web/

USER node
EXPOSE 8070
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1:8070/ || exit 1
CMD ["node", "scripts/playtest.mjs"]
