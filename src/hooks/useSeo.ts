import { useEffect } from 'react';

/**
 * Мета-теги страницы: заголовок, описание, canonical, карточка для мессенджеров
 * и разметка Schema.org.
 *
 * Своя реализация вместо библиотеки — здесь ровно один эффект на несколько тегов,
 * а react-helmet тянет за собой контекст, провайдер и полкилобайта на то же самое.
 *
 * Все теги, которые мы ставим, помечаются data-seo. При уходе со страницы удаляем
 * именно их: то, что прописано в index.html руками, трогать нельзя, иначе после
 * первой же навигации из головы пропали бы базовые описания сайта.
 */

const MANAGED = 'data-seo';

type MetaKind = 'name' | 'property';

const upsert = (kind: MetaKind, key: string, content: string | null | undefined) => {
  const selector = `meta[${kind}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);

  if (!content) {
    // Пустое значение не должно оставлять тег с прошлой страницы
    if (existing?.hasAttribute(MANAGED)) existing.remove();
    return;
  }

  const tag = existing ?? document.createElement('meta');
  tag.setAttribute(kind, key);
  tag.setAttribute('content', content);
  if (!existing) {
    tag.setAttribute(MANAGED, '');
    document.head.append(tag);
  }
};

const setCanonical = (href: string) => {
  const tag =
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') ??
    document.createElement('link');
  tag.rel = 'canonical';
  tag.href = href;
  if (!tag.isConnected) document.head.append(tag);
};

const setJsonLd = (data: unknown) => {
  document.head.querySelectorAll(`script[type="application/ld+json"][${MANAGED}]`).forEach((node) => node.remove());
  if (!data) return;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute(MANAGED, '');
  script.textContent = JSON.stringify(data);
  document.head.append(script);
};

export type SeoInput = {
  title: string;
  description?: string | null;
  /** Путь без домена, например /product/svekla. Query отбрасываем осознанно. */
  path: string;
  image?: string | null;
  type?: 'website' | 'product' | 'article';
  /** Разметка Schema.org для этой страницы */
  jsonLd?: unknown;
  /** Страницы воронки и служебные из индекса убираем */
  noindex?: boolean;
};

export const useSeo = ({
  title,
  description,
  path,
  image,
  type = 'website',
  jsonLd,
  noindex = false,
}: SeoInput) => {
  useEffect(() => {
    const origin = window.location.origin;
    const url = `${origin}${path}`;
    const cover = image ?? `${origin}/og-cover.png`;

    document.title = title;
    setCanonical(url);

    upsert('name', 'description', description);
    upsert('name', 'robots', noindex ? 'noindex, follow' : null);

    upsert('property', 'og:title', title);
    upsert('property', 'og:description', description);
    upsert('property', 'og:url', url);
    upsert('property', 'og:type', type);
    upsert('property', 'og:image', cover);

    upsert('name', 'twitter:title', title);
    upsert('name', 'twitter:description', description);
    upsert('name', 'twitter:image', cover);

    setJsonLd(jsonLd);
  }, [title, description, path, image, type, jsonLd, noindex]);
};
