import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePedidos } from '@/contexts/PedidosContext';
import { Logo } from '@/components/Logo';
import { StatusProgressBar } from '@/components/StatusProgressBar';
import { StatusPedido, TAMANHO_LABELS } from '@/types';
import { LogOut, Users, Package, Plus, Clock, Loader2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from '@/hooks/useNotificationSound';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { pedidosHoje, isLoading, atualizarStatus, refetch } = usePedidos();
  const { playNotification } = useNotificationSound();

  // Atualizar dados ao acessar a página
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Escutar novos pedidos em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('admin-pedidos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
        },
        () => {
          playNotification();
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, playNotification]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero py-6 px-4">
        <div className="container max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-primary-foreground/80 text-sm font-medium">Admin</span>
            <button
              onClick={handleLogout}
              className="text-primary-foreground/80 hover:text-primary-foreground"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Quick Actions */}
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

          <Link to="/admin/pedido-direto">
            <div className="bg-card rounded-xl p-3 sm:p-4 shadow-card border border-border/50 hover:shadow-float transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground">Criar Pedido</h3>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Pedidos Diretos</p>
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
            {isLoading ? (
              <div className="bg-card rounded-xl p-8 shadow-card border border-border/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Carregando pedidos...</span>
              </div>
            ) : pedidosHoje.length === 0 ? (
              <div className="bg-card rounded-xl p-8 shadow-card border border-border/50 text-center">
                <p className="text-muted-foreground">Nenhum pedido hoje</p>
              </div>
            ) : (
              pedidosHoje.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="bg-card rounded-xl p-4 shadow-card border border-border/50 animate-fade-in"
                  >
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                          #{pedido.numeroPedido}
                        </h3>
                        <p className="text-sm text-foreground mt-1 truncate">{pedido.clienteNome}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          {format(new Date(pedido.dataHora), "dd/MM 'às' HH:mm", { locale: ptBR })}
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
                      {pedido.itens.map((item) => (
                        <div key={item.id} className="text-sm">
                          <span className="font-medium text-foreground">
                            {item.quantidade}x Açaí {TAMANHO_LABELS[item.produto.tamanho]}
                          </span>
                          {item.adicionais.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              + {item.adicionais.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Address */}
                    <p className="text-xs text-muted-foreground mb-4">
                      📍 {pedido.enderecoEntrega.rua}, {pedido.enderecoEntrega.numero} - {pedido.enderecoEntrega.bairro}
                    </p>

                    {/* Status Progress Bar */}
                    <StatusProgressBar
                      currentStatus={pedido.status}
                      onAdvanceStatus={(newStatus) => atualizarStatus(pedido.id, newStatus)}
                    />
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
