import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePedidos } from '@/contexts/PedidosContext';
import { Logo } from '@/components/Logo';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { StatusPedido, TAMANHO_LABELS } from '@/types';
import { LogOut, Users, Package, Plus, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_OPTIONS: StatusPedido[] = ['pendente', 'confirmado', 'preparo', 'pronto', 'entrega', 'entregue'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { pedidosHoje, isLoading, atualizarStatus } = usePedidos();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNextStatus = (current: StatusPedido): StatusPedido | null => {
    const index = STATUS_OPTIONS.indexOf(current);
    return index < STATUS_OPTIONS.length - 1 ? STATUS_OPTIONS[index + 1] : null;
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
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Link to="/admin/clientes">
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 hover:shadow-float transition-shadow">
              <div className="w-12 h-12 bg-tropical rounded-lg flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground">Clientes</h3>
              <p className="text-sm text-muted-foreground">Gerenciar clientes</p>
            </div>
          </Link>

          <Link to="/admin/pedido-direto">
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 hover:shadow-float transition-shadow">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-3">
                <Plus className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground">Criar Pedido</h3>
              <p className="text-sm text-muted-foreground">Pedidos Diretos</p>
            </div>
          </Link>

          <Link to="/admin/produtos">
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 hover:shadow-float transition-shadow">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground">Produtos</h3>
              <p className="text-sm text-muted-foreground">Gerenciar cardápio</p>
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
              pedidosHoje.map((pedido) => {
                const nextStatus = getNextStatus(pedido.status);

                return (
                  <div
                    key={pedido.id}
                    className="bg-card rounded-xl p-4 shadow-card border border-border/50 animate-fade-in"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-lg text-foreground">
                            #{pedido.numeroPedido}
                          </h3>
                          <StatusBadge status={pedido.status} />
                        </div>
                        <p className="text-sm text-foreground mt-1">{pedido.clienteNome}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(pedido.dataHora), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
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
                    <p className="text-xs text-muted-foreground mb-3">
                      📍 {pedido.enderecoEntrega.rua}, {pedido.enderecoEntrega.numero} - {pedido.enderecoEntrega.bairro}
                    </p>

                    {/* Status Actions */}
                    {nextStatus && (
                      <div className="flex gap-2">
                        <Button
                          variant="acai"
                          size="sm"
                          className="flex-1"
                          onClick={() => atualizarStatus(pedido.id, nextStatus)}
                        >
                          Marcar como{' '}
                          {nextStatus === 'confirmado' && 'Confirmado'}
                          {nextStatus === 'preparo' && 'Em Preparo'}
                          {nextStatus === 'pronto' && 'Pronto'}
                          {nextStatus === 'entrega' && 'Saiu p/ Entrega'}
                          {nextStatus === 'entregue' && 'Entregue'}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
