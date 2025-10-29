'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${iconBgColor}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.startsWith('+') || trend.startsWith('↑') ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
