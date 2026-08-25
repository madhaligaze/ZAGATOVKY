import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Кнопки системы: pill-радиус 80px, без теней, состояния — сменой цвета и бордера.
 * Золото здесь намеренно отсутствует: по дизайн-системе оно не бывает заливкой CTA.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40 whitespace-nowrap select-none',
  {
    variants: {
      variant: {
        /** Основное действие на светлых полосах */
        solid: 'bg-mountain text-parchment hover:bg-teal',
        /** Контурное действие — базовый вид системы */
        outline:
          'border border-teal/40 text-mountain hover:border-teal hover:bg-mountain hover:text-parchment',
        /** То же, но на тёмной полосе */
        ghostLight:
          'border border-hairline-light text-parchment hover:bg-parchment hover:text-mountain',
        /** Основное действие на тёмной полосе */
        solidLight: 'bg-parchment text-mountain hover:bg-snow',
        /** Текстовая ссылка-действие */
        quiet: 'text-mountain underline-offset-4 hover:underline hover:text-teal',
      },
      size: {
        sm: 'h-10 px-5 text-caption tracking-[0.125em] uppercase',
        md: 'h-11 px-6 text-body-sm tracking-[0.08em] uppercase',
        lg: 'h-14 px-8 text-body-sm tracking-[0.125em] uppercase',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
