import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_id, pedido_id } = await req.json();

    if (!payment_id) {
      return new Response(
        JSON.stringify({ error: 'payment_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Configuração de pagamento não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check payment status on Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Erro ao consultar pagamento', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const status = data.status; // approved, pending, rejected, etc.
    const isPago = status === 'approved';

    // If paid, update the order in database
    if (isPago && pedido_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('pedidos')
        .update({
          pix_pago_em: data.date_approved || new Date().toISOString(),
          pix_confirmacao: String(data.id),
        })
        .eq('id', pedido_id);
    }

    return new Response(
      JSON.stringify({
        status: data.status,
        status_detail: data.status_detail,
        is_pago: isPago,
        date_approved: data.date_approved,
        payment_id: data.id,
        transaction_amount: data.transaction_amount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao verificar PIX:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao verificar PIX' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
