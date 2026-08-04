# Roadmap

[Русская версия](../ru/ROADMAP.md)

This roadmap describes intended development directions. It is not a contractual release schedule.

## Completed in 1.0

### Core Platform

- FastAPI backend
- PostgreSQL persistence
- SQLAlchemy models and Alembic migrations
- React and Material UI frontend
- Nginx, HTTPS, and systemd deployment

### Streaming

- Streamlink and yt-dlp source engines
- Automatic and manual engine selection
- FFmpeg stream copy
- RTMP output
- Protected HLS preview
- Desired active state
- Controlled restart and backoff
- Sessions, logs, metrics, and diagnostics

### Interface

- Dashboard
- Monitor with 1/4/9/16 layouts
- All Streams
- Libraries
- Stream details and editing
- Users and Account
- Components
- Complete English and Russian interface

### Security

- Viewer, Operator, and Administrator roles
- Viewer URL redaction
- Protected HLS playback tokens
- Backend-enforced permissions

## Near-Term Priorities

### Reliability

- additional watchdog coverage;
- clearer restart-limit reporting;
- node and destination health checks;
- structured operational alerts;
- improved long-running stream validation.

### Scheduling

- start at a configured date and time;
- stop at a configured date and time;
- start when the source becomes live;
- event templates;
- timezone-aware schedules.

### Analytics

- historical uptime;
- restart counts;
- average and peak bitrate;
- transferred traffic;
- failure classification;
- per-event operational reports.

## Distributed Platform

The data model already contains nodes, but complete orchestration is future work.

Planned capabilities:

- node heartbeat;
- capacity reporting;
- remote worker agents;
- stream placement;
- manual node selection;
- automated failover;
- centralized logs and metrics;
- redundant European nodes.

## Integrations

- supported public REST API;
- API tokens or service accounts;
- event-management integration;
- webhooks for stream state;
- external monitoring integration;
- notification channels.

## Media Features

Potential later additions:

- optional recording;
- DVR retention rules;
- clip extraction;
- codec compatibility checks;
- optional controlled transcoding profiles;
- SRT or other transport protocols.

These features must not compromise the low-latency stream-copy path.

## User and Administration Features

- browser-based user creation;
- role changes;
- user disabling and deletion;
- session administration;
- audit log;
- node administration;
- system settings page.

## Documentation

- screenshots for English and Russian interfaces;
- API reference;
- disaster-recovery exercises;
- automated Markdown link validation;
- release-specific documentation versions.

## Non-Goals for the Immediate Roadmap

- becoming a general-purpose video downloader;
- replacing professional production switchers;
- storing unlimited video archives by default;
- automatic transcoding of every stream;
- exposing preview without authentication.
