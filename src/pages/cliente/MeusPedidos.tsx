import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePedidos } from '@/contexts/PedidosContext';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TAMANHO_LABELS, StatusPedido } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATUS_MESSAGES: Record<StatusPedido, string> = {
  pendente: '',
  confirmado: '🎉 Recebemos seu pedido! Já estamos preparando a magia roxa!',
  preparo: '🍇 Seu açaí está sendo montado com muito carinho!',
  pronto: '✨ Tá pronto! Seu açaí ficou uma obra de arte gelada!',
  entrega: '🛵 Vrummm! Seu açaí está a caminho, segura a ansiedade!',
  entregue: '🥄 Chegou! Agora é só aproveitar essa delícia gelada!',
};

export default function MeusPedidos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPedidosCliente, refetch } = usePedidos();
  const previousStatusRef = useRef<Map<string, StatusPedido>>(new Map());

  const pedidos = user ? getPedidosCliente(user.id) : [];

  // Store initial status for all pedidos
  useEffect(() => {
    pedidos.forEach(p => {
      if (!previousStatusRef.current.has(p.id)) {
        previousStatusRef.current.set(p.id, p.status);
      }
    });
  }, [pedidos]);

  // Subscribe to realtime status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('pedidos-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `cliente_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status as StatusPedido;
          const pedidoId = payload.new.id as string;
          const previousStatus = previousStatusRef.current.get(pedidoId);

          // Only notify if status actually changed
          if (previousStatus && previousStatus !== newStatus && STATUS_MESSAGES[newStatus]) {
            toast.success(STATUS_MESSAGES[newStatus], {
              duration: 5000,
            });
            previousStatusRef.current.set(pedidoId, newStatus);
          }

          // Refetch to update UI
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero py-6 px-4 sticky top-0 z-10">
        <div className="container max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display font-bold text-primary-foreground">Meus Pedidos</h1>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-xl text-foreground mb-2">
              Nenhum pedido ainda
            </h2>
            <p className="text-muted-foreground mb-6">
              Faça seu primeiro pedido e ele aparecerá aqui
            </p>
            <Button variant="acai" onClick={() => navigate('/novo-pedido')}>
              Fazer pedido
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-card rounded-xl p-4 shadow-card border border-border/50 animate-fade-in"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-bold text-foreground">
                      Pedido #{pedido.numeroPedido}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(pedido.dataHora), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <StatusBadge status={pedido.status} />
                </div>

                <div className="space-y-2 py-3 border-y border-border">
                  {pedido.itens.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-foreground">
                        {item.quantidade}x Açaí {TAMANHO_LABELS[item.produto.tamanho]}
                      </span>
                      <span className="text-muted-foreground">
                        R$ {((item.valorUnitario + item.valorAdicionais) * item.quantidade).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-muted-foreground">
                    {pedido.formaPagamento === 'credito' && 'Cartão de Crédito'}
                    {pedido.formaPagamento === 'debito' && 'Cartão de Débito'}
                    {pedido.formaPagamento === 'pix' && 'PIX'}
                    {pedido.formaPagamento === 'dinheiro' && 'Dinheiro'}
                  </span>
                  <span className="font-bold text-lg text-primary">
                    R$ {pedido.valorTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
