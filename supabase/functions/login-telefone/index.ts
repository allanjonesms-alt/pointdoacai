import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginTelefoneRequest {
  telefone: string;
  password: string;
}

const phoneToEmail = (telefoneDigits: string) => `${telefoneDigits}@acai.app`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body: LoginTelefoneRequest = await req.json();
    const telefoneDigits = String(body?.telefone ?? '').replace(/\D/g, '');
    const password = String(body?.password ?? '');

    if (telefoneDigits.length < 10 || telefoneDigits.length > 13) {
      return new Response(JSON.stringify({ error: 'Telefone inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Senha inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1) Se existir, tenta o e-mail real do profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('telefone', telefoneDigits)
      .maybeSingle();

    const candidates = [
      ...(profile?.email ? [String(profile.email).toLowerCase()] : []),
      phoneToEmail(telefoneDigits),
    ].filter(Boolean);

    const uniqueCandidates = Array.from(new Set(candidates));

    for (const email of uniqueCandidates) {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.session) {
        return new Response(JSON.stringify({ session: data.session }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Telefone ou senha incorretos' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('login-telefone error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
