import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, queryKeys } from '@/lib/api';
import { HeroSection } from '@/components/home/HeroSection';
import {
  BundlesSection,
  CategoriesSection,
  CollectionSection,
  EditorialSection,
  FaqSection,
  StepsSection,
} from '@/components/home/HomeSections';
import { FeedbackSection } from '@/components/home/FeedbackSection';
import { PageState } from '@/components/ui/PageState';
import { useLocale } from '@/hooks/useLocale';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { useSeo } from '@/hooks/useSeo';
import { storeJsonLd } from '@/lib/jsonld';
import { pick } from '@/lib/format';
import type { HomeSection } from '@/types/catalog';

/**
 * Главная целиком собирается из секций, которыми управляет админка:
 * порядок, видимость и содержимое приходят из API. Здесь только сопоставление
 * «тип секции → компонент».
 */
const renderSection = (section: HomeSection, highlight?: Parameters<typeof HeroSection>[0]['highlight']) => {
  switch (section.kind) {
    case 'HERO':
      return <HeroSection key={section.id} section={section} highlight={highlight} />;
    case 'CATEGORIES':
      return <CategoriesSection key={section.id} section={section} />;
    case 'BUNDLES':
      return <BundlesSection key={section.id} section={section} />;
    case 'COLLECTION':
      return <CollectionSection key={section.id} section={section} />;
    case 'STEPS':
      return <StepsSection key={section.id} section={section} />;
    case 'EDITORIAL':
      return <EditorialSection key={section.id} section={section} />;
    case 'FAQ':
      return <FaqSection key={section.id} section={section} />;
    default:
      // CONTACTS и BANNER живут в подвале — отдельная секция для них не нужна
      return null;
  }
};

export const HomePage = () => {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.home,
    queryFn: api.home,
    staleTime: 5 * 60 * 1000,
  });

  const { data: featured } = useQuery({
    queryKey: queryKeys.products({ featured: true, limit: 1 }),
    queryFn: () => api.products({ featured: true, limit: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  const { locale } = useLocale();
  const { data: settings } = usePublicSettings();

  // Разметка магазина: адрес, телефон и город берутся из настроек кабинета,
  // поэтому в выдаче не разойдутся с тем, что написано в подвале
  useSeo({
    title: 'ZAGATOVKY — заготовки для дома и заведений, доставка по Алматы',
    description: settings
      ? pick(settings.brand.tagline, locale)
      : 'Нарезанные, взвешенные и упакованные заготовки для готовки. Алматы, доставка в день нарезки.',
    path: '/',
    jsonLd: storeJsonLd(settings, locale, window.location.origin),
  });

  if (isPending || isError) {
    return <PageState isError={isError} onRetry={() => void refetch()} />;
  }

  // Приглашение написать нам ставим прямо перед «Частыми вопросами»: если человек
  // дочитал до вопросов и своего там не нашёл, задать его можно тут же.
  // Блока FAQ на главной может и не быть — тогда приглашение идёт последним.
  const faqIndex = data.sections.findIndex((section) => section.kind === 'FAQ');

  return (
    <>
      {data.sections.map((section, index) => (
        <Fragment key={section.id}>
          {index === faqIndex && <FeedbackSection />}
          {renderSection(section, featured?.items[0])}
        </Fragment>
      ))}
      {faqIndex === -1 && <FeedbackSection />}
    </>
  );
};
