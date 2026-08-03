# Руководство по эксплуатации

[English version](../en/OPERATIONS.md)

Руководство описывает повседневную эксплуатацию и диагностику Cricket Stream Platform.

## 1. Основные сервисы

```bash
sudo systemctl status cricket-backend --no-pager -l
sudo systemctl status nginx --no-pager -l
sudo systemctl status postgresql --no-pager -l
```

Backend-сервис:

```text
cricket-backend.service
```

## 2. Health checks

Внешний:

```bash
curl -fsS \
  https://de.cricket-stream.icu/api/v1/health
```

Локальный:

```bash
curl -fsS \
  http://127.0.0.1:8000/api/v1/health
```

Если локальный работает, а внешний нет, проверяйте Nginx, TLS, DNS и firewall.

## 3. Журналы backend

```bash
sudo journalctl \
  -u cricket-backend \
  -n 200 \
  --no-pager -l
```

В реальном времени:

```bash
sudo journalctl \
  -u cricket-backend \
  -f -l
```

За десять минут:

```bash
sudo journalctl \
  -u cricket-backend \
  --since "10 minutes ago" \
  --no-pager -l
```

Фильтр видеотракта:

```bash
sudo journalctl \
  -u cricket-backend \
  --since "10 minutes ago" \
  --no-pager -l \
  | grep -E \
    'STREAM MANAGER|SOURCE RESOLVER|STREAMLINK|yt-dlp|FFMPEG|SUPERVISOR|error|failed'
```

## 4. Журналы Nginx

```bash
sudo tail -n 200 \
  /var/log/nginx/cricket-stream.error.log

sudo tail -n 200 \
  /var/log/nginx/cricket-stream.access.log
```

Запросы HLS с токенами намеренно не пишутся в access log.

## 5. Процессы

```bash
ps -eo \
  user,pid,ppid,etime,%cpu,%mem,args \
  --width 500 \
  | grep -E \
    '[s]treamlink|[y]t-dlp|[f]fmpeg'
```

### Streamlink

```text
backend
├── streamlink --stdout ...
└── ffmpeg -i pipe:0 ...
```

### yt-dlp

yt-dlp извлекает media URL, после чего FFmpeg читает его напрямую.

### Прямой RTMP

FFmpeg читает RTMP URL непосредственно.

Процессы должны принадлежать пользователю `stream` и быть дочерними процессами backend.

## 6. HLS-preview

```bash
find /opt/cricket-stream/var/hls \
  -maxdepth 2 \
  -type f \
  -printf '%TY-%Tm-%Td %TH:%TM:%TS %s %p\n' \
  | sort \
  | tail -50
```

Для работающего потока:

```text
var/hls/<stream-id>/index.m3u8
var/hls/<stream-id>/segment_*.ts
```

Отсутствие файлов может означать:

- источник не ведёт эфир;
- resolver завершился;
- FFmpeg ещё не открыл вход;
- поток только запускается;
- неверные права каталога.

HLS-каталог нельзя публиковать напрямую.

## 7. Версии компонентов

```bash
cd /opt/cricket-stream/backend

.venv/bin/streamlink --version
.venv/bin/yt-dlp --version
/usr/bin/ffmpeg -version | head -1
python --version
```

Не обновляйте компоненты во время мероприятия.

## 8. База данных

```bash
cd /opt/cricket-stream/backend

.venv/bin/alembic current
.venv/bin/alembic heads
.venv/bin/alembic check
```

Пользователи:

```bash
.venv/bin/python manage.py list-users
```

Сброс пароля:

```bash
.venv/bin/python manage.py reset-password USERNAME
```

По возможности используйте страницу Users.

## 9. Безопасный restart backend

Перед плановым restart:

1. остановите активные потоки;
2. учтите desired active;
3. при обновлении убедитесь в наличии backup.

```bash
sudo systemctl restart cricket-backend
sudo systemctl status cricket-backend --no-pager -l
```

```bash
curl -fsS \
  https://de.cricket-stream.icu/api/v1/health
```

Потоки с desired active могут запуститься автоматически.

## 10. Reload Nginx

```bash
sudo nginx -t \
  && sudo systemctl reload nginx
```

Не выполняйте reload после неуспешного теста.

## 11. TLS

```bash
sudo certbot certificates

systemctl list-timers --all \
  | grep -i certbot

sudo certbot renew --dry-run
```

Не добавляйте закрытые ключи в Git и обычные support-архивы.

## 12. Диск

```bash
df -h
df -i

du -sh \
  /opt/cricket-stream/var/hls \
  /var/log/nginx \
  2>/dev/null
```

Старые HLS-сегменты удаляются, но диск нужно контролировать.

## 13. CPU и RAM

```bash
free -h
uptime

ps -eo \
  pid,ppid,%cpu,%mem,etime,args \
  --sort=-%cpu \
  | head -30
```

Без перекодирования CPU обычно умеренный.

Высокая нагрузка может означать:

- неожиданное перекодирование;
- повреждённый вход;
- цикл перезапусков;
- постороннюю нагрузку VPS.

## 14. Сеть

```bash
getent hosts de.cricket-stream.icu
getent hosts rtmp.cricket-stream.icu
```

```bash
curl -I \
  https://de.cricket-stream.icu
```

```bash
nc -vz \
  rtmp.cricket-stream.icu \
  1935
```

Успешный TCP connect не подтверждает правильность application path и stream key.

## 15. Типовые ситуации

### Источник не ведёт эфир

Ожидаемо:

- диагностика сообщает offline/unavailable;
- запуск завершается ошибкой;
- supervisor повторяет попытки при desired active.

Это не обязательно авария платформы.

### Streamlink не работает, yt-dlp работает

Временно выберите yt-dlp и проверьте версии.

### yt-dlp не работает, Streamlink работает

Выберите Streamlink или Auto и изучите resolver logs.

### Preview появляется с задержкой

HLS требует нескольких секунд для первых сегментов.

### Preview есть, RTMP нет

Проверьте назначение, ключ, доступность сервера и его журналы.

### 502 после restart

Uvicorn мог ещё не открыть порт.

```bash
sudo systemctl status cricket-backend --no-pager -l
sudo journalctl -u cricket-backend -n 100 --no-pager -l
```

### Модели и миграции расходятся

Не изменяйте применённую миграцию. Создайте новую корректирующую.

### Цикл рестартов

Используйте Stop, затем изучите последнюю сессию.

## 16. Чек-лист мероприятия

До:

- сервисы работают;
- БД актуальна;
- сертификат действителен;
- диск свободен;
- версии просмотрены;
- источники проверены;
- назначения проверены;
- выполнен end-to-end тест.

Во время:

- Monitor открыт;
- диагностика контролируется;
- приём назначения проверяется независимо;
- компоненты не обновляются;
- процессы не завершаются вручную без аварийной необходимости.

После:

- ненужные потоки остановлены;
- desired active проверен;
- ошибки зафиксированы;
- изменения сохранены в backup.
