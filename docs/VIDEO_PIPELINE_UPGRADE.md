# Video pipeline upgrade

This revision integrates the useful streaming parts of Cricket Stream Lite
without its video downloader.

## What changed

- Every stream can use `auto`, `streamlink`, or `yt-dlp` as its source engine.
- `auto` preflights Streamlink first and falls back to yt-dlp URL extraction.
- FFmpeg still copies audio/video without transcoding.
- The same FFmpeg process now muxes two outputs: RTMP and a small local HLS
  preview window.
- Browser playback uses hls.js and a short-lived, stream-scoped playback token.
- Viewer responses still omit both `source_url` and `destination_rtmp_url`.
- Administrators can check installed and available Streamlink, yt-dlp and
  FFmpeg package versions. Updating remains an explicit maintenance action.

## Deployment

Полная инструкция находится в [DEPLOYMENT.md](DEPLOYMENT.md).

Run these commands from `/opt/cricket-stream` after copying the revision:

```bash
cd /opt/cricket-stream/backend
.venv/bin/alembic upgrade head

mkdir -p /opt/cricket-stream/var/hls
chown -R stream:stream /opt/cricket-stream/var/hls

cd /opt/cricket-stream/frontend
npm ci
npm run build

sudo systemctl restart cricket-backend
sudo systemctl status cricket-backend --no-pager
```

Ensure `.env` contains `YT_DLP_PATH` and the three `HLS_*` settings shown in
`backend/.env.example`. Do not replace an existing database password or JWT
secret with the placeholders from the example.

The old public Nginx `location /hls/` must be removed. Preview files are served
through `/api/v1/streams/{id}/hls/...` after playback authorization.

Do not copy the generic Nginx template over an existing Certbot-managed
production configuration during an application update. That can remove the
HTTPS directives. Back up and compare the files first.

## Verification

```bash
cd /opt/cricket-stream/backend
.venv/bin/alembic current
.venv/bin/alembic check

cd /opt/cricket-stream/frontend
npm run build

sudo journalctl -u cricket-backend -n 200 --no-pager
```

Start one test stream and verify that:

1. RTMP publishing continues normally.
2. `/opt/cricket-stream/var/hls/<stream-id>/index.m3u8` appears.
3. The Monitor page shows live video with sound/fullscreen controls.
4. Viewer API responses contain neither source nor RTMP URLs.
