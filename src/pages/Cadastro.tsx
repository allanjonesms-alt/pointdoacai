import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Lock, MapPin, Home, Loader2, ArrowLeft } from 'lucide-react';
import RuaAutocomplete from '@/components/RuaAutocomplete';
import BairroAutocomplete from '@/components/BairroAutocomplete';

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

export default function Cadastro() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    referencia: '',
  });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.nome || !formData.telefone || !formData.senha) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos obrigatórios.',
          variant: 'destructive',
        });
        return;
      }
      if (formData.senha !== formData.confirmarSenha) {
        toast({
          title: 'Senhas não coincidem',
          description: 'As senhas digitadas são diferentes.',
          variant: 'destructive',
        });
        return;
      }
      if (formData.senha.length < 6) {
        toast({
          title: 'Senha muito curta',
          description: 'A senha deve ter pelo menos 6 caracteres.',
          variant: 'destructive',
        });
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rua || !formData.numero || !formData.bairro) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha Rua, Número e Bairro.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const result = await register({
      nome: formData.nome,
      telefone: formData.telefone,
      senha: formData.senha,
      endereco: {
        rua: formData.rua,
        numero: formData.numero,
        bairro: formData.bairro,
        complemento: formData.complemento,
        referencia: formData.referencia,
      },
    });

    if (result.success) {
      toast({
        title: 'Cadastro realizado!',
        description: 'Sua conta foi criada com sucesso.',
      });
      navigate('/');
    } else {
      toast({
        title: 'Erro no cadastro',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero py-8 px-4">
        <div className="container max-w-md mx-auto">
          <button
            onClick={() => step === 1 ? navigate('/login') : setStep(1)}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>
          <Logo size="md" className="justify-center" />
          <div className="text-center mt-4">
            <h1 className="text-xl font-display font-bold text-primary-foreground">
              {step === 1 ? 'Crie sua conta' : 'Endereço de entrega'}
            </h1>
            <div className="flex justify-center gap-2 mt-3">
              <div className={`w-16 h-1 rounded-full ${step >= 1 ? 'bg-primary-foreground' : 'bg-primary-foreground/30'}`} />
              <div className={`w-16 h-1 rounded-full ${step >= 2 ? 'bg-primary-foreground' : 'bg-primary-foreground/30'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1 -mt-4">
        <div className="container max-w-md mx-auto px-4 pb-8">
          <div className="bg-card rounded-2xl shadow-float p-6 animate-fade-in-up">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="nome"
                      placeholder="Seu nome"
                      className="pl-10"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      className="pl-10"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="senha"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmarSenha"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="acai"
                  size="lg"
                  className="w-full mt-6"
                  onClick={handleNext}
                >
                  Continuar
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="rua">Rua *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="rua"
                        placeholder="Nome da rua"
                        className="pl-10"
                        value={formData.rua}
                        onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Nº *</Label>
                    <Input
                      id="numero"
                      placeholder="123"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="bairro"
                      placeholder="Seu bairro"
                      className="pl-10"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    placeholder="Apto, bloco, etc. (opcional)"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referencia">Referência</Label>
                  <Input
                    id="referencia"
                    placeholder="Próximo a... (opcional)"
                    value={formData.referencia}
                    onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                  />
                </div>

                <Button
                  type="submit"
                  variant="acai"
                  size="lg"
                  className="w-full mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar conta'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
