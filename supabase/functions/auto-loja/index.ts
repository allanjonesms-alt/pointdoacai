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

// Retorna a data "agora" deslocada para UTC-4 (Manaus)
function getAgoraUTC4(): Date {
  const agoraUTC = new Date();
  return new Date(agoraUTC.getTime() + (agoraUTC.getTimezoneOffset() + (-4 * 60)) * 60000);
}

function parseHora(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { h, m };
}

/**
 * Encontra a transição programada (abertura ou fechamento) mais recente
 * anterior ou igual a `agora`, considerando os dias de funcionamento.
 *
 * Retorna { instante, statusApos } — o status da loja imediatamente após
 * essa transição (true = abriu, false = fechou).
 *
 * Varre até 8 dias para trás para garantir cobertura mesmo com dias fechados.
 */
function ultimaTransicaoProgramada(
  agora: Date,
  horarioAbertura: string,
  horarioFechamento: string,
  diasFuncionamento: DiaSemana[]
): { instante: Date; statusApos: boolean } | null {
  const { h: hA, m: mA } = parseHora(horarioAbertura);
  const { h: hF, m: mF } = parseHora(horarioFechamento);

  const eventos: { instante: Date; statusApos: boolean }[] = [];

  for (let i = 0; i < 8; i++) {
    const d = new Date(agora);
    d.setDate(d.getDate() - i);
    const dia = DIAS_MAP[d.getDay()];
    if (!diasFuncionamento.includes(dia)) continue;

    const abertura = new Date(d);
    abertura.setHours(hA, mA, 0, 0);
    const fechamento = new Date(d);
    fechamento.setHours(hF, mF, 0, 0);

    if (abertura <= agora) eventos.push({ instante: abertura, statusApos: true });
    if (fechamento <= agora) eventos.push({ instante: fechamento, statusApos: false });
  }

  if (eventos.length === 0) return null;

  // A transição efetiva é a mais recente
  eventos.sort((a, b) => b.instante.getTime() - a.instante.getTime());
  return eventos[0];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const agora = getAgoraUTC4();
    const horarioAbertura = config.horario_abertura?.slice(0, 5) ?? '13:30';
    const horarioFechamento = config.horario_fechamento?.slice(0, 5) ?? '22:00';
    const diasFuncionamento = (config.dias_funcionamento as DiaSemana[]) ?? ['domingo', 'segunda', 'terca', 'quarta', 'sexta', 'sabado'];
    const statusAtual: boolean = config.loja_aberta;
    const overrideEm: string | null = (config as any).override_manual_em ?? null;
    const overrideStatus: boolean | null = (config as any).override_manual_status ?? null;

    const ultima = ultimaTransicaoProgramada(agora, horarioAbertura, horarioFechamento, diasFuncionamento);

    console.log(`[AUTO-LOJA] Agora UTC-4: ${agora.toISOString()} (${DIAS_MAP[agora.getDay()]})`);
    console.log(`[AUTO-LOJA] Horário: ${horarioAbertura} - ${horarioFechamento} | Dias: ${diasFuncionamento.join(',')}`);
    console.log(`[AUTO-LOJA] Última transição programada: ${ultima ? `${ultima.instante.toISOString()} -> ${ultima.statusApos ? 'ABERTA' : 'FECHADA'}` : 'nenhuma'}`);
    console.log(`[AUTO-LOJA] Override manual: ${overrideEm ?? 'nenhum'} -> ${overrideStatus}`);
    console.log(`[AUTO-LOJA] Status atual: ${statusAtual ? 'ABERTA' : 'FECHADA'}`);

    // Determinar status desejado
    let statusDesejado: boolean;
    let motivo: string;

    if (overrideEm && ultima) {
      // Converter override (UTC absoluto do banco) para o mesmo "frame UTC-4 naïve" usado em `ultima.instante`
      const overrideUTC = new Date(overrideEm);
      const overrideUTC4 = new Date(overrideUTC.getTime() + (overrideUTC.getTimezoneOffset() + (-4 * 60)) * 60000);

      if (overrideUTC4 > ultima.instante) {
        statusDesejado = overrideStatus ?? ultima.statusApos;
        motivo = 'override manual ainda válido (após última transição programada)';
      } else {
        statusDesejado = ultima.statusApos;
        motivo = 'override manual expirado, aplicando programação';
      }
    } else if (ultima) {
      statusDesejado = ultima.statusApos;
      motivo = 'sem override, aplicando programação';
    } else {
      statusDesejado = false;
      motivo = 'nenhuma transição encontrada — fechada por padrão';
    }

    console.log(`[AUTO-LOJA] Status desejado: ${statusDesejado ? 'ABERTA' : 'FECHADA'} (${motivo})`);

    if (statusAtual !== statusDesejado) {
      const updateData: Record<string, unknown> = {
        loja_aberta: statusDesejado,
        updated_at: new Date().toISOString(),
      };

      // Se a aplicação programada sobrescreveu o override, limpamos o override
      if (motivo.startsWith('override manual expirado') || motivo.startsWith('sem override')) {
        updateData.override_manual_em = null;
        updateData.override_manual_status = null;
      }

      const { error: updateError } = await supabase
        .from('configuracoes_loja')
        .update(updateData)
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (updateError) {
        console.error('Erro ao atualizar status:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[AUTO-LOJA] ✅ Status alterado para: ${statusDesejado ? 'ABERTA' : 'FECHADA'}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Loja ${statusDesejado ? 'ABERTA' : 'FECHADA'} automaticamente`,
          motivo,
          statusAnterior: statusAtual,
          novoStatus: statusDesejado,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AUTO-LOJA] ℹ️ Nenhuma alteração necessária (${motivo})`);
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Nenhuma alteração necessária',
        motivo,
        statusAtual,
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
