import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, ArrowLeft, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Bairro {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export default function AdminBairros() {
  const navigate = useNavigate();
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBairro, setNewBairro] = useState('');
  const [editingBairro, setEditingBairro] = useState<Bairro | null>(null);
  const [editName, setEditName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBairros = async () => {
    const { data, error } = await supabase
      .from('bairros')
      .select('*')
      .order('nome');
    
    if (error) {
      toast.error('Erro ao carregar bairros');
      console.error(error);
    } else {
      setBairros(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBairros();

    const channel = supabase
      .channel('bairros-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bairros'
        },
        () => {
          fetchBairros();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddBairro = async () => {
    if (!newBairro.trim()) {
      toast.error('Digite o nome do bairro');
      return;
    }

    const { error } = await supabase
      .from('bairros')
      .insert({ nome: newBairro.trim() });

    if (error) {
      toast.error('Erro ao adicionar bairro');
      console.error(error);
    } else {
      toast.success('Bairro adicionado com sucesso');
      setNewBairro('');
      setIsAddDialogOpen(false);
    }
  };

  const handleEditBairro = async () => {
    if (!editingBairro || !editName.trim()) {
      toast.error('Digite o nome do bairro');
      return;
    }

    const { error } = await supabase
      .from('bairros')
      .update({ nome: editName.trim() })
      .eq('id', editingBairro.id);

    if (error) {
      toast.error('Erro ao editar bairro');
      console.error(error);
    } else {
      toast.success('Bairro atualizado com sucesso');
      setEditingBairro(null);
      setEditName('');
      setIsEditDialogOpen(false);
    }
  };

  const handleToggleAtivo = async (bairro: Bairro) => {
    const { error } = await supabase
      .from('bairros')
      .update({ ativo: !bairro.ativo })
      .eq('id', bairro.id);

    if (error) {
      toast.error('Erro ao alterar status do bairro');
      console.error(error);
    } else {
      toast.success(bairro.ativo ? 'Bairro desativado' : 'Bairro ativado');
    }
  };

  const openEditDialog = (bairro: Bairro) => {
    setEditingBairro(bairro);
    setEditName(bairro.nome);
    setIsEditDialogOpen(true);
  };

  const filteredBairros = bairros.filter(bairro =>
    bairro.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Gerenciar Bairros</h1>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Bairros Cadastrados</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Bairro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-bairro">Nome do Bairro</Label>
                    <Input
                      id="new-bairro"
                      value={newBairro}
                      onChange={(e) => setNewBairro(e.target.value)}
                      placeholder="Digite o nome do bairro"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddBairro()}
                    />
                  </div>
                  <Button onClick={handleAddBairro} className="w-full">
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar bairro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBairros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {searchQuery ? 'Nenhum bairro encontrado' : 'Nenhum bairro cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBairros.map((bairro) => (
                    <TableRow key={bairro.id}>
                      <TableCell className="font-medium">{bairro.nome}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={bairro.ativo}
                          onCheckedChange={() => handleToggleAtivo(bairro)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(bairro)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Bairro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bairro">Nome do Bairro</Label>
                <Input
                  id="edit-bairro"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Digite o nome do bairro"
                  onKeyDown={(e) => e.key === 'Enter' && handleEditBairro()}
                />
              </div>
              <Button onClick={handleEditBairro} className="w-full">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
