'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export type MetricStatus = 'success' | 'warning' | 'danger' | 'neutral';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  status?: MetricStatus;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  href?: string;
}

const statusStyles: Record<MetricStatus, string> = {
  success: 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
  warning: 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20',
  danger: 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20',
  neutral: 'border-gray-200 dark:border-gray-800',
};

const iconStyles: Record<MetricStatus, string> = {
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-orange-600 dark:text-orange-400',
  danger: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-600 dark:text-gray-400',
};

const trendStyles = {
  positive: 'text-green-600 dark:text-green-400',
  negative: 'text-red-600 dark:text-red-400',
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  status = 'neutral',
  trend,
  className,
  href,
}: MetricCardProps) {
  const trendIsPositive = trend && trend.value > 0;

  const cardContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-5 w-5', iconStyles[status])} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={cn('text-xs font-medium mt-2', trendIsPositive ? trendStyles.positive : trendStyles.negative)}>
            {trendIsPositive ? '↗' : '↘'} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className={cn('border-2 transition-all hover:shadow-lg cursor-pointer', statusStyles[status], className)}>
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cn('border-2 transition-all hover:shadow-md', statusStyles[status], className)}>
      {cardContent}
    </Card>
  );
}
