import type { Locale, ProductDetail, PublicSettings } from '@/types/catalog';
import { pick } from './format';

/**
 * Разметка Schema.org.
 *
 * Нужна ради того, что видно прямо в выдаче: у товара — цена и наличие, у сайта —
 * адрес, телефон и часы работы. Всё берётся из тех же данных, что уже на странице,
 * поэтому разойтись с ней разметка не может.
 */

const BRAND = 'ZAGATOVKY';

/** Единицы измерения в кодах UN/CEFACT — так их понимает Schema.org */
const UNIT_CODES: Record<string, string> = {
  G: 'GRM',
  ML: 'MLT',
  PCS: 'H87',
  PORTION: 'H87',
};

export const productJsonLd = (
  product: ProductDetail,
  locale: Locale,
  origin: string,
): unknown => {
  const url = `${origin}/product/${product.slug}`;
  const images = product.images.map((item) => item.url).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${url}#product`,
        name: pick(product.name, locale),
        description: pick(product.description, locale) || pick(product.short, locale) || undefined,
        // Пустой массив вместо картинок хуже отсутствия поля: валидатор считает
        // его ошибкой, а не «фото пока нет»
        image: images.length > 0 ? images : undefined,
        sku: product.slug,
        category: product.category ? pick(product.category.name, locale) : undefined,
        brand: { '@type': 'Brand', name: BRAND },
        weight: {
          '@type': 'QuantitativeValue',
          value: product.weight.value,
          unitCode: UNIT_CODES[product.weight.unit] ?? 'GRM',
        },
        offers: {
          '@type': 'Offer',
          url,
          price: product.price,
          priceCurrency: 'KZT',
          availability:
            product.stockStatus === 'OUT'
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
          seller: { '@type': 'Organization', name: BRAND },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: BRAND, item: origin },
          {
            '@type': 'ListItem',
            position: 2,
            name: locale === 'kk' ? 'Каталог' : 'Каталог',
            item: `${origin}/catalog`,
          },
          { '@type': 'ListItem', position: 3, name: pick(product.name, locale), item: url },
        ],
      },
    ],
  };
};

export const storeJsonLd = (
  settings: PublicSettings | undefined,
  locale: Locale,
  origin: string,
): unknown => {
  const contacts = settings?.contacts;

  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${origin}#store`,
    name: settings?.brand.name ?? BRAND,
    description: settings ? pick(settings.brand.tagline, locale) : undefined,
    url: origin,
    image: `${origin}/og-cover.png`,
    telephone: contacts?.phone || undefined,
    email: contacts?.email || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: contacts ? pick(contacts.address, locale) : 'Алматы',
      addressCountry: 'KZ',
    },
    areaServed: { '@type': 'City', name: 'Алматы' },
    currenciesAccepted: 'KZT',
    // Разброс цен по каталогу — Google показывает его значком в выдаче
    priceRange: '₸₸',
  };
};
