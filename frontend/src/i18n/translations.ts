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
