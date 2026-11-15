FROM node:26-alpine

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV PORT=40100
ENV DATA_DIR=/var/www/data

WORKDIR /var/www

# The app is built in CI (npm run build, output: standalone). The standalone output contains the
# traced node_modules; there are no native modules (SQLite uses the built-in node:sqlite).
COPY ./.next/standalone /var/www
COPY ./.next/static /var/www/.next/static
COPY ./public /var/www/public
# package.json is copied last: Semantic Release bumps the version after the build.
COPY ./package.json /var/www/package.json

RUN mkdir -p /var/www/data && chown -R node:node /var/www/data

USER node

VOLUME /var/www/data

EXPOSE 40100

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "server.js"]
