import React from 'react';
import { OrderStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'espresso' | 'green' | 'amber' | 'blue' | 'red' | 'purple' | 'zinc';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'espresso',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  const variantClasses = {
    gold: 'bg-[#cfa851]/15 text-[#e6ca85] border border-[#cfa851]/30',
    espresso: 'bg-[#261710] text-[#ded0c3] border border-[#3e271c]',
    green: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    blue: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    red: 'bg-red-500/15 text-red-300 border border-red-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    zinc: 'bg-zinc-800 text-zinc-300 border border-zinc-700/60',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full tracking-wide uppercase font-mono ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus; size?: 'sm' | 'md' | 'lg' }> = ({
  status,
  size = 'md',
}) => {
  const map: Record<OrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
    NEW: { label: 'New', variant: 'blue' },
    CONFIRMED: { label: 'Confirmed', variant: 'purple' },
    ACCEPTED: { label: 'Accepted', variant: 'amber' },
    PREPARING: { label: 'Preparing', variant: 'gold' },
    READY: { label: 'Ready', variant: 'green' },
    PACKED: { label: 'Packed', variant: 'green' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'amber' },
    DELIVERED: { label: 'Delivered', variant: 'zinc' },
    CANCELLED: { label: 'Cancelled', variant: 'red' },
    REFUNDED: { label: 'Refunded', variant: 'red' },
  };

  const config = map[status] || { label: status, variant: 'zinc' };

  return (
    <Badge variant={config.variant} size={size}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {config.label}
    </Badge>
  );
};
