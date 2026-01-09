import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function EsqueciSenha() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Por favor, informe seu e-mail');
      return;
    }

    // Validate email format
    if (!email.includes('@')) {
      toast.error('Por favor, informe um e-mail válido');
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/redefinir-senha`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Reset password error:', error);
        toast.error('Erro ao enviar e-mail de recuperação');
        setIsLoading(false);
        return;
      }

      setEmailSent(true);
      toast.success('E-mail de recuperação enviado!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="gradient-hero py-12 px-4">
          <div className="container max-w-md mx-auto text-center">
            <Logo size="lg" className="justify-center mb-4" />
            <p className="text-primary-foreground/80">
              Recuperação de Senha
            </p>
          </div>
        </div>

        <div className="flex-1 -mt-6">
          <div className="container max-w-md mx-auto px-4">
            <div className="bg-card rounded-2xl shadow-float p-6 animate-fade-in-up text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-xl font-bold mb-2">E-mail Enviado!</h2>
              <p className="text-muted-foreground mb-6">
                Enviamos um link de recuperação para <strong>{email}</strong>. 
                Verifique sua caixa de entrada e spam.
              </p>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEmailSent(false)}
                >
                  Enviar novamente
                </Button>
                
                <Link to="/login">
                  <Button variant="acai" className="w-full">
                    Voltar ao Login
                  </Button>
                </Link>
              </div>
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
            Recuperação de Senha
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1 -mt-6">
        <div className="container max-w-md mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-float p-6 animate-fade-in-up">
            <div className="mb-6">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </Link>
            </div>

            <h2 className="text-xl font-bold mb-2">Esqueceu sua senha?</h2>
            <p className="text-muted-foreground mb-6">
              Informe o e-mail cadastrado na sua conta e enviaremos um link para redefinir sua senha.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
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
                    Enviando...
                  </>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground text-center">
                O link de recuperação expira em 1 hora
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
