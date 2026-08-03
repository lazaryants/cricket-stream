import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  translations,
  type Language,
  type TranslationKey,
} from "./translations";

interface I18nContextValue {
  language: Language;
  setLanguage: (
    language: Language,
  ) => void;
  t: (
    key: TranslationKey,
    values?: Record<
      string,
      string | number
    >,
  ) => string;
}

export const I18nContext =
  createContext<I18nContextValue | null>(
    null,
  );

interface I18nProviderProps {
  children: ReactNode;
}

function readStoredLanguage():
  Language {
  const storedLanguage =
    window.localStorage.getItem(
      LANGUAGE_STORAGE_KEY,
    );

  if (
    storedLanguage === "en"
    || storedLanguage === "ru"
  ) {
    return storedLanguage;
  }

  return DEFAULT_LANGUAGE;
}

export function I18nProvider({
  children,
}: I18nProviderProps) {
  const [
    language,
    setLanguage,
  ] = useState<Language>(
    readStoredLanguage,
  );

  useEffect(() => {
    window.localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      language,
    );

    document.documentElement.lang =
      language;
  }, [
    language,
  ]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (
        key: TranslationKey,
        values: Record<
          string,
          string | number
        > = {},
      ) => {
        let result: string =
          translations[language][key];

        for (
          const [
            name,
            replacement,
          ] of Object.entries(values)
        ) {
          result = result.replaceAll(
            `{{${name}}}`,
            String(replacement),
          );
        }

        return result;
      },
    }),
    [
      language,
    ],
  );

  return (
    <I18nContext.Provider
      value={value}
    >
      {children}
    </I18nContext.Provider>
  );
}
