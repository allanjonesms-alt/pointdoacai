import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Bairro {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export function useBairros() {
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBairros = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('bairros')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar bairros:', error);
    } else {
      setBairros(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBairros();

    const channel = supabase
      .channel('bairros-autocomplete')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bairros' },
        () => {
          fetchBairros();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { bairros, isLoading, refetch: fetchBairros };
}
