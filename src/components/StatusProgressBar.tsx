import React from 'react';
import { StatusPedido } from '@/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StatusProgressBarProps {
  currentStatus: StatusPedido;
  onAdvanceStatus: (newStatus: StatusPedido) => void;
}

const STATUS_STEPS: { id: StatusPedido; label: string; shortLabel: string; color: string }[] = [
  { id: 'pendente', label: 'Pendente', shortLabel: 'Pend.', color: 'bg-amber-500' },
  { id: 'confirmado', label: 'Confirmado', shortLabel: 'Conf.', color: 'bg-blue-500' },
  { id: 'preparo', label: 'Em Preparo', shortLabel: 'Prep.', color: 'bg-orange-500' },
  { id: 'pronto', label: 'Pronto', shortLabel: 'Pronto', color: 'bg-purple-500' },
  { id: 'entrega', label: 'Saiu p/ Entrega', shortLabel: 'Saiu p/ Entreg', color: 'bg-indigo-500' },
  { id: 'entregue', label: 'Entregue', shortLabel: 'Entregue', color: 'bg-green-500' },
];

export function StatusProgressBar({ currentStatus, onAdvanceStatus }: StatusProgressBarProps) {
  const currentIndex = STATUS_STEPS.findIndex(s => s.id === currentStatus);

  const handleStatusClick = (statusId: StatusPedido) => {
    if (statusId !== currentStatus) {
      onAdvanceStatus(statusId);
    }
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative">
        {/* Background track */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          {/* Progress fill */}
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              STATUS_STEPS[currentIndex]?.color || 'bg-primary'
            )}
            style={{ width: `${((currentIndex + 1) / STATUS_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step indicators - clickable */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between">
          {STATUS_STEPS.map((step, index) => {
            const isPast = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <button
                key={step.id}
                onClick={() => handleStatusClick(step.id)}
                className={cn(
                  'w-4 h-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center cursor-pointer',
                  'hover:scale-125 hover:ring-2 hover:ring-offset-1 hover:ring-offset-background',
                  isPast && `${step.color} border-transparent hover:ring-current`,
                  isCurrent && `${step.color} border-white ring-2 ring-offset-1 ring-offset-background`,
                  isFuture && 'bg-muted border-border hover:bg-muted-foreground/20'
                )}
                title={step.label}
              >
                {isPast && <Check className="w-2.5 h-2.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Labels - also clickable */}
      <div className="flex justify-between mt-2">
        {STATUS_STEPS.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <button
              key={step.id}
              onClick={() => handleStatusClick(step.id)}
              className={cn(
                'text-[8px] sm:text-[9px] font-medium transition-colors duration-300 text-center w-10 sm:w-14 cursor-pointer',
                'hover:opacity-80',
                isCurrent && 'text-foreground font-bold',
                isPast && 'text-muted-foreground',
                !isPast && !isCurrent && 'text-muted-foreground/50'
              )}
              title={`Alterar para: ${step.label}`}
            >
              {step.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
