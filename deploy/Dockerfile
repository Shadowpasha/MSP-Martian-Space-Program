# The game as a small static website: nginx serving the Estella web export.
# Build context is the repo root, with the export in dist/web (see docs/DEPLOY.md).
FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/web/ /usr/share/nginx/html/

EXPOSE 8070
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1:8070/ || exit 1
