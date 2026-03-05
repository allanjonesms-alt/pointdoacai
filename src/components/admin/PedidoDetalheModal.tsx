import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pedido, TAMANHO_LABELS, EMBALAGEM_LABELS } from '@/types';
import { StatusProgressBar } from '@/components/StatusProgressBar';
import { Clock, MapPin, CreditCard, User, Package, CheckCircle2, Banknote, Printer, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusPedido } from '@/types';
import { useLojaStatus } from '@/hooks/useLojaStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PedidoDetalheModalProps {
  pedido: Pedido | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvanceStatus: (pedidoId: string, newStatus: StatusPedido) => void;
}

export function PedidoDetalheModal({ pedido, open, onOpenChange, onAdvanceStatus }: PedidoDetalheModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { printConfig } = useLojaStatus();
  const { toast } = useToast();
  const [verificandoPix, setVerificandoPix] = useState(false);
  const [pixConfirmadoLocal, setPixConfirmadoLocal] = useState(false);

  if (!pedido) return null;

  const formaPagamentoLabel = {
    credito: 'Cartão de Crédito',
    debito: 'Cartão de Débito',
    pix: 'PIX',
    dinheiro: 'Dinheiro',
  };

  const handleAdvanceStatus = (newStatus: StatusPedido) => {
    if (pedido.formaPagamento === 'pix' && newStatus === 'confirmado' && !pedido.pixPagoEm && !pixConfirmadoLocal) {
      return;
    }
    onAdvanceStatus(pedido.id, newStatus);
  };

  const handleVerificarPix = async () => {
    if (!pedido.pixPaymentId) {
      toast({ title: 'ID do pagamento não encontrado', description: 'Este pedido não possui um ID de pagamento PIX associado.', variant: 'destructive' });
      return;
    }
    setVerificandoPix(true);
    try {
      const { data, error } = await supabase.functions.invoke('verificar-pix', {
        body: { payment_id: Number(pedido.pixPaymentId), pedido_id: pedido.id },
      });
      if (error) throw error;
      if (data?.is_pago) {
        setPixConfirmadoLocal(true);
        toast({ title: 'PIX Confirmado!', description: `Pago em ${data.date_approved ? format(new Date(data.date_approved), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'agora'}.` });
      } else {
        toast({ title: 'PIX não confirmado', description: `Status: ${data?.status_detail || data?.status || 'pendente'}`, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Erro ao verificar PIX', variant: 'destructive' });
    } finally {
      setVerificandoPix(false);
    }
  };

  const handleConfirmarPixManual = async () => {
    setVerificandoPix(true);
    try {
      await supabase.from('pedidos').update({
        pix_pago_em: new Date().toISOString(),
        pix_confirmacao: 'CONFIRMADO_MANUALMENTE',
      } as any).eq('id', pedido.id);
      setPixConfirmadoLocal(true);
      toast({ title: 'PIX confirmado manualmente!' });
    } catch {
      toast({ title: 'Erro ao confirmar PIX', variant: 'destructive' });
    } finally {
      setVerificandoPix(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const { largura, altura, fonteTamanho, fonteTipo } = printConfig;

    const pageSize = altura > 0
      ? `@page { size: ${largura}mm ${altura}mm; margin: 2mm; }`
      : `@page { size: ${largura}mm auto; margin: 2mm; }`;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Pedido #${pedido.numeroPedido}</title>
          <style>
            ${pageSize}
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: '${fonteTipo}', sans-serif;
              font-size: ${fonteTamanho}px;
              color: #000;
              padding: 4px;
            }
            .print-header { text-align: center; font-weight: bold; font-size: ${fonteTamanho + 4}px; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 6px; }
            .section { margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dashed #ccc; }
            .section-title { font-weight: bold; font-size: ${fonteTamanho + 1}px; margin-bottom: 4px; }
            .item { margin-bottom: 4px; }
            .item-name { font-weight: bold; }
            .item-details { font-size: ${fonteTamanho - 1}px; color: #444; }
            .adicionais { font-size: ${fonteTamanho - 2}px; color: #666; margin-top: 2px; }
            .total { font-weight: bold; font-size: ${fonteTamanho + 2}px; text-align: right; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .troco { font-weight: bold; color: #333; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="font-display text-xl">
              DETALHES DO PEDIDO #{pedido.numeroPedido}
            </DialogTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrint}
              title="Imprimir pedido"
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Hidden print content */}
        <div ref={printRef} className="hidden">
          <div className="print-header">PEDIDO #{pedido.numeroPedido}</div>
          
          <div className="section">
            <div className="info-row">
              <span>Cliente: {pedido.clienteNome}</span>
            </div>
            <div className="info-row">
              <span>{format(new Date(pedido.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
          </div>

          <div className="section">
            <div className="section-title">ITENS</div>
            {pedido.itens.map((item) => (
              <div key={item.id} className="item">
                <div className="item-name">
                  {item.quantidade}x Açaí {TAMANHO_LABELS[item.produto.tamanho]} - {EMBALAGEM_LABELS[item.embalagem]}
                </div>
                <div className="item-details">{item.produto.peso} - R$ {(item.valorUnitario * item.quantidade).toFixed(2).replace('.', ',')}</div>
                {item.adicionais.length > 0 && (
                  <div className="adicionais">+ {item.adicionais.join(', ')}</div>
                )}
              </div>
            ))}
          </div>

          <div className="section">
            <div className="section-title">ENTREGA</div>
            <div>{pedido.enderecoEntrega.rua}, {pedido.enderecoEntrega.numero}</div>
            <div>{pedido.enderecoEntrega.bairro}</div>
            {pedido.enderecoEntrega.complemento && <div>Comp: {pedido.enderecoEntrega.complemento}</div>}
            {pedido.enderecoEntrega.referencia && <div>Ref: {pedido.enderecoEntrega.referencia}</div>}
          </div>

          <div className="section">
            <div className="info-row">
              <span>Pagamento:</span>
              <span>{formaPagamentoLabel[pedido.formaPagamento]}</span>
            </div>
            {pedido.formaPagamento === 'dinheiro' && pedido.valorTroco && (
              <div className="info-row troco">
                <span>Troco para:</span>
                <span>{pedido.valorTroco}</span>
              </div>
            )}
            {pedido.formaPagamento === 'pix' && pedido.pixPagoEm && (
              <div className="info-row">
                <span>PIX Confirmado</span>
              </div>
            )}
          </div>

          <div className="total">
            TOTAL: R$ {pedido.valorTotal.toFixed(2).replace('.', ',')}
          </div>
        </div>

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
            
            {pedido.itens.map((item) => (
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

            {/* Troco for cash payments */}
            {pedido.formaPagamento === 'dinheiro' && pedido.valorTroco && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-foreground">Troco</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Levar troco para:</span>
                  <span className="font-bold text-foreground">{pedido.valorTroco}</span>
                </div>
              </div>
            )}

            {/* PIX Payment Details */}
            {pedido.formaPagamento === 'pix' && (
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                {(pedido.pixPagoEm || pixConfirmadoLocal) ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">PIX Confirmado</span>
                    </div>
                    {pedido.pixPagoEm && (
                      <p className="text-xs text-muted-foreground">
                        Pago em: {format(new Date(pedido.pixPagoEm), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </p>
                    )}
                    {pedido.pixConfirmacao && (
                      <p className="text-xs text-muted-foreground">
                        Código: <span className="font-mono font-medium text-foreground">{pedido.pixConfirmacao}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-sm text-amber-600 font-medium">Aguardando pagamento PIX</span>
                    </div>
                    {pedido.pixPaymentId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={handleVerificarPix}
                        disabled={verificandoPix}
                      >
                        <RefreshCw className={`h-3 w-3 ${verificandoPix ? 'animate-spin' : ''}`} />
                        {verificandoPix ? 'Verificando...' : 'Verificar PIX na API'}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <AlertCircle className="h-3 w-3" />
                          <span>ID do pagamento não encontrado</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={handleConfirmarPixManual}
                          disabled={verificandoPix}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Confirmar PIX Manualmente
                        </Button>
                      </div>
                    )}
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
