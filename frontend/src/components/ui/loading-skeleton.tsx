'use client';

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function LoadingSkeleton({ className, variant = 'rectangular' }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rectangular' && 'rounded-md',
        className
      )}
    />
  );
}

export function ProdutoCardSkeleton() {
  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-sm">
      <LoadingSkeleton className="w-full aspect-[4/3]" />
      <div className="p-3 space-y-2">
        <LoadingSkeleton className="h-4 w-3/4" />
        <LoadingSkeleton className="h-3 w-full" />
        <LoadingSkeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function MesaCardSkeleton() {
  return (
    <div className="aspect-square rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-2">
      <LoadingSkeleton variant="circular" className="w-8 h-8" />
      <LoadingSkeleton className="h-6 w-12" />
      <LoadingSkeleton className="h-3 w-16" />
    </div>
  );
}
