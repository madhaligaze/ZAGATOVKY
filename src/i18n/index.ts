import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ru } from './ru';
import { kk } from './kk';
import type { Locale } from '@/types/catalog';

const STORAGE_KEY = 'zagatovky:locale';

const detectLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ru' || stored === 'kk') return stored;
  } catch {
    // приватный режим или заблокированное хранилище — просто берём русский
  }
  return navigator.language?.toLowerCase().startsWith('kk') ? 'kk' : 'ru';
};

void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    kk: { translation: kk },
  },
  lng: detectLocale(),
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export const setLocale = (locale: Locale) => {
  void i18n.changeLanguage(locale);
  document.documentElement.lang = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // не критично: язык просто не запомнится между сессиями
  }
};

document.documentElement.lang = i18n.language;

export default i18n;
