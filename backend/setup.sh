#!/usr/bin/env bash
# Usage: cd backend && ./setup.sh   (PHP 8.3+ et Composer requis)
set -e
cd "$(dirname "$0")/.."
composer create-project laravel/laravel:^12.0 _laravel
cp -R backend/app backend/database backend/routes backend/config _laravel/
cat backend/.env.additions >> _laravel/.env
cd _laravel
composer require predis/predis
php artisan install:api --no-interaction || true
php artisan migrate
echo "OK. Lancer: php artisan serve  puis, dans un autre terminal: php artisan queue:work"
