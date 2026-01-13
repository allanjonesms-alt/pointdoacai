import React from 'react';
import { TAMANHO_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProdutoDB } from '@/hooks/useProdutos';

interface ProductCardCompactProps {
  produto: ProdutoDB;
  onSelect: (produto: ProdutoDB) => void;
  selected?: boolean;
}

export function ProductCardCompact({ produto, onSelect, selected }: ProductCardCompactProps) {
  return (
    <div
      className={cn(
        'relative group bg-card rounded-xl p-3 border-2 transition-all duration-300 cursor-pointer hover:shadow-md',
        selected
          ? 'border-primary shadow-md scale-[1.02]'
          : 'border-transparent shadow-card hover:border-primary/30'
      )}
      onClick={() => onSelect(produto)}
    >
      {/* Size Badge */}
      <div className="absolute -top-1.5 -right-1.5 w-10 h-10 gradient-acai rounded-full flex items-center justify-center shadow-sm transform group-hover:scale-110 transition-transform">
        <span className="text-primary-foreground font-bold text-[10px]">{produto.peso}</span>
      </div>

      {/* Product Image */}
      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-acai-light to-muted flex items-center justify-center mb-2 overflow-hidden">
        {produto.imagem_url ? (
          <img 
            src={produto.imagem_url} 
            alt={produto.nome} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
            🥣
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-0.5">
        <h3 className="font-display font-bold text-sm text-foreground leading-tight truncate">
          {produto.nome}
        </h3>
        <p className="text-xs text-muted-foreground">
          {TAMANHO_LABELS[produto.tamanho]}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-primary">
            R$ {produto.preco.toFixed(2).replace('.', ',')}
          </span>
          <Button
            size="icon"
            variant={selected ? 'acai' : 'soft'}
            className="rounded-full h-7 w-7"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
