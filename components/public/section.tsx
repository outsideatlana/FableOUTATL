import { cn } from '@/lib/utils';

export function Section({
  id,
  eyebrow,
  title,
  action,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('mx-auto max-w-7xl px-5 py-16 md:py-24', className)}>
      {(eyebrow || title || action) && (
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            {eyebrow && <p className="mono-label">{eyebrow}</p>}
            {title && (
              <h2 className="mt-2 font-display text-4xl uppercase tracking-tight md:text-5xl">
                {title}
              </h2>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
