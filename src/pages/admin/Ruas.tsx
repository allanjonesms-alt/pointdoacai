import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Loader2, MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Rua {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export default function AdminRuas() {
  const [ruas, setRuas] = useState<Rua[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ruaToEdit, setRuaToEdit] = useState<Rua | null>(null);
  const [formNome, setFormNome] = useState('');

  const fetchRuas = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ruas')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setRuas(data || []);
    } catch (err) {
      console.error('Error fetching ruas:', err);
      toast.error('Erro ao carregar ruas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuas();
  }, []);

  const handleAddRua = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNome.trim()) {
      toast.error('Digite o nome da rua');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ruas')
        .insert({ nome: formNome.trim() });

      if (error) {
        if (error.code === '23505') {
          toast.error('Esta rua já está cadastrada');
        } else {
          throw error;
        }
      } else {
        toast.success('Rua adicionada com sucesso!');
        setIsAddDialogOpen(false);
        setFormNome('');
        fetchRuas();
      }
    } catch (err) {
      console.error('Error adding rua:', err);
      toast.error('Erro ao adicionar rua');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRua = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ruaToEdit || !formNome.trim()) {
      toast.error('Digite o nome da rua');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ruas')
        .update({ nome: formNome.trim() })
        .eq('id', ruaToEdit.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Esta rua já está cadastrada');
        } else {
          throw error;
        }
      } else {
        toast.success('Rua atualizada com sucesso!');
        setIsEditDialogOpen(false);
        setRuaToEdit(null);
        setFormNome('');
        fetchRuas();
      }
    } catch (err) {
      console.error('Error updating rua:', err);
      toast.error('Erro ao atualizar rua');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAtivo = async (rua: Rua) => {
    try {
      const { error } = await supabase
        .from('ruas')
        .update({ ativo: !rua.ativo })
        .eq('id', rua.id);

      if (error) throw error;

      toast.success(rua.ativo ? 'Rua desativada' : 'Rua ativada');
      fetchRuas();
    } catch (err) {
      console.error('Error toggling rua:', err);
      toast.error('Erro ao alterar status da rua');
    }
  };

  const openEditDialog = (rua: Rua) => {
    setRuaToEdit(rua);
    setFormNome(rua.nome);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/admin">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <Card className="border-0 shadow-elegant">
          <CardHeader className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Gerenciar Ruas
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Rua
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Adicionar Rua
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddRua} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome da Rua *</Label>
                      <Input
                        id="nome"
                        value={formNome}
                        onChange={(e) => setFormNome(e.target.value)}
                        placeholder="Ex: Rua das Flores"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setFormNome('');
                        }}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Adicionar'
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : ruas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma rua cadastrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-24 text-center">Ativo</TableHead>
                    <TableHead className="w-20 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ruas.map((rua) => (
                    <TableRow key={rua.id} className={!rua.ativo ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{rua.nome}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={rua.ativo}
                            onCheckedChange={() => handleToggleAtivo(rua)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(rua)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setRuaToEdit(null);
            setFormNome('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" />
                Editar Rua
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditRua} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome da Rua *</Label>
                <Input
                  id="edit-nome"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Rua das Flores"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setRuaToEdit(null);
                    setFormNome('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
