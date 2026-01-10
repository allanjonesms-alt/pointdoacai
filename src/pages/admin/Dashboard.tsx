import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePedidos } from '@/contexts/PedidosContext';
import { Logo } from '@/components/Logo';
import { StatusProgressBar } from '@/components/StatusProgressBar';
import { StatusPedido, TAMANHO_LABELS, Pedido } from '@/types';
import { LogOut, Users, Package, Plus, Clock, Loader2, BarChart3, MapPin, Store, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { PedidoDetalheModal } from '@/components/admin/PedidoDetalheModal';
import { useLojaStatus } from '@/hooks/useLojaStatus';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ConfiguracaoLojaModal } from '@/components/admin/ConfiguracaoLojaModal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    logout
  } = useAuth();
  const {
    pedidosHoje,
    isLoading,
    atualizarStatus,
    refetch
  } = usePedidos();
  const {
    playNotification
  } = useNotificationSound();
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const { lojaAberta, horarioAbertura, horarioFechamento, diasFuncionamento, isLoading: isLoadingLoja, toggleLoja, atualizarConfiguracoes } = useLojaStatus();

  const handleToggleLoja = async () => {
    try {
      await toggleLoja();
      toast.success(lojaAberta ? 'Loja fechada!' : 'Loja aberta!');
    } catch {
      toast.error('Erro ao alterar status da loja');
    }
  };

  // Atualizar dados ao acessar a página
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Escutar novos pedidos em tempo real
  useEffect(() => {
    const channel = supabase.channel('admin-pedidos-realtime').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'pedidos'
    }, () => {
      playNotification();
      refetch();
    }).on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'pedidos'
    }, () => {
      refetch();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, playNotification]);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const handlePedidoClick = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setModalOpen(true);
  };
  const handleAdvanceStatus = (pedidoId: string, newStatus: StatusPedido) => {
    atualizarStatus(pedidoId, newStatus);
    // Atualiza o pedido selecionado no modal
    if (selectedPedido && selectedPedido.id === pedidoId) {
      setSelectedPedido({
        ...selectedPedido,
        status: newStatus
      });
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero py-6 px-4">
        <div className="container max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            {/* Toggle Loja */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Store className={`h-4 w-4 ${lojaAberta ? 'text-green-300' : 'text-red-300'}`} />
              <span className="text-xs font-medium text-primary-foreground/90 hidden sm:inline">
                {lojaAberta ? 'Aberta' : 'Fechada'}
              </span>
              <Switch 
                checked={lojaAberta}
                onCheckedChange={handleToggleLoja}
                disabled={isLoadingLoja}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
            </div>
            {/* Config Button */}
            <button 
              onClick={() => setShowConfigModal(true)}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20 transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button onClick={handleLogout} className="text-primary-foreground/80 hover:text-primary-foreground">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Quick Actions */}
        {/* Criar Pedido - Full Width - Destacado */}
        <Link to="/admin/pedido-direto" className="block mb-4 group">
          <div className="gradient-hero rounded-xl p-4 shadow-float hover:shadow-xl transition-all duration-300 gap-4 hover-scale flex items-start justify-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
              <Plus className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-primary-foreground">Criar Pedido</h3>
              <p className="text-sm text-primary-foreground/80">Pedidos Diretos</p>
            </div>
          </div>
        </Link>

        {/* Other Quick Actions */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          <Link to="/admin/clientes">
            <div className="bg-card rounded-xl p-3 sm:p-4 shadow-card border border-border/50 hover:shadow-float transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-tropical rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground">Clientes</h3>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gerenciar clientes</p>
            </div>
          </Link>

          <Link to="/admin/produtos">
            <div className="bg-card rounded-xl p-3 sm:p-4 shadow-card border border-border/50 hover:shadow-float transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground">Produtos</h3>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gerenciar cardápio</p>
            </div>
          </Link>

          <Link to="/admin/relatorios">
            <div className="bg-card rounded-xl p-3 sm:p-4 shadow-card border border-border/50 hover:shadow-float transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground">Relatórios</h3>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Vendas e métricas</p>
            </div>
          </Link>

          <Link to="/admin/enderecos">
            <div className="bg-card rounded-xl p-3 sm:p-4 shadow-card border border-border/50 hover:shadow-float transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground">Endereços</h3>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Ruas e bairros</p>
            </div>
          </Link>
        </div>

        {/* Orders List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-foreground">Pedidos do Dia</h2>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
              {pedidosHoje.length} pedidos
            </span>
          </div>

          <div className="space-y-4">
            {isLoading ? <div className="bg-card rounded-xl p-8 shadow-card border border-border/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Carregando pedidos...</span>
              </div> : pedidosHoje.length === 0 ? <div className="bg-card rounded-xl p-8 shadow-card border border-border/50 text-center">
                <p className="text-muted-foreground">Nenhum pedido hoje</p>
              </div> : pedidosHoje.map(pedido => <div key={pedido.id} className="bg-card rounded-xl p-4 shadow-card border border-border/50 animate-fade-in cursor-pointer hover:shadow-float transition-shadow" onClick={() => handlePedidoClick(pedido)}>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                          #{pedido.numeroPedido}
                        </h3>
                        <p className="text-sm text-foreground mt-1 truncate">{pedido.clienteNome}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          {format(new Date(pedido.dataHora), "dd/MM 'às' HH:mm", {
                    locale: ptBR
                  })}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-base sm:text-lg text-primary whitespace-nowrap">
                          R$ {pedido.valorTotal.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pedido.formaPagamento === 'credito' && 'Crédito'}
                          {pedido.formaPagamento === 'debito' && 'Débito'}
                          {pedido.formaPagamento === 'pix' && 'PIX'}
                          {pedido.formaPagamento === 'dinheiro' && 'Dinheiro'}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-muted rounded-lg p-3 mb-3">
                      {pedido.itens.map(item => <div key={item.id} className="text-sm">
                          <span className="font-medium text-foreground">
                            {item.quantidade}x Açaí {TAMANHO_LABELS[item.produto.tamanho]}
                          </span>
                          {item.adicionais.length > 0 && <p className="text-xs text-muted-foreground">
                              + {item.adicionais.join(', ')}
                            </p>}
                        </div>)}
                    </div>

                    {/* Address */}
                    <p className="text-xs text-muted-foreground mb-4">
                      📍 {pedido.enderecoEntrega.rua}, {pedido.enderecoEntrega.numero} - {pedido.enderecoEntrega.bairro}
                    </p>

                    {/* Status Progress Bar */}
                    <div onClick={e => e.stopPropagation()}>
                      <StatusProgressBar currentStatus={pedido.status} onAdvanceStatus={newStatus => handleAdvanceStatus(pedido.id, newStatus)} />
                    </div>
                  </div>)}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      <PedidoDetalheModal pedido={selectedPedido} open={modalOpen} onOpenChange={setModalOpen} onAdvanceStatus={handleAdvanceStatus} />

      {/* Modal de Configuração */}
      <ConfiguracaoLojaModal 
        open={showConfigModal} 
        onOpenChange={setShowConfigModal}
        config={{ horarioAbertura, horarioFechamento, diasFuncionamento }}
        onSave={atualizarConfiguracoes}
      />
    </div>;
}