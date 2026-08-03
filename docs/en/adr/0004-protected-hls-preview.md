# ADR 0004: Serve Preview Through an Authenticated API

- Status: Accepted
- Date: 2026-08-03

## Context

Operational preview is required, but direct public access to HLS files would bypass application authorization and expose temporary stream URLs.

## Decision

Store HLS files locally and serve them through authenticated API endpoints with short-lived playback tokens. Do not configure a public Nginx HLS alias.

## Consequences

Positive:

- role-aware access;
- no public filesystem exposure;
- token URLs can expire;
- preview remains an application feature.

Trade-offs:

- backend participates in HLS delivery;
- token and caching behavior require careful testing;
- access logs must not leak tokenized URLs.
