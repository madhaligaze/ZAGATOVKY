import * as Accordion from '@radix-ui/react-accordion';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Button } from '@/components/ui/Button';
import { useReveal } from '@/hooks/useReveal';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@tanstack/react-query';
import { api, queryKeys } from '@/lib/api';
import { pick } from '@/lib/format';
import type { HomeSection, Locale, ProductCard as ProductCardData } from '@/types/catalog';

type L = Record<Locale, string>;

const text = (value: unknown, locale: Locale): string =>
  value && typeof value === 'object' && locale in (value as L)
    ? ((value as L)[locale] ?? '')
    : '';

/** Сетка товаров, общая для секций «Наборы» и «Подборка». */
const ProductGrid = ({ products }: { products: ProductCardData[] }) => (
  <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
    {products.map((product) => (
      <ProductCard key={product.id} product={product} className="reveal" />
    ))}
  </div>
);

export const CategoriesSection = ({ section }: { section: HomeSection }) => {
  const { t, locale } = useLocale();
  const ref = useReveal<HTMLElement>();
  const { data } = useQuery({ queryKey: queryKeys.categories, queryFn: api.categories });

  return (
    <section ref={ref} className="band band-snow">
      <div className="container-page">
        <SectionHeading
          title={text(section.payload.title, locale)}
          subtitle={text(section.payload.subtitle, locale)}
          action={
            <Button asChild variant="outline">
              <Link to="/catalog">{t('nav.catalog')}</Link>
            </Button>
          }
        />

        <div className="mt-12 grid gap-px overflow-hidden border border-hairline bg-[color:var(--color-hairline)] sm:grid-cols-2 lg:grid-cols-4">
          {data?.map((category) => (
            <Link
              key={category.id}
              to={`/catalog?category=${category.slug}`}
              className="reveal group flex min-h-56 flex-col justify-between bg-snow p-8 transition-colors hover:bg-parchment"
            >
              <span className="eyebrow text-stone">
                {t('catalog.found_many', { count: category.productCount })}
              </span>
              <div>
                <p className="font-editorial text-heading-sm group-hover:text-teal">
                  {pick(category.name, locale)}
                </p>
                <p className="mt-2 text-body-sm text-stone">{pick(category.description, locale)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export const BundlesSection = ({ section }: { section: HomeSection }) => {
  const { locale } = useLocale();
  const ref = useReveal<HTMLElement>();
  const products = section.products ?? [];

  if (products.length === 0) return null;

  return (
    <section ref={ref} className="band band-parchment">
      <div className="container-page">
        <SectionHeading
          eyebrow={locale === 'kk' ? 'Бір тағамға' : 'Под одно блюдо'}
          title={text(section.payload.title, locale)}
          subtitle={text(section.payload.subtitle, locale)}
        />
        <ProductGrid products={products} />
      </div>
    </section>
  );
};

export const CollectionSection = ({ section }: { section: HomeSection }) => {
  const { t, locale } = useLocale();
  const ref = useReveal<HTMLElement>();
  const products = section.products ?? [];

  if (products.length === 0) return null;

  return (
    <section ref={ref} className="band band-snow">
      <div className="container-page">
        <SectionHeading
          title={text(section.payload.title, locale)}
          subtitle={text(section.payload.subtitle, locale)}
          action={
            <Button asChild variant="outline">
              <Link to="/catalog">{t('common.more')}</Link>
            </Button>
          }
        />
        <ProductGrid products={products} />
      </div>
    </section>
  );
};

export const StepsSection = ({ section }: { section: HomeSection }) => {
  const { locale } = useLocale();
  const ref = useReveal<HTMLElement>();
  const steps = (section.payload.steps ?? []) as { title: L; text: L }[];

  return (
    <section
      ref={ref}
      id={(section.payload.anchor as string) ?? undefined}
      className="band band-mountain scroll-mt-20"
    >
      <div className="container-page">
        <SectionHeading tone="light" title={text(section.payload.title, locale)} />

        <ol className="mt-14 grid gap-px bg-hairline-light sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={index} className="reveal flex flex-col gap-4 bg-mountain p-8">
              <span className="font-editorial text-heading text-honey">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="text-subheading font-semibold">{text(step.title, locale)}</p>
              <p className="text-body-sm text-parchment/60">{text(step.text, locale)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export const EditorialSection = ({ section }: { section: HomeSection }) => {
  const { locale } = useLocale();
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} className="band band-parchment">
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <h2 className="font-editorial reveal text-display leading-[1.05]">
          {text(section.payload.title, locale)}
        </h2>
        <div className="reveal flex flex-col gap-6 self-center border-l border-hairline pl-8">
          <span className="h-px w-12 bg-honey" />
          <p className="text-lead text-mountain/80">{text(section.payload.text, locale)}</p>
        </div>
      </div>
    </section>
  );
};

export const FaqSection = ({ section }: { section: HomeSection }) => {
  const { locale } = useLocale();
  const ref = useReveal<HTMLElement>();
  const items = (section.payload.items ?? []) as { q: L; a: L }[];

  return (
    <section ref={ref} className="band band-snow">
      <div className="container-page max-w-3xl">
        <SectionHeading align="center" title={text(section.payload.title, locale)} />

        <Accordion.Root type="single" collapsible className="reveal mt-12 border-t border-hairline">
          {items.map((item, index) => (
            <Accordion.Item key={index} value={`item-${index}`} className="border-b border-hairline">
              <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-6 text-left text-subheading font-semibold hover:text-teal">
                {text(item.q, locale)}
                <ChevronDown
                  size={20}
                  strokeWidth={1.5}
                  className="shrink-0 text-honey transition-transform duration-300 group-data-[state=open]:rotate-180"
                />
              </Accordion.Trigger>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[acc-up_250ms_ease] data-[state=open]:animate-[acc-down_250ms_ease]">
                <p className="pb-6 pr-10 text-body text-stone">{text(item.a, locale)}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
};
