# ADR 0006: English-Primary Bilingual Interface

- Status: Accepted
- Date: 2026-08-03

## Context

The platform is used by Russian-speaking operators and international partners.

## Decision

Provide a complete English and Russian interface. English is the default language. Language preference is persisted and can be changed at runtime.

Documentation is maintained in both languages.

## Consequences

Positive:

- international usability;
- consistent operator experience;
- documentation matches the application.

Trade-offs:

- every user-visible change requires two translations;
- hard-coded strings must be avoided;
- layout must be tested with both text lengths.
