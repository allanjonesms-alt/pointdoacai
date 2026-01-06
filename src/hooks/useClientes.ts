import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string | null;
  referencia: string | null;
  valor_total_compras: number;
  created_at: string;
  updated_at: string;
}

interface ClienteWithRole extends Profile {
  role: 'cliente' | 'admin';
}

export function useClientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<ClienteWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = async () => {
    if (user?.role !== 'admin') {
      setClientes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('nome');

      if (profilesError) {
        throw profilesError;
      }

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw rolesError;
      }

      // Combine profiles with roles and filter only clients
      const clientesWithRoles: ClienteWithRole[] = (profiles || [])
        .map(profile => {
          const userRole = roles?.find(r => r.user_id === profile.id);
          return {
            ...profile,
            role: (userRole?.role as 'cliente' | 'admin') || 'cliente',
          };
        })
        .filter(c => c.role === 'cliente');

      setClientes(clientesWithRoles);
      setError(null);
    } catch (err) {
      console.error('Error fetching clientes:', err);
      setError('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCliente = async (clienteId: string, data: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', clienteId);

      if (error) {
        throw error;
      }

      await fetchClientes();
      return { success: true };
    } catch (err) {
      console.error('Error updating cliente:', err);
      return { success: false, error: 'Erro ao atualizar cliente' };
    }
  };

  const deleteCliente = async (clienteId: string) => {
    try {
      // Delete from profiles (will cascade to user_roles due to foreign key)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', clienteId);

      if (error) {
        throw error;
      }

      await fetchClientes();
      return { success: true };
    } catch (err) {
      console.error('Error deleting cliente:', err);
      return { success: false, error: 'Erro ao excluir cliente' };
    }
  };

  const getClienteById = (id: string) => {
    return clientes.find(c => c.id === id);
  };

  useEffect(() => {
    fetchClientes();
  }, [user?.role]);

  return {
    clientes,
    isLoading,
    error,
    fetchClientes,
    updateCliente,
    deleteCliente,
    getClienteById,
  };
}
