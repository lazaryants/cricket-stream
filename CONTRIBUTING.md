# Contributing

[Русская версия](CONTRIBUTING.ru.md)

Thank you for contributing to Cricket Stream Platform.

## Ground Rules

- Keep production data safe.
- Do not commit secrets.
- Use small, focused changes.
- Preserve role-based security.
- Add or update tests and documentation where relevant.
- Maintain English and Russian documentation together.
- Run required checks before submitting.

## Workflow

1. Create a branch:

```bash
git switch -c feature/short-description
```

2. Make focused changes.
3. Review:

```bash
git diff --check
git status --short
```

4. Build the frontend when changed:

```bash
cd frontend
npm run build
```

5. Check migrations when backend models change:

```bash
cd backend
.venv/bin/alembic check
```

6. Commit with a concise message.
7. Push the branch and open a pull request.

## Database Rules

- Never reset the populated production database as part of a code change.
- Create a new Alembic migration for every schema change.
- Never rewrite a migration already applied to production.
- Back up before applying migrations.
- Review data migrations carefully.

## Security Rules

Viewer must not receive:

- `source_url`;
- `destination_rtmp_url`.

Operator can view both and edit source configuration, but cannot edit RTMP destination definitions.

Administrator has full access.

Backend authorization is mandatory even when the frontend hides an action.

## Frontend Rules

- Use the existing Material UI patterns.
- Preserve mobile behavior.
- Use i18n keys for user-visible text.
- Add English and Russian translations together.
- Verify autofill, responsive layouts, and both languages.
- Run `npm run build`.

## Streaming Rules

- Prefer `-c:v copy` and `-c:a copy`.
- Document any transcoding requirement.
- Test Streamlink and yt-dlp behavior.
- Preserve controlled stop, retry, and process-group cleanup.
- Do not expose HLS preview publicly.

## Documentation Rules

Update both languages when behavior changes.

Use:

```text
docs/en/
docs/ru/
```

Create or update an ADR for important architectural changes.

## Commit Messages

Examples:

```text
Add node health endpoint
Fix destination authorization
Document backup procedure
```

## Pull Request Description

Include:

- purpose;
- affected components;
- database impact;
- security impact;
- operational impact;
- tests performed;
- documentation updated;
- rollback considerations.

## Review Checklist

- no secrets;
- no unintended database reset;
- role policy preserved;
- build passes;
- migration check passes;
- documentation links work;
- English and Russian content stay aligned;
- production deployment remains reversible.
