import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdicionalChipProps {
  nome: string;
  selected: boolean;
  onToggle: () => void;
  isFree: boolean;
}

export function AdicionalChip({ nome, selected, onToggle, isFree }: AdicionalChipProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium text-sm',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted'
      )}
    >
      <div className={cn(
        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
        selected
          ? 'border-primary bg-primary'
          : 'border-muted-foreground'
      )}>
        {selected && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <span>{nome}</span>
      {selected && !isFree && (
        <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          +R$2
        </span>
      )}
    </button>
  );
}
