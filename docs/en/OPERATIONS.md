# Operations Guide

[Русская версия](../ru/OPERATIONS.md)

This guide covers routine operation and diagnostics of Cricket Stream Platform.

## 1. Main Services

```bash
sudo systemctl status cricket-backend --no-pager -l
sudo systemctl status nginx --no-pager -l
sudo systemctl status postgresql --no-pager -l
```

Backend service:

```text
cricket-backend.service
```

## 2. Health Checks

External:

```bash
curl -fsS \
  https://de.cricket-stream.icu/api/v1/health
```

Local backend:

```bash
curl -fsS \
  http://127.0.0.1:8000/api/v1/health
```

A local success with an external failure usually points to Nginx, TLS, DNS, or firewall configuration.

## 3. Backend Logs

Recent messages:

```bash
sudo journalctl \
  -u cricket-backend \
  -n 200 \
  --no-pager -l
```

Follow live:

```bash
sudo journalctl \
  -u cricket-backend \
  -f -l
```

Messages from the last ten minutes:

```bash
sudo journalctl \
  -u cricket-backend \
  --since "10 minutes ago" \
  --no-pager -l
```

Filter video-pipeline messages:

```bash
sudo journalctl \
  -u cricket-backend \
  --since "10 minutes ago" \
  --no-pager -l \
  | grep -E \
    'STREAM MANAGER|SOURCE RESOLVER|STREAMLINK|yt-dlp|FFMPEG|SUPERVISOR|error|failed'
```

## 4. Nginx Logs

```bash
sudo tail -n 200 \
  /var/log/nginx/cricket-stream.error.log

sudo tail -n 200 \
  /var/log/nginx/cricket-stream.access.log
```

Tokenized HLS API requests intentionally have access logging disabled.

## 5. Runtime Processes

```bash
ps -eo \
  user,pid,ppid,etime,%cpu,%mem,args \
  --width 500 \
  | grep -E \
    '[s]treamlink|[y]t-dlp|[f]fmpeg'
```

Expected patterns:

### Streamlink mode

```text
backend
├── streamlink --stdout ...
└── ffmpeg -i pipe:0 ...
```

### yt-dlp mode

yt-dlp resolves a media URL, after which FFmpeg reads it directly.

### Direct RTMP source

FFmpeg reads the RTMP URL directly.

FFmpeg and resolver processes should belong to user `stream` and be descendants of the backend service.

## 6. HLS Preview

Inspect current files:

```bash
find /opt/cricket-stream/var/hls \
  -maxdepth 2 \
  -type f \
  -printf '%TY-%Tm-%Td %TH:%TM:%TS %s %p\n' \
  | sort \
  | tail -50
```

Expected files for a running stream:

```text
var/hls/<stream-id>/index.m3u8
var/hls/<stream-id>/segment_*.ts
```

No files can indicate:

- source is not live;
- source resolver failed;
- FFmpeg has not opened the input;
- the stream has only just started;
- HLS directory permissions are incorrect.

The HLS directory must not be exposed directly by Nginx.

## 7. Component Versions

```bash
cd /opt/cricket-stream/backend

.venv/bin/streamlink --version
.venv/bin/yt-dlp --version
/usr/bin/ffmpeg -version | head -1
python --version
```

The Components page performs user-visible checks.

Do not upgrade components during an active event.

## 8. Database State

```bash
cd /opt/cricket-stream/backend

.venv/bin/alembic current
.venv/bin/alembic heads
.venv/bin/alembic check
```

List users:

```bash
.venv/bin/python manage.py list-users
```

Reset a password:

```bash
.venv/bin/python manage.py reset-password USERNAME
```

Use the browser Users page for supported password administration when possible.

## 9. Safe Backend Restart

Before a planned restart:

1. stop active streams through the interface where practical;
2. record streams whose desired active state is enabled;
3. verify database backup when the restart is part of an update.

Restart:

```bash
sudo systemctl restart cricket-backend
sudo systemctl status cricket-backend --no-pager -l
```

Verify:

```bash
curl -fsS \
  https://de.cricket-stream.icu/api/v1/health
```

Streams with desired active state can restart automatically.

## 10. Safe Nginx Reload

```bash
sudo nginx -t \
  && sudo systemctl reload nginx
```

Never reload after a failed configuration test.

## 11. TLS Maintenance

```bash
sudo certbot certificates

systemctl list-timers --all \
  | grep -i certbot

sudo certbot renew --dry-run
```

Do not copy private keys into the repository or ordinary support archives.

## 12. Disk Usage

```bash
df -h
df -i

du -sh \
  /opt/cricket-stream/var/hls \
  /var/log/nginx \
  2>/dev/null
```

The HLS process deletes old segments, but disk monitoring is still required.

## 13. Memory and CPU

```bash
free -h
uptime

ps -eo \
  pid,ppid,%cpu,%mem,etime,args \
  --sort=-%cpu \
  | head -30
```

Without transcoding, CPU use should normally remain moderate. High CPU can indicate:

- unexpected transcoding;
- a damaged input;
- excessive process restarts;
- another workload on the VPS.

## 14. Network Checks

DNS:

```bash
getent hosts de.cricket-stream.icu
getent hosts rtmp.cricket-stream.icu
```

HTTPS:

```bash
curl -I \
  https://de.cricket-stream.icu
```

RTMP destination port:

```bash
nc -vz \
  rtmp.cricket-stream.icu \
  1935
```

A successful TCP connection does not prove that the application path or stream key is accepted.

## 15. Common Situations

### Source is not live

Expected behavior:

- diagnostic changes to source offline or unavailable;
- start can fail;
- supervisor can retry with backoff if desired active state is enabled.

This is not necessarily a platform outage.

### Streamlink fails, yt-dlp works

Use the yt-dlp engine temporarily and review component versions.

Provider websites can change without notice.

### yt-dlp fails, Streamlink works

Select Streamlink or Auto and review source-resolver logs.

### Preview appears after a delay

HLS segment creation normally takes several seconds.

The player retries automatically.

### Preview works but RTMP is missing

FFmpeg receives the source, but the destination may reject the output.

Check:

- destination URL;
- stream key;
- server availability;
- destination-side logs.

### HTTP 502 immediately after restart

Uvicorn may not yet be listening.

Wait a few seconds and check:

```bash
sudo systemctl status cricket-backend --no-pager -l
sudo journalctl -u cricket-backend -n 100 --no-pager -l
```

### Database models and migrations differ

Do not edit an applied migration.

Create a new corrective migration, back up the database, and test:

```bash
.venv/bin/alembic check
```

### Repeated restart loop

Use Stop in the interface to clear desired active state or stop supervisor recovery, then inspect the latest session log.

## 16. Event-Day Operational Checklist

Before the event:

- services healthy;
- database current;
- certificate valid;
- disk space sufficient;
- components reviewed;
- sources verified;
- RTMP destinations verified;
- one real end-to-end test completed.

During the event:

- Monitor open;
- diagnostics observed;
- destination reception independently checked;
- no unplanned component upgrades;
- no direct process killing unless emergency response requires it.

After the event:

- unneeded streams stopped;
- desired active state reviewed;
- failures documented;
- backups completed if configuration changed.
