# Deployment Guide

[Русская версия](../ru/DEPLOYMENT.md)

This guide describes a production deployment of Cricket Stream Platform on Ubuntu using:

- `/opt/cricket-stream`
- system user `stream`
- PostgreSQL
- Nginx
- systemd
- Let's Encrypt / Certbot

The production database must be preserved during all updates.

## 1. Recommended Server

For up to 16 simultaneous restreams without transcoding:

- Ubuntu LTS
- 4 vCPU
- 8 GB RAM
- reliable network uplink
- SSD storage
- public IPv4 address
- DNS record for the web interface
- outbound access to source platforms and RTMP destinations

Lower specifications can be used for development or a small number of streams.

## 2. Required Software

- Python 3.13
- Node.js 22
- `uv`
- PostgreSQL
- FFmpeg
- Nginx
- Git
- Certbot
- Streamlink and yt-dlp from the backend virtual environment

Open inbound TCP ports:

- 22 for SSH, restricted where possible
- 80 for HTTP and certificate validation
- 443 for HTTPS

The application does not require public port 8000. Uvicorn is proxied through Nginx.

## 3. Create the Service Account

```bash
sudo useradd \
  --system \
  --create-home \
  --shell /bin/bash \
  stream
```

Create the application directory:

```bash
sudo mkdir -p /opt/cricket-stream
sudo chown -R stream:stream /opt/cricket-stream
```

## 4. Clone the Repository

```bash
sudo -u stream git clone \
  git@github.com:lazaryants/cricket-stream.git \
  /opt/cricket-stream
```

For a private repository, configure a read-only deploy key or another approved GitHub authentication method.

Check the branch and release:

```bash
cd /opt/cricket-stream
git status --short --branch
git tag --points-at HEAD
```

## 5. Install System Packages

Package names can differ between Ubuntu releases. Install at least:

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

Install Python 3.13, Node.js 22, `uv`, and any required build tools using the approved method for the server.

Verify:

```bash
python3.13 --version
node --version
npm --version
uv --version
ffmpeg -version | head -1
```

## 6. PostgreSQL

Create a dedicated database user and database.

Example:

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE cricket_stream
  LOGIN
  PASSWORD 'REPLACE_WITH_A_STRONG_PASSWORD';

CREATE DATABASE cricket_stream
  OWNER cricket_stream;
SQL
```

Do not reuse the example password.

Restrict access to localhost unless remote database access is intentionally required.

## 7. Backend Environment

```bash
cd /opt/cricket-stream/backend

uv sync --locked

cp .env.example .env
chmod 600 .env
```

Edit `.env` and replace all placeholder values.

Important settings:

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

Generate a JWT secret:

```bash
openssl rand -hex 32
```

Example database URL:

```text
postgresql+asyncpg://cricket_stream:STRONG_PASSWORD@127.0.0.1/cricket_stream
```

Production recommendations:

```text
DEBUG=false
HOST=127.0.0.1
PORT=8000
MAX_STREAMS=16
HLS_DIR=/opt/cricket-stream/var/hls
```

The current systemd unit starts Uvicorn on `0.0.0.0:8000`. If the service unit is later changed to bind only to localhost, update documentation and test Nginx before deployment.

## 8. Database Migrations

Before the first migration, verify that `DATABASE_URL` points to the intended database.

```bash
cd /opt/cricket-stream/backend

.venv/bin/alembic upgrade head
.venv/bin/alembic current
.venv/bin/alembic heads
.venv/bin/alembic check
```

Expected result:

- one current head;
- one migration head;
- `No new upgrade operations detected.`

Do not edit a migration already applied to production. Create a new corrective migration instead.

## 9. Initial Node and Administrator

Use the management CLI:

```bash
cd /opt/cricket-stream/backend

.venv/bin/python manage.py create-node
```

Create the first Administrator:

```bash
.venv/bin/python manage.py create-user \
  --username admin \
  --role admin \
  --superuser
```

Use the exact options supported by the current `manage.py`. Run help if necessary:

```bash
.venv/bin/python manage.py --help
```

## 10. Runtime Directories

```bash
sudo mkdir -p /opt/cricket-stream/var/hls
sudo chown -R stream:stream /opt/cricket-stream/var
sudo chmod 755 /opt/cricket-stream/var
sudo chmod 755 /opt/cricket-stream/var/hls
```

HLS files are temporary runtime data.

Do not:

- commit them to Git;
- include them in normal code backups;
- expose them through a public Nginx alias.

## 11. Frontend

```bash
cd /opt/cricket-stream/frontend

npm ci
npm run build
```

The production build is written to:

```text
/opt/cricket-stream/frontend/dist
```

The current build may display a warning about a JavaScript chunk larger than 500 kB. This is not a build failure.

## 12. systemd

Install the repository unit:

```bash
sudo cp \
  /opt/cricket-stream/deploy/systemd/cricket-backend.service \
  /etc/systemd/system/cricket-backend.service

sudo systemctl daemon-reload
sudo systemctl enable --now cricket-backend
```

Verify:

```bash
sudo systemctl status cricket-backend --no-pager -l
sudo journalctl -u cricket-backend -n 100 --no-pager -l
```

The service name is:

```text
cricket-backend.service
```

Use:

```bash
sudo systemctl restart cricket-backend
sudo systemctl status cricket-backend --no-pager -l
sudo journalctl -u cricket-backend -f -l
```

Do not substitute another service name.

## 13. Nginx

For a new installation before Certbot modifies the file:

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

The repository template includes:

- frontend static files;
- `/api/` proxy;
- WebSocket upgrade headers;
- authenticated HLS API proxy;
- disabled access logging for tokenized HLS URLs;
- no public `/hls/` alias.

If Certbot has already modified the production file, do not copy the repository template over it.

## 14. DNS and HTTPS

Create the DNS `A` record for the web interface.

Current production hostname:

```text
de.cricket-stream.icu
```

After DNS resolves:

```bash
sudo certbot \
  --nginx \
  -d de.cricket-stream.icu \
  --redirect
```

Verify:

```bash
curl -I http://de.cricket-stream.icu
curl -I https://de.cricket-stream.icu
sudo certbot certificates
sudo certbot renew --dry-run
```

HTTP should redirect to HTTPS.

## 15. Firewall

Allow only required services.

Example with UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

Do not expose PostgreSQL or Uvicorn publicly unless there is a documented requirement and an additional access-control layer.

## 16. Final Validation

Backend health:

```bash
curl -fsS \
  https://de.cricket-stream.icu/api/v1/health
```

Services:

```bash
sudo systemctl status \
  cricket-backend \
  nginx \
  postgresql \
  --no-pager -l
```

Database:

```bash
cd /opt/cricket-stream/backend
.venv/bin/alembic current
.venv/bin/alembic check
```

Components:

```bash
.venv/bin/streamlink --version
.venv/bin/yt-dlp --version
/usr/bin/ffmpeg -version | head -1
```

Browser checks:

- login in English and Russian;
- Dashboard;
- Monitor;
- Libraries;
- All Streams;
- stream creation and editing;
- Stream Details;
- Users;
- Account;
- Components;
- one test source through Streamlink;
- one test source through yt-dlp when available;
- RTMP reception;
- protected HLS preview.

## 17. Deployment Safety Rules

- Never reset or recreate the populated production database during an application deployment
- Back up PostgreSQL before every migration
- Preserve production `.env`
- Preserve Certbot-managed Nginx settings
- Stop production streams before maintenance where practical
- Test Nginx before reload
- Run `git diff --check` before committing deployment changes
- Run the frontend production build after frontend changes
