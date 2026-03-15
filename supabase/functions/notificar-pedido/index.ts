import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Suporte ao webhook do banco (type: INSERT) e chamada direta
    let record = body.record || body;

    const clienteNome = record?.cliente_nome || 'Cliente';
    const numeroPedido = record?.numero_pedido || '';
    const valorTotal = record?.valor_total
      ? `R$ ${Number(record.valor_total).toFixed(2).replace('.', ',')}`
      : '';

    const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const appId = 'b802ce99-b924-44ea-a43e-8242721dc561';

    if (!restApiKey) {
      return new Response(
        JSON.stringify({ error: 'ONESIGNAL_REST_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const heading = numeroPedido ? `🛒 Novo Pedido #${numeroPedido}` : '🛒 Novo Pedido!';
    const content = valorTotal
      ? `${clienteNome} • ${valorTotal}`
      : clienteNome;

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${restApiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ['All'],
        headings: { pt: heading, en: heading },
        contents: { pt: content, en: content },
        priority: 10,
        ttl: 3600,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro OneSignal:', data);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar notificação', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Notificação enviada:', data.id);

    return new Response(
      JSON.stringify({ success: true, notification_id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
