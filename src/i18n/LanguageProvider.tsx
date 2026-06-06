import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

import { getAppSettings, saveAppSettings } from "../storage/rescueStorage";
import {
  DEFAULT_LANGUAGE,
  getLanguageMeta,
  normalizeLanguage,
  supportedLanguages,
  type AppLanguage
} from "./languages";
import {
  translate,
  type TranslateFn,
  type TranslationKey,
  type TranslationParams
} from "./translations";

type LanguageContextValue = {
  language: AppLanguage;
  languageLabel: string;
  locale: string;
  speechLocale: string;
  supportedLanguages: typeof supportedLanguages;
  isLanguageLoading: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: TranslateFn;
  formatNumber: (value: number) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [isLanguageLoading, setIsLanguageLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getAppSettings()
      .then((settings) => {
        if (!mounted) {
          return;
        }

        setLanguageState(normalizeLanguage(settings.language));
      })
      .finally(() => {
        if (mounted) {
          setIsLanguageLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const meta = getLanguageMeta(language);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    const settings = await getAppSettings();
    await saveAppSettings({
      ...settings,
      language: nextLanguage
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) =>
      translate(language, key, params),
    [language]
  );

  const formatNumber = useCallback(
    (value: number) =>
      Math.max(0, Math.round(value)).toLocaleString(meta.locale),
    [meta.locale]
  );

  const formatDate = useCallback(
    (date: Date, options?: Intl.DateTimeFormatOptions) =>
      date.toLocaleDateString(meta.locale, options),
    [meta.locale]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      languageLabel: meta.nativeLabel,
      locale: meta.locale,
      speechLocale: meta.speechLocale,
      supportedLanguages,
      isLanguageLoading,
      setLanguage,
      t,
      formatNumber,
      formatDate
    }),
    [
      formatDate,
      formatNumber,
      isLanguageLoading,
      language,
      meta.locale,
      meta.nativeLabel,
      meta.speechLocale,
      setLanguage,
      t
    ]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
