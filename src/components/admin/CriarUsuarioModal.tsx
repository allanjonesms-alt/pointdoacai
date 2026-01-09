import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, UserPlus, User, Phone, Mail, MapPin, Home, Lock, Shield } from 'lucide-react';
import RuaAutocomplete from '@/components/RuaAutocomplete';
import BairroAutocomplete from '@/components/BairroAutocomplete';

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

interface CriarUsuarioModalProps {
  onSuccess: () => void;
  existingProfile?: {
    id: string;
    nome: string;
    telefone: string;
    email?: string | null;
    rua?: string;
    numero?: string;
    bairro?: string;
    complemento?: string | null;
    referencia?: string | null;
  } | null;
  trigger?: React.ReactNode;
}

export function CriarUsuarioModal({ onSuccess, existingProfile, trigger }: CriarUsuarioModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    password: '',
    confirmPassword: '',
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    referencia: '',
    isAdmin: false,
  });

  // Pre-fill form when existingProfile changes
  useEffect(() => {
    if (existingProfile && open) {
      setFormData({
        nome: existingProfile.nome || '',
        telefone: formatPhone(existingProfile.telefone || ''),
        email: existingProfile.email || '',
        password: '',
        confirmPassword: '',
        rua: existingProfile.rua || '',
        numero: existingProfile.numero || '',
        bairro: existingProfile.bairro || '',
        complemento: existingProfile.complemento || '',
        referencia: existingProfile.referencia || '',
        isAdmin: false,
      });
    }
  }, [existingProfile, open]);

  const handleChange = (field: string, value: string | boolean) => {
    if (field === 'telefone' && typeof value === 'string') {
      setFormData({ ...formData, telefone: formatPhone(value) });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      password: '',
      confirmPassword: '',
      rua: '',
      numero: '',
      bairro: '',
      complemento: '',
      referencia: '',
      isAdmin: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.telefone.trim() || !formData.email.trim() || !formData.password) {
      toast.error('Nome, telefone, email e senha são obrigatórios');
      return;
    }

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
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast.error('Você precisa estar logado');
        setIsLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('criar-usuario', {
        body: {
          email: formData.email.trim(),
          password: formData.password,
          nome: formData.nome.trim(),
          telefone: formData.telefone.replace(/\D/g, ''),
          rua: formData.rua,
          numero: formData.numero,
          bairro: formData.bairro,
          complemento: formData.complemento || null,
          referencia: formData.referencia || null,
          isAdmin: formData.isAdmin,
          existingProfileId: existingProfile?.id || null,
        },
      });

      if (response.error) {
        console.error('Error creating user:', response.error);
        toast.error(response.error.message || 'Erro ao criar usuário');
        setIsLoading(false);
        return;
      }

      if (response.data?.error) {
        toast.error(response.data.error);
        setIsLoading(false);
        return;
      }

      toast.success(existingProfile 
        ? 'Conta de login criada com sucesso!' 
        : 'Usuário criado com sucesso!');
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="acai" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {existingProfile ? 'Criar Login para Cliente' : 'Criar Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {existingProfile 
              ? `Criar conta de acesso para ${existingProfile.nome}`
              : 'Crie um usuário com email e senha para acessar o sistema.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="nome"
                placeholder="Nome completo"
                className="pl-10"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="telefone"
                type="tel"
                placeholder="(00) 00000-0000"
                className="pl-10"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                className="pl-10"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="pl-10"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme a senha"
                className="pl-10"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Admin switch */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <div>
                <Label htmlFor="isAdmin" className="font-medium">Administrador</Label>
                <p className="text-xs text-muted-foreground">
                  Terá acesso total ao sistema
                </p>
              </div>
            </div>
            <Switch
              id="isAdmin"
              checked={formData.isAdmin}
              onCheckedChange={(checked) => handleChange('isAdmin', checked)}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Endereço
            </h4>

            {/* Rua */}
            <div className="space-y-2 mb-3">
              <Label>Rua</Label>
              <RuaAutocomplete
                value={formData.rua}
                onChange={(value) => handleChange('rua', value)}
                placeholder="Selecione a rua..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Número */}
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="numero"
                    placeholder="Nº"
                    className="pl-10"
                    value={formData.numero}
                    onChange={(e) => handleChange('numero', e.target.value)}
                  />
                </div>
              </div>

              {/* Bairro */}
              <div className="space-y-2">
                <Label>Bairro</Label>
                <BairroAutocomplete
                  value={formData.bairro}
                  onChange={(value) => handleChange('bairro', value)}
                  placeholder="Selecione o bairro..."
                />
              </div>
            </div>

            {/* Complemento */}
            <div className="space-y-2 mb-3">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                placeholder="Apto, bloco, etc."
                value={formData.complemento}
                onChange={(e) => handleChange('complemento', e.target.value)}
              />
            </div>

            {/* Referência */}
            <div className="space-y-2">
              <Label htmlFor="referencia">Ponto de Referência</Label>
              <Input
                id="referencia"
                placeholder="Próximo a..."
                value={formData.referencia}
                onChange={(e) => handleChange('referencia', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="acai"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                'Criar Usuário'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
