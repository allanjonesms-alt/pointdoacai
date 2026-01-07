import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Rua {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export function useRuas() {
  const [ruas, setRuas] = useState<Rua[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuas = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('ruas')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setRuas(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching ruas:', err);
      setError('Erro ao carregar ruas');
    } finally {
      setIsLoading(false);
    }
  };

  const searchRuas = (query: string): Rua[] => {
    if (!query.trim()) return ruas;
    
    const lowerQuery = query.toLowerCase();
    return ruas.filter(rua => 
      rua.nome.toLowerCase().includes(lowerQuery)
    );
  };

  useEffect(() => {
    fetchRuas();
  }, []);

  return {
    ruas,
    isLoading,
    error,
    fetchRuas,
    searchRuas,
  };
}
