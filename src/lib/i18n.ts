import { createInstance } from "i18next";
import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

export const LANGUAGE_STORAGE_KEY = "learning-tracker-language";
export type Language = "en" | "vi";

// Create an isolated instance for each rendered app. SSR and initial hydration
// both start in English; a saved browser preference is restored after mount.
export function createAppI18n() {
  const instance = createInstance();
  void instance.init({
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "vi"],
    resources: { en: { translation: en }, vi: { translation: vi } },
    initAsync: false,
    keySeparator: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}

// Static route metadata uses the default language, without mutable global state.
export const defaultT = createAppI18n().getFixedT("en");
