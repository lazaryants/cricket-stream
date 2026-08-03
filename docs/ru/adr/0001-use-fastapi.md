# ADR 0001: FastAPI для backend

- Статус: принято
- Дата: 2026-08-03

## Контекст

Нужны авторизованный REST API, async-БД, WebSocket, supervisor процессов и типизированные схемы.

## Решение

Использовать Python 3.13, FastAPI, Uvicorn, SQLAlchemy async и Alembic.

## Последствия

Плюсы:

- типизированные API;
- async;
- удобное управление процессами;
- OpenAPI;
- один язык backend и supervisor.

Компромиссы:

- тяжёлая обработка остаётся в FFmpeg;
- требуется аккуратный lifecycle;
- blocking-библиотеки нужно изолировать.
