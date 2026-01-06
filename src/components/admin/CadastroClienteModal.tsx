import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, UserPlus, User, Phone, Mail, MapPin, Home } from 'lucide-react';

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

interface CadastroClienteModalProps {
  onSuccess: () => void;
}

export function CadastroClienteModal({ onSuccess }: CadastroClienteModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    referencia: '',
    senha: '',
  });

  const handleChange = (field: string, value: string) => {
    if (field === 'telefone') {
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
      rua: '',
      numero: '',
      bairro: '',
      complemento: '',
      referencia: '',
      senha: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.telefone.trim() || !formData.senha.trim()) {
      toast.error('Nome, telefone e senha são obrigatórios');
      return;
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const cleanPhone = formData.telefone.replace(/\D/g, '');
      const userEmail = `${cleanPhone}@acai.app`;

      // Store current session before creating new user
      const { data: currentSession } = await supabase.auth.getSession();

      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userEmail,
        password: formData.senha,
        options: {
          data: {
            nome: formData.nome,
            telefone: cleanPhone,
            rua: formData.rua,
            numero: formData.numero,
            bairro: formData.bairro,
            complemento: formData.complemento,
            referencia: formData.referencia,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Este telefone já está cadastrado');
        } else {
          toast.error(authError.message);
        }
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Wait for trigger to create profile, then update tipo_cliente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            tipo_cliente: 'sintetico',
            email: formData.email || null,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }

        // Restore admin session if it was lost
        if (currentSession?.session) {
          await supabase.auth.setSession({
            access_token: currentSession.session.access_token,
            refresh_token: currentSession.session.refresh_token,
          });
        }
      }

      toast.success('Cliente cadastrado com sucesso!');
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Erro ao cadastrar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="acai" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Cadastrar Cliente Sintético
          </DialogTitle>
          <DialogDescription>
            Clientes sintéticos são cadastrados pelo administrador. O e-mail é opcional.
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

          {/* Email (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail (opcional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                className="pl-10"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="senha">Senha *</Label>
            <Input
              id="senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.senha}
              onChange={(e) => handleChange('senha', e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Endereço
            </h4>

            {/* Rua */}
            <div className="space-y-2 mb-3">
              <Label htmlFor="rua">Rua</Label>
              <Input
                id="rua"
                placeholder="Nome da rua"
                value={formData.rua}
                onChange={(e) => handleChange('rua', e.target.value)}
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
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  placeholder="Bairro"
                  value={formData.bairro}
                  onChange={(e) => handleChange('bairro', e.target.value)}
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
                  Cadastrando...
                </>
              ) : (
                'Cadastrar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}