import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProdutoDB {
  id: string;
  nome: string;
  tamanho: 'pequeno' | 'medio' | 'grande' | 'gg' | 'mega';
  peso: string;
  preco: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdicionalDB {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useProdutos() {
  const [produtos, setProdutos] = useState<ProdutoDB[]>([]);
  const [adicionais, setAdicionais] = useState<AdicionalDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProdutos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('preco', { ascending: true });

      if (error) throw error;
      setProdutos(data || []);
    } catch (err: any) {
      console.error('Error fetching produtos:', err);
      setError(err.message);
    }
  }, []);

  const fetchAdicionais = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('adicionais')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setAdicionais(data || []);
    } catch (err: any) {
      console.error('Error fetching adicionais:', err);
      setError(err.message);
    }
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchProdutos(), fetchAdicionais()]);
    setIsLoading(false);
  }, [fetchProdutos, fetchAdicionais]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Produtos CRUD
  const criarProduto = async (produto: Omit<ProdutoDB, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.from('produtos').insert(produto);
      if (error) throw error;
      toast.success('Produto criado com sucesso!');
      await fetchProdutos();
      return true;
    } catch (err: any) {
      toast.error('Erro ao criar produto: ' + err.message);
      return false;
    }
  };

  const atualizarProduto = async (id: string, updates: Partial<Omit<ProdutoDB, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { error } = await supabase.from('produtos').update(updates).eq('id', id);
      if (error) throw error;
      toast.success('Produto atualizado com sucesso!');
      await fetchProdutos();
      return true;
    } catch (err: any) {
      toast.error('Erro ao atualizar produto: ' + err.message);
      return false;
    }
  };

  const excluirProduto = async (id: string) => {
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Produto excluído com sucesso!');
      await fetchProdutos();
      return true;
    } catch (err: any) {
      toast.error('Erro ao excluir produto: ' + err.message);
      return false;
    }
  };

  const toggleProdutoAtivo = async (id: string, ativo: boolean) => {
    return atualizarProduto(id, { ativo });
  };

  // Adicionais CRUD
  const criarAdicional = async (adicional: Omit<AdicionalDB, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.from('adicionais').insert(adicional);
      if (error) throw error;
      toast.success('Adicional criado com sucesso!');
      await fetchAdicionais();
      return true;
    } catch (err: any) {
      toast.error('Erro ao criar adicional: ' + err.message);
      return false;
    }
  };

  const atualizarAdicional = async (id: string, updates: Partial<Omit<AdicionalDB, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { error } = await supabase.from('adicionais').update(updates).eq('id', id);
      if (error) throw error;
      toast.success('Adicional atualizado com sucesso!');
      await fetchAdicionais();
      return true;
    } catch (err: any) {
      toast.error('Erro ao atualizar adicional: ' + err.message);
      return false;
    }
  };

  const excluirAdicional = async (id: string) => {
    try {
      const { error } = await supabase.from('adicionais').delete().eq('id', id);
      if (error) throw error;
      toast.success('Adicional excluído com sucesso!');
      await fetchAdicionais();
      return true;
    } catch (err: any) {
      toast.error('Erro ao excluir adicional: ' + err.message);
      return false;
    }
  };

  const toggleAdicionalAtivo = async (id: string, ativo: boolean) => {
    return atualizarAdicional(id, { ativo });
  };

  return {
    produtos,
    adicionais,
    isLoading,
    error,
    refetch,
    // Produtos
    criarProduto,
    atualizarProduto,
    excluirProduto,
    toggleProdutoAtivo,
    // Adicionais
    criarAdicional,
    atualizarAdicional,
    excluirAdicional,
    toggleAdicionalAtivo,
  };
}
