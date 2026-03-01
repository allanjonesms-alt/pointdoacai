import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pedido, TAMANHO_LABELS, EMBALAGEM_LABELS } from '@/types';
import { StatusProgressBar } from '@/components/StatusProgressBar';
import { Clock, MapPin, CreditCard, User, Package, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusPedido } from '@/types';

interface PedidoDetalheModalProps {
  pedido: Pedido | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvanceStatus: (pedidoId: string, newStatus: StatusPedido) => void;
}

export function PedidoDetalheModal({ pedido, open, onOpenChange, onAdvanceStatus }: PedidoDetalheModalProps) {
  if (!pedido) return null;

  const formaPagamentoLabel = {
    credito: 'Cartão de Crédito',
    debito: 'Cartão de Débito',
    pix: 'PIX',
    dinheiro: 'Dinheiro',
  };

  const handleAdvanceStatus = (newStatus: StatusPedido) => {
    // Block advancing to "confirmado" if PIX and not paid
    if (pedido.formaPagamento === 'pix' && newStatus === 'confirmado' && !pedido.pixPagoEm) {
      return;
    }
    onAdvanceStatus(pedido.id, newStatus);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Pedido #{pedido.numeroPedido}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cliente e Data */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{pedido.clienteNome}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(pedido.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-display font-bold text-foreground">Itens do Pedido</span>
            </div>
            
            {pedido.itens.map((item, index) => (
              <div key={item.id} className="bg-background rounded-lg p-3 border border-border/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-foreground">
                      {item.quantidade}x Açaí {TAMANHO_LABELS[item.produto.tamanho]}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {EMBALAGEM_LABELS[item.embalagem]} • {item.produto.peso}
                    </p>
                  </div>
                  <span className="font-bold text-primary">
                    R$ {(item.valorUnitario * item.quantidade).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                {item.adicionais.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Adicionais:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.adicionais.map((adicional, i) => (
                        <span
                          key={i}
                          className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full"
                        >
                          {adicional}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Endereço de Entrega */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-display font-bold text-foreground">Endereço de Entrega</span>
            </div>
            <div className="text-sm text-foreground space-y-1">
              <p>
                {pedido.enderecoEntrega.rua}, {pedido.enderecoEntrega.numero}
              </p>
              <p className="text-muted-foreground">{pedido.enderecoEntrega.bairro}</p>
              {pedido.enderecoEntrega.complemento && (
                <p className="text-muted-foreground">
                  Complemento: {pedido.enderecoEntrega.complemento}
                </p>
              )}
              {pedido.enderecoEntrega.referencia && (
                <p className="text-muted-foreground">
                  Referência: {pedido.enderecoEntrega.referencia}
                </p>
              )}
            </div>
          </div>

          {/* Forma de Pagamento e Total */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-display font-bold text-foreground">Pagamento</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground">
                {formaPagamentoLabel[pedido.formaPagamento]}
              </span>
              <span className="font-display font-bold text-xl text-primary">
                R$ {pedido.valorTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* PIX Payment Details */}
            {pedido.formaPagamento === 'pix' && (
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                {pedido.pixPagoEm ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">PIX Confirmado</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pago em: {format(new Date(pedido.pixPagoEm), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                    {pedido.pixConfirmacao && (
                      <p className="text-xs text-muted-foreground">
                        Código de confirmação: <span className="font-mono font-medium text-foreground">{pedido.pixConfirmacao}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-sm text-amber-600 font-medium">Aguardando pagamento PIX</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="pt-2">
            {pedido.formaPagamento === 'pix' && !pedido.pixPagoEm && pedido.status === 'pendente' && (
              <p className="text-xs text-amber-600 text-center mb-2">
                ⚠ Status só pode avançar após confirmação do pagamento PIX
              </p>
            )}
            <StatusProgressBar
              currentStatus={pedido.status}
              onAdvanceStatus={handleAdvanceStatus}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
