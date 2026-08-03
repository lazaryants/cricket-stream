# ADR 0002: Use Stream Copy by Default

- Status: Accepted
- Date: 2026-08-03

## Context

The primary workload is live relay. Transcoding would increase latency and CPU consumption and reduce the number of simultaneous streams per VPS.

## Decision

Use FFmpeg video and audio stream copy by default:

```text
-c:v copy
-c:a copy
```

## Consequences

Positive:

- low CPU use;
- low additional latency;
- high stream density;
- original quality preserved.

Trade-offs:

- destination codec compatibility is required;
- unsupported codecs are not repaired;
- bitrate and GOP cannot be normalized without transcoding.
