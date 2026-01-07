import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Star, Loader2, Home, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEnderecos, Endereco, EnderecoInput } from '@/hooks/useEnderecos';
import { toast } from 'sonner';

interface EnderecosListProps {
  profileId?: string;
  showTitle?: boolean;
}

export default function EnderecosList({ profileId, showTitle = true }: EnderecosListProps) {
  const {
    enderecos,
    isLoading,
    addEndereco,
    updateEndereco,
    deleteEndereco,
    setDefaultEndereco,
  } = useEnderecos(profileId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [enderecoToDelete, setEnderecoToDelete] = useState<Endereco | null>(null);
  const [enderecoToEdit, setEnderecoToEdit] = useState<Endereco | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<EnderecoInput>({
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    referencia: '',
  });

  const resetForm = () => {
    setFormData({
      rua: '',
      numero: '',
      bairro: '',
      complemento: '',
      referencia: '',
    });
  };

  const openEditDialog = (endereco: Endereco) => {
    setEnderecoToEdit(endereco);
    setFormData({
      rua: endereco.rua,
      numero: endereco.numero,
      bairro: endereco.bairro,
      complemento: endereco.complemento || '',
      referencia: endereco.referencia || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleAddEndereco = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rua || !formData.numero || !formData.bairro) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    const result = await addEndereco(formData);
    setIsSaving(false);

    if (result.success) {
      toast.success('Endereço adicionado com sucesso!');
      setIsAddDialogOpen(false);
      resetForm();
    } else {
      toast.error(result.error || 'Erro ao adicionar endereço');
    }
  };

  const handleEditEndereco = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enderecoToEdit) return;

    if (!formData.rua || !formData.numero || !formData.bairro) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    const result = await updateEndereco(enderecoToEdit.id, formData);
    setIsSaving(false);

    if (result.success) {
      toast.success('Endereço atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setEnderecoToEdit(null);
      resetForm();
    } else {
      toast.error(result.error || 'Erro ao atualizar endereço');
    }
  };

  const handleDeleteEndereco = async () => {
    if (!enderecoToDelete) return;

    const result = await deleteEndereco(enderecoToDelete.id);
    
    if (result.success) {
      toast.success('Endereço excluído com sucesso!');
    } else {
      toast.error(result.error || 'Erro ao excluir endereço');
    }

    setIsDeleteDialogOpen(false);
    setEnderecoToDelete(null);
  };

  const handleSetDefault = async (endereco: Endereco) => {
    if (endereco.is_default) return;

    const result = await setDefaultEndereco(endereco.id);
    
    if (result.success) {
      toast.success('Endereço definido como padrão!');
    } else {
      toast.error(result.error || 'Erro ao definir endereço padrão');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Endereços de Entrega
          </h3>
        </div>
      )}

      {/* Lista de endereços */}
      <div className="space-y-3">
        {enderecos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum endereço cadastrado
          </p>
        ) : (
          enderecos.map((endereco) => (
            <Card
              key={endereco.id}
              className={`relative ${
                endereco.is_default
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {endereco.is_default && (
                        <span className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3" />
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-foreground">
                      {endereco.rua}, {endereco.numero}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {endereco.bairro}
                      {endereco.complemento && ` - ${endereco.complemento}`}
                    </p>
                    {endereco.referencia && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ref: {endereco.referencia}
                      </p>
                    )}
                  </div>
                    <div className="flex items-center gap-1">
                      {!endereco.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(endereco)}
                          className="text-muted-foreground hover:text-primary"
                          title="Definir como padrão"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(endereco)}
                        className="text-muted-foreground hover:text-primary"
                        title="Editar endereço"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEnderecoToDelete(endereco);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        title="Excluir endereço"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Botão adicionar */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Novo Endereço
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Novo Endereço
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEndereco} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="rua">Rua *</Label>
                <Input
                  id="rua"
                  value={formData.rua}
                  onChange={(e) => setFormData(prev => ({ ...prev, rua: e.target.value }))}
                  placeholder="Nome da rua"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Nº *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
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
                  value={formData.bairro}
                  onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                  className="pl-10"
                  placeholder="Nome do bairro"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                placeholder="Apartamento, bloco, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Ponto de Referência</Label>
              <Input
                id="referencia"
                value={formData.referencia || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                placeholder="Próximo a..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
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

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEnderecoToEdit(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Editar Endereço
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditEndereco} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-rua">Rua *</Label>
                <Input
                  id="edit-rua"
                  value={formData.rua}
                  onChange={(e) => setFormData(prev => ({ ...prev, rua: e.target.value }))}
                  placeholder="Nome da rua"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-numero">Nº *</Label>
                <Input
                  id="edit-numero"
                  value={formData.numero}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                  placeholder="Nº"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bairro">Bairro *</Label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="edit-bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                  className="pl-10"
                  placeholder="Nome do bairro"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-complemento">Complemento</Label>
              <Input
                id="edit-complemento"
                value={formData.complemento || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                placeholder="Apartamento, bloco, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-referencia">Ponto de Referência</Label>
              <Input
                id="edit-referencia"
                value={formData.referencia || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                placeholder="Próximo a..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEnderecoToEdit(null);
                  resetForm();
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

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Endereço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este endereço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEndereco}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
