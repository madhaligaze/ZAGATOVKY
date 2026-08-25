import { useTranslation } from 'react-i18next';
import { setLocale } from '@/i18n';
import type { Locale } from '@/types/catalog';

/**
 * Тонкая обёртка над i18next: отдаёт текущий язык уже сузенным до 'ru' | 'kk',
 * чтобы им можно было напрямую индексировать двуязычные поля из API.
 */
export const useLocale = () => {
  const { t, i18n } = useTranslation();
  const locale: Locale = i18n.language === 'kk' ? 'kk' : 'ru';

  return {
    t,
    locale,
    setLocale,
    toggle: () => setLocale(locale === 'ru' ? 'kk' : 'ru'),
  };
};
