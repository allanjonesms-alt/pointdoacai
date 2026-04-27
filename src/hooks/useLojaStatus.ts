import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type DiaSemana = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

export interface PrintConfig {
  largura: number;
  altura: number;
  fonteTamanho: number;
  fonteTipo: string;
}

export interface ConfiguracoesLoja {
  lojaAberta: boolean;
  horarioAbertura: string;
  horarioFechamento: string;
  diasFuncionamento: DiaSemana[];
  printConfig: PrintConfig;
}

interface LojaStatus extends ConfiguracoesLoja {
  isLoading: boolean;
  toggleLoja: () => Promise<void>;
  atualizarConfiguracoes: (config: Partial<Omit<ConfiguracoesLoja, 'lojaAberta'>>) => Promise<void>;
  refetch: () => void;
}

const DIAS_MAP: Record<number, DiaSemana> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado'
};

export function useLojaStatus(): LojaStatus {
  const [config, setConfig] = useState<ConfiguracoesLoja>({
    lojaAberta: true,
    horarioAbertura: '13:30',
    horarioFechamento: '22:00',
    diasFuncionamento: ['domingo', 'segunda', 'terca', 'quarta', 'sexta', 'sabado'],
    printConfig: { largura: 80, altura: 0, fonteTamanho: 12, fonteTipo: 'Arial' }
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('configuracoes_loja')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setConfig({
          lojaAberta: data.loja_aberta,
          horarioAbertura: data.horario_abertura?.slice(0, 5) ?? '13:30',
          horarioFechamento: data.horario_fechamento?.slice(0, 5) ?? '22:00',
          diasFuncionamento: (data.dias_funcionamento as DiaSemana[]) ?? ['domingo', 'segunda', 'terca', 'quarta', 'sexta', 'sabado'],
          printConfig: {
            largura: (data as any).print_largura ?? 80,
            altura: (data as any).print_altura ?? 0,
            fonteTamanho: (data as any).print_fonte_tamanho ?? 12,
            fonteTipo: (data as any).print_fonte_tipo ?? 'Arial',
          }
        });
      }
    } catch (error) {
      console.error('Erro ao buscar status da loja:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoja = async () => {
    try {
      const newStatus = !config.lojaAberta;
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('configuracoes_loja')
        .update({
          loja_aberta: newStatus,
          updated_at: nowIso,
          // Registra override manual para a função automática respeitar até a próxima transição
          override_manual_em: nowIso,
          override_manual_status: newStatus,
        } as any)
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      setConfig(prev => ({ ...prev, lojaAberta: newStatus }));
    } catch (error) {
      console.error('Erro ao atualizar status da loja:', error);
      throw error;
    }
  };

  const atualizarConfiguracoes = async (novaConfig: Partial<Omit<ConfiguracoesLoja, 'lojaAberta'>>) => {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (novaConfig.horarioAbertura) {
        updateData.horario_abertura = novaConfig.horarioAbertura + ':00';
      }
      if (novaConfig.horarioFechamento) {
        updateData.horario_fechamento = novaConfig.horarioFechamento + ':00';
      }
      if (novaConfig.diasFuncionamento) {
        updateData.dias_funcionamento = novaConfig.diasFuncionamento;
      }
      if (novaConfig.printConfig) {
        updateData.print_largura = novaConfig.printConfig.largura;
        updateData.print_altura = novaConfig.printConfig.altura;
        updateData.print_fonte_tamanho = novaConfig.printConfig.fonteTamanho;
        updateData.print_fonte_tipo = novaConfig.printConfig.fonteTipo;
      }

      const { error } = await supabase
        .from('configuracoes_loja')
        .update(updateData)
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      
      setConfig(prev => ({ ...prev, ...novaConfig }));
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
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
          const data = payload.new as any;
          setConfig({
            lojaAberta: data.loja_aberta,
            horarioAbertura: data.horario_abertura?.slice(0, 5) ?? '13:30',
            horarioFechamento: data.horario_fechamento?.slice(0, 5) ?? '22:00',
            diasFuncionamento: data.dias_funcionamento ?? ['domingo', 'segunda', 'terca', 'quarta', 'sexta', 'sabado'],
            printConfig: {
              largura: data.print_largura ?? 80,
              altura: data.print_altura ?? 0,
              fonteTamanho: data.print_fonte_tamanho ?? 12,
              fonteTipo: data.print_fonte_tipo ?? 'Arial',
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    ...config,
    isLoading,
    toggleLoja,
    atualizarConfiguracoes,
    refetch: fetchStatus
  };
}

// Utility function to check if store should be open based on schedule (using UTC-4)
export function verificarHorarioFuncionamento(
  horarioAbertura: string,
  horarioFechamento: string,
  diasFuncionamento: DiaSemana[]
): boolean {
  // Usar UTC-4 (horário de Manaus/Amazonas)
  const agoraUTC = new Date();
  const offsetUTC4 = -4 * 60; // UTC-4 em minutos
  const agora = new Date(agoraUTC.getTime() + (agoraUTC.getTimezoneOffset() + offsetUTC4) * 60000);
  
  const diaAtual = DIAS_MAP[agora.getDay()];
  
  // Check if today is a working day
  if (!diasFuncionamento.includes(diaAtual)) {
    return false;
  }

  // Check if current time is within working hours
  const [horaAbertura, minAbertura] = horarioAbertura.split(':').map(Number);
  const [horaFechamento, minFechamento] = horarioFechamento.split(':').map(Number);
  
  const horaAtual = agora.getHours();
  const minAtual = agora.getMinutes();
  
  const minutosAbertura = horaAbertura * 60 + minAbertura;
  const minutosFechamento = horaFechamento * 60 + minFechamento;
  const minutosAtual = horaAtual * 60 + minAtual;

  return minutosAtual >= minutosAbertura && minutosAtual < minutosFechamento;
}
