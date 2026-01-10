import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type DiaSemana = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

const DIAS_MAP: Record<number, DiaSemana> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado'
};

function getDataUTC4(): Date {
  const agoraUTC = new Date();
  const offsetUTC4 = -4 * 60; // UTC-4 em minutos
  return new Date(agoraUTC.getTime() + (agoraUTC.getTimezoneOffset() + offsetUTC4) * 60000);
}

function verificarSeDeveEstarAberta(
  horarioAbertura: string,
  horarioFechamento: string,
  diasFuncionamento: DiaSemana[]
): boolean {
  const agora = getDataUTC4();
  const diaAtual = DIAS_MAP[agora.getDay()];
  
  // Verificar se hoje é dia de funcionamento
  if (!diasFuncionamento.includes(diaAtual)) {
    return false;
  }

  // Verificar se está dentro do horário de funcionamento
  const [horaAbertura, minAbertura] = horarioAbertura.split(':').map(Number);
  const [horaFechamento, minFechamento] = horarioFechamento.split(':').map(Number);
  
  const horaAtual = agora.getHours();
  const minAtual = agora.getMinutes();
  
  const minutosAbertura = horaAbertura * 60 + minAbertura;
  const minutosFechamento = horaFechamento * 60 + minFechamento;
  const minutosAtual = horaAtual * 60 + minAtual;

  return minutosAtual >= minutosAbertura && minutosAtual < minutosFechamento;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configurações atuais
    const { data: config, error: configError } = await supabase
      .from('configuracoes_loja')
      .select('*')
      .single();
    
    if (configError) {
      console.error('Erro ao buscar configurações:', configError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar configurações' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const agora = getDataUTC4();
    const horarioAbertura = config.horario_abertura?.slice(0, 5) ?? '13:30';
    const horarioFechamento = config.horario_fechamento?.slice(0, 5) ?? '22:00';
    const diasFuncionamento = (config.dias_funcionamento as DiaSemana[]) ?? ['domingo', 'segunda', 'terca', 'quarta', 'sexta', 'sabado'];

    // Verificar se deveria estar aberta
    const deveriaEstarAberta = verificarSeDeveEstarAberta(
      horarioAbertura,
      horarioFechamento,
      diasFuncionamento
    );

    const statusAtual = config.loja_aberta;
    
    console.log(`[AUTO-LOJA] Horário UTC-4: ${agora.toISOString()}`);
    console.log(`[AUTO-LOJA] Dia: ${DIAS_MAP[agora.getDay()]}, Hora: ${agora.getHours()}:${agora.getMinutes()}`);
    console.log(`[AUTO-LOJA] Horário funcionamento: ${horarioAbertura} - ${horarioFechamento}`);
    console.log(`[AUTO-LOJA] Dias funcionamento: ${diasFuncionamento.join(', ')}`);
    console.log(`[AUTO-LOJA] Status atual: ${statusAtual ? 'ABERTA' : 'FECHADA'}`);
    console.log(`[AUTO-LOJA] Deveria estar: ${deveriaEstarAberta ? 'ABERTA' : 'FECHADA'}`);

    // Só atualiza se o status precisar mudar
    if (statusAtual !== deveriaEstarAberta) {
      const { error: updateError } = await supabase
        .from('configuracoes_loja')
        .update({ 
          loja_aberta: deveriaEstarAberta,
          updated_at: new Date().toISOString()
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (updateError) {
        console.error('Erro ao atualizar status:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[AUTO-LOJA] ✅ Status alterado para: ${deveriaEstarAberta ? 'ABERTA' : 'FECHADA'}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Loja ${deveriaEstarAberta ? 'ABERTA' : 'FECHADA'} automaticamente`,
          statusAnterior: statusAtual,
          novoStatus: deveriaEstarAberta,
          horarioUTC4: agora.toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AUTO-LOJA] ℹ️ Nenhuma alteração necessária`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Nenhuma alteração necessária',
        statusAtual: statusAtual,
        deveriaEstar: deveriaEstarAberta,
        horarioUTC4: agora.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na função auto-loja:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
