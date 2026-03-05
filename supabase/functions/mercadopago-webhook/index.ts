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
    // Mercado Pago sends: POST with JSON body containing type and data.id
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body));

    // Only process payment notifications
    if (body.type !== 'payment') {
      console.log('Ignoring non-payment notification:', body.type);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.log('No payment ID in webhook');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'Config missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch payment details from Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const payment = await mpResponse.json();
    console.log('Payment status:', payment.status, 'ID:', paymentId);

    if (payment.status !== 'approved') {
      console.log('Payment not approved yet, status:', payment.status);
      return new Response(JSON.stringify({ received: true, status: payment.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update pedido in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: pedido, error: findError } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, pix_pago_em')
      .eq('pix_payment_id', String(paymentId))
      .single();

    if (findError || !pedido) {
      console.log('Pedido not found for payment_id:', paymentId);
      // Still return 200 so MP doesn't retry
      return new Response(JSON.stringify({ received: true, warning: 'pedido not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Avoid double-processing
    if (pedido.pix_pago_em) {
      console.log('Pedido already marked as paid:', pedido.numero_pedido);
      return new Response(JSON.stringify({ received: true, already_processed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        pix_pago_em: payment.date_approved || new Date().toISOString(),
        pix_confirmacao: String(payment.id),
        status: 'confirmado',
      })
      .eq('id', pedido.id);

    if (updateError) {
      console.error('Error updating pedido:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Pedido updated successfully:', pedido.numero_pedido);

    return new Response(
      JSON.stringify({ received: true, pedido_id: pedido.id, numero_pedido: pedido.numero_pedido }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to prevent MP from retrying on parse errors
    return new Response(JSON.stringify({ received: true, error: String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
