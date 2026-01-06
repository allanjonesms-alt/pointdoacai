import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import { usePedidos } from '@/contexts/PedidosContext';
import { useAuth } from '@/contexts/AuthContext';
import { CarrinhoItemCard } from '@/components/CarrinhoItem';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShoppingBag, CreditCard, Smartphone, Banknote, QrCode, Check, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PixQRCode } from '@/components/PixQRCode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type FormaPagamento = 'credito' | 'debito' | 'pix' | 'dinheiro';

const FORMAS_PAGAMENTO: { id: FormaPagamento; label: string; icon: React.ReactNode }[] = [
  { id: 'credito', label: 'Crédito', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'debito', label: 'Débito', icon: <Smartphone className="h-5 w-5" /> },
  { id: 'pix', label: 'PIX', icon: <QrCode className="h-5 w-5" /> },
  { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="h-5 w-5" /> },
];

export default function Carrinho() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { itens, subtotal, totalAdicionais, total, limparCarrinho } = useCarrinho();
  const { criarPedido } = usePedidos();
  const { toast } = useToast();
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [numeroPedidoAtual, setNumeroPedidoAtual] = useState<string | null>(null);

  const handleFinalizarPedido = async () => {
    if (!formaPagamento) {
      toast({
        title: 'Escolha a forma de pagamento',
        description: 'Selecione como deseja pagar seu pedido.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setIsLoading(true);

    const numeroPedido = await criarPedido(
      user.id,
      user.nome,
      user.endereco,
      formaPagamento,
      itens,
      total
    );

    if (!numeroPedido) {
      setIsLoading(false);
      return;
    }

    setNumeroPedidoAtual(numeroPedido);

    // Se for PIX, mostrar modal com QR Code
    if (formaPagamento === 'pix') {
      setShowPixModal(true);
      setIsLoading(false);
      return;
    }

    // Para outros métodos, finaliza normalmente
    limparCarrinho();

    toast({
      title: 'Pedido realizado!',
      description: `Pedido #${numeroPedido} criado com sucesso.`,
    });

    navigate('/meus-pedidos');
    setIsLoading(false);
  };

  const handlePixSuccess = () => {
    setShowPixModal(false);
    limparCarrinho();
    
    toast({
      title: 'Pedido realizado!',
      description: `Pedido #${numeroPedidoAtual} criado com sucesso. Aguardando confirmação do PIX.`,
    });

    navigate('/meus-pedidos');
  };

  const handlePixCancel = () => {
    setShowPixModal(false);
  };

  if (itens.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="gradient-hero py-6 px-4">
          <div className="container max-w-md mx-auto flex items-center gap-4">
            <button
              onClick={() => navigate('/novo-pedido')}
              className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display font-bold text-primary-foreground">Carrinho</h1>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">
            Carrinho vazio
          </h2>
          <p className="text-muted-foreground mb-6">
            Adicione itens ao seu carrinho para continuar
          </p>
          <Button variant="acai" onClick={() => navigate('/novo-pedido')}>
            Fazer pedido
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-48">
      {/* Header */}
      <div className="gradient-hero py-6 px-4 sticky top-0 z-10">
        <div className="container max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/novo-pedido')}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display font-bold text-primary-foreground">
            Carrinho ({itens.length} {itens.length === 1 ? 'item' : 'itens'})
          </h1>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Cart Items */}
        <div className="space-y-4">
          {itens.map((item) => (
            <CarrinhoItemCard key={item.id} item={item} />
          ))}
        </div>

        {/* Add More Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/novo-pedido')}
        >
          + Adicionar mais itens
        </Button>

        {/* Delivery Address */}
        {user && (
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Entregar em</h3>
                <p className="text-sm text-muted-foreground">
                  {user.endereco.rua}, {user.endereco.numero}
                  {user.endereco.complemento && ` - ${user.endereco.complemento}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.endereco.bairro}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Forma de pagamento
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {FORMAS_PAGAMENTO.map((forma) => (
              <button
                key={forma.id}
                onClick={() => setFormaPagamento(forma.id)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                  formaPagamento === forma.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  formaPagamento === forma.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  {forma.icon}
                </div>
                <span className="font-medium text-foreground">{forma.label}</span>
                {formaPagamento === forma.id && (
                  <Check className="h-5 w-5 text-primary ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Summary & Checkout */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-float">
        <div className="container max-w-md mx-auto">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            {totalAdicionais > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Adicionais extras</span>
                <span className="text-foreground">R$ {totalAdicionais.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span className="text-foreground">Total</span>
              <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <Button
            variant="acai"
            size="lg"
            className="w-full"
            onClick={handleFinalizarPedido}
            disabled={isLoading || !formaPagamento}
          >
          {isLoading ? 'Finalizando...' : 'Finalizar Pedido'}
          </Button>
        </div>
      </div>

      {/* PIX Modal */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Pagamento via PIX</DialogTitle>
          </DialogHeader>
          <PixQRCode
            valor={total}
            descricao={`Pedido #${numeroPedidoAtual}`}
            onSuccess={handlePixSuccess}
            onCancel={handlePixCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
