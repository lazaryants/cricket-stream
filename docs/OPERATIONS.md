# Эксплуатация и диагностика

## Основные сервисы

```bash
sudo systemctl status cricket-backend --no-pager -l
sudo systemctl status nginx --no-pager -l
sudo systemctl status postgresql --no-pager -l
```

Backend запускается сервисом `cricket-backend.service`.

## Журналы

Последние сообщения backend:

```bash
sudo journalctl -u cricket-backend -n 200 --no-pager -l
```

Наблюдение в реальном времени:

```bash
sudo journalctl -u cricket-backend -f -l
```

Только сообщения видеотракта:

```bash
sudo journalctl -u cricket-backend --since "10 minutes ago" \
  --no-pager -l \
  | grep -E 'STREAM MANAGER|SOURCE RESOLVER|STREAMLINK|yt-dlp|FFMPEG|SUPERVISOR|error|failed'
```

## Процессы трансляций

```bash
ps -eo pid,ppid,etime,%cpu,%mem,cmd --width 500 \
  | grep -E '[y]t-dlp|[s]treamlink|[f]fmpeg'
```

FFmpeg должен быть дочерним процессом backend. Для Streamlink дополнительно
работает процесс-резолвер с выводом в pipe. В режиме yt-dlp FFmpeg читает
извлечённый media URL непосредственно.

## HLS-preview

```bash
find /opt/cricket-stream/var/hls \
  -maxdepth 2 -type f \
  -printf '%TY-%Tm-%Td %TH:%TM:%TS %s %p\n' \
  | sort | tail -30
```

Для работающего потока ожидаются:

```text
var/hls/<stream-id>/index.m3u8
var/hls/<stream-id>/segment_*.ts
```

Отсутствие файлов при живом FFmpeg обычно означает, что вход ещё не получен,
источник не вещает или FFmpeg не смог открыть извлечённый URL.

Каталог HLS не должен раздаваться открытым `location /hls/`. Playlist и сегменты
обслуживаются API после проверки короткоживущего playback-токена.

## Проверка компонентов

```bash
cd /opt/cricket-stream/backend
.venv/bin/streamlink --version
.venv/bin/yt-dlp --version
/usr/bin/ffmpeg -version | head -1
```

Доступные версии также отображаются администратору на странице компонентов.
Обновление выполняется только вручную после проверки совместимости:

```bash
cd /opt/cricket-stream/backend
uv lock --upgrade-package streamlink
uv lock --upgrade-package yt-dlp
uv sync --locked
```

После обновления необходимо протестировать хотя бы один источник каждого
используемого провайдера.

## База данных

```bash
cd /opt/cricket-stream/backend
.venv/bin/alembic current
.venv/bin/alembic heads
.venv/bin/alembic check
```

Создание backup:

```bash
sudo -u postgres pg_dump --format=custom cricket_stream \
  > ~/cricket-stream-$(date +%Y%m%d-%H%M%S).dump
```

Список пользователей:

```bash
cd /opt/cricket-stream/backend
.venv/bin/python manage.py list-users
```

Смена пароля:

```bash
.venv/bin/python manage.py reset-password USERNAME
```

## HTTPS

```bash
curl -I https://de.cricket-stream.icu
curl -I http://de.cricket-stream.icu
curl -fsS https://de.cricket-stream.icu/api/v1/health

systemctl list-timers --all | grep -i certbot
sudo certbot certificates
sudo certbot renew --dry-run
```

Не добавляйте приватный ключ из `/etc/letsencrypt` в Git или архив проекта.

## Типовые ситуации

### Источник не вещает

Ожидаемое поведение: карточка переходит в статус «Ошибка», диагностика сообщает
об отсутствии live-потока, supervisor повторяет запуск с ограниченной задержкой.
Это не означает неисправность сайта.

### Streamlink работает, а yt-dlp нет

Проверьте выбранный движок, версии компонентов и сообщения `SOURCE RESOLVER`.
В режиме `auto` система сначала пробует Streamlink, затем yt-dlp.

### Видео появляется с задержкой

HLS использует сегменты длительностью несколько секунд. Нормальная задержка
после старта — примерно 4–10 секунд. Плеер повторно проверяет готовность playlist
и не требует обновления страницы.

### API возвращает 502 после рестарта

Если запрос сделан сразу после `systemctl restart`, Uvicorn мог ещё не открыть
порт 8000. Повторите проверку через несколько секунд и посмотрите статус сервиса.

### Миграции расходятся с моделями

Не редактируйте уже применённые production-миграции. Создайте следующую
корректирующую миграцию, сделайте backup и проверьте `alembic check`.

## Безопасный перезапуск

Сначала остановите активные трансляции через интерфейс. Затем:

```bash
sudo systemctl restart cricket-backend
sudo systemctl status cricket-backend --no-pager -l
curl -fsS https://de.cricket-stream.icu/api/v1/health
```

Nginx после изменения конфигурации:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

