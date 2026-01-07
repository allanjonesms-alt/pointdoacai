import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Loader2, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface Bairro {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export default function AdminEnderecos() {
  // State for Ruas
  const [ruas, setRuas] = useState<Rua[]>([]);
  const [ruaSearchQuery, setRuaSearchQuery] = useState('');
  const [isRuasLoading, setIsRuasLoading] = useState(true);
  const [isAddRuaDialogOpen, setIsAddRuaDialogOpen] = useState(false);
  const [isEditRuaDialogOpen, setIsEditRuaDialogOpen] = useState(false);
  const [isRuaSaving, setIsRuaSaving] = useState(false);
  const [ruaToEdit, setRuaToEdit] = useState<Rua | null>(null);
  const [ruaFormNome, setRuaFormNome] = useState('');

  // State for Bairros
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [bairroSearchQuery, setBairroSearchQuery] = useState('');
  const [isBairrosLoading, setIsBairrosLoading] = useState(true);
  const [isAddBairroDialogOpen, setIsAddBairroDialogOpen] = useState(false);
  const [isEditBairroDialogOpen, setIsEditBairroDialogOpen] = useState(false);
  const [isBairroSaving, setIsBairroSaving] = useState(false);
  const [bairroToEdit, setBairroToEdit] = useState<Bairro | null>(null);
  const [bairroFormNome, setBairroFormNome] = useState('');

  // Fetch Ruas
  const fetchRuas = async () => {
    try {
      setIsRuasLoading(true);
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
      setIsRuasLoading(false);
    }
  };

  // Fetch Bairros
  const fetchBairros = async () => {
    try {
      setIsBairrosLoading(true);
      const { data, error } = await supabase
        .from('bairros')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setBairros(data || []);
    } catch (err) {
      console.error('Error fetching bairros:', err);
      toast.error('Erro ao carregar bairros');
    } finally {
      setIsBairrosLoading(false);
    }
  };

  useEffect(() => {
    fetchRuas();
    fetchBairros();

    // Real-time subscriptions
    const ruasChannel = supabase
      .channel('ruas-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ruas' },
        () => fetchRuas()
      )
      .subscribe();

    const bairrosChannel = supabase
      .channel('bairros-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bairros' },
        () => fetchBairros()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ruasChannel);
      supabase.removeChannel(bairrosChannel);
    };
  }, []);

  // Filtered lists
  const filteredRuas = ruas.filter(rua =>
    rua.nome.toLowerCase().includes(ruaSearchQuery.toLowerCase())
  );

  const filteredBairros = bairros.filter(bairro =>
    bairro.nome.toLowerCase().includes(bairroSearchQuery.toLowerCase())
  );

  // Rua handlers
  const handleAddRua = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruaFormNome.trim()) {
      toast.error('Digite o nome da rua');
      return;
    }

    setIsRuaSaving(true);
    try {
      const { error } = await supabase
        .from('ruas')
        .insert({ nome: ruaFormNome.trim() });

      if (error) {
        if (error.code === '23505') {
          toast.error('Esta rua já está cadastrada');
        } else {
          throw error;
        }
      } else {
        toast.success('Rua adicionada com sucesso!');
        setIsAddRuaDialogOpen(false);
        setRuaFormNome('');
      }
    } catch (err) {
      console.error('Error adding rua:', err);
      toast.error('Erro ao adicionar rua');
    } finally {
      setIsRuaSaving(false);
    }
  };

  const handleEditRua = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruaToEdit || !ruaFormNome.trim()) {
      toast.error('Digite o nome da rua');
      return;
    }

    setIsRuaSaving(true);
    try {
      const { error } = await supabase
        .from('ruas')
        .update({ nome: ruaFormNome.trim() })
        .eq('id', ruaToEdit.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Esta rua já está cadastrada');
        } else {
          throw error;
        }
      } else {
        toast.success('Rua atualizada com sucesso!');
        setIsEditRuaDialogOpen(false);
        setRuaToEdit(null);
        setRuaFormNome('');
      }
    } catch (err) {
      console.error('Error updating rua:', err);
      toast.error('Erro ao atualizar rua');
    } finally {
      setIsRuaSaving(false);
    }
  };

  const handleToggleRuaAtivo = async (rua: Rua) => {
    try {
      const { error } = await supabase
        .from('ruas')
        .update({ ativo: !rua.ativo })
        .eq('id', rua.id);

      if (error) throw error;
      toast.success(rua.ativo ? 'Rua desativada' : 'Rua ativada');
    } catch (err) {
      console.error('Error toggling rua:', err);
      toast.error('Erro ao alterar status da rua');
    }
  };

  const openEditRuaDialog = (rua: Rua) => {
    setRuaToEdit(rua);
    setRuaFormNome(rua.nome);
    setIsEditRuaDialogOpen(true);
  };

  // Bairro handlers
  const handleAddBairro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bairroFormNome.trim()) {
      toast.error('Digite o nome do bairro');
      return;
    }

    setIsBairroSaving(true);
    try {
      const { error } = await supabase
        .from('bairros')
        .insert({ nome: bairroFormNome.trim() });

      if (error) {
        if (error.code === '23505') {
          toast.error('Este bairro já está cadastrado');
        } else {
          throw error;
        }
      } else {
        toast.success('Bairro adicionado com sucesso!');
        setIsAddBairroDialogOpen(false);
        setBairroFormNome('');
      }
    } catch (err) {
      console.error('Error adding bairro:', err);
      toast.error('Erro ao adicionar bairro');
    } finally {
      setIsBairroSaving(false);
    }
  };

  const handleEditBairro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bairroToEdit || !bairroFormNome.trim()) {
      toast.error('Digite o nome do bairro');
      return;
    }

    setIsBairroSaving(true);
    try {
      const { error } = await supabase
        .from('bairros')
        .update({ nome: bairroFormNome.trim() })
        .eq('id', bairroToEdit.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Este bairro já está cadastrado');
        } else {
          throw error;
        }
      } else {
        toast.success('Bairro atualizado com sucesso!');
        setIsEditBairroDialogOpen(false);
        setBairroToEdit(null);
        setBairroFormNome('');
      }
    } catch (err) {
      console.error('Error updating bairro:', err);
      toast.error('Erro ao atualizar bairro');
    } finally {
      setIsBairroSaving(false);
    }
  };

  const handleToggleBairroAtivo = async (bairro: Bairro) => {
    try {
      const { error } = await supabase
        .from('bairros')
        .update({ ativo: !bairro.ativo })
        .eq('id', bairro.id);

      if (error) throw error;
      toast.success(bairro.ativo ? 'Bairro desativado' : 'Bairro ativado');
    } catch (err) {
      console.error('Error toggling bairro:', err);
      toast.error('Erro ao alterar status do bairro');
    }
  };

  const openEditBairroDialog = (bairro: Bairro) => {
    setBairroToEdit(bairro);
    setBairroFormNome(bairro.nome);
    setIsEditBairroDialogOpen(true);
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
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Gerenciamento de Endereços
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Tabs defaultValue="ruas" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="ruas">Ruas ({ruas.length})</TabsTrigger>
                <TabsTrigger value="bairros">Bairros ({bairros.length})</TabsTrigger>
              </TabsList>

              {/* Ruas Tab */}
              <TabsContent value="ruas" className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar rua..."
                      value={ruaSearchQuery}
                      onChange={(e) => setRuaSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog open={isAddRuaDialogOpen} onOpenChange={setIsAddRuaDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
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
                          <Label htmlFor="rua-nome">Nome da Rua *</Label>
                          <Input
                            id="rua-nome"
                            value={ruaFormNome}
                            onChange={(e) => setRuaFormNome(e.target.value)}
                            placeholder="Ex: Rua das Flores"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAddRuaDialogOpen(false);
                              setRuaFormNome('');
                            }}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" className="flex-1" disabled={isRuaSaving}>
                            {isRuaSaving ? (
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

                {isRuasLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredRuas.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {ruaSearchQuery ? 'Nenhuma rua encontrada' : 'Nenhuma rua cadastrada'}
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead className="w-24 text-center">Ativo</TableHead>
                          <TableHead className="w-20 text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRuas.map((rua) => (
                          <TableRow key={rua.id} className={!rua.ativo ? 'opacity-50' : ''}>
                            <TableCell className="font-medium">{rua.nome}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={rua.ativo}
                                  onCheckedChange={() => handleToggleRuaAtivo(rua)}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditRuaDialog(rua)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Bairros Tab */}
              <TabsContent value="bairros" className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar bairro..."
                      value={bairroSearchQuery}
                      onChange={(e) => setBairroSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog open={isAddBairroDialogOpen} onOpenChange={setIsAddBairroDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Bairro
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          Adicionar Bairro
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddBairro} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="bairro-nome">Nome do Bairro *</Label>
                          <Input
                            id="bairro-nome"
                            value={bairroFormNome}
                            onChange={(e) => setBairroFormNome(e.target.value)}
                            placeholder="Ex: Centro"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAddBairroDialogOpen(false);
                              setBairroFormNome('');
                            }}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" className="flex-1" disabled={isBairroSaving}>
                            {isBairroSaving ? (
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

                {isBairrosLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredBairros.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {bairroSearchQuery ? 'Nenhum bairro encontrado' : 'Nenhum bairro cadastrado'}
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead className="w-24 text-center">Ativo</TableHead>
                          <TableHead className="w-20 text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBairros.map((bairro) => (
                          <TableRow key={bairro.id} className={!bairro.ativo ? 'opacity-50' : ''}>
                            <TableCell className="font-medium">{bairro.nome}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={bairro.ativo}
                                  onCheckedChange={() => handleToggleBairroAtivo(bairro)}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditBairroDialog(bairro)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Edit Rua Dialog */}
        <Dialog open={isEditRuaDialogOpen} onOpenChange={(open) => {
          setIsEditRuaDialogOpen(open);
          if (!open) {
            setRuaToEdit(null);
            setRuaFormNome('');
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
                <Label htmlFor="edit-rua-nome">Nome da Rua *</Label>
                <Input
                  id="edit-rua-nome"
                  value={ruaFormNome}
                  onChange={(e) => setRuaFormNome(e.target.value)}
                  placeholder="Ex: Rua das Flores"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditRuaDialogOpen(false);
                    setRuaToEdit(null);
                    setRuaFormNome('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isRuaSaving}>
                  {isRuaSaving ? (
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

        {/* Edit Bairro Dialog */}
        <Dialog open={isEditBairroDialogOpen} onOpenChange={(open) => {
          setIsEditBairroDialogOpen(open);
          if (!open) {
            setBairroToEdit(null);
            setBairroFormNome('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" />
                Editar Bairro
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditBairro} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bairro-nome">Nome do Bairro *</Label>
                <Input
                  id="edit-bairro-nome"
                  value={bairroFormNome}
                  onChange={(e) => setBairroFormNome(e.target.value)}
                  placeholder="Ex: Centro"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditBairroDialogOpen(false);
                    setBairroToEdit(null);
                    setBairroFormNome('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isBairroSaving}>
                  {isBairroSaving ? (
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
