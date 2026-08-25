import { cn } from '@/lib/cn';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
  action?: React.ReactNode;
};

/** Шапка секции: золотая засечка, надзаголовок капсом, serif-заголовок. */
export const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  tone = 'dark',
  className,
  action,
}: Props) => (
  <div
    className={cn(
      'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
      align === 'center' && 'md:flex-col md:items-center md:text-center',
      className,
    )}
  >
    <div className={cn('max-w-2xl', align === 'center' && 'text-center')}>
      {eyebrow && (
        <p
          className={cn(
            'eyebrow reveal',
            align === 'left' && 'gold-rule',
            tone === 'light' ? 'text-parchment/60' : 'text-stone',
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className="font-editorial reveal mt-4 text-heading-lg">{title}</h2>
      {subtitle && (
        <p
          className={cn(
            'reveal mt-4 text-lead',
            tone === 'light' ? 'text-parchment/70' : 'text-stone',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
    {action && <div className="reveal shrink-0">{action}</div>}
  </div>
);
