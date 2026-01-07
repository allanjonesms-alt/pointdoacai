import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePedidos } from '@/contexts/PedidosContext';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, Clock, RefreshCw, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TAMANHO_LABELS, EMBALAGEM_LABELS, StatusPedido, CarrinhoItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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
  const { adicionarItem } = useCarrinho();
  const previousStatusRef = useRef<Map<string, StatusPedido>>(new Map());
  const { playNotification } = useNotificationSound();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CarrinhoItem | null>(null);

  // Atualizar dados sempre ao acessar/montar a página
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            playNotification();
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

  const handleRepetirItem = (item: CarrinhoItem) => {
    setSelectedItem(item);
    setShowConfirmModal(true);
  };

  const handleConfirmarPedido = () => {
    if (!selectedItem) return;
    
    adicionarItem(selectedItem.produto, selectedItem.adicionais, selectedItem.embalagem);
    setShowConfirmModal(false);
    setSelectedItem(null);
    navigate('/carrinho');
  };

  const calcularValorTotal = (item: CarrinhoItem) => {
    return item.valorUnitario + item.valorAdicionais;
  };

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

                <div className="space-y-3 py-3 border-y border-border">
                  {pedido.itens.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 text-sm">
                        <span className="text-foreground">
                          {item.quantidade}x Açaí {TAMANHO_LABELS[item.produto.tamanho]}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          R$ {((item.valorUnitario + item.valorAdicionais) * item.quantidade).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => handleRepetirItem(item)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        <span className="text-xs">Repetir</span>
                      </Button>
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

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Confirmar Pedido
            </DialogTitle>
            <DialogDescription>
              Revise os detalhes antes de adicionar ao carrinho
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 gradient-acai rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedItem.produto.nome}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {TAMANHO_LABELS[selectedItem.produto.tamanho]} • {selectedItem.produto.peso}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Embalagem</span>
                    <span className="font-medium">{EMBALAGEM_LABELS[selectedItem.embalagem]}</span>
                  </div>
                  
                  {selectedItem.adicionais.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Adicionais:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedItem.adicionais.map((adicional, idx) => (
                          <span 
                            key={idx}
                            className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                          >
                            {adicional}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Valor Total</span>
                <span className="text-xl font-bold text-primary">
                  R$ {calcularValorTotal(selectedItem).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="acai" onClick={handleConfirmarPedido} className="flex-1">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
