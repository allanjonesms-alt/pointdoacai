import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CarrinhoItem, Produto } from '@/types';

interface CarrinhoContextType {
  itens: CarrinhoItem[];
  adicionarItem: (produto: Produto, adicionais: string[]) => void;
  removerItem: (itemId: string) => void;
  atualizarItem: (itemId: string, adicionais: string[]) => void;
  atualizarQuantidade: (itemId: string, quantidade: number) => void;
  limparCarrinho: () => void;
  subtotal: number;
  totalAdicionais: number;
  total: number;
  quantidadeTotal: number;
}

const CarrinhoContext = createContext<CarrinhoContextType | undefined>(undefined);

const ADICIONAL_GRATIS = 3;
const PRECO_ADICIONAL_EXTRA = 2.00;

function calcularValorAdicionais(adicionais: string[]): number {
  const extras = Math.max(0, adicionais.length - ADICIONAL_GRATIS);
  return extras * PRECO_ADICIONAL_EXTRA;
}

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<CarrinhoItem[]>(() => {
    const saved = localStorage.getItem('pointdoacai_carrinho');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pointdoacai_carrinho', JSON.stringify(itens));
  }, [itens]);

  const adicionarItem = (produto: Produto, adicionais: string[]) => {
    const valorAdicionais = calcularValorAdicionais(adicionais);
    const novoItem: CarrinhoItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      produto,
      quantidade: 1,
      adicionais,
      valorUnitario: produto.preco,
      valorAdicionais,
    };
    setItens(prev => [...prev, novoItem]);
  };

  const removerItem = (itemId: string) => {
    setItens(prev => prev.filter(item => item.id !== itemId));
  };

  const atualizarItem = (itemId: string, adicionais: string[]) => {
    setItens(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          adicionais,
          valorAdicionais: calcularValorAdicionais(adicionais),
        };
      }
      return item;
    }));
  };

  const atualizarQuantidade = (itemId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removerItem(itemId);
      return;
    }
    setItens(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, quantidade };
      }
      return item;
    }));
  };

  const limparCarrinho = () => {
    setItens([]);
  };

  const subtotal = itens.reduce((acc, item) => acc + (item.valorUnitario * item.quantidade), 0);
  const totalAdicionais = itens.reduce((acc, item) => acc + (item.valorAdicionais * item.quantidade), 0);
  const total = subtotal + totalAdicionais;
  const quantidadeTotal = itens.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <CarrinhoContext.Provider value={{
      itens,
      adicionarItem,
      removerItem,
      atualizarItem,
      atualizarQuantidade,
      limparCarrinho,
      subtotal,
      totalAdicionais,
      total,
      quantidadeTotal,
    }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const context = useContext(CarrinhoContext);
  if (context === undefined) {
    throw new Error('useCarrinho must be used within a CarrinhoProvider');
  }
  return context;
}
