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
