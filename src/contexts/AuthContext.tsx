import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
}

interface UserWithProfile {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    complemento?: string;
    referencia?: string;
  };
  role: 'cliente' | 'admin';
  valorTotalCompras: number;
}

// Helper to convert phone to email format for Supabase auth
const phoneToEmail = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  return `${cleanPhone}@acai.app`;
};

interface AuthContextType {
  user: UserWithProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (identificador: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  nome: string;
  telefone: string;
  senha: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    complemento?: string;
    referencia?: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string): Promise<UserWithProfile | null> => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      const role = (roleData?.role as 'cliente' | 'admin') || 'cliente';

      return {
        id: profile.id,
        nome: profile.nome,
        telefone: profile.telefone,
        email: profile.email,
        endereco: {
          rua: profile.rua,
          numero: profile.numero,
          bairro: profile.bairro,
          complemento: profile.complemento || undefined,
          referencia: profile.referencia || undefined,
        },
        role,
        valorTotalCompras: Number(profile.valor_total_compras) || 0,
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id).then(setUser);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id).then(profile => {
          setUser(profile);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (identificador: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const raw = identificador.trim();
      const isEmail = raw.includes('@');
      
      // If it's an email, try login directly
      if (isEmail) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: raw.toLowerCase(),
          password,
        });

        if (error) {
          return {
            success: false,
            error:
              error.message === 'Invalid login credentials'
                ? 'E-mail ou senha incorretos'
                : error.message,
          };
        }

        if (data.user) {
          const profile = await fetchUserProfile(data.user.id);
          setUser(profile);
        }

        return { success: true };
      }

      // It's a phone number - try both email formats
      const cleanPhone = raw.replace(/\D/g, '');
      const phoneEmail = phoneToEmail(raw); // Format: {phone}@acai.app

      // First, try with the phone-based email (for users registered via app)
      const { data: phoneData, error: phoneError } = await supabase.auth.signInWithPassword({
        email: phoneEmail,
        password,
      });

      if (!phoneError && phoneData.user) {
        const profile = await fetchUserProfile(phoneData.user.id);
        setUser(profile);
        return { success: true };
      }

      // If that fails, try to find a profile with this phone and use their real email
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('telefone', cleanPhone)
        .maybeSingle();

      if (profileData?.email) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: profileData.email,
          password,
        });

        if (error) {
          return {
            success: false,
            error:
              error.message === 'Invalid login credentials'
                ? 'Telefone ou senha incorretos'
                : error.message,
          };
        }

        if (data.user) {
          const profile = await fetchUserProfile(data.user.id);
          setUser(profile);
        }

        return { success: true };
      }

      // No profile found or no real email, return error from first attempt
      return {
        success: false,
        error: 'Telefone ou senha incorretos',
      };
    } catch (error) {
      return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const cleanPhone = userData.telefone.replace(/\D/g, '');
      const email = phoneToEmail(userData.telefone);
      
      // Check if there's an existing synthetic profile with this phone
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('telefone', cleanPhone)
        .maybeSingle();

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password: userData.senha,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome: userData.nome,
            telefone: cleanPhone,
            rua: userData.endereco.rua,
            numero: userData.endereco.numero,
            bairro: userData.endereco.bairro,
            complemento: userData.endereco.complemento,
            referencia: userData.endereco.referencia,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { success: false, error: 'Este telefone já está cadastrado' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500));

        // If there was a synthetic profile, migrate data to the new auth user profile
        if (existingProfile && existingProfile.tipo_cliente === 'sintetico') {
          // Update the trigger-created profile with synthetic data + new user data + mark as organic
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              nome: userData.nome,
              rua: userData.endereco.rua,
              numero: userData.endereco.numero,
              bairro: userData.endereco.bairro,
              complemento: userData.endereco.complemento || null,
              referencia: userData.endereco.referencia || null,
              tipo_cliente: 'organico',
              // Preserve important data from synthetic profile
              valor_total_compras: existingProfile.valor_total_compras || 0,
              email: existingProfile.email || null,
            })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('Error updating profile:', updateError);
          }

          // Delete the old synthetic profile (it's no longer needed)
          await supabase.from('profiles').delete().eq('id', existingProfile.id);
        }

        const profile = await fetchUserProfile(data.user.id);
        setUser(profile);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao criar conta. Tente novamente.' };
    }
  };

  const updateProfile = async (data: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    if (!session?.user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', session.user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Refresh user profile
      const profile = await fetchUserProfile(session.user.id);
      setUser(profile);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar perfil' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
