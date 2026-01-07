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
  { id: 'entrega', label: 'Em Entrega', shortLabel: 'Entreg.', color: 'bg-indigo-500' },
  { id: 'entregue', label: 'Entregue', shortLabel: 'Finalizado', color: 'bg-green-500' },
];

export function StatusProgressBar({ currentStatus, onAdvanceStatus }: StatusProgressBarProps) {
  const currentIndex = STATUS_STEPS.findIndex(s => s.id === currentStatus);
  const nextStatus = currentIndex < STATUS_STEPS.length - 1 ? STATUS_STEPS[currentIndex + 1] : null;
  const isCompleted = currentStatus === 'entregue';

  const handleClick = () => {
    if (nextStatus) {
      onAdvanceStatus(nextStatus.id);
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

        {/* Step indicators */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between">
          {STATUS_STEPS.map((step, index) => {
            const isPast = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <div
                key={step.id}
                className={cn(
                  'w-4 h-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center',
                  isPast && `${step.color} border-transparent`,
                  isCurrent && `${step.color} border-white ring-2 ring-offset-1 ring-offset-background`,
                  isFuture && 'bg-muted border-border'
                )}
                style={{
                  boxShadow: isCurrent ? `0 0 8px ${step.color.replace('bg-', '')}` : 'none'
                }}
              >
                {isPast && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2">
        {STATUS_STEPS.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <span
              key={step.id}
              className={cn(
                'text-[8px] sm:text-[9px] font-medium transition-colors duration-300 text-center w-10 sm:w-12',
                isCurrent && 'text-foreground font-bold',
                isPast && 'text-muted-foreground',
                !isPast && !isCurrent && 'text-muted-foreground/50'
              )}
            >
              {step.shortLabel}
            </span>
          );
        })}
      </div>

      {/* Action Button */}
      {!isCompleted && nextStatus && (
        <button
          onClick={handleClick}
          className={cn(
            'w-full mt-3 py-2 sm:py-2.5 rounded-lg font-semibold text-white text-xs sm:text-sm transition-all duration-300',
            'hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]',
            'flex items-center justify-center gap-1 sm:gap-2',
            nextStatus.color
          )}
        >
          <span className="truncate">Avançar: {nextStatus.shortLabel}</span>
          <span className="text-white/70">→</span>
        </button>
      )}

      {isCompleted && (
        <div className="w-full mt-3 py-2.5 rounded-lg font-semibold text-white text-sm bg-green-500 flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          <span>Pedido Finalizado</span>
        </div>
      )}
    </div>
  );
}
