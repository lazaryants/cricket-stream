# Руководство по развёртыванию

[English version](../en/DEPLOYMENT.md)

Руководство описывает production-развёртывание Cricket Stream Platform на Ubuntu с использованием:

- `/opt/cricket-stream`;
- системного пользователя `stream`;
- PostgreSQL;
- Nginx;
- systemd;
- Let's Encrypt / Certbot.

Заполненная production-база должна сохраняться при любых обновлениях.

## 1. Рекомендуемый сервер

Для 16 одновременных ретрансляций без перекодирования:

- Ubuntu LTS;
- 4 vCPU;
- 8 ГБ RAM;
- стабильный сетевой канал;
- SSD;
- публичный IPv4;
- DNS-запись для веб-интерфейса;
- исходящий доступ к платформам-источникам и RTMP-назначениям.

Для разработки или небольшого количества потоков можно использовать меньшую конфигурацию.

## 2. Необходимое ПО

- Python 3.13;
- Node.js 22;
- `uv`;
- PostgreSQL;
- FFmpeg;
- Nginx;
- Git;
- Certbot;
- Streamlink и yt-dlp в виртуальном окружении backend.

Входящие TCP-порты:

- 22 для SSH, по возможности с ограничением доступа;
- 80 для HTTP и проверки сертификата;
- 443 для HTTPS.

Порт 8000 не должен быть публичным: Uvicorn обслуживается через Nginx.

## 3. Системный пользователь

```bash
sudo useradd \
  --system \
  --create-home \
  --shell /bin/bash \
  stream
```

Каталог приложения:

```bash
sudo mkdir -p /opt/cricket-stream
sudo chown -R stream:stream /opt/cricket-stream
```

## 4. Репозиторий

```bash
sudo -u stream git clone \
  git@github.com:lazaryants/cricket-stream.git \
  /opt/cricket-stream
```

Для приватного репозитория настройте deploy key только для чтения или другой разрешённый способ доступа.

Проверка:

```bash
cd /opt/cricket-stream
git status --short --branch
git tag --points-at HEAD
```

## 5. Системные пакеты

```bash
sudo apt update

sudo apt install -y \
  git \
  nginx \
  postgresql \
  postgresql-client \
  ffmpeg \
  certbot \
  python3-certbot-nginx
```

Python 3.13, Node.js 22, `uv` и инструменты сборки устанавливаются утверждённым для сервера способом.

```bash
python3.13 --version
node --version
npm --version
uv --version
ffmpeg -version | head -1
```

## 6. PostgreSQL

Создайте отдельного пользователя и базу.

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE cricket_stream
  LOGIN
  PASSWORD 'REPLACE_WITH_A_STRONG_PASSWORD';

CREATE DATABASE cricket_stream
  OWNER cricket_stream;
SQL
```

Замените пример пароля.

Не открывайте PostgreSQL во внешнюю сеть без документированной необходимости.

## 7. Backend и `.env`

```bash
cd /opt/cricket-stream/backend

uv sync --locked

cp .env.example .env
chmod 600 .env
```

Измените все значения-заглушки.

Важные параметры:

```text
APP_NAME
APP_VERSION
DEBUG
HOST
PORT
DATABASE_URL
JWT_SECRET_KEY
JWT_ACCESS_TOKEN_MINUTES
JWT_REFRESH_TOKEN_DAYS
FFMPEG_PATH
STREAMLINK_PATH
YT_DLP_PATH
MAX_STREAMS
HLS_DIR
HLS_SEGMENT_TIME
HLS_LIST_SIZE
MEDIA_STARTUP_GRACE_SECONDS
MEDIA_STALL_TIMEOUT_SECONDS
LOG_LEVEL
```

JWT-секрет:

```bash
openssl rand -hex 32
```

Пример URL БД:

```text
postgresql+asyncpg://cricket_stream:STRONG_PASSWORD@127.0.0.1/cricket_stream
```

Рекомендуемые production-значения:

```text
DEBUG=false
HOST=127.0.0.1
PORT=8000
MAX_STREAMS=16
HLS_DIR=/opt/cricket-stream/var/hls
```

Текущий systemd unit запускает Uvicorn на `0.0.0.0:8000`. Если unit будет изменён на localhost, нужно проверить Nginx и обновить документацию.

## 8. Миграции

Перед применением проверьте `DATABASE_URL`.

```bash
cd /opt/cricket-stream/backend

.venv/bin/alembic upgrade head
.venv/bin/alembic current
.venv/bin/alembic heads
.venv/bin/alembic check
```

Ожидается:

- одна текущая head;
- одна head миграций;
- `No new upgrade operations detected.`

Не редактируйте миграцию, уже применённую к production. Создавайте новую корректирующую.

## 9. Узел и Administrator

```bash
cd /opt/cricket-stream/backend

.venv/bin/python manage.py create-node
```

Первый администратор:

```bash
.venv/bin/python manage.py create-user \
  --username admin \
  --role admin \
  --superuser
```

При необходимости проверьте параметры:

```bash
.venv/bin/python manage.py --help
```

## 10. Runtime-каталоги

```bash
sudo mkdir -p /opt/cricket-stream/var/hls
sudo chown -R stream:stream /opt/cricket-stream/var
sudo chmod 755 /opt/cricket-stream/var
sudo chmod 755 /opt/cricket-stream/var/hls
```

HLS-файлы временные.

Их нельзя:

- добавлять в Git;
- включать в обычный backup кода;
- публиковать через открытый Nginx `alias`.

## 11. Frontend

```bash
cd /opt/cricket-stream/frontend

npm ci
npm run build
```

Результат:

```text
/opt/cricket-stream/frontend/dist
```

Предупреждение о chunk больше 500 kB не является ошибкой сборки.

## 12. systemd

```bash
sudo cp \
  /opt/cricket-stream/deploy/systemd/cricket-backend.service \
  /etc/systemd/system/cricket-backend.service

sudo systemctl daemon-reload
sudo systemctl enable --now cricket-backend
```

Проверка:

```bash
sudo systemctl status cricket-backend --no-pager -l
sudo journalctl -u cricket-backend -n 100 --no-pager -l
```

Точное имя сервиса:

```text
cricket-backend.service
```

Используйте:

```bash
sudo systemctl restart cricket-backend
sudo systemctl status cricket-backend --no-pager -l
sudo journalctl -u cricket-backend -f -l
```

## 13. Nginx

Для новой установки до работы Certbot:

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

Шаблон содержит:

- раздачу frontend;
- proxy `/api/`;
- WebSocket-заголовки;
- proxy защищённого HLS API;
- отключение access log для URL с playback-токенами;
- отсутствие публичного `/hls/`.

Не копируйте шаблон поверх production-файла, уже изменённого Certbot.

## 14. DNS и HTTPS

Production hostname:

```text
de.cricket-stream.icu
```

После настройки DNS:

```bash
sudo certbot \
  --nginx \
  -d de.cricket-stream.icu \
  --redirect
```

Проверка:

```bash
curl -I http://de.cricket-stream.icu
curl -I https://de.cricket-stream.icu
sudo certbot certificates
sudo certbot renew --dry-run
```

HTTP должен перенаправляться на HTTPS.

## 15. Firewall

Пример UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

Не открывайте наружу PostgreSQL и Uvicorn без дополнительной защиты.

## 16. Финальная проверка

```bash
curl -fsS \
  https://de.cricket-stream.icu/api/v1/health
```

```bash
sudo systemctl status \
  cricket-backend \
  nginx \
  postgresql \
  --no-pager -l
```

```bash
cd /opt/cricket-stream/backend
.venv/bin/alembic current
.venv/bin/alembic check
```

```bash
.venv/bin/streamlink --version
.venv/bin/yt-dlp --version
/usr/bin/ffmpeg -version | head -1
```

В браузере проверьте:

- вход EN/RU;
- Dashboard;
- Monitor;
- Libraries;
- All Streams;
- создание и редактирование;
- Details;
- Users;
- Account;
- Components;
- тест через Streamlink;
- тест через yt-dlp;
- RTMP-приём;
- защищённый HLS-preview.

## 17. Правила безопасности развёртывания

- Не сбрасывать заполненную production-базу
- Делать backup перед каждой миграцией
- Сохранять production `.env`
- Сохранять TLS-настройки Certbot
- По возможности останавливать потоки перед обслуживанием
- Проверять Nginx до reload
- Выполнять `git diff --check`
- После frontend-изменений выполнять production-сборку
