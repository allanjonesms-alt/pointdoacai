import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapeamento de adicionais para emojis
const ADICIONAL_EMOJIS: Record<string, string> = {
  'Leite em Pó': '🥛',
  'Leite Condensado': '🍼',
  'Granola': '🥣',
  'Banana': '🍌',
  'Morango': '🍓',
  'Kiwi': '🥝',
  'Paçoca': '🥜',
  'Mel': '🍯',
  'Nutella': '🍫',
  'Amendoim': '🥜',
  'Coco Ralado': '🥥',
  'Chocolate Granulado': '🍫',
  'Uva': '🍇',
  'Manga': '🥭',
  'Maçã': '🍎',
  'Abacaxi': '🍍',
  'Laranja': '🍊',
  'Limão': '🍋',
  'Cereja': '🍒',
  'Pêssego': '🍑',
  'Aveia': '🌾',
  'Castanha': '🌰',
  'Confete': '🎊',
  'Biscoito': '🍪',
  'Doce de Leite': '🥄',
  'Caramelo': '🍬',
  'Açúcar': '🧂',
};

const getAdicionalEmoji = (nome: string): string => {
  return ADICIONAL_EMOJIS[nome] || '✨';
};

interface AdicionalQuantityProps {
  nome: string;
  quantidade: number;
  onQuantidadeChange: (quantidade: number) => void;
  gratuitos: number; // quantidade de adicionais gratuitos restantes
}

export function AdicionalQuantity({ nome, quantidade, onQuantidadeChange, gratuitos }: AdicionalQuantityProps) {
  const isSelected = quantidade > 0;
  const emoji = getAdicionalEmoji(nome);
  
  // Calcular quantos são pagos (acima do limite gratuito)
  const quantidadePaga = Math.max(0, quantidade - gratuitos);

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantidade > 0) {
      onQuantidadeChange(quantidade - 1);
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuantidadeChange(quantidade + 1);
  };

  return (
    <div
      className={cn(
        'relative flex flex-col px-3 py-2 rounded-xl border-2 transition-all duration-200',
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-base">{emoji}</span>
        <span className={cn(
          'font-medium text-sm truncate',
          isSelected ? 'text-primary' : 'text-foreground'
        )}>
          {nome}
        </span>
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-2">
        <button
          onClick={handleDecrease}
          disabled={quantidade === 0}
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center transition-all',
            quantidade === 0
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-violet-500 hover:bg-violet-600 text-white'
          )}
        >
          <Minus className="w-3 h-3" />
        </button>
        
        <span className={cn(
          'w-6 text-center font-bold text-base',
          isSelected ? 'text-primary' : 'text-muted-foreground'
        )}>
          {quantidade}
        </span>
        
        <button
          onClick={handleIncrease}
          className="w-7 h-7 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-all"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {quantidadePaga > 0 && (
        <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          +R${(quantidadePaga * 2).toFixed(0)}
        </span>
      )}
    </div>
  );
}
