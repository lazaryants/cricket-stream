# Upgrade Guide

[Русская версия](../ru/UPGRADE.md)

This guide describes a safe update of an existing production installation.

The populated database must remain intact.

## 1. Choose a Maintenance Window

Avoid upgrades during an active event.

Plan time for:

- stopping streams;
- database backup;
- dependency synchronization;
- migrations;
- frontend build;
- service restart;
- end-to-end testing;
- rollback if necessary.

## 2. Review Current State

```bash
cd /opt/cricket-stream

git status --short --branch
git log -1 --oneline --decorate
git tag --points-at HEAD

sudo systemctl status cricket-backend --no-pager -l
```

Resolve or intentionally preserve local changes before pulling.

## 3. Stop Streams

Use the web interface to stop active streams where practical.

Review desired active state so streams do not restart unexpectedly during maintenance.

## 4. Back Up

Create:

- PostgreSQL dump;
- `.env` backup;
- Nginx backup;
- systemd unit backup;
- record of current commit and migration.

Follow [Backup and Restore](BACKUP_RESTORE.md).

## 5. Fetch the Update

```bash
cd /opt/cricket-stream

git fetch origin --tags
git pull --ff-only origin main
```

For a specific release:

```bash
git fetch origin --tags
git checkout v1.0.0
```

A detached tag is suitable for inspection, but normal ongoing production operation is usually kept on the intended deployment branch.

## 6. Backend Dependencies

```bash
cd /opt/cricket-stream/backend

uv sync --locked
```

Do not replace production `.env`.

Verify component paths:

```bash
.venv/bin/streamlink --version
.venv/bin/yt-dlp --version
/usr/bin/ffmpeg -version | head -1
```

## 7. Database Migration

Before migration, confirm the backup exists.

```bash
cd /opt/cricket-stream/backend

.venv/bin/alembic current
.venv/bin/alembic heads

.venv/bin/alembic upgrade head

.venv/bin/alembic current
.venv/bin/alembic check
```

Never edit an already-applied production migration to make the database appear current.

## 8. Frontend

```bash
cd /opt/cricket-stream/frontend

npm ci
npm run build
```

A chunk-size warning does not mean the build failed.

## 9. Deployment Configuration

Compare repository and production systemd files:

```bash
cd /opt/cricket-stream

sudo diff -u \
  deploy/systemd/cricket-backend.service \
  /etc/systemd/system/cricket-backend.service \
  || true
```

Compare Nginx carefully:

```bash
sudo diff -u \
  deploy/nginx/cricket-stream.conf \
  /etc/nginx/sites-available/cricket-stream \
  || true
```

The production Nginx file contains Certbot-managed TLS directives and should not be overwritten blindly.

If systemd is intentionally updated:

```bash
sudo cp \
  deploy/systemd/cricket-backend.service \
  /etc/systemd/system/cricket-backend.service

sudo systemctl daemon-reload
```

## 10. Restart Backend

```bash
sudo systemctl restart cricket-backend
sudo systemctl status cricket-backend --no-pager -l
```

Review logs:

```bash
sudo journalctl \
  -u cricket-backend \
  -n 200 \
  --no-pager -l
```

## 11. Validate Nginx

If the Nginx file changed:

```bash
sudo nginx -t \
  && sudo systemctl reload nginx
```

## 12. Post-Upgrade Checks

```bash
curl -fsS \
  https://de.cricket-stream.icu/api/v1/health

cd /opt/cricket-stream/backend
.venv/bin/alembic current
.venv/bin/alembic check

cd /opt/cricket-stream
git status --short --branch
git log -1 --oneline --decorate
```

Browser checks:

- login;
- language switching;
- Dashboard;
- Monitor;
- Libraries;
- All Streams;
- stream form;
- details;
- Users;
- Account;
- Components.

Streaming checks:

- Streamlink source;
- yt-dlp source if available;
- RTMP destination reception;
- protected HLS preview;
- live metrics;
- stop and restart behavior.

## 13. Component Upgrades

An application update and a component upgrade are separate operations.

For Streamlink or yt-dlp, update lock data intentionally:

```bash
cd /opt/cricket-stream/backend

uv lock --upgrade-package streamlink
uv lock --upgrade-package yt-dlp
uv sync --locked
```

Commit lock-file changes only after testing.

FFmpeg, Python, and Node.js upgrades can change behavior significantly. Perform them in a separate maintenance task.

## 14. Rollback Code

If no irreversible migration was applied:

```bash
cd /opt/cricket-stream

git log --oneline --decorate -20
git reset --hard PREVIOUS_COMMIT
```

Then:

```bash
cd backend
uv sync --locked

cd ../frontend
npm ci
npm run build

sudo systemctl restart cricket-backend
```

Review local changes before `git reset --hard`.

## 15. Rollback Database

If a migration changed data or schema incompatibly, restore the pre-upgrade database dump.

Follow [Backup and Restore](BACKUP_RESTORE.md).

Do not guess a downgrade command on production without testing it first.

## 16. Upgrade Completion

An upgrade is complete only after:

- backend healthy;
- migrations current;
- frontend built;
- Nginx valid;
- database preserved;
- browser pages verified;
- one end-to-end stream verified;
- repository working tree clean or intentionally documented.
