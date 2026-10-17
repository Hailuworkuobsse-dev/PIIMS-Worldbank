import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { en } from "./en";
import { am } from "./am";

export const defaultNS = "translation";

export const resources = {
  en: { translation: en },
  am: { translation: am },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "am"],
    defaultNS,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "piims.lang",
    },
    // Merge per-namespace JSON into one flat object
    ns: [defaultNS],
    defaultNS,
  });

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

export { i18n };