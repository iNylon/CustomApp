FROM php:8.3-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libpq-dev libzip-dev curl \
    && docker-php-ext-install curl pdo pdo_mysql pdo_pgsql \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY public /app/public
COPY src /app/src

EXPOSE 8080

CMD ["php", "-S", "0.0.0.0:8080", "-t", "/app/public"]
