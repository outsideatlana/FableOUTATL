import { cn } from '@/lib/utils';

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em]',
        className,
      )}
    >
      {children}
    </span>
  );
}
