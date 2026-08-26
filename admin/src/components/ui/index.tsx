import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  forwardRef,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

/* ─── Кнопка ──────────────────────────────────────────────────────────────── */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 whitespace-nowrap',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-ink hover:opacity-90',
        outline: 'border border-line-strong text-ink hover:bg-raised',
        ghost: 'text-muted hover:bg-raised hover:text-ink',
        danger: 'border border-danger/40 text-danger hover:bg-danger/10',
        subtle: 'bg-raised text-ink hover:bg-line',
      },
      size: {
        sm: 'h-8 px-3 text-2xs uppercase tracking-[0.06em]',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-sm',
        icon: 'h-9 w-9 p-0',
        iconSm: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    return (
      <Component ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = 'Button';

/* ─── Поля ────────────────────────────────────────────────────────────────── */

// Единая высота у input и select: у нативного select своя внутренняя метрика,
// и без явной высоты соседние поля в строке различаются на пиксель.
const fieldClass =
  'w-full rounded-control border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent disabled:opacity-50';
const controlHeight = 'h-9 py-0';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldClass, controlHeight, className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldClass, 'resize-y py-2', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClass, controlHeight, 'cursor-pointer', className)} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

export const Field = ({
  label,
  hint,
  error,
  children,
  className,
  /** Отключает резерв места под подсказку — для форм, где поля идут в столбик */
  compact,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) => (
  <label className={cn('flex flex-col gap-1.5', className)}>
    <span className="label-caps">{label}</span>
    {children}

    {/*
      Строка подсказки существует всегда, даже пустая. Иначе поле с подсказкой
      выше соседних, и в строке с выравниванием по низу оно уезжает вверх —
      форма выглядит съехавшей.
    */}
    {!compact && (
      <span
        className={cn('min-h-4 text-2xs leading-4', error ? 'text-danger' : 'text-faint')}
        aria-live={error ? 'polite' : undefined}
      >
        {error ?? hint ?? ''}
      </span>
    )}

    {compact && (error || hint) && (
      <span className={cn('text-2xs leading-4', error ? 'text-danger' : 'text-faint')}>
        {error ?? hint}
      </span>
    )}
  </label>
);

/* ─── Прочее ──────────────────────────────────────────────────────────────── */

export const Panel = ({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) => (
  <section className={cn('panel flex flex-col overflow-hidden', className)}>
    {(title || action) && (
      <header className="flex items-center justify-between gap-3 border-b border-line px-[var(--pad-panel)] py-3">
        {typeof title === 'string' ? <h2 className="label-caps">{title}</h2> : title}
        {action}
      </header>
    )}
    <div className={cn('p-[var(--pad-panel)]', bodyClassName)}>{children}</div>
  </section>
);

const chipTones = {
  neutral: 'border-line-strong text-muted',
  accent: 'border-accent bg-accent-soft text-ink',
  success: 'border-success/40 bg-success/10 text-success',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  danger: 'border-danger/40 bg-danger/10 text-danger',
};

export const Chip = ({
  tone = 'neutral',
  children,
  className,
  ...rest
}: {
  tone?: keyof typeof chipTones;
  children: ReactNode;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLSpanElement>, 'children' | 'className'>) => (
  <span
    {...rest}
    className={cn(
      'inline-flex items-center gap-1 rounded-control border px-2 py-0.5 text-2xs font-semibold uppercase tracking-[0.05em]',
      chipTones[tone],
      className,
    )}
  >
    {children}
  </span>
);

const calloutTones = {
  info: 'border-line bg-raised text-muted',
  accent: 'border-accent/40 bg-accent-soft text-ink',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  danger: 'border-danger/40 bg-danger/10 text-danger',
};

/**
 * Пояснение рядом с полем или блоком: что это влияет на витрине и как заполнять.
 * Задача — чтобы владелец не гадал, а видел ответ прямо на месте.
 */
export const Callout = ({
  tone = 'info',
  icon,
  title,
  children,
  className,
}: {
  tone?: keyof typeof calloutTones;
  icon?: ReactNode;
  title?: string;
  children?: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'flex items-start gap-2 rounded-control border px-3 py-2.5 text-2xs leading-relaxed',
      calloutTones[tone],
      className,
    )}
  >
    {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
    <div className="min-w-0">
      {title && <p className="mb-0.5 font-semibold">{title}</p>}
      {children}
    </div>
  </div>
);

export const EmptyState = ({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <span className="h-px w-8 bg-accent" />
    <p className="text-sm font-semibold">{title}</p>
    {hint && <p className="max-w-sm text-2xs text-muted">{hint}</p>}
    {action}
  </div>
);

/**
 * Кнопка сохранения, которая показывает, что происходит.
 *
 * Обычная кнопка + всплывающая плашка внизу экрана читались плохо: нажатие
 * не давало никакого отклика в том месте, куда человек смотрит. Здесь состояние
 * видно прямо на кнопке — «нечего сохранять», «сохраняем», «сохранено», —
 * и переход в последнее сопровождается коротким движением.
 *
 * Состояние «сохранено» держится пару секунд и само уходит: постоянная зелёная
 * кнопка перестала бы что-либо значить.
 */
export const SaveButton = ({
  isPending,
  isSuccess,
  dirty = true,
  label = 'Сохранить',
  savedLabel = 'Сохранено',
  cleanLabel = 'Всё сохранено',
  onClick,
  size = 'sm',
  className,
  ...rest
}: {
  isPending: boolean;
  isSuccess: boolean;
  /** Есть ли что сохранять. Пока правок нет, кнопка не зовёт нажимать. */
  dirty?: boolean;
  label?: string;
  savedLabel?: string;
  cleanLabel?: string;
  onClick: () => void;
  size?: ButtonProps['size'];
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'className'>) => {
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!isSuccess) return;
    setJustSaved(true);
    const timer = window.setTimeout(() => setJustSaved(false), 2200);
    return () => window.clearTimeout(timer);
  }, [isSuccess]);

  const state = isPending ? 'pending' : justSaved ? 'saved' : dirty ? 'dirty' : 'clean';

  return (
    <Button
      {...rest}
      size={size}
      variant={state === 'dirty' ? 'primary' : 'outline'}
      disabled={state !== 'dirty'}
      aria-live="polite"
      data-state={state}
      onClick={onClick}
      className={cn(
        'min-w-32 transition-colors',
        state === 'saved' &&
          'border-success/50 bg-success/10 text-success opacity-100 [animation:save-pop_420ms_cubic-bezier(0.34,1.56,0.64,1)]',
        state === 'clean' && 'opacity-60',
        className,
      )}
    >
      {state === 'pending' && (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent"
        />
      )}
      {state === 'saved' && (
        <Check
          size={14}
          strokeWidth={2.5}
          className="[animation:save-check_360ms_cubic-bezier(0.34,1.56,0.64,1)]"
        />
      )}

      {state === 'pending' ? 'Сохраняем…' : state === 'saved' ? savedLabel : state === 'clean' ? cleanLabel : label}
    </Button>
  );
};

export const Spinner = ({ label = 'Загружаем…' }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-2xs uppercase tracking-[0.08em] text-muted">
    <span className="h-3 w-3 animate-spin rounded-full border border-line-strong border-t-accent" />
    {label}
  </div>
);
