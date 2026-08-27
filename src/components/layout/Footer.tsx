import { Link } from 'react-router-dom';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { useLocale } from '@/hooks/useLocale';
import { Button } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/LogoMark';
import { pick } from '@/lib/format';
import { formatKzPhone } from '@/lib/phone';

export const Footer = () => {
  const { t, locale } = useLocale();
  const { data: settings } = usePublicSettings();

  const contacts = settings?.contacts;
  const whatsappUrl = contacts ? `https://wa.me/${contacts.whatsapp.replace(/\D/g, '')}` : '#';

  return (
    <footer id="contacts" className="band band-mountain">
      <div className="container-page">
        {/* Четыре колонки только с lg: на 768 px они дают строку в 779 px
            и уводят всю страницу вбок. */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr]">
          <div>
            {/* Тот же знак, что и в шапке. Цвет наследуется от текста, поэтому
                на тёмной полосе он светлый — отдельная версия файла не нужна. */}
            <div className="flex items-center gap-3">
              <LogoMark className="h-10 w-10" />
              <p className="font-editorial text-heading-lg leading-tight">ZAGATOVKY</p>
            </div>
            <p className="mt-4 max-w-sm text-body text-parchment/70">
              {settings ? pick(settings.brand.tagline, locale) : t('footer.rights')}
            </p>
            <Button asChild variant="ghostLight" className="mt-8">
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                {t('footer.written')}
              </a>
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <p className="eyebrow text-honey">{t('nav.contacts')}</p>
            {contacts && (
              <>
                <a href={`tel:${contacts.phone.replace(/\s/g, '')}`} className="hover:text-honey">
                  {/* В настройках номер лежит сплошными цифрами. Одиннадцать цифр
                      подряд нечитаемы и их невозможно продиктовать — показываем
                      тем же форматтером, что и оформление заказа. */}
                  {formatKzPhone(contacts.phone.replace(/\D/g, '').replace(/^7/, '')) ||
                    contacts.phone}
                </a>
                {/* Без проверки пустая почта давала <a href="mailto:"> размером
                    320×0 без доступного имени — ссылку без текста, на которую
                    встаёт клавиатура. */}
                {contacts.email && (
                  <a href={`mailto:${contacts.email}`} className="hover:text-honey">
                    {contacts.email}
                  </a>
                )}
                <a
                  href={`https://instagram.com/${contacts.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-honey"
                >
                  Instagram
                </a>
                <a
                  href={`https://t.me/${contacts.telegram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-honey"
                >
                  Telegram
                </a>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <p className="eyebrow text-honey">{t('nav.delivery')}</p>
            {contacts && <p className="text-parchment/70">{pick(contacts.address, locale)}</p>}
            {contacts && (
              <p className="text-parchment/70">{pick(contacts.workingHours, locale)}</p>
            )}
            {settings && (
              <p className="mt-2 max-w-xs text-body-sm text-parchment/65">
                {pick(settings.delivery.note, locale)}
              </p>
            )}
          </div>

          {/* Ссылка на каталог висела в конце колонки «Доставка», под абзацем
              про зоны, — навигация в логистике. Своя колонка. */}
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-honey">{t('footer.nav')}</p>
            <Link to="/catalog" className="hover:text-honey">
              {t('nav.catalog')}
            </Link>
            <Link to="/catalog?type=BUNDLE" className="hover:text-honey">
              {t('nav.bundles')}
            </Link>
            <Link to="/#steps" className="hover:text-honey">
              {t('nav.how')}
            </Link>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-hairline-light pt-6 text-caption uppercase tracking-[0.125em] text-parchment/65 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} ZAGATOVKY</span>
          <span>{t('footer.rights')}</span>
        </div>
      </div>
    </footer>
  );
};
