import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Mail, Loader2, KeyRound, Shield, Sparkles, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientes } from '@/hooks/useClientes';
import { toast } from 'sonner';
import EnderecosList from '@/components/EnderecosList';
import { CriarUsuarioModal } from '@/components/admin/CriarUsuarioModal';
const EditarCliente = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clientes, isLoading: loadingClientes, updateCliente } = useClientes();
  
  const cliente = clientes.find(c => c.id === id);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
      });
    }
  }, [cliente]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cliente || !id) return;

    if (!formData.nome || !formData.telefone || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);

    const result = await updateCliente(id, {
      nome: formData.nome,
      telefone: formData.telefone,
      email: formData.email,
    });

    setIsSaving(false);

    if (result.success) {
      toast.success('Cliente atualizado com sucesso!');
      navigate('/admin/clientes');
    } else {
      toast.error(result.error || 'Erro ao atualizar cliente');
    }
  };

  if (loadingClientes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Cliente não encontrado</p>
            <Button onClick={() => navigate('/admin/clientes')} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/clientes')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-0 shadow-elegant">
          <CardHeader className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Editar Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Status do Cliente */}
            <div className="mb-6 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  {cliente.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <Shield className="h-4 w-4" />
                      Administrador
                    </span>
                  ) : cliente.tipo_cliente === 'organico' ? (
                    <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Leaf className="h-4 w-4" />
                      Cliente Orgânico (com login)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <Sparkles className="h-4 w-4" />
                      Cliente Sintético (sem login)
                    </span>
                  )}
                </div>
                
                {cliente.tipo_cliente === 'sintetico' && cliente.role !== 'admin' && (
                  <CriarUsuarioModal
                    onSuccess={() => navigate('/admin/clientes')}
                    existingProfile={{
                      id: cliente.id,
                      nome: cliente.nome,
                      telefone: cliente.telefone,
                      email: cliente.email,
                      rua: cliente.rua,
                      numero: cliente.numero,
                      bairro: cliente.bairro,
                      complemento: cliente.complemento,
                      referencia: cliente.referencia,
                    }}
                    trigger={
                      <Button variant="outline" size="sm" className="gap-2">
                        <KeyRound className="h-4 w-4" />
                        Criar Login
                      </Button>
                    }
                  />
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Dados Pessoais
                </h3>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Nome completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="telefone"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereços de Entrega */}
              <EnderecosList profileId={id} />

              <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditarCliente;
