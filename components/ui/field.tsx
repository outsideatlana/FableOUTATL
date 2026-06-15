import * as React from 'react';
import { cn } from '@/lib/utils';

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <label htmlFor={htmlFor} className="field-label">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('field-input', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('field-input resize-y', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn('field-input cursor-pointer', className)} {...props} />
));
Select.displayName = 'Select';
