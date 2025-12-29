import React from 'react';
import { StatusPedido } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: StatusPedido;
  className?: string;
}

const statusConfig: Record<StatusPedido, { label: string; className: string }> = {
  pendente: {
    label: 'Pendente',
    className: 'bg-status-pending/20 text-status-pending border-status-pending/30',
  },
  preparo: {
    label: 'Em Preparo',
    className: 'bg-status-preparing/20 text-status-preparing border-status-preparing/30',
  },
  pronto: {
    label: 'Pronto',
    className: 'bg-status-ready/20 text-status-ready border-status-ready/30',
  },
  entrega: {
    label: 'Saiu para Entrega',
    className: 'bg-status-delivery/20 text-status-delivery border-status-delivery/30',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
      config.className,
      className
    )}>
      <span className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse-soft" />
      {config.label}
    </span>
  );
}
