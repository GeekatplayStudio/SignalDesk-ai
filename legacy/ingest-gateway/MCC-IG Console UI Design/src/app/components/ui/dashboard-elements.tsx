import React from 'react';
import { cn } from './index';

export const CodeBlock = ({
  code,
  language = 'json',
  className,
}: {
  code: string;
  language?: string;
  className?: string;
}) => {
  return (
    <pre className={cn('p-4 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto font-mono text-sm leading-relaxed', className)}>
      <code className="text-cyan-400">
        {code}
      </code>
    </pre>
  );
};

export const KPIBox = ({
  title,
  value,
  trend,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  icon?: any;
  variant?: 'default' | 'error' | 'warning' | 'success' | 'info';
}) => {
  const colors = {
    default: 'text-slate-50',
    error: 'text-destructive',
    warning: 'text-warning',
    success: 'text-success',
    info: 'text-primary',
  };

  return (
    <div className="p-5 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className={cn('text-2xl font-bold', colors[variant])}>{value}</span>
          {trend && (
            <span className={cn('ml-2 text-xs font-medium', trend.positive ? 'text-success' : 'text-destructive')}>
              {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
