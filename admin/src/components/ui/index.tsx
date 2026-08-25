import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
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

const fieldClass =
  'w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldClass, className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldClass, 'resize-y', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClass, 'cursor-pointer', className)} {...props}>
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
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) => (
  <label className={cn('flex flex-col gap-1.5', className)}>
    <span className="label-caps">{label}</span>
    {children}
    {error ? (
      <span className="text-2xs text-danger">{error}</span>
    ) : hint ? (
      <span className="text-2xs text-faint">{hint}</span>
    ) : null}
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

export const Spinner = ({ label = 'Загружаем…' }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-2xs uppercase tracking-[0.08em] text-muted">
    <span className="h-3 w-3 animate-spin rounded-full border border-line-strong border-t-accent" />
    {label}
  </div>
);
