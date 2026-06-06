export const DEFAULT_LANGUAGE = "en";

export const supportedLanguages = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    locale: "en-US",
    speechLocale: "en-US"
  },
  {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    locale: "fr-FR",
    speechLocale: "fr-FR"
  },
  {
    code: "de",
    label: "German",
    nativeLabel: "Deutsch",
    locale: "de-DE",
    speechLocale: "de-DE"
  },
  {
    code: "ja",
    label: "Japanese",
    nativeLabel: "日本語",
    locale: "ja-JP",
    speechLocale: "ja-JP"
  },
  {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    locale: "es-ES",
    speechLocale: "es-ES"
  },
  {
    code: "ko",
    label: "Korean",
    nativeLabel: "한국어",
    locale: "ko-KR",
    speechLocale: "ko-KR"
  }
] as const;

export type AppLanguage = (typeof supportedLanguages)[number]["code"];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return (
    typeof value === "string" &&
    supportedLanguages.some((language) => language.code === value)
  );
}

export function normalizeLanguage(value: unknown): AppLanguage {
  return isAppLanguage(value) ? value : DEFAULT_LANGUAGE;
}

export function getLanguageMeta(language: AppLanguage) {
  return (
    supportedLanguages.find((option) => option.code === language) ??
    supportedLanguages[0]
  );
}
