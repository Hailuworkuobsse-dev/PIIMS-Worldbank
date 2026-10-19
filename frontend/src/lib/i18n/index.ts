import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { en } from "./en";
import { am } from "./am";

export const defaultNS = "common";
export const resources = {
  en: { common: en },
  am: { common: am },
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
  });

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

export { i18n };
