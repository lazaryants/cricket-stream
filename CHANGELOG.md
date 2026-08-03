# Changelog

All notable changes to Cricket Stream Platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project intends to follow [Semantic Versioning](https://semver.org/).

[Русская версия](CHANGELOG.ru.md)

## [Unreleased]

### Planned

- Scheduled stream starts
- Distributed streaming nodes
- Historical analytics
- High-availability mechanisms
- Alerts and notifications
- Public API

## [1.0.0] - 2026-08-03

### Added

#### Stream management

- Stream creation, editing, start, stop, and deletion
- Desired active state and controlled restart behavior
- Manual source-engine selection
- Streamlink-first operation with yt-dlp alternative
- Runtime status, process information, sessions, and logs

#### Dashboard and monitoring

- Dashboard with selectable stream visibility
- Complete stream inventory with search and filters
- Monitoring wall with 1/4/9/16 layouts
- Protected live HLS preview
- WebSocket-driven runtime updates

#### Metrics and diagnostics

- Resolution, FPS, bitrate, processing speed, codecs, uptime, and dropped-frame metrics
- Stable diagnostic status codes with English and Russian frontend translations
- Source availability and process-failure diagnostics
- Session history and log viewer

#### Libraries

- Reusable source library
- Reusable RTMP destination library
- Search, enabled-state filtering, creation, editing, and deletion
- Migration of destination hostnames to `rtmp.cricket-stream.icu`

#### Users and security

- Viewer, Operator, and Administrator roles
- Authentication and session handling
- Current-user password change
- Administrator password reset for other users
- Sensitive source and destination URLs excluded from Viewer API responses
- Short-lived protected HLS playback tokens

#### Components

- Installed component version reporting
- Update availability checks for supported components
- Localized version-check status and timestamps

#### Internationalization

- Complete English and Russian interface
- Runtime language switching
- Persisted language preference
- Localized dates, durations, metrics, diagnostics, forms, and error messages

#### Infrastructure

- FastAPI backend
- PostgreSQL database
- SQLAlchemy and Alembic migrations
- React 19 and Material UI frontend
- Nginx reverse proxy and HTTPS deployment
- systemd backend service
- Production deployment at `de.cricket-stream.icu`

### Changed

- Standardized FFmpeg output on video and audio stream copy
- Unified RTMP delivery and HLS preview in one FFmpeg process
- Improved desktop stream-table layout to avoid horizontal scrolling
- Improved player reconnect behavior while the first HLS playlist is being created
- Aligned repository and production systemd service configuration
- Renamed RTMP destination domain from `video.curling76.ru` to `rtmp.cricket-stream.icu`

### Fixed

- Saved destination UUID uniqueness alignment between SQLAlchemy and PostgreSQL
- Preview refresh after source-engine changes
- Start failure feedback for unavailable or offline sources
- Automatic restart and desired-state restoration after backend restart
- Runtime synchronization between REST and WebSocket updates
- Live-preview and diagnostic consistency across Dashboard, Monitor, list, mobile, and details pages
- Localized duration formatting for uptime exceeding 24 hours

### Security

- Viewer cannot receive source or destination URLs
- Operator can view both URLs but cannot modify RTMP destinations
- Administrator retains complete access
- HLS files are not published through a public Nginx alias
- Preview access is mediated by the authenticated API

[Unreleased]: https://github.com/lazaryants/cricket-stream/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lazaryants/cricket-stream/releases/tag/v1.0.0
