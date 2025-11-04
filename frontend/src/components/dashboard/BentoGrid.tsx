'use client';

import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid auto-rows-min gap-4',
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  span?: {
    mobile?: 1;
    tablet?: 1 | 2;
    desktop?: 1 | 2 | 3 | 4;
  };
}

export function BentoGridItem({ children, className, span }: BentoGridItemProps) {
  const spanClasses = cn(
    span?.mobile === 1 && 'col-span-1',
    span?.tablet === 2 && 'sm:col-span-2',
    span?.desktop === 2 && 'lg:col-span-2',
    span?.desktop === 3 && 'lg:col-span-3',
    span?.desktop === 4 && 'lg:col-span-4'
  );

  return (
    <div className={cn(spanClasses, className)}>
      {children}
    </div>
  );
}
