# Участие в разработке

[English version](CONTRIBUTING.md)

Спасибо за участие в развитии Cricket Stream Platform.

## Основные правила

- Беречь production-данные.
- Не коммитить секреты.
- Делать небольшие изменения.
- Сохранять ролевую безопасность.
- Обновлять тесты и документацию.
- Вести EN/RU документацию вместе.
- Выполнять проверки до отправки.

## Процесс

1. Создать ветку:

```bash
git switch -c feature/short-description
```

2. Внести изменения.
3. Проверить:

```bash
git diff --check
git status --short
```

4. При frontend-изменениях:

```bash
cd frontend
npm run build
```

5. При изменении моделей:

```bash
cd backend
.venv/bin/alembic check
```

6. Сделать понятный коммит.
7. Push и pull request.

## База данных

- Не сбрасывать заполненную production-БД.
- Для изменения схемы создавать новую Alembic migration.
- Не переписывать применённую миграцию.
- Делать backup.
- Проверять data migrations.

## Безопасность

Viewer не получает:

- `source_url`;
- `destination_rtmp_url`.

Operator видит оба URL и меняет source, но не destination definitions.

Administrator имеет полный доступ.

Backend обязан проверять права независимо от frontend.

## Frontend

- Использовать существующие MUI-паттерны.
- Сохранять мобильное поведение.
- UI-текст через i18n.
- EN/RU добавляются вместе.
- Проверять autofill, responsive и оба языка.
- Выполнять `npm run build`.

## Видеотракт

- Предпочитать `-c:v copy` и `-c:a copy`.
- Документировать необходимость transcoding.
- Тестировать Streamlink и yt-dlp.
- Сохранять корректный stop/retry/process cleanup.
- Не публиковать HLS напрямую.

## Документация

При изменении поведения обновлять оба языка:

```text
docs/en/
docs/ru/
```

Для важных решений создавать ADR.

## Коммиты

Примеры:

```text
Add node health endpoint
Fix destination authorization
Document backup procedure
```

## Pull request

Указать:

- цель;
- компоненты;
- влияние на БД;
- безопасность;
- эксплуатацию;
- тесты;
- документацию;
- rollback.

## Проверка

- нет секретов;
- нет сброса БД;
- роли сохранены;
- build проходит;
- migration check проходит;
- ссылки работают;
- EN/RU синхронизированы;
- deployment обратим.
