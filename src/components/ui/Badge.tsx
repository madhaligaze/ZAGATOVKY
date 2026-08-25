import { cn } from '@/lib/cn';
import type { Badge as BadgeData } from '@/types/catalog';

/**
 * Бейджи товара — pill-радиус, только контур или мягкая заливка.
 * Золотой тон зарезервирован за самыми «продающими» отметками («Хит», «Свежий срез»).
 */
const toneClasses: Record<BadgeData['tone'], string> = {
  GOLD: 'border-honey bg-honey/25 text-mountain',
  TEAL: 'border-teal/35 text-teal',
  STONE: 'border-stone-light text-stone',
};

type Props = {
  tone?: BadgeData['tone'];
  className?: string;
  children: React.ReactNode;
};

export const Badge = ({ tone = 'TEAL', className, children }: Props) => (
  <span
    className={cn(
      'inline-flex items-center rounded-pill border px-3 py-1 text-caption font-semibold uppercase',
      toneClasses[tone],
      className,
    )}
  >
    {children}
  </span>
);
