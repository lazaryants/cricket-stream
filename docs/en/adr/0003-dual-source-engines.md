# ADR 0003: Support Streamlink and yt-dlp

- Status: Accepted
- Date: 2026-08-03

## Context

External streaming websites change frequently. No single resolver reliably supports every source at all times.

## Decision

Support Streamlink and yt-dlp, with automatic and manual engine selection.

## Consequences

Positive:

- operational fallback;
- broader provider compatibility;
- per-stream control.

Trade-offs:

- two dependencies must be maintained;
- diagnostics must distinguish resolver paths;
- provider changes can still break both engines.
