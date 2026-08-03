# Руководство разработчика

[English version](../en/DEVELOPER_GUIDE.md)

## 1. Принципы

- сохранять production-базу;
- менять схему миграциями;
- проверять права в backend;
- делать небольшие коммиты;
- выполнять проверки;
- обновлять EN/RU документацию вместе;
- не перекодировать без явного требования;
- разделять runtime и persistent state.

## 2. Репозиторий

```text
backend/
frontend/
deploy/
docs/
```

`var/` содержит runtime и не входит в Git.

## 3. Backend

```bash
cd backend
uv sync --locked
cp .env.example .env
```

Используйте development-БД.

```bash
.venv/bin/alembic upgrade head
```

```bash
.venv/bin/uvicorn app.main:app \
  --reload \
  --host 127.0.0.1 \
  --port 8000
```

## 4. Frontend

```bash
cd frontend
npm ci
npm run dev
```

Production-проверка:

```bash
npm run build
```

## 5. Изменение БД

1. Изменить модели.
2. Создать новую миграцию.
3. Проверить upgrade/downgrade.
4. Тестировать не на production.
5. Выполнить:

```bash
.venv/bin/alembic upgrade head
.venv/bin/alembic current
.venv/bin/alembic check
```

Не переписывайте применённую миграцию.

Data migration должна быть ограниченной и безопасной.

## 6. API endpoint

- выбрать router;
- определить schemas;
- проверить роль в backend;
- не возвращать URL Viewer;
- определить ошибки;
- обновить frontend API и types;
- документировать публичный контракт.

## 7. Провайдер источника

Провайдер должен:

- принимать URL;
- определять платформу;
- возвращать вход FFmpeg;
- давать структурированные ошибки;
- не логировать секреты;
- поддерживать отмену;
- интегрироваться с сессиями.

Тесты:

- live;
- offline;
- неверный URL;
- timeout;
- stop;
- restart backend.

## 8. FFmpeg

Перед изменением аргументов определить:

- тип входа;
- кодеки;
- timestamps;
- RTMP-совместимость;
- HLS-совместимость;
- reconnect;
- CPU.

Сохраняйте `copy`, если транскодирование не требуется.

Тестируйте:

- Streamlink;
- yt-dlp;
- прямой RTMP;
- длительную работу;
- обрыв источника;
- обрыв назначения;
- отсутствие audio/video.

## 9. Runtime и WebSocket

REST-запросы хранятся в TanStack Query.

WebSocket обновляет query cache.

При добавлении поля:

1. backend schema;
2. WebSocket payload;
3. TypeScript type;
4. cache merge;
5. REST fallback;
6. reconnect и hidden tab.

## 10. Локализация

Английский основной, русский дополнительный.

Для нового текста:

1. английский ключ;
2. русский перевод;
3. `t("key")`;
4. без hard-coded UI;
5. перевести ошибки и empty states;
6. проверить оба языка;
7. проверить формы с autofill.

```bash
grep -RIn \
  --include='*.ts' \
  --include='*.tsx' \
  -P '[А-Яа-яЁё]' \
  frontend/src \
  --exclude='translations.ts'
```

Комментарии допустимы, UI-строки — через i18n.

## 11. Роли

Frontend скрывает действия, backend обеспечивает безопасность.

- Viewer: без URL и управления;
- Operator: оба URL, source edit, start/stop, без destination edit;
- Administrator: полный доступ.

Тестируйте API напрямую.

## 12. Диагностика

Используйте стабильные коды.

Локализованный текст не является machine identifier.

Для нового статуса:

- backend code;
- severity;
- fallback;
- EN/RU keys;
- chip и tooltip;
- unknown fallback.

## 13. Документация

Функция завершена после обновления документации на двух языках.

Обычно:

- README;
- CHANGELOG;
- `docs/en`;
- `docs/ru`;
- ADR.

## 14. Перед коммитом

```bash
git diff --check
git status --short
```

```bash
cd frontend
npm run build
```

```bash
cd backend
.venv/bin/alembic check
```

Проверить staged diff:

```bash
git diff --cached
```

## 15. Коммиты

Краткие imperative сообщения:

```text
Add bilingual user guide
Fix preview readiness handling
Update RTMP destination domain
```

Не смешивайте независимые задачи.

## 16. Ветки

```text
main
feature/<name>
fix/<name>
docs/<name>
```

Не force-push `main`.

## 17. Релиз

1. чистый tree;
2. миграции актуальны;
3. frontend build;
4. документация;
5. smoke test;
6. merge main;
7. annotated tag;
8. push tag;
9. release notes;
10. мониторинг production.

## 18. Секреты

Не коммитить:

- `.env`;
- JWT;
- пароли БД;
- deploy keys;
- TLS private keys;
- stream keys;
- tokenized HLS URL.

## 19. Production

Изменения должны быть воспроизводимы.

Перед заменой systemd/Nginx:

- backup;
- diff;
- сохранить Certbot;
- validate;
- apply;
- rollback plan.
