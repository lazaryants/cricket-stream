# Руководство по обновлению

[English version](../en/UPGRADE.md)

Руководство описывает безопасное обновление существующего production.

Заполненная база должна сохраниться.

## 1. Maintenance window

Не обновляйте систему во время мероприятия.

Запланируйте время на:

- остановку потоков;
- backup;
- синхронизацию зависимостей;
- миграции;
- frontend build;
- restart;
- end-to-end тест;
- возможный rollback.

## 2. Текущее состояние

```bash
cd /opt/cricket-stream

git status --short --branch
git log -1 --oneline --decorate
git tag --points-at HEAD

sudo systemctl status cricket-backend --no-pager -l
```

Разберите локальные изменения до pull.

## 3. Остановка потоков

Остановите активные потоки через интерфейс.

Проверьте desired active, чтобы они не запускались неожиданно.

## 4. Backup

Сохраните:

- PostgreSQL;
- `.env`;
- Nginx;
- systemd;
- commit и миграцию.

Используйте [руководство по backup](BACKUP_RESTORE.md).

## 5. Получение обновления

```bash
cd /opt/cricket-stream

git fetch origin --tags
git pull --ff-only origin main
```

Для конкретного релиза:

```bash
git fetch origin --tags
git checkout v1.0.0
```

Для постоянной эксплуатации обычно используется нужная ветка, а tag — для фиксации релиза.

## 6. Backend dependencies

```bash
cd /opt/cricket-stream/backend

uv sync --locked
```

Не заменяйте production `.env`.

```bash
.venv/bin/streamlink --version
.venv/bin/yt-dlp --version
/usr/bin/ffmpeg -version | head -1
```

## 7. Миграции

Убедитесь в наличии backup.

```bash
cd /opt/cricket-stream/backend

.venv/bin/alembic current
.venv/bin/alembic heads

.venv/bin/alembic upgrade head

.venv/bin/alembic current
.venv/bin/alembic check
```

Не редактируйте применённую production-миграцию.

## 8. Frontend

```bash
cd /opt/cricket-stream/frontend

npm ci
npm run build
```

Предупреждение chunk size не означает ошибку.

## 9. Конфигурация

systemd diff:

```bash
cd /opt/cricket-stream

sudo diff -u \
  deploy/systemd/cricket-backend.service \
  /etc/systemd/system/cricket-backend.service \
  || true
```

Nginx diff:

```bash
sudo diff -u \
  deploy/nginx/cricket-stream.conf \
  /etc/nginx/sites-available/cricket-stream \
  || true
```

Production Nginx содержит TLS-директивы Certbot. Не перезаписывайте его вслепую.

При намеренном обновлении systemd:

```bash
sudo cp \
  deploy/systemd/cricket-backend.service \
  /etc/systemd/system/cricket-backend.service

sudo systemctl daemon-reload
```

## 10. Restart backend

```bash
sudo systemctl restart cricket-backend
sudo systemctl status cricket-backend --no-pager -l
```

```bash
sudo journalctl \
  -u cricket-backend \
  -n 200 \
  --no-pager -l
```

## 11. Nginx

Если конфигурация менялась:

```bash
sudo nginx -t \
  && sudo systemctl reload nginx
```

## 12. Проверка

```bash
curl -fsS \
  https://de.cricket-stream.icu/api/v1/health

cd /opt/cricket-stream/backend
.venv/bin/alembic current
.venv/bin/alembic check

cd /opt/cricket-stream
git status --short --branch
git log -1 --oneline --decorate
```

В браузере:

- Login;
- языки;
- Dashboard;
- Monitor;
- Libraries;
- All Streams;
- формы;
- Details;
- Users;
- Account;
- Components.

Видеотракт:

- Streamlink;
- yt-dlp;
- RTMP-приём;
- HLS-preview;
- метрики;
- stop/restart.

## 13. Обновление компонентов

Обновление приложения и компонентов — разные задачи.

```bash
cd /opt/cricket-stream/backend

uv lock --upgrade-package streamlink
uv lock --upgrade-package yt-dlp
uv sync --locked
```

Lock-файлы коммитятся только после теста.

FFmpeg, Python и Node.js обновляйте отдельной задачей.

## 14. Rollback кода

Если необратимая миграция не применялась:

```bash
cd /opt/cricket-stream

git log --oneline --decorate -20
git reset --hard PREVIOUS_COMMIT
```

```bash
cd backend
uv sync --locked

cd ../frontend
npm ci
npm run build

sudo systemctl restart cricket-backend
```

Сначала проверьте локальные изменения.

## 15. Rollback базы

Если схема или данные изменены несовместимо, восстановите pre-upgrade dump.

Используйте [руководство по backup](BACKUP_RESTORE.md).

Не выполняйте непроверенный downgrade Alembic на production.

## 16. Завершение

Обновление закончено, когда:

- backend healthy;
- миграции актуальны;
- frontend собран;
- Nginx валиден;
- БД сохранена;
- страницы проверены;
- один end-to-end поток проверен;
- working tree чист или изменения документированы.
