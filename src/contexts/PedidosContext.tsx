import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Pedido, StatusPedido, CarrinhoItem, Endereco } from '@/types';

interface PedidosContextType {
  pedidos: Pedido[];
  criarPedido: (
    clienteId: string,
    clienteNome: string,
    enderecoEntrega: Endereco,
    formaPagamento: 'credito' | 'debito' | 'pix' | 'dinheiro',
    itens: CarrinhoItem[],
    valorTotal: number
  ) => string;
  atualizarStatus: (pedidoId: string, status: StatusPedido) => void;
  getPedidosCliente: (clienteId: string) => Pedido[];
}

const PedidosContext = createContext<PedidosContextType | undefined>(undefined);

const MOCK_PEDIDOS: Pedido[] = [
  {
    id: 'pedido-1',
    numeroPedido: '001',
    clienteId: 'cliente-1',
    clienteNome: 'João Silva',
    enderecoEntrega: {
      rua: 'Rua das Flores',
      numero: '123',
      bairro: 'Centro',
      complemento: 'Apto 45',
    },
    formaPagamento: 'pix',
    status: 'preparo',
    valorTotal: 46.00,
    dataHora: new Date(Date.now() - 1000 * 60 * 30),
    itens: [
      {
        id: 'item-1',
        produto: { id: '3', nome: 'Açaí', tamanho: 'grande', peso: '400g', preco: 20.00, ativo: true },
        quantidade: 2,
        adicionais: ['Granola', 'Banana', 'Leite Condensado'],
        valorUnitario: 20.00,
        valorAdicionais: 0,
      },
      {
        id: 'item-2',
        produto: { id: '1', nome: 'Açaí', tamanho: 'pequeno', peso: '200g', preco: 12.00, ativo: true },
        quantidade: 1,
        adicionais: ['Morango', 'Mel', 'Paçoca', 'Nutella'],
        valorUnitario: 12.00,
        valorAdicionais: 2.00,
      },
    ],
  },
  {
    id: 'pedido-2',
    numeroPedido: '002',
    clienteId: 'cliente-2',
    clienteNome: 'Maria Santos',
    enderecoEntrega: {
      rua: 'Av. Brasil',
      numero: '456',
      bairro: 'Jardim América',
    },
    formaPagamento: 'credito',
    status: 'pendente',
    valorTotal: 35.00,
    dataHora: new Date(Date.now() - 1000 * 60 * 10),
    itens: [
      {
        id: 'item-3',
        produto: { id: '5', nome: 'Açaí', tamanho: 'mega', peso: '700g', preco: 35.00, ativo: true },
        quantidade: 1,
        adicionais: ['Granola', 'Banana'],
        valorUnitario: 35.00,
        valorAdicionais: 0,
      },
    ],
  },
];

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<Pedido[]>(MOCK_PEDIDOS);
  const [contador, setContador] = useState(3);

  const criarPedido = (
    clienteId: string,
    clienteNome: string,
    enderecoEntrega: Endereco,
    formaPagamento: 'credito' | 'debito' | 'pix' | 'dinheiro',
    itens: CarrinhoItem[],
    valorTotal: number
  ): string => {
    const numeroPedido = contador.toString().padStart(3, '0');
    const novoPedido: Pedido = {
      id: `pedido-${Date.now()}`,
      numeroPedido,
      clienteId,
      clienteNome,
      enderecoEntrega,
      formaPagamento,
      status: 'pendente',
      valorTotal,
      dataHora: new Date(),
      itens,
    };

    setPedidos(prev => [novoPedido, ...prev]);
    setContador(prev => prev + 1);
    return numeroPedido;
  };

  const atualizarStatus = (pedidoId: string, status: StatusPedido) => {
    setPedidos(prev => prev.map(p => 
      p.id === pedidoId ? { ...p, status } : p
    ));
  };

  const getPedidosCliente = (clienteId: string) => {
    return pedidos.filter(p => p.clienteId === clienteId);
  };

  return (
    <PedidosContext.Provider value={{ pedidos, criarPedido, atualizarStatus, getPedidosCliente }}>
      {children}
    </PedidosContext.Provider>
  );
}

export function usePedidos() {
  const context = useContext(PedidosContext);
  if (context === undefined) {
    throw new Error('usePedidos must be used within a PedidosProvider');
  }
  return context;
}
