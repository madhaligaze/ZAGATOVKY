import { forwardRef, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { pick } from '@/lib/format';
import { useLocale } from '@/hooks/useLocale';
import type { Localized, LocalizedNullable } from '@/types/catalog';

type ImageData = {
  url: string;
  width: number;
  height: number;
  lqip: string | null;
  alt: LocalizedNullable;
} | null;

type Props = {
  image: ImageData;
  name: string;
  className?: string;
  imageClassName?: string;
  /** Заглушка крупнее на детальной странице — монограмма масштабируется */
  size?: 'card' | 'detail';
};

/**
 * Фото товара или его отсутствие.
 *
 * Пока владелец не залил снимки, каталог всё равно должен выглядеть законченным,
 * а не «сломанным». Поэтому заглушка — не серый прямоугольник с иконкой, а полноценный
 * элемент системы: пергаментная поверхность, золотая засечка и первая буква названия
 * дисплейным serif'ом. Как только фото появится, элемент заменится без изменений вёрстки.
 */
export const ProductMedia = forwardRef<HTMLDivElement, Props>(
  ({ image, name, className, imageClassName, size = 'card' }, ref) => {
    const { locale } = useLocale();
    /*
     * Ссылка на фото может быть живой в базе и мёртвой в хранилище: так уже
     * случилось — товар ссылался на файл, которого в R2 нет, и вместо снимка
     * оставался пустой прямоугольник. Заглушка ниже нарисована именно на этот
     * случай, поэтому при ошибке загрузки честно откатываемся к ней.
     */
    const [broken, setBroken] = useState(false);
    useEffect(() => setBroken(false), [image?.url]);

    if (image && !broken) {
      return (
        <div ref={ref} className={cn('overflow-hidden bg-parchment', className)}>
          <img
            src={image.url}
            alt={pick(image.alt, locale) || name}
            width={image.width}
            height={image.height}
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            style={
              image.lqip
                ? { backgroundImage: `url(${image.lqip})`, backgroundSize: 'cover' }
                : undefined
            }
            className={cn(
              'h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
              imageClassName,
            )}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        aria-hidden
        className={cn(
          'relative flex items-center justify-center overflow-hidden bg-parchment',
          className,
        )}
      >
        {/* Диагональная штриховка тем же тилом — фактура «крафтовой бумаги» */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, var(--color-mountain) 0 1px, transparent 1px 9px)',
          }}
        />
        <span
          className={cn(
            'font-editorial relative text-mountain/25 leading-none',
            size === 'detail' ? 'text-[9rem]' : 'text-[4.5rem]',
          )}
        >
          {name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="absolute bottom-4 left-1/2 h-px w-8 -translate-x-1/2 bg-honey" />
      </div>
    );
  },
);

ProductMedia.displayName = 'ProductMedia';

export type { Localized };
