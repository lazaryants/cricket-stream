# ADR 0001: Use FastAPI for the Backend

- Status: Accepted
- Date: 2026-08-03

## Context

The platform requires an authenticated REST API, asynchronous database access, WebSocket updates, process supervision, and typed schemas.

## Decision

Use Python 3.13 with FastAPI, Uvicorn, Pydantic-style schemas, SQLAlchemy async access, and Alembic.

## Consequences

Positive:

- clear typed API contracts;
- good asynchronous support;
- direct integration with Python process-management libraries;
- built-in OpenAPI generation;
- one language for API and stream supervision.

Trade-offs:

- CPU-heavy video processing must remain outside Python;
- careful lifecycle management is required for child processes;
- blocking provider libraries must be isolated appropriately.
