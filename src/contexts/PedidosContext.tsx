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

  const gerarNumeroPedido = async (): Promise<string> => {
    // Gerar número único: DDMM + sequencial + random
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const prefixo = `${dia}${mes}`;
    
    // Buscar o último número de pedido do dia com o mesmo prefixo
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
    
    const { data, error } = await supabase
      .from('pedidos')
      .select('numero_pedido')
      .gte('created_at', inicioDia)
      .like('numero_pedido', `${prefixo}%`)
      .order('numero_pedido', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Erro ao buscar último pedido:', error);
      // Fallback: usar timestamp para garantir unicidade
      return `${prefixo}${Date.now().toString().slice(-4)}`;
    }

    let sequencial = 1;
    if (data && data.length > 0) {
      // Extrair o sequencial do último número (formato: DDMM + 3 dígitos)
      const ultimoNumero = data[0].numero_pedido;
      const ultimoSequencial = parseInt(ultimoNumero.slice(4), 10);
      if (!isNaN(ultimoSequencial)) {
        sequencial = ultimoSequencial + 1;
      }
    }

    return `${prefixo}${sequencial.toString().padStart(3, '0')}`;
  };

  const criarPedidoComRetry = async (
    clienteId: string,
    clienteNome: string,
    enderecoEntrega: Endereco,
    formaPagamento: 'credito' | 'debito' | 'pix' | 'dinheiro',
    itens: CarrinhoItem[],
    valorTotal: number,
    tentativa: number = 1
  ): Promise<string | null> => {
    const maxTentativas = 3;
    
    try {
      const numeroPedido = await gerarNumeroPedido();

      // 1. Criar o pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          numero_pedido: numeroPedido,
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

      if (pedidoError) {
        // Se for erro de chave duplicada e ainda temos tentativas, retry
        if (pedidoError.message.includes('duplicate key') && tentativa < maxTentativas) {
          console.log(`Tentativa ${tentativa} falhou, tentando novamente...`);
          await new Promise(resolve => setTimeout(resolve, 100 * tentativa)); // pequeno delay
          return criarPedidoComRetry(clienteId, clienteNome, enderecoEntrega, formaPagamento, itens, valorTotal, tentativa + 1);
        }
        throw pedidoError;
      }

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

  const criarPedido = async (
    clienteId: string,
    clienteNome: string,
    enderecoEntrega: Endereco,
    formaPagamento: 'credito' | 'debito' | 'pix' | 'dinheiro',
    itens: CarrinhoItem[],
    valorTotal: number
  ): Promise<string | null> => {
    return criarPedidoComRetry(clienteId, clienteNome, enderecoEntrega, formaPagamento, itens, valorTotal, 1);
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
