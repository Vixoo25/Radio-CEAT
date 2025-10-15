# Usar la imagen oficial de PHP 8.1 con un servidor Apache preconfigurado
FROM php:8.1-apache

# Habilitar el módulo de reescritura de Apache (útil para URLs amigables en el futuro)
RUN a2enmod rewrite

# Copiar todos los archivos de tu proyecto al directorio web del servidor
COPY . /var/www/html/