# Резервное копирование и восстановление

[English version](../en/BACKUP_RESTORE.md)

PostgreSQL — основной источник данных о пользователях, узлах, трансляциях, библиотеках и сессиях. Не сбрасывайте базу при обычном развёртывании и диагностике.

## 1. Что сохранять

Обязательно:

- PostgreSQL;
- `backend/.env`;
- production-конфигурацию Nginx;
- systemd unit, если он отличается от репозитория;
- текущий commit или tag;
- при необходимости данные для disaster recovery TLS.

Обычно не требуется:

- `frontend/dist`;
- виртуальное окружение backend;
- `var/hls`;
- запущенные процессы FFmpeg.

## 2. Каталог backup

```bash
STAMP="$(date -u +%Y%m%d-%H%M%S)"

BACKUP_DIR="$HOME/cricket-stream-backups/$STAMP"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "$BACKUP_DIR"
```

## 3. PostgreSQL

```bash
sudo -u postgres pg_dump \
  --format=custom \
  --file="$BACKUP_DIR/cricket_stream.dump" \
  cricket_stream
```

Схема:

```bash
sudo -u postgres pg_dump \
  --schema-only \
  --file="$BACKUP_DIR/cricket_stream-schema.sql" \
  cricket_stream
```

Проверка:

```bash
pg_restore \
  --list \
  "$BACKUP_DIR/cricket_stream.dump" \
  | head -30
```

## 4. Конфигурация

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

```bash
sudo chown -R "$USER":"$USER" "$BACKUP_DIR"

chmod 600 \
  "$BACKUP_DIR/backend.env" \
  "$BACKUP_DIR/nginx-cricket-stream.conf" \
  "$BACKUP_DIR/cricket-backend.service" \
  "$BACKUP_DIR/cricket_stream.dump"
```

## 5. Git и версии

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

## 6. Контроль целостности

```bash
cd "$BACKUP_DIR"

sha256sum \
  * \
  > SHA256SUMS

sha256sum -c SHA256SUMS
```

## 7. Проверочное восстановление

```bash
sudo systemctl stop cricket-backend
```

```bash
sudo -u postgres dropdb \
  --if-exists \
  cricket_stream_restore

sudo -u postgres createdb \
  --owner=cricket_stream \
  cricket_stream_restore
```

```bash
sudo -u postgres pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --dbname=cricket_stream_restore \
  "$BACKUP_DIR/cricket_stream.dump"
```

Сначала тестируйте восстановление на отдельной БД.

## 8. Восстановление production

Операция разрушительная. Нужны maintenance window и подтверждённый backup.

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

Проверка:

```bash
cd /opt/cricket-stream/backend

.venv/bin/alembic current
.venv/bin/alembic heads
.venv/bin/alembic check
```

```bash
sudo systemctl start cricket-backend
sudo systemctl status cricket-backend --no-pager -l
```

## 9. `.env`, systemd и Nginx

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

```bash
sudo cp \
  "$BACKUP_DIR/cricket-backend.service" \
  /etc/systemd/system/cricket-backend.service

sudo systemctl daemon-reload
```

```bash
sudo cp \
  "$BACKUP_DIR/nginx-cricket-stream.conf" \
  /etc/nginx/sites-available/cricket-stream

sudo nginx -t
sudo systemctl reload nginx
```

## 10. Код

Используйте записанный commit или tag.

```bash
cd /opt/cricket-stream

git fetch --all --tags
git switch main
git reset --hard COMMIT_FROM_BACKUP
```

`git reset --hard` удаляет локальные изменения. Сначала проверьте `git status`.

```bash
cd /opt/cricket-stream/backend
uv sync --locked

cd ../frontend
npm ci
npm run build
```

## 11. Проверка после восстановления

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

Проверьте:

- пользователей;
- узлы;
- трансляции;
- библиотеки;
- desired active;
- назначения;
- сессии;
- preview;
- один тестовый поток.

## 12. Политика backup

Минимально:

- перед каждой миграцией;
- перед обновлением компонентов;
- перед изменением Nginx/systemd;
- перед релизом;
- после крупных настроек;
- регулярно по расписанию.

Хотя бы одна копия должна храниться вне VPS.
