export type Language = "en" | "ru";

export const DEFAULT_LANGUAGE: Language =
  "en";

export const LANGUAGE_STORAGE_KEY =
  "cricket-stream-language";

export const translations = {
  en: {
    "language.english": "English",
    "language.russian": "Russian",
    "language.switch": "Change language",

    "common.monitor": "Monitor",
    "common.libraries": "Libraries",
    "common.componentVersions":
      "Component versions",
    "common.users": "Users",
    "common.account":
      "Account and password",
    "common.logout": "Log out",
    "common.refreshAll":
      "Refresh all",

    "role.viewer": "Viewer",
    "role.operator": "Operator",
    "role.admin": "Administrator",

    "dashboard.title": "Streams",
    "dashboard.subtitle":
      "Current stream and server status",
    "dashboard.total":
      "Total: {{count}}",
    "dashboard.running":
      "Running: {{count}}",
    "dashboard.runningLoading":
      "Running: …",
    "dashboard.problems":
      "Problems: {{count}}",
    "dashboard.allStreams":
      "All streams",
    "dashboard.newStream":
      "New stream",
    "dashboard.emailMissing":
      "Email not specified",
    "dashboard.loadError":
      "Unable to load the stream list. Check the backend and try again.",
    "dashboard.empty":
      "No streams have been configured yet.",

    "common.refresh": "Refresh",
    "common.details": "Details",
    "common.edit": "Edit",
    "common.noData": "No data",
    "common.enabled": "Enabled",
    "common.disabled": "Disabled",

    "stream.provider.custom":
      "Direct URL",
    "stream.provider.unknown":
      "Unknown",
    "stream.openDetails":
      "Open details: {{name}}",
    "stream.operationError":
      "Operation failed. Check the stream status.",
    "stream.statusError":
      "Unable to obtain the current stream status.",
    "stream.sourceUnavailable":
      "The source is unavailable. Recovery attempts are in progress.",
    "stream.start": "Start",
    "stream.stop": "Stop",
    "stream.stopAttempts":
      "Stop attempts",

    "status.draft": "Draft",
    "status.ready": "Ready",
    "status.starting": "Starting",
    "status.running": "Running",
    "status.restarting":
      "Restarting",
    "status.stopping": "Stopping",
    "status.stopped": "Stopped",
    "status.error": "Error",

    "diagnostic.checking":
      "Checking…",
    "diagnostic.loadError":
      "Unable to obtain stream diagnostics",

    "metrics.none":
      "No live metrics",
    "metrics.waiting":
      "Waiting for metrics…",
    "metrics.resolution":
      "Resolution",
    "metrics.sourceFps":
      "Source FPS",
    "metrics.outputBitrate":
      "Output bitrate",
    "metrics.ffmpegSpeed":
      "FFmpeg speed",
    "metrics.videoCodec":
      "Video codec",
    "metrics.audioCodec":
      "Audio codec",
    "metrics.uptime":
      "Uptime",
    "metrics.dropped":
      "Dropped by FFmpeg",

    "preview.alt":
      "Stream preview",
    "preview.loading":
      "Getting preview…",
    "preview.unavailable":
      "Preview unavailable",
    "preview.stopped":
      "Stream stopped",

    "player.unavailable":
      "The video stream is temporarily unavailable",
    "player.unsupported":
      "This browser does not support HLS",
    "player.hlsNotReady":
      "HLS is not ready yet",
    "player.connecting":
      "Connecting to video…",

    "monitor.title":
      "Stream monitor",
    "monitor.dashboard":
      "Dashboard",
    "monitor.grid":
      "Grid",
    "monitor.running":
      "Running: {{count}}",
    "monitor.cameras":
      "Cameras {{first}}–{{last}} of {{total}}",
    "monitor.problems":
      "Problems: {{count}}",
    "monitor.previousCameras":
      "Previous cameras",
    "monitor.nextCameras":
      "Next cameras",
    "monitor.refresh":
      "Refresh data",
    "monitor.fullscreen":
      "Full screen",
    "monitor.exitFullscreen":
      "Exit full screen",
    "monitor.openStream":
      "Open {{name}}",
    "monitor.openDetails":
      "Open details",
    "monitor.problem":
      "PROBLEM",
    "monitor.loadError":
      "Unable to load the stream list.",
    "monitor.empty":
      "No streams are selected for the Dashboard. Enable “Show on Dashboard” in the stream settings.",
    "monitor.sourceFps":
      "Source FPS {{value}}",

    "login.subtitle":
      "Sign in to the control panel",
    "login.username": "Username",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.submitting": "Signing in…",
    "login.error":
      "Unable to sign in. Check your username and password.",
    "login.passwordChanged":
      "Password changed. Sign in with your new password.",
  },

  ru: {
    "language.english": "Английский",
    "language.russian": "Русский",
    "language.switch": "Изменить язык",

    "common.monitor": "Монитор",
    "common.libraries": "Библиотеки",
    "common.componentVersions":
      "Версии компонентов",
    "common.users": "Пользователи",
    "common.account":
      "Аккаунт и пароль",
    "common.logout": "Выйти",
    "common.refreshAll":
      "Обновить всё",

    "role.viewer": "Наблюдатель",
    "role.operator": "Оператор",
    "role.admin": "Администратор",

    "dashboard.title": "Трансляции",
    "dashboard.subtitle":
      "Текущее состояние потоков и серверов",
    "dashboard.total":
      "Всего: {{count}}",
    "dashboard.running":
      "Работает: {{count}}",
    "dashboard.runningLoading":
      "Работает: …",
    "dashboard.problems":
      "Проблемы: {{count}}",
    "dashboard.allStreams":
      "Все трансляции",
    "dashboard.newStream":
      "Новая трансляция",
    "dashboard.emailMissing":
      "Email не указан",
    "dashboard.loadError":
      "Не удалось загрузить список трансляций. Проверьте backend и повторите запрос.",
    "dashboard.empty":
      "В системе пока нет настроенных потоков.",

    "common.refresh": "Обновить",
    "common.details": "Подробнее",
    "common.edit": "Редактировать",
    "common.noData": "Нет данных",
    "common.enabled": "Включена",
    "common.disabled": "Отключена",

    "stream.provider.custom":
      "Прямая ссылка",
    "stream.provider.unknown":
      "Неизвестно",
    "stream.openDetails":
      "Открыть подробности: {{name}}",
    "stream.operationError":
      "Операция не выполнена. Проверьте состояние потока.",
    "stream.statusError":
      "Не удалось получить текущий статус потока.",
    "stream.sourceUnavailable":
      "Источник недоступен. Выполняются попытки восстановления.",
    "stream.start": "Запустить",
    "stream.stop": "Остановить",
    "stream.stopAttempts":
      "Прекратить попытки",

    "status.draft": "Черновик",
    "status.ready": "Готов",
    "status.starting": "Запускается",
    "status.running": "Работает",
    "status.restarting":
      "Перезапускается",
    "status.stopping":
      "Останавливается",
    "status.stopped": "Остановлен",
    "status.error": "Ошибка",

    "diagnostic.checking":
      "Проверка…",
    "diagnostic.loadError":
      "Не удалось получить диагностику потока",

    "metrics.none":
      "Нет live-метрик",
    "metrics.waiting":
      "Ожидание метрик…",
    "metrics.resolution":
      "Разрешение",
    "metrics.sourceFps":
      "FPS источника",
    "metrics.outputBitrate":
      "Выходной битрейт",
    "metrics.ffmpegSpeed":
      "Скорость FFmpeg",
    "metrics.videoCodec":
      "Видеокодек",
    "metrics.audioCodec":
      "Аудиокодек",
    "metrics.uptime":
      "Время работы",
    "metrics.dropped":
      "Пропущено FFmpeg",

    "preview.alt":
      "Кадр трансляции",
    "preview.loading":
      "Получение кадра…",
    "preview.unavailable":
      "Кадр недоступен",
    "preview.stopped":
      "Поток остановлен",

    "player.unavailable":
      "Видеопоток временно недоступен",
    "player.unsupported":
      "Браузер не поддерживает HLS",
    "player.hlsNotReady":
      "HLS ещё не готов",
    "player.connecting":
      "Подключение к видео…",

    "monitor.title":
      "Монитор трансляций",
    "monitor.dashboard":
      "Dashboard",
    "monitor.grid":
      "Сетка",
    "monitor.running":
      "Работает: {{count}}",
    "monitor.cameras":
      "Камеры {{first}}–{{last}} из {{total}}",
    "monitor.problems":
      "Проблемы: {{count}}",
    "monitor.previousCameras":
      "Предыдущие камеры",
    "monitor.nextCameras":
      "Следующие камеры",
    "monitor.refresh":
      "Обновить данные",
    "monitor.fullscreen":
      "Во весь экран",
    "monitor.exitFullscreen":
      "Выйти из полноэкранного режима",
    "monitor.openStream":
      "Открыть {{name}}",
    "monitor.openDetails":
      "Открыть подробности",
    "monitor.problem":
      "ПРОБЛЕМА",
    "monitor.loadError":
      "Не удалось получить список трансляций.",
    "monitor.empty":
      "На Dashboard пока нет выбранных трансляций. Включите параметр «Показывать на Dashboard» в настройках потока.",
    "monitor.sourceFps":
      "FPS источника {{value}}",

    "login.subtitle":
      "Вход в панель управления",
    "login.username": "Имя пользователя",
    "login.password": "Пароль",
    "login.submit": "Войти",
    "login.submitting":
      "Выполняется вход…",
    "login.error":
      "Не удалось выполнить вход. Проверьте имя пользователя и пароль.",
    "login.passwordChanged":
      "Пароль изменён. Войдите с новым паролем.",
  },
} as const;

export type TranslationKey =
  keyof typeof translations.en;
