import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'accent' | 'hot' | 'outline' | 'ghost';
type Size = 'md' | 'sm';

const VARIANTS: Record<Variant, string> = {
  accent: 'bg-electric text-white hover:bg-electric-700',
  hot: 'bg-hot text-white hover:bg-hot-700',
  outline: 'border border-line text-white hover:border-white',
  ghost: 'text-muted hover:text-white',
};

const SIZES: Record<Size, string> = {
  md: 'px-6 py-3 text-sm',
  sm: 'px-4 py-2 text-xs',
};

export function buttonClasses(variant: Variant = 'accent', size: Size = 'md'): string {
  return cn(
    'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-[0.15em] font-semibold',
    'transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'accent', size = 'md', ...props }, ref) => (
    <button ref={ref} className={cn(buttonClasses(variant, size), className)} {...props} />
  ),
);
Button.displayName = 'Button';
