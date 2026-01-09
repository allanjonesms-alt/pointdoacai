import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [passwordReset, setPasswordReset] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // The user should have a session from the recovery link
      if (session) {
        setIsValidSession(true);
      } else {
        // Listen for auth state changes (recovery link will trigger this)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            setIsValidSession(true);
          } else if (session) {
            setIsValidSession(true);
          }
        });

        // Set a timeout to show error if no session
        setTimeout(() => {
          if (isValidSession === null) {
            setIsValidSession(false);
          }
        }, 3000);

        return () => subscription.unsubscribe();
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        console.error('Update password error:', error);
        toast.error(error.message || 'Erro ao redefinir senha');
        setIsLoading(false);
        return;
      }

      setPasswordReset(true);
      toast.success('Senha redefinida com sucesso!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid/expired link
  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="gradient-hero py-12 px-4">
          <div className="container max-w-md mx-auto text-center">
            <Logo size="lg" className="justify-center mb-4" />
            <p className="text-primary-foreground/80">
              Redefinir Senha
            </p>
          </div>
        </div>

        <div className="flex-1 -mt-6">
          <div className="container max-w-md mx-auto px-4">
            <div className="bg-card rounded-2xl shadow-float p-6 animate-fade-in-up text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h2 className="text-xl font-bold mb-2">Link Inválido ou Expirado</h2>
              <p className="text-muted-foreground mb-6">
                O link de recuperação expirou ou é inválido. Por favor, solicite um novo link.
              </p>

              <Button
                variant="acai"
                className="w-full"
                onClick={() => navigate('/esqueci-senha')}
              >
                Solicitar Novo Link
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (passwordReset) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="gradient-hero py-12 px-4">
          <div className="container max-w-md mx-auto text-center">
            <Logo size="lg" className="justify-center mb-4" />
            <p className="text-primary-foreground/80">
              Senha Redefinida
            </p>
          </div>
        </div>

        <div className="flex-1 -mt-6">
          <div className="container max-w-md mx-auto px-4">
            <div className="bg-card rounded-2xl shadow-float p-6 animate-fade-in-up text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-xl font-bold mb-2">Senha Atualizada!</h2>
              <p className="text-muted-foreground mb-6">
                Sua senha foi redefinida com sucesso. Você será redirecionado para o login.
              </p>

              <Button
                variant="acai"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Ir para Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero py-12 px-4">
        <div className="container max-w-md mx-auto text-center">
          <Logo size="lg" className="justify-center mb-4" />
          <p className="text-primary-foreground/80">
            Redefinir Senha
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1 -mt-6">
        <div className="container max-w-md mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-float p-6 animate-fade-in-up">
            <h2 className="text-xl font-bold mb-2">Criar Nova Senha</h2>
            <p className="text-muted-foreground mb-6">
              Digite sua nova senha abaixo.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirme a senha"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="acai"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
