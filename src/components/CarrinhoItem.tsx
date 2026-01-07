import React from 'react';
import { CarrinhoItem as CarrinhoItemType, TAMANHO_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCarrinho } from '@/contexts/CarrinhoContext';

interface CarrinhoItemProps {
  item: CarrinhoItemType;
}

export function CarrinhoItemCard({ item }: CarrinhoItemProps) {
  const { removerItem, atualizarQuantidade } = useCarrinho();

  const valorTotal = (item.valorUnitario + item.valorAdicionais) * item.quantidade;

  return (
    <div className="bg-card rounded-xl p-3 sm:p-4 shadow-card border border-border/50 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl sm:text-2xl flex-shrink-0">🥣</span>
            <div className="min-w-0">
              <h4 className="font-display font-bold text-sm sm:text-base text-foreground truncate">
                Açaí {TAMANHO_LABELS[item.produto.tamanho]}
              </h4>
              <p className="text-xs text-muted-foreground">{item.produto.peso}</p>
            </div>
          </div>

          {/* Adicionais */}
          {item.adicionais.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Adicionais:</p>
              <div className="flex flex-wrap gap-1">
                {item.adicionais.map((adicional, index) => (
                  <span
                    key={adicional}
                    className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                      index < 3
                        ? 'bg-tropical-light text-tropical'
                        : 'bg-accent/20 text-accent'
                    }`}
                  >
                    {adicional}
                    {index >= 3 && ' (+R$2)'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price & Actions */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-base sm:text-lg text-primary whitespace-nowrap">
            R$ {valorTotal.toFixed(2).replace('.', ',')}
          </p>
          {item.valorAdicionais > 0 && (
            <p className="text-xs text-muted-foreground">
              (+R$ {(item.valorAdicionais * item.quantidade).toFixed(2).replace('.', ',')})
            </p>
          )}
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full"
            onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="font-bold text-lg w-8 text-center">{item.quantidade}</span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full"
            onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => removerItem(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
