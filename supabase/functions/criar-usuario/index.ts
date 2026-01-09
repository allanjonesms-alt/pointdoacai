import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  nome: string;
  telefone: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  referencia?: string;
  isAdmin?: boolean;
  existingProfileId?: string; // If updating an existing synthetic profile
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get the calling user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callingUser }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !callingUser) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if calling user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CreateUserRequest = await req.json();
    const { email, password, nome, telefone, rua, numero, bairro, complemento, referencia, isAdmin, existingProfileId } = body;

    if (!email || !password || !nome || !telefone) {
      return new Response(
        JSON.stringify({ error: 'Email, senha, nome e telefone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If we're updating an existing profile, delete the old synthetic profile first
    if (existingProfileId) {
      // Delete the old synthetic profile (it will be recreated by the trigger)
      const { error: deleteError } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', existingProfileId);

      if (deleteError) {
        console.error('Error deleting old profile:', deleteError);
        // Continue anyway - the profile might not exist
      }

      // Also delete any existing user_roles for the old profile
      await supabaseClient
        .from('user_roles')
        .delete()
        .eq('user_id', existingProfileId);
    }

    // Create the auth user with metadata
    const { data: authData, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        nome,
        telefone: telefone.replace(/\D/g, ''),
        rua: rua || '',
        numero: numero || '',
        bairro: bairro || '',
        complemento: complemento || null,
        referencia: referencia || null,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      
      if (createError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'Este email já está cadastrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If user should be admin, update their role
    if (isAdmin) {
      const { error: updateRoleError } = await supabaseClient
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', authData.user.id);

      if (updateRoleError) {
        console.error('Error updating role:', updateRoleError);
        // Don't fail the whole operation, just log it
      }
    }

    // Update the profile tipo_cliente to 'organico' since it now has auth
    const { error: profileUpdateError } = await supabaseClient
      .from('profiles')
      .update({ tipo_cliente: 'organico' })
      .eq('id', authData.user.id);

    if (profileUpdateError) {
      console.error('Error updating profile:', profileUpdateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user.id,
        message: 'Usuário criado com sucesso' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
