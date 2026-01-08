import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone, Mail, MapPin, TrendingUp, Pencil, Trash2, Loader2, Leaf, Sparkles, Shield, ArrowUpDown, Search, History } from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { toast } from 'sonner';
import { CadastroClienteModal } from '@/components/admin/CadastroClienteModal';
import { HistoricoPedidosModal } from '@/components/admin/HistoricoPedidosModal';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type OrdenacaoType = 'nome' | 'total_desc';

export default function AdminClientes() {
  const navigate = useNavigate();
  const { clientes, isLoading, deleteCliente, fetchClientes } = useClientes();
  const [ordenacao, setOrdenacao] = useState<OrdenacaoType>('total_desc');
  const [busca, setBusca] = useState('');
  const [historicoModal, setHistoricoModal] = useState<{ open: boolean; clienteId: string; clienteNome: string }>({
    open: false,
    clienteId: '',
    clienteNome: '',
  });

  const clientesFiltrados = useMemo(() => {
    const termoOriginal = busca.trim();
    if (!termoOriginal) return clientes;

    const normalizar = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const termoNome = normalizar(termoOriginal.replace(/[0-9]/g, '')).trim();
    const termoNumeros = termoOriginal.replace(/\D/g, '');

    return clientes.filter((cliente) => {
      const nomeNormalizado = normalizar(cliente.nome);
      const nomeMatch = termoNome ? nomeNormalizado.includes(termoNome) : false;

      const telefoneNumeros = (cliente.telefone || '').replace(/\D/g, '');
      const telefoneMatch = termoNumeros ? telefoneNumeros.includes(termoNumeros) : false;

      return nomeMatch || telefoneMatch;
    });
  }, [clientes, busca]);

  const clientesOrdenados = useMemo(() => {
    const sorted = [...clientesFiltrados];
    switch (ordenacao) {
      case 'nome':
        return sorted.sort((a, b) => a.nome.localeCompare(b.nome));
      case 'total_desc':
      default:
        return sorted.sort((a, b) => Number(b.valor_total_compras) - Number(a.valor_total_compras));
    }
  }, [clientesFiltrados, ordenacao]);

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
        <div className="container max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display font-bold text-primary-foreground">Clientes</h1>
          </div>
          <CadastroClienteModal onSuccess={fetchClientes} />
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
            {/* Busca e Ordenação */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={ordenacao} onValueChange={(value: OrdenacaoType) => setOrdenacao(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_desc">Maior total comprado</SelectItem>
                    <SelectItem value="nome">Nome (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {clientesOrdenados.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhum cliente encontrado para "{busca}"</p>
              </div>
            ) : (
              clientesOrdenados.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-card rounded-xl p-3 sm:p-4 shadow-card border border-border/50 animate-fade-in"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-acai rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-sm sm:text-base text-foreground truncate">{cliente.nome}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        {cliente.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            <Shield className="h-3 w-3" />
                            <span className="hidden sm:inline">Admin</span>
                          </span>
                        ) : cliente.tipo_cliente === 'organico' ? (
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <Leaf className="h-3 w-3" />
                            <span className="hidden sm:inline">Orgânico</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            <Sparkles className="h-3 w-3" />
                            <span className="hidden sm:inline">Sintético</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-tropical">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-bold text-sm sm:text-base whitespace-nowrap">
                        R$ {Number(cliente.valor_total_compras).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground hidden sm:block">Total comprado</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{cliente.telefone}</span>
                  </div>
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                    <div className="text-muted-foreground text-xs sm:text-sm min-w-0">
                      <p className="truncate">
                        {cliente.rua}, {cliente.numero}
                        {cliente.complemento && ` - ${cliente.complemento}`}
                      </p>
                      <p>{cliente.bairro}</p>
                      {cliente.referencia && (
                        <p className="text-xs mt-1 truncate">Ref: {cliente.referencia}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 sm:pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs sm:text-sm"
                    onClick={() => setHistoricoModal({ open: true, clienteId: cliente.id, clienteNome: cliente.nome })}
                  >
                    <History className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Ver </span>Histórico
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/admin/clientes/${cliente.id}/editar`)}
                    className="text-xs sm:text-sm"
                  >
                    <Pencil className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Editar</span>
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
              ))
            )}
          </div>
        )}
      </div>

      <HistoricoPedidosModal
        clienteId={historicoModal.clienteId}
        clienteNome={historicoModal.clienteNome}
        open={historicoModal.open}
        onOpenChange={(open) => setHistoricoModal(prev => ({ ...prev, open }))}
      />
    </div>
  );
}
