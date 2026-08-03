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

    "diagnostic.running.title":
      "Stream is running",
    "diagnostic.running.message":
      "The video transmission process is active. Errors from previous runs do not affect the current status.",

    "diagnostic.sourceUnavailable.title":
      "Source unavailable",
    "diagnostic.sourceUnavailable.message":
      "Unable to obtain video from the specified source.",

    "diagnostic.destinationRefused.title":
      "Destination server refused the connection",
    "diagnostic.destinationRefused.message":
      "Check the RTMP address, stream key, and destination server availability.",

    "diagnostic.authenticationFailed.title":
      "Authentication failed",
    "diagnostic.authenticationFailed.message":
      "The destination server rejected the stream key or credentials.",

    "diagnostic.networkUnavailable.title":
      "Network unavailable",
    "diagnostic.networkUnavailable.message":
      "The server cannot establish a network connection.",

    "diagnostic.connectionTimeout.title":
      "Server is not responding",
    "diagnostic.connectionTimeout.message":
      "The connection timed out. This may be a temporary network problem.",

    "diagnostic.connectionLost.title":
      "Connection lost",
    "diagnostic.connectionLost.message":
      "Video transmission was interrupted. The system may attempt to restore the stream.",

    "diagnostic.sourceProcessFailed.title":
      "Source process stopped",
    "diagnostic.sourceProcessFailed.message":
      "Unable to continue receiving video from the source.",

    "diagnostic.ffmpegFailed.title":
      "Stream processing stopped",
    "diagnostic.ffmpegFailed.message":
      "FFmpeg exited with an error.",

    "diagnostic.sourceOffline.title":
      "Source is not live",
    "diagnostic.sourceOffline.message":
      "There is currently no active live stream on the specified channel.",

    "diagnostic.stopped.title":
      "Stream stopped",
    "diagnostic.stopped.message":
      "The video transmission process is not currently running.",

    "diagnostic.noData.title":
      "No data",
    "diagnostic.noData.message":
      "The stream has not been started since the last backend restart.",

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

    "time.dayShort": "d",

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

    "streams.title": "All streams",
    "streams.libraries": "Libraries",
    "streams.logout": "Log out",
    "streams.subtitle":
      "Manage active, hidden and disabled streams",
    "streams.total": "Total: {{count}}",
    "streams.running": "Running: {{count}}",
    "streams.onDashboard":
      "On Dashboard: {{count}}",
    "streams.new": "New stream",
    "streams.refreshAll": "Refresh all",
    "streams.search":
      "Search by name, description, provider or ID",
    "streams.filter.all": "All",
    "streams.filter.running": "Running",
    "streams.filter.stopped": "Stopped",
    "streams.filter.dashboard":
      "On Dashboard",
    "streams.filter.hidden": "Hidden",
    "streams.filter.disabled": "Disabled",
    "streams.loadError":
      "Unable to load the stream list.",
    "streams.loading": "Loading streams…",
    "streams.empty":
      "No streams match the selected filters.",
    "streams.column.name": "Name",
    "streams.column.status": "Status",
    "streams.column.diagnostic":
      "Diagnostic",
    "streams.column.provider": "Provider",
    "streams.column.node": "Node",
    "streams.column.availability":
      "Availability",
    "streams.column.actions": "Actions",
    "streams.visibleOnDashboard":
      "Shown on Dashboard",
    "streams.hiddenFromDashboard":
      "Hidden from Dashboard",
    "streams.showOnDashboard":
      "Show on Dashboard",
    "streams.destination": "Destination",
    "streams.enabled": "Enabled",
    "streams.disabled": "Disabled",
    "streams.details": "Details",
    "streams.edit": "Edit",
    "streams.start": "Start",
    "streams.stop": "Stop",
    "streams.liveMetrics": "Live metrics",
    "streams.diagnostic": "Diagnostic",
    "streams.onDashboardLabel":
      "On Dashboard",
    "streams.showCard": "Show card",
    "streams.startStream": "Start stream",
    "streams.stopStream": "Stop stream",

    "sessionLog.empty": "The log is empty.",
    "streamPreview.title": "Stream preview",
    "streamPreview.subtitle": "Live HLS video without transcoding. Full screen is available in the player controls.",
    "streamControl.title": "Stream control",
    "streamControl.recovering": "The source is unavailable. The supervisor is trying to recover the stream. Click Stop attempts if the broadcast has ended.",
    "streamControl.disabled": "The stream is disabled in settings. An administrator must enable it before it can be started.",
    "selector.manageLibrary": "Manage library",
    "selector.fromLibrary": "From library",
    "selector.manual": "Enter manually",
    "sourceSelector.title": "Stream source",
    "sourceSelector.subtitle": "Select a source from the library or enter a temporary URL manually.",
    "sourceSelector.empty": "There are no active sources in the library. Use manual mode.",
    "sourceSelector.saved": "Saved source",
    "sourceSelector.activeOnly": "Only active sources are shown.",
    "sourceSelector.copyNotice": "The current URL is copied into the stream card. Later library changes do not update an existing card.",
    "sourceSelector.manualNotice": "A manually entered URL is used only in this card and is not saved to the library.",
    "destinationSelector.title": "Stream destination",
    "destinationSelector.subtitle": "Select an RTMP destination from the library or enter an address manually.",
    "destinationSelector.empty": "There are no active destinations in the library. Use manual mode.",
    "destinationSelector.saved": "Saved destination",
    "destinationSelector.activeOnly": "Only active destinations are shown.",
    "destinationSelector.copyNotice": "The RTMP address is copied into the stream card. Later library changes do not update an existing stream.",
    "destinationSelector.manualNotice": "A manually entered address is used only in this card and is not saved to the library.",
    "streamForm.saveError": "Unable to save the stream card.",
    "streamForm.nameRequired": "Enter a stream name.",
    "streamForm.sourceRequired": "Enter a source URL.",
    "streamForm.nodeInvalid": "Invalid node ID.",
    "streamForm.destinationRequired": "Enter an RTMP destination.",
    "streamForm.newTitle": "New stream",
    "streamForm.editTitle": "Stream settings",
    "streamForm.stopBeforeEdit": "Stop the stream before changing its settings.",
    "streamForm.operatorNotice": "An operator may change the source, platform, name, and description. The RTMP destination is read-only.",
    "streamForm.engine": "Source engine",
    "streamForm.engineAuto": "Auto (Streamlink → yt-dlp)",
    "streamForm.engineHelp": "In automatic mode Streamlink is tried first, followed by yt-dlp.",
    "streamForm.showDashboard": "Show on Dashboard",
    "streamForm.nodeId": "Node ID",
    "streamForm.enabled": "Stream enabled",
    "streamForm.autoStart": "Auto-start",
    "streamForm.create": "Create",
    "streamCreate.title": "Create stream",
    "streamCreate.error": "Unable to create the stream card.",
    "streamEdit.title": "Edit stream",
    "streamEdit.loadError": "Unable to load the stream card.",
    "streamEdit.saveError": "Unable to save changes. Stop a running stream first.",
    "streamEdit.deleteError": "Unable to delete the stream. Stop it first.",
    "streamEdit.deleteTitle": "Delete stream?",
    "streamEdit.deleteWarning": "The card and its session history will be deleted. This cannot be undone.",
    "streamDetails.loadError": "Unable to load stream data.",
    "streamDetails.noDescription": "No description",
    "streamDetails.state": "Stream state",
    "streamDetails.processAlive": "Process alive",
    "streamDetails.transferred": "Transferred",
    "streamDetails.media": "Video and audio",
    "streamDetails.profile": "Profile",
    "streamDetails.audioRate": "Audio rate",
    "streamDetails.channels": "Channels",
    "streamDetails.duplicated": "Duplicated by FFmpeg",
    "streamDetails.route": "Stream route",
    "streamDetails.source": "Source",
    "streamDetails.destination": "RTMP destination",
    "streamDetails.sessions": "Recent sessions",
    "streamDetails.sessionsError": "Unable to load session history.",
    "streamDetails.noSessions": "No sessions yet.",
    "streamDetails.started": "Started",
    "streamDetails.ended": "Ended",
    "streamDetails.latestLog": "Latest session log",
    "streamDetails.noLatestSession": "No latest session.",
    "streamDetails.logError": "Unable to load the log.",
    "common.yes": "Yes",
    "common.no": "No",
    "users.title": "Users",
    "users.subtitle":
      "Password management and user session termination",
    "users.backDashboard":
      "Back to Dashboard",
    "users.loadError":
      "Unable to load users.",
    "users.column.user":
      "User",
    "users.column.role":
      "Role",
    "users.column.status":
      "Status",
    "users.column.lastLogin":
      "Last login",
    "users.column.actions":
      "Actions",
    "users.active":
      "Active",
    "users.disabled":
      "Disabled",
    "users.changePassword":
      "Change password",
    "users.changePasswordFor":
      "Change password for {{username}}",
    "users.changePasswordTitle":
      "Change password: {{username}}",
    "users.selfPasswordHint":
      "Change your own password in the Account section",
    "users.sessionsWarning":
      "All active user sessions will be terminated.",
    "users.passwordChanged":
      "The password for {{username}} has been changed. All active sessions have been terminated.",
    "users.passwordChangeError":
      "Unable to change the password.",
    "users.cancel":
      "Cancel",
    "users.saving":
      "Saving…",

    "account.title":
      "Account",
    "account.backDashboard":
      "Back to Dashboard",
    "account.sessionsNotice":
      "After changing the password, all previously issued sessions will be terminated. You will need to sign in again.",
    "account.changePassword":
      "Change password",
    "account.changeError":
      "Unable to change the password.",

    "password.current":
      "Current password",
    "password.new":
      "New password",
    "password.confirmNew":
      "Confirm new password",
    "password.minimumLength":
      "The password must contain at least 8 characters.",
    "password.minimumLengthHint":
      "At least 8 characters",
    "password.mismatch":
      "Passwords do not match.",
    "password.newMinimumLength":
      "The new password must contain at least 8 characters.",
    "password.newMismatch":
      "The new passwords do not match.",

    "components.back": "Back",
    "components.title":
      "Video pipeline components",
    "components.subtitle":
      "Installed and available versions",
    "components.check": "Check updates",
    "components.checking": "Checking…",
    "components.updateNotice":
      "This page only checks versions. Updates are installed manually by an administrator during a maintenance window so active streams are not interrupted.",
    "components.loadError":
      "Unable to check component versions.",
    "components.status.updateAvailable":
      "Update available",
    "components.status.checkFailed":
      "Check failed",
    "components.status.checked": "Checked",
    "components.status.upToDate":
      "Up to date",
    "components.installed": "Installed",
    "components.available": "Available",
    "components.lastChecked":
      "Last checked",

    "selector.error.http":
      "Backend returned HTTP {{status}}",
    "selector.error.unavailable":
      "Backend unavailable: {{message}}",
    "sourceSelector.loadError":
      "Unable to load the source library.",
    "destinationSelector.loadError":
      "Unable to load the destination library.",

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

    "diagnostic.running.title":
      "Поток работает",
    "diagnostic.running.message":
      "Процесс передачи видео активен. Старые ошибки предыдущих запусков не влияют на текущий статус.",

    "diagnostic.sourceUnavailable.title":
      "Источник недоступен",
    "diagnostic.sourceUnavailable.message":
      "Не удалось получить видео с указанного источника.",

    "diagnostic.destinationRefused.title":
      "Сервер назначения отказал в подключении",
    "diagnostic.destinationRefused.message":
      "Проверьте RTMP-адрес, ключ трансляции и доступность сервера назначения.",

    "diagnostic.authenticationFailed.title":
      "Ошибка авторизации",
    "diagnostic.authenticationFailed.message":
      "Сервер назначения не принял ключ трансляции или учётные данные.",

    "diagnostic.networkUnavailable.title":
      "Сеть недоступна",
    "diagnostic.networkUnavailable.message":
      "Сервер не может установить сетевое соединение.",

    "diagnostic.connectionTimeout.title":
      "Сервер не отвечает",
    "diagnostic.connectionTimeout.message":
      "Время ожидания подключения истекло. Возможна временная проблема сети.",

    "diagnostic.connectionLost.title":
      "Соединение потеряно",
    "diagnostic.connectionLost.message":
      "Передача видео была прервана. Система могла попытаться восстановить поток.",

    "diagnostic.sourceProcessFailed.title":
      "Процесс источника завершился",
    "diagnostic.sourceProcessFailed.message":
      "Не удалось продолжить получение видео с источника.",

    "diagnostic.ffmpegFailed.title":
      "Обработка потока остановлена",
    "diagnostic.ffmpegFailed.message":
      "FFmpeg завершился с ошибкой.",

    "diagnostic.sourceOffline.title":
      "Источник не ведёт трансляцию",
    "diagnostic.sourceOffline.message":
      "На указанном канале сейчас нет активного эфира.",

    "diagnostic.stopped.title":
      "Поток остановлен",
    "diagnostic.stopped.message":
      "Сейчас процесс передачи видео не запущен.",

    "diagnostic.noData.title":
      "Нет данных",
    "diagnostic.noData.message":
      "Поток ещё не запускался после последнего перезапуска backend.",

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

    "time.dayShort": "д",

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

    "streams.title": "Все трансляции",
    "streams.libraries": "Библиотеки",
    "streams.logout": "Выйти",
    "streams.subtitle":
      "Управление активными, скрытыми и отключёнными потоками",
    "streams.total": "Всего: {{count}}",
    "streams.running": "Работает: {{count}}",
    "streams.onDashboard":
      "На Dashboard: {{count}}",
    "streams.new": "Новая трансляция",
    "streams.refreshAll": "Обновить всё",
    "streams.search":
      "Поиск по названию, описанию, провайдеру или ID",
    "streams.filter.all": "Все",
    "streams.filter.running": "Работающие",
    "streams.filter.stopped": "Остановленные",
    "streams.filter.dashboard":
      "На Dashboard",
    "streams.filter.hidden": "Скрытые",
    "streams.filter.disabled": "Отключённые",
    "streams.loadError":
      "Не удалось получить список трансляций.",
    "streams.loading": "Загрузка трансляций…",
    "streams.empty":
      "Трансляции по выбранным условиям не найдены.",
    "streams.column.name": "Название",
    "streams.column.status": "Статус",
    "streams.column.diagnostic":
      "Диагностика",
    "streams.column.provider": "Провайдер",
    "streams.column.node": "Узел",
    "streams.column.availability":
      "Доступность",
    "streams.column.actions": "Действия",
    "streams.visibleOnDashboard":
      "Показывается на Dashboard",
    "streams.hiddenFromDashboard":
      "Скрыта с Dashboard",
    "streams.showOnDashboard":
      "Показывать на Dashboard",
    "streams.destination": "Назначение",
    "streams.enabled": "Включена",
    "streams.disabled": "Отключена",
    "streams.details": "Подробнее",
    "streams.edit": "Редактировать",
    "streams.start": "Старт",
    "streams.stop": "Стоп",
    "streams.liveMetrics": "Live-метрики",
    "streams.diagnostic": "Диагностика",
    "streams.onDashboardLabel":
      "На Dashboard",
    "streams.showCard": "Показывать карточку",
    "streams.startStream": "Запустить трансляцию",
    "streams.stopStream": "Остановить трансляцию",

    "sessionLog.empty": "Журнал пуст.",
    "streamPreview.title": "Предпросмотр трансляции",
    "streamPreview.subtitle": "Живое HLS-видео без перекодирования. Полный экран доступен в панели плеера.",
    "streamControl.title": "Управление трансляцией",
    "streamControl.recovering": "The source is unavailable. The supervisor is trying to recover the stream. Click Stop attempts if the broadcast has ended.",
    "streamControl.disabled": "The stream is disabled in settings. An administrator must enable it before it can be started.",
    "selector.manageLibrary": "Управление библиотекой",
    "selector.fromLibrary": "Из библиотеки",
    "selector.manual": "Ввести вручную",
    "sourceSelector.title": "Источник трансляции",
    "sourceSelector.subtitle": "Select a source from the library or enter a temporary URL manually.",
    "sourceSelector.empty": "There are no active sources in the library. Use manual mode.",
    "sourceSelector.saved": "Saved source",
    "sourceSelector.activeOnly": "Only active sources are shown.",
    "sourceSelector.copyNotice": "The current URL is copied into the stream card. Later library changes do not update an existing card.",
    "sourceSelector.manualNotice": "A manually entered URL is used only in this card and is not saved to the library.",
    "destinationSelector.title": "Назначение трансляции",
    "destinationSelector.subtitle": "Select an RTMP destination from the library or enter an address manually.",
    "destinationSelector.empty": "There are no active destinations in the library. Use manual mode.",
    "destinationSelector.saved": "Saved destination",
    "destinationSelector.activeOnly": "Only active destinations are shown.",
    "destinationSelector.copyNotice": "The RTMP address is copied into the stream card. Later library changes do not update an existing stream.",
    "destinationSelector.manualNotice": "A manually entered address is used only in this card and is not saved to the library.",
    "streamForm.saveError": "Unable to save the stream card.",
    "streamForm.nameRequired": "Enter a stream name.",
    "streamForm.sourceRequired": "Enter a source URL.",
    "streamForm.nodeInvalid": "Invalid node ID.",
    "streamForm.destinationRequired": "Enter an RTMP destination.",
    "streamForm.newTitle": "Новая трансляция",
    "streamForm.editTitle": "Настройки трансляции",
    "streamForm.stopBeforeEdit": "Stop the stream before changing its settings.",
    "streamForm.operatorNotice": "An operator may change the source, platform, name, and description. The RTMP destination is read-only.",
    "streamForm.engine": "Source engine",
    "streamForm.engineAuto": "Auto (Streamlink → yt-dlp)",
    "streamForm.engineHelp": "In automatic mode Streamlink is tried first, followed by yt-dlp.",
    "streamForm.showDashboard": "Show on Dashboard",
    "streamForm.nodeId": "Node ID",
    "streamForm.enabled": "Stream enabled",
    "streamForm.autoStart": "Auto-start",
    "streamForm.create": "Create",
    "streamCreate.title": "Создать трансляцию",
    "streamCreate.error": "Unable to create the stream card.",
    "streamEdit.title": "Редактировать трансляцию",
    "streamEdit.loadError": "Unable to load the stream card.",
    "streamEdit.saveError": "Unable to save changes. Stop a running stream first.",
    "streamEdit.deleteError": "Unable to delete the stream. Stop it first.",
    "streamEdit.deleteTitle": "Delete stream?",
    "streamEdit.deleteWarning": "The card and its session history will be deleted. This cannot be undone.",
    "streamDetails.loadError": "Unable to load stream data.",
    "streamDetails.noDescription": "No description",
    "streamDetails.state": "Состояние потока",
    "streamDetails.processAlive": "Process alive",
    "streamDetails.transferred": "Transferred",
    "streamDetails.media": "Видео и аудио",
    "streamDetails.profile": "Profile",
    "streamDetails.audioRate": "Audio rate",
    "streamDetails.channels": "Channels",
    "streamDetails.duplicated": "Duplicated by FFmpeg",
    "streamDetails.route": "Маршрут трансляции",
    "streamDetails.source": "Source",
    "streamDetails.destination": "RTMP destination",
    "streamDetails.sessions": "Последние сессии",
    "streamDetails.sessionsError": "Unable to load session history.",
    "streamDetails.noSessions": "No sessions yet.",
    "streamDetails.started": "Started",
    "streamDetails.ended": "Ended",
    "streamDetails.latestLog": "Latest session log",
    "streamDetails.noLatestSession": "No latest session.",
    "streamDetails.logError": "Unable to load the log.",
    "common.yes": "Да",
    "common.no": "Нет",
    "users.title": "Пользователи",
    "users.subtitle":
      "Смена паролей и завершение пользовательских сеансов",
    "users.backDashboard":
      "На Dashboard",
    "users.loadError":
      "Не удалось загрузить пользователей.",
    "users.column.user":
      "Пользователь",
    "users.column.role":
      "Роль",
    "users.column.status":
      "Состояние",
    "users.column.lastLogin":
      "Последний вход",
    "users.column.actions":
      "Действия",
    "users.active":
      "Активен",
    "users.disabled":
      "Отключён",
    "users.changePassword":
      "Сменить пароль",
    "users.changePasswordFor":
      "Сменить пароль {{username}}",
    "users.changePasswordTitle":
      "Сменить пароль: {{username}}",
    "users.selfPasswordHint":
      "Свой пароль меняется в разделе Аккаунт",
    "users.sessionsWarning":
      "Все активные сеансы пользователя будут завершены.",
    "users.passwordChanged":
      "Пароль пользователя {{username}} изменён. Его активные сеансы завершены.",
    "users.passwordChangeError":
      "Не удалось сменить пароль.",
    "users.cancel":
      "Отмена",
    "users.saving":
      "Сохранение…",

    "account.title":
      "Аккаунт",
    "account.backDashboard":
      "На Dashboard",
    "account.sessionsNotice":
      "После смены пароля все ранее выданные сеансы будут завершены. Потребуется войти заново.",
    "account.changePassword":
      "Изменить пароль",
    "account.changeError":
      "Не удалось изменить пароль.",

    "password.current":
      "Текущий пароль",
    "password.new":
      "Новый пароль",
    "password.confirmNew":
      "Повторите новый пароль",
    "password.minimumLength":
      "Пароль должен содержать не менее 8 символов.",
    "password.minimumLengthHint":
      "Не менее 8 символов",
    "password.mismatch":
      "Пароли не совпадают.",
    "password.newMinimumLength":
      "Новый пароль должен содержать не менее 8 символов.",
    "password.newMismatch":
      "Новые пароли не совпадают.",

    "components.back": "Назад",
    "components.title":
      "Компоненты видеотракта",
    "components.subtitle":
      "Установленные и доступные версии",
    "components.check": "Проверить обновления",
    "components.checking": "Проверка…",
    "components.updateNotice":
      "Страница только проверяет версии. Обновление выполняется администратором в плановое окно, чтобы не прерывать активные трансляции.",
    "components.loadError":
      "Не удалось проверить версии компонентов.",
    "components.status.updateAvailable":
      "Доступно обновление",
    "components.status.checkFailed":
      "Ошибка проверки",
    "components.status.checked": "Проверено",
    "components.status.upToDate":
      "Актуально",
    "components.installed": "Установлено",
    "components.available": "Доступно",
    "components.lastChecked":
      "Проверено",

    "selector.error.http":
      "Backend вернул HTTP {{status}}",
    "selector.error.unavailable":
      "Backend недоступен: {{message}}",
    "sourceSelector.loadError":
      "Не удалось загрузить библиотеку источников.",
    "destinationSelector.loadError":
      "Не удалось загрузить библиотеку назначений.",

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
