import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone, Mail, MapPin, TrendingUp, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminClientes() {
  const navigate = useNavigate();
  const { clientes, isLoading, deleteCliente } = useClientes();

  const handleDelete = async (clienteId: string, nome: string) => {
    const result = await deleteCliente(clienteId);
    if (result.success) {
      toast.success(`Cliente "${nome}" excluído com sucesso`);
    } else {
      toast.error(result.error || 'Erro ao excluir cliente');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero py-6 px-4 sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display font-bold text-primary-foreground">Clientes</h1>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        {clientes.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-card rounded-xl p-4 shadow-card border border-border/50 animate-fade-in"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 gradient-acai rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground">{cliente.nome}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-tropical">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-bold">
                        R$ {Number(cliente.valor_total_compras).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total comprado</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    {cliente.telefone}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    {cliente.email}
                  </div>
                </div>

                {/* Endereço completo */}
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                    <div className="text-muted-foreground">
                      <p>
                        {cliente.rua}, {cliente.numero}
                        {cliente.complemento && ` - ${cliente.complemento}`}
                      </p>
                      <p>{cliente.bairro}</p>
                      {cliente.referencia && (
                        <p className="text-xs mt-1">Ref: {cliente.referencia}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Histórico
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/admin/clientes/${cliente.id}/editar`)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o cliente "{cliente.nome}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(cliente.id, cliente.nome)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
