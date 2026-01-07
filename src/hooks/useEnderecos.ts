import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Endereco {
  id: string;
  profile_id: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string | null;
  referencia: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnderecoInput {
  rua: string;
  numero: string;
  bairro: string;
  complemento?: string | null;
  referencia?: string | null;
  is_default?: boolean;
}

export function useEnderecos(profileId?: string) {
  const { user } = useAuth();
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use provided profileId or current user's id
  const targetProfileId = profileId || user?.id;

  const fetchEnderecos = useCallback(async () => {
    if (!targetProfileId) {
      setEnderecos([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('enderecos')
        .select('*')
        .eq('profile_id', targetProfileId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setEnderecos(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching enderecos:', err);
      setError('Erro ao carregar endereços');
    } finally {
      setIsLoading(false);
    }
  }, [targetProfileId]);

  const addEndereco = async (endereco: EnderecoInput) => {
    if (!targetProfileId) {
      return { success: false, error: 'Perfil não identificado' };
    }

    try {
      // If this is the first address or marked as default, set it as default
      const isFirst = enderecos.length === 0;
      const shouldBeDefault = isFirst || endereco.is_default;

      const { data, error: insertError } = await supabase
        .from('enderecos')
        .insert({
          profile_id: targetProfileId,
          rua: endereco.rua,
          numero: endereco.numero,
          bairro: endereco.bairro,
          complemento: endereco.complemento || null,
          referencia: endereco.referencia || null,
          is_default: shouldBeDefault,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      await fetchEnderecos();
      return { success: true, data };
    } catch (err) {
      console.error('Error adding endereco:', err);
      return { success: false, error: 'Erro ao adicionar endereço' };
    }
  };

  const updateEndereco = async (id: string, endereco: Partial<EnderecoInput>) => {
    try {
      const { error: updateError } = await supabase
        .from('enderecos')
        .update({
          ...endereco,
          complemento: endereco.complemento || null,
          referencia: endereco.referencia || null,
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await fetchEnderecos();
      return { success: true };
    } catch (err) {
      console.error('Error updating endereco:', err);
      return { success: false, error: 'Erro ao atualizar endereço' };
    }
  };

  const deleteEndereco = async (id: string) => {
    try {
      const enderecoToDelete = enderecos.find(e => e.id === id);
      
      const { error: deleteError } = await supabase
        .from('enderecos')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // If deleted address was default, set the most recent as default
      if (enderecoToDelete?.is_default && enderecos.length > 1) {
        const remainingEnderecos = enderecos.filter(e => e.id !== id);
        if (remainingEnderecos.length > 0) {
          await supabase
            .from('enderecos')
            .update({ is_default: true })
            .eq('id', remainingEnderecos[0].id);
        }
      }

      await fetchEnderecos();
      return { success: true };
    } catch (err) {
      console.error('Error deleting endereco:', err);
      return { success: false, error: 'Erro ao excluir endereço' };
    }
  };

  const setDefaultEndereco = async (id: string) => {
    try {
      const { error: updateError } = await supabase
        .from('enderecos')
        .update({ is_default: true })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await fetchEnderecos();
      return { success: true };
    } catch (err) {
      console.error('Error setting default endereco:', err);
      return { success: false, error: 'Erro ao definir endereço padrão' };
    }
  };

  const getDefaultEndereco = () => {
    return enderecos.find(e => e.is_default) || enderecos[0] || null;
  };

  useEffect(() => {
    fetchEnderecos();
  }, [fetchEnderecos]);

  return {
    enderecos,
    isLoading,
    error,
    fetchEnderecos,
    addEndereco,
    updateEndereco,
    deleteEndereco,
    setDefaultEndereco,
    getDefaultEndereco,
  };
}
