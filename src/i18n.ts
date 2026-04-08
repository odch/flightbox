import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './locales/de.json';
import en from './locales/en.json';

export const detectLanguage = (): string => {
  const stored = localStorage.getItem('flightbox_language');
  if (stored) return stored;
  const browserLang = navigator.language || '';
  return browserLang.startsWith('en') ? 'en' : 'de';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: {
        translation: de,
      },
      en: {
        translation: en,
      },
    },
    lng: detectLanguage(),
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
