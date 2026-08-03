# ADR 0005: Viewer, Operator, and Administrator Roles

- Status: Accepted
- Date: 2026-08-03

## Context

Source and destination URLs can reveal unpublished content or permit unintended publication. Operational users need different capabilities.

## Decision

Use three roles:

- Viewer: safe monitoring data only, no source or destination URLs;
- Operator: view both URLs, start/stop, edit source, no destination editing;
- Administrator: full access.

Authorization is enforced in the backend.

## Consequences

Positive:

- least-privilege operation;
- sensitive routing data protected;
- clear operational separation.

Trade-offs:

- response schemas can differ by role;
- every new endpoint needs an explicit authorization review;
- frontend visibility alone is insufficient.
