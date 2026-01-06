import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Produto, TipoEmbalagem } from '@/types';

interface PedidoFavoritoItem {
  produto: Produto;
  embalagem: TipoEmbalagem;
  adicionais: string[];
  quantidade: number;
  valorUnitario: number;
  valorAdicionais: number;
}

interface PedidoFavorito {
  item: PedidoFavoritoItem;
  vezesComprado: number;
}

export function usePedidoFavorito(userId: string | undefined) {
  const [pedidoFavorito, setPedidoFavorito] = useState<PedidoFavorito | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchPedidoFavorito = async () => {
      try {
        setIsLoading(true);

        // Buscar todos os itens de pedidos do cliente
        const { data: pedidos, error: pedidosError } = await supabase
          .from('pedidos')
          .select('id')
          .eq('cliente_id', userId);

        if (pedidosError) throw pedidosError;

        if (!pedidos || pedidos.length === 0) {
          setPedidoFavorito(null);
          setIsLoading(false);
          return;
        }

        const pedidoIds = pedidos.map(p => p.id);

        // Buscar itens desses pedidos
        const { data: itens, error: itensError } = await supabase
          .from('pedido_itens')
          .select('*')
          .in('pedido_id', pedidoIds);

        if (itensError) throw itensError;

        if (!itens || itens.length === 0) {
          setPedidoFavorito(null);
          setIsLoading(false);
          return;
        }

        // Buscar adicionais de cada item
        const itemIds = itens.map(i => i.id);
        const { data: adicionaisData, error: adicionaisError } = await supabase
          .from('pedido_item_adicionais')
          .select('*')
          .in('pedido_item_id', itemIds);

        if (adicionaisError) throw adicionaisError;

        // Criar chave única para cada combinação produto+embalagem+adicionais
        const contagemProdutos: Record<string, { count: number; item: typeof itens[0]; adicionais: string[] }> = {};

        itens.forEach(item => {
          const itemAdicionais = (adicionaisData || [])
            .filter(a => a.pedido_item_id === item.id)
            .map(a => a.adicional_nome)
            .sort();
          
          // Chave: produto_id + embalagem + adicionais ordenados
          const chave = `${item.produto_id || item.produto_nome}_${item.embalagem}_${itemAdicionais.join(',')}`;
          
          if (!contagemProdutos[chave]) {
            contagemProdutos[chave] = { count: 0, item, adicionais: itemAdicionais };
          }
          contagemProdutos[chave].count += item.quantidade;
        });

        // Encontrar o mais comprado
        const entries = Object.entries(contagemProdutos);
        if (entries.length === 0) {
          setPedidoFavorito(null);
          setIsLoading(false);
          return;
        }

        const maxCount = Math.max(...entries.map(([, v]) => v.count));
        const maisComprados = entries.filter(([, v]) => v.count === maxCount);
        
        // Se houver empate, escolhe aleatoriamente
        const escolhido = maisComprados[Math.floor(Math.random() * maisComprados.length)];
        const [, { count, item, adicionais }] = escolhido;

        // Buscar dados do produto se tiver ID
        let produto: Produto;
        if (item.produto_id) {
          const { data: produtoData } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', item.produto_id)
            .maybeSingle();

          if (produtoData) {
            produto = {
              id: produtoData.id,
              nome: produtoData.nome,
              tamanho: produtoData.tamanho as Produto['tamanho'],
              peso: produtoData.peso,
              preco: Number(produtoData.preco),
              ativo: produtoData.ativo,
            };
          } else {
            produto = {
              id: item.produto_id || '',
              nome: item.produto_nome,
              tamanho: item.tamanho as Produto['tamanho'],
              peso: item.peso,
              preco: Number(item.valor_unitario),
              ativo: true,
            };
          }
        } else {
          produto = {
            id: '',
            nome: item.produto_nome,
            tamanho: item.tamanho as Produto['tamanho'],
            peso: item.peso,
            preco: Number(item.valor_unitario),
            ativo: true,
          };
        }

        setPedidoFavorito({
          item: {
            produto,
            embalagem: item.embalagem as TipoEmbalagem,
            adicionais,
            quantidade: 1,
            valorUnitario: Number(item.valor_unitario),
            valorAdicionais: Number(item.valor_adicionais),
          },
          vezesComprado: count,
        });
      } catch (error) {
        console.error('Erro ao buscar pedido favorito:', error);
        setPedidoFavorito(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPedidoFavorito();
  }, [userId]);

  return { pedidoFavorito, isLoading };
}
