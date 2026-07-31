# Развёртывание Cricket Stream Platform

Инструкция рассчитана на Ubuntu, каталог `/opt/cricket-stream`, пользователя
`stream`, PostgreSQL, Nginx и systemd.

## Требования

- Python 3.13;
- Node.js 22;
- `uv`;
- PostgreSQL;
- FFmpeg;
- Nginx;
- DNS-запись домена, указывающая на сервер;
- открытые TCP-порты 80 и 443.

## 1. Получение проекта

```bash
sudo useradd --system --create-home --shell /bin/bash stream
sudo mkdir -p /opt/cricket-stream
sudo chown -R stream:stream /opt/cricket-stream

sudo -u stream git clone \
  git@github.com:lazaryants/cricket-stream.git \
  /opt/cricket-stream
```

Для приватного репозитория на сервере должен быть настроен deploy key или другой
разрешённый способ аутентификации GitHub.

## 2. Backend

```bash
cd /opt/cricket-stream/backend
uv sync --locked
cp .env.example .env
chmod 600 .env
```

Заполните `.env`. Обязательно замените:

- `DATABASE_URL`;
- `JWT_SECRET_KEY`;
- пути к FFmpeg, Streamlink и yt-dlp при необходимости.

Секрет JWT можно создать так:

```bash
openssl rand -hex 32
```

## 3. PostgreSQL и миграции

Создайте отдельного пользователя и базу данных, затем:

```bash
cd /opt/cricket-stream/backend
.venv/bin/alembic upgrade head
.venv/bin/alembic current
.venv/bin/alembic check
```

Ожидается одна актуальная `head`-ревизия и сообщение:

```text
No new upgrade operations detected.
```

Создание ноды и администратора:

```bash
cd /opt/cricket-stream/backend
.venv/bin/python manage.py create-node
.venv/bin/python manage.py create-user \
  --username admin \
  --role admin \
  --superuser
```

## 4. Runtime-каталоги

```bash
sudo mkdir -p /opt/cricket-stream/var/hls
sudo chown -R stream:stream /opt/cricket-stream/var
sudo chmod 755 /opt/cricket-stream/var
sudo chmod 755 /opt/cricket-stream/var/hls
```

HLS-сегменты временные и не должны добавляться в Git или резервную копию кода.

## 5. Frontend

```bash
cd /opt/cricket-stream/frontend
npm ci
npm run lint
npm run build
```

Production-файлы появятся в `frontend/dist`.

## 6. systemd

```bash
sudo cp \
  /opt/cricket-stream/deploy/systemd/cricket-backend.service \
  /etc/systemd/system/cricket-backend.service

sudo systemctl daemon-reload
sudo systemctl enable --now cricket-backend
sudo systemctl status cricket-backend --no-pager -l
```

## 7. Nginx

Для первичной установки, когда HTTPS ещё не выпускался:

```bash
sudo cp \
  /opt/cricket-stream/deploy/nginx/cricket-stream.conf \
  /etc/nginx/sites-available/cricket-stream

sudo ln -s \
  /etc/nginx/sites-available/cricket-stream \
  /etc/nginx/sites-enabled/cricket-stream

sudo nginx -t
sudo systemctl reload nginx
```

> Если Certbot уже изменил рабочую конфигурацию, не копируйте шаблон поверх
> `/etc/nginx/sites-available/cricket-stream`. Сначала сравните файлы и сохраните
> резервную копию, иначе можно удалить TLS-настройки.

## 8. HTTPS

DNS `A` для `de.cricket-stream.icu` должен указывать на production-сервер.

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

sudo certbot \
  --nginx \
  -d de.cricket-stream.icu \
  --redirect
```

Проверка:

```bash
curl -I https://de.cricket-stream.icu
curl -I http://de.cricket-stream.icu
curl -fsS https://de.cricket-stream.icu/api/v1/health

sudo certbot renew --dry-run
```

HTTP должен перенаправляться на HTTPS, а тестовое продление — завершаться
успешно.

## 9. Финальная проверка

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager -l
sudo systemctl status cricket-backend --no-pager -l

ps -eo pid,cmd --width 500 \
  | grep -E '[y]t-dlp|[s]treamlink|[f]fmpeg'
```

Через браузер проверьте авторизацию, Dashboard, страницу всех трансляций,
запуск тестового потока, HLS-preview, монитор и остановку.

## Обновление существующего сервера

Перед обновлением остановите трансляции через интерфейс и создайте резервные
копии:

```bash
cd /opt/cricket-stream
git status

cp backend/.env ~/cricket-backend.env.backup
sudo cp -a /etc/nginx/sites-available/cricket-stream \
  /etc/nginx/sites-available/cricket-stream.backup

sudo -u postgres pg_dump --format=custom cricket_stream \
  > ~/cricket-stream-db.backup.dump
```

Затем:

```bash
cd /opt/cricket-stream
git pull --ff-only

cd backend
uv sync --locked
.venv/bin/alembic upgrade head
.venv/bin/alembic check

cd ../frontend
npm ci
npm run lint
npm run build

sudo systemctl restart cricket-backend
sudo systemctl status cricket-backend --no-pager -l
```

Не заменяйте production `.env` примером и не копируйте Nginx-шаблон поверх
конфигурации Certbot при обычном обновлении приложения.

