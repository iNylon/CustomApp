FROM node:22-alpine AS frontend-builder

WORKDIR /frontend

COPY package.json /frontend/package.json
COPY frontend /frontend/frontend

RUN npm install --no-fund --no-audit
RUN npm run build

FROM php:8.3-cli

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        $PHPIZE_DEPS \
        git \
        unzip \
        libcurl4-openssl-dev \
        libpq-dev \
        libzip-dev; \
    docker-php-ext-install \
        curl \
        pdo \
        pdo_mysql \
        pdo_pgsql; \
    pecl install redis; \
    docker-php-ext-enable redis; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY public /app/public
COPY src /app/src
COPY --from=frontend-builder /frontend/public/assets /app/public/assets

EXPOSE 8080

CMD ["php", "-S", "0.0.0.0:8080", "-t", "/app/public", "/app/public/router.php"]
