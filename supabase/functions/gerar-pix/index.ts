import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PixRequest {
  valor: number;
  descricao: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { valor, descricao }: PixRequest = await req.json();

    console.log(`Gerando PIX: valor=${valor}, descricao=${descricao}`);

    if (!valor || valor <= 0) {
      return new Response(
        JSON.stringify({ error: 'Valor inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
      return new Response(
        JSON.stringify({ error: 'Configuração de pagamento não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar pagamento PIX no Mercado Pago
    const paymentData = {
      transaction_amount: valor,
      description: descricao || 'Pedido Açaí',
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@acai.app',
        first_name: 'Cliente',
        last_name: 'Acai',
        identification: {
          type: 'CPF',
          number: '00000000000'
        }
      }
    };

    console.log('Enviando requisição para Mercado Pago...');

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    console.log('Resposta do Mercado Pago:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Erro do Mercado Pago:', data);
      return new Response(
        JSON.stringify({ 
          error: data.message || 'Erro ao gerar PIX',
          details: data 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair dados do QR Code PIX
    const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCode || !qrCodeBase64) {
      console.error('QR Code não retornado pelo Mercado Pago');
      return new Response(
        JSON.stringify({ error: 'QR Code PIX não disponível' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('PIX gerado com sucesso!');

    return new Response(
      JSON.stringify({
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        payment_id: data.id,
        status: data.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao gerar PIX' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
