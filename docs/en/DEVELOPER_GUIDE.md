# Developer Guide

[Русская версия](../ru/DEVELOPER_GUIDE.md)

## 1. Development Principles

- preserve the production database;
- use migrations for schema changes;
- keep authorization in the backend;
- prefer small, reviewable commits;
- run checks before every commit;
- update English and Russian documentation together;
- avoid transcoding unless a requirement explicitly needs it;
- keep runtime and persistent state separate.

## 2. Repository

```text
backend/
frontend/
deploy/
docs/
```

Runtime files under `var/` are excluded from source control.

## 3. Backend Setup

```bash
cd backend
uv sync --locked
cp .env.example .env
```

Use a development database. Do not point a local development `.env` to production.

Run migrations:

```bash
.venv/bin/alembic upgrade head
```

Run development server:

```bash
.venv/bin/uvicorn app.main:app \
  --reload \
  --host 127.0.0.1 \
  --port 8000
```

## 4. Frontend Setup

```bash
cd frontend
npm ci
npm run dev
```

Production verification:

```bash
npm run build
```

## 5. Database Changes

1. Modify SQLAlchemy models.
2. Generate or write a new Alembic migration.
3. Review upgrade and downgrade logic.
4. Test against a copy or development database.
5. Run:

```bash
.venv/bin/alembic upgrade head
.venv/bin/alembic current
.venv/bin/alembic check
```

Never rewrite an applied production migration.

Data migrations must be idempotent or carefully constrained.

## 6. Adding an API Endpoint

- choose the correct router;
- define request and response schemas;
- enforce role checks in the backend;
- avoid returning source or destination URLs to Viewer;
- add explicit error behavior;
- update frontend API modules and types;
- document the endpoint when it becomes a supported integration surface.

## 7. Adding a Source Provider

A provider should:

- accept a source URL;
- validate or identify supported platforms;
- resolve an FFmpeg-consumable input;
- return structured errors;
- avoid exposing secrets in logs;
- support cancellation;
- integrate with session diagnostics.

Test:

- source live;
- source offline;
- invalid URL;
- provider timeout;
- cancellation;
- backend restart.

## 8. FFmpeg Changes

Before changing FFmpeg arguments, document:

- input type;
- expected codecs;
- timestamp behavior;
- RTMP compatibility;
- HLS compatibility;
- reconnect behavior;
- CPU impact.

Keep video and audio copy unless transcoding is an explicit requirement.

Test with:

- YouTube/Streamlink;
- YouTube/yt-dlp;
- direct RTMP;
- long-running stream;
- source disconnect;
- destination disconnect;
- audio missing;
- video missing.

## 9. Runtime and WebSocket

Persistent queries use TanStack Query.

Runtime messages update the query cache through the WebSocket bridge.

When adding runtime fields:

1. update backend schema;
2. update WebSocket payload;
3. update TypeScript types;
4. update cache merge logic;
5. verify REST fallback;
6. test hidden browser tabs and reconnect.

## 10. Frontend Localization

English is the primary language and Russian is the secondary language.

When adding UI text:

1. add an English translation key;
2. add the Russian equivalent;
3. use `t("key")`;
4. avoid hard-coded UI text;
5. localize error and empty states;
6. verify both languages;
7. check autofill-sensitive form labels.

Search for missed Cyrillic outside the dictionary:

```bash
grep -RIn \
  --include='*.ts' \
  --include='*.tsx' \
  -P '[А-Яа-яЁё]' \
  frontend/src \
  --exclude='translations.ts'
```

Comments can remain in either language, but user-visible literals should use i18n.

## 11. Role-Sensitive UI

The frontend can hide unavailable actions, but backend authorization remains mandatory.

Current policy:

- Viewer: no URLs and no control;
- Operator: both URLs, source editing, start/stop, no destination editing;
- Administrator: full access.

Test API responses directly, not only visible buttons.

## 12. Diagnostics

Use stable status codes.

Do not use localized strings as machine identifiers.

When adding a diagnostic:

- define backend status code;
- assign severity;
- provide fallback title and message;
- add EN/RU translations;
- verify chip and tooltip;
- verify unknown-code fallback.

## 13. Documentation

A feature is complete only when relevant documentation is updated in both languages.

Typical files:

- `README.md` and `README.ru.md`;
- `CHANGELOG.md` and `CHANGELOG.ru.md`;
- `docs/en/*`;
- `docs/ru/*`;
- ADR when an architectural decision changes.

## 14. Checks Before Commit

```bash
git diff --check
git status --short
```

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
.venv/bin/alembic check
```

Review accidental secrets:

```bash
git diff --cached
```

## 15. Commit Style

Use concise imperative messages:

```text
Add bilingual user guide
Fix preview readiness handling
Update RTMP destination domain
```

Keep unrelated changes in separate commits.

## 16. Branches

Recommended:

```text
main
feature/<name>
fix/<name>
docs/<name>
```

Rebase or merge according to the repository workflow. Never force-push `main`.

## 17. Release Process

1. clean working tree;
2. migrations current;
3. frontend build passes;
4. documentation updated;
5. production smoke test;
6. merge to `main`;
7. create annotated tag;
8. push tag;
9. publish release notes;
10. monitor production.

## 18. Secrets

Never commit:

- `.env`;
- JWT secrets;
- database passwords;
- deploy keys;
- TLS private keys;
- stream keys in public documentation;
- tokenized HLS URLs.

## 19. Production Changes

Production edits should be reproducible in the repository whenever appropriate.

Before replacing systemd or Nginx files:

- make a timestamped backup;
- compare repository and active files;
- preserve Certbot directives;
- validate;
- apply;
- verify rollback path.
