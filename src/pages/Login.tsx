import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    telefone: '',
    senha: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(formData.telefone, formData.senha);

    if (result.success) {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });
      navigate('/');
    } else {
      toast({
        title: 'Erro no login',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero py-12 px-4">
        <div className="container max-w-md mx-auto text-center">
          <Logo size="lg" className="justify-center mb-4" />
          <p className="text-primary-foreground/80">
            Faça login para continuar
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1 -mt-6">
        <div className="container max-w-md mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-float p-6 animate-fade-in-up">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    className="pl-10"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
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
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Não tem uma conta?{' '}
                <Link to="/cadastro" className="text-primary font-semibold hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground text-center">
                Use seu número de telefone e senha para entrar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
