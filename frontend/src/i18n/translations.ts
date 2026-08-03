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

    "libraries.title":
      "Libraries",
    "libraries.subtitle":
      "Saved sources and RTMP destinations",
    "libraries.back":
      "Back",
    "libraries.add":
      "Add",
    "libraries.sources":
      "Sources",
    "libraries.destinations":
      "Destinations",
    "libraries.searchSources":
      "Search by name or source URL",
    "libraries.searchDestinations":
      "Search by name or RTMP address",
    "libraries.showDisabled":
      "Show disabled",
    "libraries.loading":
      "Loading library…",
    "libraries.sourcesEmpty":
      "No sources found.",
    "libraries.destinationsEmpty":
      "No destinations found.",
    "libraries.active":
      "Active",
    "libraries.disabled":
      "Disabled",
    "libraries.edit":
      "Edit",
    "libraries.delete":
      "Delete",
    "libraries.sourcePermission":
      "Operator or administrator permissions are required to modify sources.",
    "libraries.destinationPermission":
      "Administrator permissions are required to modify RTMP destinations.",

    "libraries.serverHttp":
      "The server returned HTTP {{status}}",
    "libraries.serverUnavailable":
      "The server is unavailable: {{message}}",
    "libraries.unknownError":
      "An unknown error occurred.",

    "libraries.source.add":
      "Add source",
    "libraries.source.edit":
      "Edit source",
    "libraries.source.nameRequired":
      "Enter a source name.",
    "libraries.source.urlRequired":
      "Enter a source URL.",
    "libraries.source.name":
      "Name",
    "libraries.source.namePlaceholder":
      "Main YouTube stream",
    "libraries.source.platform":
      "Platform",
    "libraries.source.url":
      "Source URL",
    "libraries.source.description":
      "Description",
    "libraries.source.descriptionPlaceholder":
      "Optional description",
    "libraries.source.enabled":
      "Source is active",

    "libraries.destination.add":
      "Add destination",
    "libraries.destination.edit":
      "Edit destination",
    "libraries.destination.nameRequired":
      "Enter a destination name.",
    "libraries.destination.urlRequired":
      "Enter an RTMP address.",
    "libraries.destination.urlInvalid":
      "The RTMP address must begin with rtmp:// or rtmps://.",
    "libraries.destination.name":
      "Name",
    "libraries.destination.namePlaceholder":
      "Venue 1",
    "libraries.destination.url":
      "RTMP address",
    "libraries.destination.description":
      "Description",
    "libraries.destination.descriptionPlaceholder":
      "Optional description",
    "libraries.destination.enabled":
      "Destination is active",

    "libraries.cancel":
      "Cancel",
    "libraries.save":
      "Save",
    "libraries.saving":
      "Saving…",
    "libraries.deleting":
      "Deleting…",
    "libraries.deleteRecord":
      "Delete record {{name}}?",
    "libraries.deleteWarning":
      "Existing stream cards will not be changed.",
    "libraries.deleteSourceTitle":
      "Delete source?",
    "libraries.deleteDestinationTitle":
      "Delete destination?",

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

    "libraries.title":
      "Библиотеки",
    "libraries.subtitle":
      "Сохранённые источники и RTMP-назначения",
    "libraries.back":
      "Назад",
    "libraries.add":
      "Добавить",
    "libraries.sources":
      "Источники",
    "libraries.destinations":
      "Назначения",
    "libraries.searchSources":
      "Поиск по названию или URL источника",
    "libraries.searchDestinations":
      "Поиск по названию или RTMP-адресу",
    "libraries.showDisabled":
      "Показывать отключённые",
    "libraries.loading":
      "Загрузка библиотеки…",
    "libraries.sourcesEmpty":
      "Источники не найдены.",
    "libraries.destinationsEmpty":
      "Назначения не найдены.",
    "libraries.active":
      "Активен",
    "libraries.disabled":
      "Отключён",
    "libraries.edit":
      "Редактировать",
    "libraries.delete":
      "Удалить",
    "libraries.sourcePermission":
      "Для изменения источников нужны права оператора или администратора.",
    "libraries.destinationPermission":
      "Для изменения RTMP-назначений нужны права администратора.",

    "libraries.serverHttp":
      "Сервер вернул HTTP {{status}}",
    "libraries.serverUnavailable":
      "Сервер недоступен: {{message}}",
    "libraries.unknownError":
      "Произошла неизвестная ошибка.",

    "libraries.source.add":
      "Добавить источник",
    "libraries.source.edit":
      "Редактировать источник",
    "libraries.source.nameRequired":
      "Укажите название источника.",
    "libraries.source.urlRequired":
      "Укажите URL источника.",
    "libraries.source.name":
      "Название",
    "libraries.source.namePlaceholder":
      "Основная трансляция YouTube",
    "libraries.source.platform":
      "Платформа",
    "libraries.source.url":
      "URL источника",
    "libraries.source.description":
      "Описание",
    "libraries.source.descriptionPlaceholder":
      "Необязательное описание",
    "libraries.source.enabled":
      "Источник активен",

    "libraries.destination.add":
      "Добавить назначение",
    "libraries.destination.edit":
      "Редактировать назначение",
    "libraries.destination.nameRequired":
      "Укажите название назначения.",
    "libraries.destination.urlRequired":
      "Укажите RTMP-адрес.",
    "libraries.destination.urlInvalid":
      "RTMP-адрес должен начинаться с rtmp:// или rtmps://.",
    "libraries.destination.name":
      "Название",
    "libraries.destination.namePlaceholder":
      "Площадка 1",
    "libraries.destination.url":
      "RTMP-адрес",
    "libraries.destination.description":
      "Описание",
    "libraries.destination.descriptionPlaceholder":
      "Необязательное описание",
    "libraries.destination.enabled":
      "Назначение активно",

    "libraries.cancel":
      "Отмена",
    "libraries.save":
      "Сохранить",
    "libraries.saving":
      "Сохранение…",
    "libraries.deleting":
      "Удаление…",
    "libraries.deleteRecord":
      "Удалить запись {{name}}?",
    "libraries.deleteWarning":
      "Уже созданные карточки трансляций не изменятся.",
    "libraries.deleteSourceTitle":
      "Удалить источник?",
    "libraries.deleteDestinationTitle":
      "Удалить назначение?",

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
