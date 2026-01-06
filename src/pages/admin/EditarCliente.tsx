import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientes } from '@/hooks/useClientes';
import { toast } from 'sonner';

const EditarCliente = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clientes, isLoading: loadingClientes, updateCliente } = useClientes();
  
  const cliente = clientes.find(c => c.id === id);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    referencia: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
        rua: cliente.rua,
        numero: cliente.numero,
        bairro: cliente.bairro,
        complemento: cliente.complemento || '',
        referencia: cliente.referencia || '',
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

    if (!formData.rua || !formData.numero || !formData.bairro) {
      toast.error('Preencha o endereço completo');
      return;
    }

    setIsSaving(true);

    const result = await updateCliente(id, {
      nome: formData.nome,
      telefone: formData.telefone,
      email: formData.email,
      rua: formData.rua,
      numero: formData.numero,
      bairro: formData.bairro,
      complemento: formData.complemento || null,
      referencia: formData.referencia || null,
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

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Endereço
                </h3>
                
                <div className="grid gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="rua">Rua *</Label>
                      <Input
                        id="rua"
                        name="rua"
                        value={formData.rua}
                        onChange={handleChange}
                        placeholder="Nome da rua"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número *</Label>
                      <Input
                        id="numero"
                        name="numero"
                        value={formData.numero}
                        onChange={handleChange}
                        placeholder="Nº"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro *</Label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="bairro"
                        name="bairro"
                        value={formData.bairro}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Nome do bairro"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleChange}
                      placeholder="Apartamento, bloco, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referencia">Ponto de Referência</Label>
                    <Input
                      id="referencia"
                      name="referencia"
                      value={formData.referencia}
                      onChange={handleChange}
                      placeholder="Próximo a..."
                    />
                  </div>
                </div>
              </div>

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
