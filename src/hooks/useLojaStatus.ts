import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LojaStatus {
  lojaAberta: boolean;
  isLoading: boolean;
  toggleLoja: () => Promise<void>;
  refetch: () => void;
}

export function useLojaStatus(): LojaStatus {
  const [lojaAberta, setLojaAberta] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('configuracoes_loja')
        .select('loja_aberta')
        .single();
      
      if (error) throw error;
      setLojaAberta(data?.loja_aberta ?? true);
    } catch (error) {
      console.error('Erro ao buscar status da loja:', error);
      setLojaAberta(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoja = async () => {
    try {
      const newStatus = !lojaAberta;
      const { error } = await supabase
        .from('configuracoes_loja')
        .update({ loja_aberta: newStatus, updated_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      setLojaAberta(newStatus);
    } catch (error) {
      console.error('Erro ao atualizar status da loja:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('loja-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'configuracoes_loja'
        },
        (payload) => {
          setLojaAberta(payload.new.loja_aberta);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    lojaAberta,
    isLoading,
    toggleLoja,
    refetch: fetchStatus
  };
}
