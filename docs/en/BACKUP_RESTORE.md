# Backup and Restore Guide

[Русская версия](../ru/BACKUP_RESTORE.md)

The PostgreSQL database is the authoritative store for users, nodes, streams, libraries, and session history. Do not reset it during routine deployment or troubleshooting.

## 1. What Must Be Backed Up

Required:

- PostgreSQL database
- `backend/.env`
- production Nginx site configuration
- systemd service unit if it differs from the repository
- optional TLS metadata for disaster-recovery planning
- repository commit or release tag currently deployed

Usually not required:

- `frontend/dist`, because it can be rebuilt
- backend virtual environment, because it can be recreated
- `var/hls`, because it contains temporary preview segments
- active FFmpeg processes

## 2. Create a Backup Directory

```bash
STAMP="$(date -u +%Y%m%d-%H%M%S)"

BACKUP_DIR="$HOME/cricket-stream-backups/$STAMP"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "$BACKUP_DIR"
```

## 3. Database Backup

Custom format:

```bash
sudo -u postgres pg_dump \
  --format=custom \
  --file="$BACKUP_DIR/cricket_stream.dump" \
  cricket_stream
```

Schema-only reference:

```bash
sudo -u postgres pg_dump \
  --schema-only \
  --file="$BACKUP_DIR/cricket_stream-schema.sql" \
  cricket_stream
```

Verify the dump:

```bash
pg_restore \
  --list \
  "$BACKUP_DIR/cricket_stream.dump" \
  | head -30
```

## 4. Environment and Deployment Files

```bash
cp \
  /opt/cricket-stream/backend/.env \
  "$BACKUP_DIR/backend.env"

sudo cp \
  /etc/nginx/sites-available/cricket-stream \
  "$BACKUP_DIR/nginx-cricket-stream.conf"

sudo cp \
  /etc/systemd/system/cricket-backend.service \
  "$BACKUP_DIR/cricket-backend.service"
```

Restrict permissions:

```bash
sudo chown -R "$USER":"$USER" "$BACKUP_DIR"
chmod 600 \
  "$BACKUP_DIR/backend.env" \
  "$BACKUP_DIR/nginx-cricket-stream.conf" \
  "$BACKUP_DIR/cricket-backend.service" \
  "$BACKUP_DIR/cricket_stream.dump"
```

## 5. Record Git State and Versions

```bash
cd /opt/cricket-stream

git status --short --branch \
  > "$BACKUP_DIR/git-status.txt"

git rev-parse HEAD \
  > "$BACKUP_DIR/git-commit.txt"

git tag --points-at HEAD \
  > "$BACKUP_DIR/git-tags.txt"

cd backend

.venv/bin/alembic current \
  > "$BACKUP_DIR/alembic-current.txt"

.venv/bin/streamlink --version \
  > "$BACKUP_DIR/streamlink-version.txt"

.venv/bin/yt-dlp --version \
  > "$BACKUP_DIR/yt-dlp-version.txt"

/usr/bin/ffmpeg -version \
  | head -1 \
  > "$BACKUP_DIR/ffmpeg-version.txt"
```

## 6. Backup Integrity

```bash
cd "$BACKUP_DIR"

sha256sum \
  * \
  > SHA256SUMS

sha256sum -c SHA256SUMS
```

Do not include `SHA256SUMS` itself in the first checksum command if rerunning it.

## 7. Restore to an Empty Database

Stop active streams before a full restore.

Stop backend:

```bash
sudo systemctl stop cricket-backend
```

Create a new empty database if required:

```bash
sudo -u postgres dropdb \
  --if-exists \
  cricket_stream_restore

sudo -u postgres createdb \
  --owner=cricket_stream \
  cricket_stream_restore
```

Restore:

```bash
sudo -u postgres pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --dbname=cricket_stream_restore \
  "$BACKUP_DIR/cricket_stream.dump"
```

Test the restored database before replacing production.

## 8. Restore Production Database

This is destructive and should be done only with a confirmed backup and maintenance window.

```bash
sudo systemctl stop cricket-backend

sudo -u postgres dropdb \
  --if-exists \
  cricket_stream

sudo -u postgres createdb \
  --owner=cricket_stream \
  cricket_stream

sudo -u postgres pg_restore \
  --no-owner \
  --dbname=cricket_stream \
  "$BACKUP_DIR/cricket_stream.dump"
```

Then verify migrations:

```bash
cd /opt/cricket-stream/backend

.venv/bin/alembic current
.venv/bin/alembic heads
.venv/bin/alembic check
```

Start backend:

```bash
sudo systemctl start cricket-backend
sudo systemctl status cricket-backend --no-pager -l
```

## 9. Restore Environment and Service Files

Environment:

```bash
sudo cp \
  "$BACKUP_DIR/backend.env" \
  /opt/cricket-stream/backend/.env

sudo chown \
  stream:stream \
  /opt/cricket-stream/backend/.env

sudo chmod 600 \
  /opt/cricket-stream/backend/.env
```

systemd:

```bash
sudo cp \
  "$BACKUP_DIR/cricket-backend.service" \
  /etc/systemd/system/cricket-backend.service

sudo systemctl daemon-reload
```

Nginx:

```bash
sudo cp \
  "$BACKUP_DIR/nginx-cricket-stream.conf" \
  /etc/nginx/sites-available/cricket-stream

sudo nginx -t
sudo systemctl reload nginx
```

## 10. Restore Application Code

Use the recorded commit or tag.

Example:

```bash
cd /opt/cricket-stream

git fetch --all --tags
git switch main
git reset --hard COMMIT_FROM_BACKUP
```

A hard reset discards local code changes. Review `git status` first.

Recreate dependencies and build:

```bash
cd /opt/cricket-stream/backend
uv sync --locked

cd ../frontend
npm ci
npm run build
```

## 11. Post-Restore Validation

```bash
curl -fsS \
  https://de.cricket-stream.icu/api/v1/health

sudo systemctl status \
  cricket-backend \
  nginx \
  postgresql \
  --no-pager -l
```

Verify in the browser:

- users;
- nodes;
- streams;
- libraries;
- desired active state;
- destination URLs;
- recent sessions;
- preview;
- one controlled test stream.

## 12. Backup Policy

Recommended minimum:

- before every migration;
- before component upgrades;
- before Nginx or systemd changes;
- before a release deployment;
- after major configuration changes;
- periodic scheduled database backups.

Store at least one copy outside the VPS.
