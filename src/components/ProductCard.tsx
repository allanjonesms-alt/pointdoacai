import React from 'react';
import { Produto, TAMANHO_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  produto: Produto;
  onSelect: (produto: Produto) => void;
  selected?: boolean;
}

export function ProductCard({ produto, onSelect, selected }: ProductCardProps) {
  return (
    <div
      className={cn(
        'relative group bg-card rounded-2xl p-4 border-2 transition-all duration-300 cursor-pointer hover:shadow-float',
        selected
          ? 'border-primary shadow-float scale-[1.02]'
          : 'border-transparent shadow-card hover:border-primary/30'
      )}
      onClick={() => onSelect(produto)}
    >
      {/* Size Indicator */}
      <div className="absolute -top-2 -right-2 w-12 h-12 gradient-acai rounded-full flex items-center justify-center shadow-button transform group-hover:scale-110 transition-transform">
        <span className="text-primary-foreground font-bold text-xs">{produto.peso}</span>
      </div>

      {/* Açaí Bowl Illustration */}
      <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-acai-light to-muted flex items-center justify-center mb-4 overflow-hidden">
        <div className="text-6xl group-hover:scale-110 transition-transform duration-300 group-hover:animate-bounce-soft">
          🥣
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2">
        <h3 className="font-display font-bold text-lg text-foreground">
          {TAMANHO_LABELS[produto.tamanho]}
        </h3>
        <p className="text-sm text-muted-foreground">{produto.peso}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-2xl font-bold text-primary">
            R$ {produto.preco.toFixed(2).replace('.', ',')}
          </span>
          <Button
            size="icon"
            variant={selected ? 'acai' : 'soft'}
            className="rounded-full"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
