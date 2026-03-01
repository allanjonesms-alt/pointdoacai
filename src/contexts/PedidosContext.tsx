import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Pedido, StatusPedido, CarrinhoItem, Endereco } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PedidosContextType {
  pedidos: Pedido[];
  pedidosHoje: Pedido[];
  isLoading: boolean;
  criarPedido: (
    clienteId: string,
    clienteNome: string,
    enderecoEntrega: Endereco,
    formaPagamento: 'credito' | 'debito' | 'pix' | 'dinheiro',
    itens: CarrinhoItem[],
    valorTotal: number
  ) => Promise<string | null>;
  atualizarStatus: (pedidoId: string, status: StatusPedido) => Promise<void>;
  getPedidosCliente: (clienteId: string) => Pedido[];
  refetch: () => Promise<void>;
}

const PedidosContext = createContext<PedidosContextType | undefined>(undefined);

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPedidos = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Buscar todos os pedidos com seus itens
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select(`
          *,
          pedido_itens (
            *,
            pedido_item_adicionais (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (pedidosError) throw pedidosError;

      // Transformar dados do banco para o formato do tipo Pedido
      const pedidosFormatados: Pedido[] = (pedidosData || []).map(p => ({
        id: p.id,
        numeroPedido: p.numero_pedido,
        clienteId: p.cliente_id || '',
        clienteNome: p.cliente_nome,
        enderecoEntrega: {
          rua: p.endereco_rua,
          numero: p.endereco_numero,
          bairro: p.endereco_bairro,
          complemento: p.endereco_complemento || undefined,
          referencia: p.endereco_referencia || undefined,
        },
        formaPagamento: p.forma_pagamento,
        status: p.status,
        valorTotal: Number(p.valor_total),
        dataHora: new Date(p.created_at),
        pixPaymentId: p.pix_payment_id || null,
        pixPagoEm: p.pix_pago_em || null,
        pixConfirmacao: p.pix_confirmacao || null,
        itens: (p.pedido_itens || []).map((item: any) => ({
          id: item.id,
          produto: {
            id: item.produto_id || '',
            nome: item.produto_nome,
            tamanho: item.tamanho,
            peso: item.peso,
            preco: Number(item.valor_unitario),
            ativo: true,
          },
          quantidade: item.quantidade,
          adicionais: (item.pedido_item_adicionais || []).map((a: any) => a.adicional_nome),
          embalagem: item.embalagem || 'copo',
          valorUnitario: Number(item.valor_unitario),
          valorAdicionais: Number(item.valor_adicionais),
        })),
      }));

      setPedidos(pedidosFormatados);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Filtrar pedidos de hoje
  const pedidosHoje = pedidos.filter(p => {
    const hoje = new Date();
    const dataPedido = new Date(p.dataHora);
    return (
      dataPedido.getDate() === hoje.getDate() &&
      dataPedido.getMonth() === hoje.getMonth() &&
      dataPedido.getFullYear() === hoje.getFullYear()
    );
  });

  const criarPedido = async (
    clienteId: string,
    clienteNome: string,
    enderecoEntrega: Endereco,
    formaPagamento: 'credito' | 'debito' | 'pix' | 'dinheiro',
    itens: CarrinhoItem[],
    valorTotal: number
  ): Promise<string | null> => {
    try {
      // 1. Criar o pedido - usar string vazia para que o trigger do banco gere o número
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          numero_pedido: '', // Trigger no banco vai substituir por número sequencial
          cliente_id: clienteId || null,
          cliente_nome: clienteNome,
          endereco_rua: enderecoEntrega.rua,
          endereco_numero: enderecoEntrega.numero,
          endereco_bairro: enderecoEntrega.bairro,
          endereco_complemento: enderecoEntrega.complemento || null,
          endereco_referencia: enderecoEntrega.referencia || null,
          forma_pagamento: formaPagamento,
          valor_total: valorTotal,
          status: 'pendente',
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      const numeroPedido = pedidoData.numero_pedido;

      // 2. Criar os itens do pedido
      for (const item of itens) {
        const { data: itemData, error: itemError } = await supabase
          .from('pedido_itens')
          .insert({
            pedido_id: pedidoData.id,
            produto_id: item.produto.id || null,
            produto_nome: item.produto.nome,
            tamanho: item.produto.tamanho,
            peso: item.produto.peso,
            quantidade: item.quantidade,
            valor_unitario: item.valorUnitario,
            valor_adicionais: item.valorAdicionais,
            embalagem: item.embalagem,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // 3. Criar os adicionais de cada item
        if (item.adicionais.length > 0) {
          const adicionaisInsert = item.adicionais.map(adicionalNome => ({
            pedido_item_id: itemData.id,
            adicional_nome: adicionalNome,
          }));

          const { error: adicionaisError } = await supabase
            .from('pedido_item_adicionais')
            .insert(adicionaisInsert);

          if (adicionaisError) throw adicionaisError;
        }
      }

      // Atualizar lista de pedidos
      await fetchPedidos();

      toast.success(`Pedido #${numeroPedido} criado com sucesso!`);
      return numeroPedido;
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido: ' + error.message);
      return null;
    }
  };

  const atualizarStatus = async (pedidoId: string, status: StatusPedido) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status })
        .eq('id', pedidoId);

      if (error) throw error;

      // Atualizar estado local
      setPedidos(prev => prev.map(p => 
        p.id === pedidoId ? { ...p, status } : p
      ));

      toast.success('Status atualizado!');
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getPedidosCliente = (clienteId: string) => {
    return pedidos.filter(p => p.clienteId === clienteId);
  };

  return (
    <PedidosContext.Provider value={{ 
      pedidos, 
      pedidosHoje,
      isLoading,
      criarPedido, 
      atualizarStatus, 
      getPedidosCliente,
      refetch: fetchPedidos,
    }}>
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
