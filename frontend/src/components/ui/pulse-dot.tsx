'use client';

import { cn } from '@/lib/utils';

interface PulseDotProps {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  success: 'bg-green-500',
  warning: 'bg-orange-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
};

const sizeStyles = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function PulseDot({ 
  variant = 'info', 
  size = 'md',
  className 
}: PulseDotProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <span
        className={cn(
          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
          variantStyles[variant]
        )}
      />
      <span
        className={cn(
          'relative inline-flex rounded-full',
          variantStyles[variant],
          sizeStyles[size]
        )}
      />
    </span>
  );
}
