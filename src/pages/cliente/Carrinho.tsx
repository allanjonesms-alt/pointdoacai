import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCarrinho, ModoEntrega } from '@/contexts/CarrinhoContext';
import { usePedidos } from '@/contexts/PedidosContext';
import { useAuth } from '@/contexts/AuthContext';
import { CarrinhoItemCard } from '@/components/CarrinhoItem';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShoppingBag, CreditCard, Smartphone, Banknote, QrCode, Check, MapPin, Store, Truck, ChevronDown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PixQRCode } from '@/components/PixQRCode';
import { useEnderecos, Endereco } from '@/hooks/useEnderecos';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
  const { itens, subtotal, totalAdicionais, taxaEntrega, total, limparCarrinho, modoEntrega, setModoEntrega } = useCarrinho();
  const { criarPedido } = usePedidos();
  const { toast } = useToast();
  const { enderecos, getDefaultEndereco } = useEnderecos();
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [numeroPedidoAtual, setNumeroPedidoAtual] = useState<string | null>(null);
  const [pedidoIdAtual, setPedidoIdAtual] = useState<string | null>(null);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<Endereco | null>(null);
  const [showEnderecoSheet, setShowEnderecoSheet] = useState(false);
  const [valorTroco, setValorTroco] = useState<string>('');

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    const numberValue = parseInt(numericValue, 10) / 100;
    return numberValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleTrocoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValorTroco(formatted);
  };

  // Define o endereço padrão quando os endereços carregam
  useEffect(() => {
    if (enderecos.length > 0 && !enderecoSelecionado) {
      const defaultEndereco = getDefaultEndereco();
      setEnderecoSelecionado(defaultEndereco);
    }
  }, [enderecos, enderecoSelecionado, getDefaultEndereco]);

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

    // Determinar o endereço para entrega
    let enderecoEntrega = user.endereco;
    
    if (modoEntrega === 'entrega' && enderecoSelecionado) {
      enderecoEntrega = {
        rua: enderecoSelecionado.rua,
        numero: enderecoSelecionado.numero,
        bairro: enderecoSelecionado.bairro,
        complemento: enderecoSelecionado.complemento || undefined,
        referencia: enderecoSelecionado.referencia || undefined,
      };
    }

    setIsLoading(true);

    const result = await criarPedido(
      user.id,
      user.nome,
      enderecoEntrega,
      formaPagamento,
      itens,
      total
    );

    if (!result) {
      setIsLoading(false);
      return;
    }

    setNumeroPedidoAtual(result.numeroPedido);
    setPedidoIdAtual(result.pedidoId);

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
      description: `Pedido #${result.numeroPedido} criado com sucesso.`,
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
    <div className="min-h-screen bg-background pb-6">
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

        {/* Delivery Mode */}
        <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Modo de entrega
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setModoEntrega('entrega')}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                modoEntrega === 'entrega'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                modoEntrega === 'entrega' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Truck className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="font-medium text-foreground block">Entrega</span>
                <span className="text-xs text-muted-foreground">+ R$ 1,00</span>
              </div>
              {modoEntrega === 'entrega' && (
                <Check className="h-5 w-5 text-primary ml-auto" />
              )}
            </button>
            <button
              onClick={() => setModoEntrega('retirada')}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                modoEntrega === 'retirada'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                modoEntrega === 'retirada' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Store className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="font-medium text-foreground block">Retirada</span>
                <span className="text-xs text-green-600">Grátis</span>
              </div>
              {modoEntrega === 'retirada' && (
                <Check className="h-5 w-5 text-primary ml-auto" />
              )}
            </button>
          </div>
        </div>

        {/* Delivery Address */}
        {user && modoEntrega === 'entrega' && (
          <Sheet open={showEnderecoSheet} onOpenChange={setShowEnderecoSheet}>
            <SheetTrigger asChild>
              <button className="w-full bg-card rounded-xl p-4 shadow-card border border-border/50 text-left hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground mb-1">Entregar em</h3>
                      {enderecos.length > 1 && (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    {enderecoSelecionado ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {enderecoSelecionado.rua}, {enderecoSelecionado.numero}
                          {enderecoSelecionado.complemento && ` - ${enderecoSelecionado.complemento}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {enderecoSelecionado.bairro}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {user.endereco.rua}, {user.endereco.numero}
                          {user.endereco.complemento && ` - ${user.endereco.complemento}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.endereco.bairro}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Selecionar Endereço
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {enderecos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Nenhum endereço cadastrado</p>
                    <Button onClick={() => navigate('/perfil')} variant="outline">
                      Cadastrar Endereço
                    </Button>
                  </div>
                ) : (
                  enderecos.map((endereco) => (
                    <button
                      key={endereco.id}
                      onClick={() => {
                        setEnderecoSelecionado(endereco);
                        setShowEnderecoSheet(false);
                      }}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-all',
                        enderecoSelecionado?.id === endereco.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {endereco.is_default && (
                              <span className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                <Star className="w-3 h-3" />
                                Padrão
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-foreground">
                            {endereco.rua}, {endereco.numero}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {endereco.bairro}
                            {endereco.complemento && ` - ${endereco.complemento}`}
                          </p>
                          {endereco.referencia && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ref: {endereco.referencia}
                            </p>
                          )}
                        </div>
                        {enderecoSelecionado?.id === endereco.id && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Pickup Location */}
        {modoEntrega === 'retirada' && (
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Retirar em</h3>
                <p className="text-sm text-muted-foreground">
                  Point do Açaí
                </p>
                <p className="text-sm text-muted-foreground">
                  Endereço da loja
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

          {/* Change Value for Cash Payment */}
          {formaPagamento === 'dinheiro' && (
            <div className="mt-4 pt-4 border-t border-border">
              <label htmlFor="valorTroco" className="block text-sm font-medium text-foreground mb-2">
                Valor para troco
              </label>
              <input
                id="valorTroco"
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={valorTroco}
                onChange={handleTrocoChange}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Summary & Checkout */}
        <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Entrega</span>
              <span className={cn("text-foreground", modoEntrega === 'retirada' && "text-green-600")}>
                {modoEntrega === 'retirada' ? 'Grátis' : `R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`}
              </span>
            </div>
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
            pedidoId={pedidoIdAtual || undefined}
            onSuccess={handlePixSuccess}
            onCancel={handlePixCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
