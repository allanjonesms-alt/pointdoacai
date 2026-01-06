import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRODUTOS, ADICIONAIS, Produto, TAMANHO_LABELS, CarrinhoItem } from '@/types';
import { useClientes } from '@/hooks/useClientes';
import { usePedidos } from '@/contexts/PedidosContext';
import { ProductCard } from '@/components/ProductCard';
import { AdicionalChip } from '@/components/AdicionalChip';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, ShoppingCart, Trash2, User, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PedidoDireto() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clientes, isLoading: loadingClientes } = useClientes();
  const { criarPedido } = usePedidos();

  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [step, setStep] = useState<'cliente' | 'tamanho' | 'adicionais' | 'resumo'>('cliente');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<string[]>([]);
  const [itensCarrinho, setItensCarrinho] = useState<CarrinhoItem[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<'credito' | 'debito' | 'pix' | 'dinheiro'>('dinheiro');

  const produtosAtivos = PRODUTOS.filter(p => p.ativo);
  const adicionaisAtivos = ADICIONAIS.filter(a => a.ativo);

  const clienteInfo = clientes.find(c => c.id === clienteSelecionado);

  const handleSelectProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setStep('adicionais');
    setAdicionaisSelecionados([]);
  };

  const toggleAdicional = (nome: string) => {
    setAdicionaisSelecionados(prev =>
      prev.includes(nome)
        ? prev.filter(a => a !== nome)
        : [...prev, nome]
    );
  };

  const calcularExtras = () => {
    const extras = Math.max(0, adicionaisSelecionados.length - 3);
    return extras * 2;
  };

  const handleAddToCart = () => {
    if (!produtoSelecionado) return;

    const novoItem: CarrinhoItem = {
      id: `item-${Date.now()}`,
      produto: produtoSelecionado,
      quantidade: 1,
      adicionais: adicionaisSelecionados,
      valorUnitario: produtoSelecionado.preco,
      valorAdicionais: calcularExtras(),
    };

    setItensCarrinho(prev => [...prev, novoItem]);
    toast({
      title: 'Item adicionado!',
      description: `Açaí ${TAMANHO_LABELS[produtoSelecionado.tamanho]} adicionado.`,
    });

    setStep('tamanho');
    setProdutoSelecionado(null);
    setAdicionaisSelecionados([]);
  };

  const removerItem = (itemId: string) => {
    setItensCarrinho(prev => prev.filter(item => item.id !== itemId));
  };

  const calcularTotal = () => {
    return itensCarrinho.reduce((acc, item) => 
      acc + (item.valorUnitario + item.valorAdicionais) * item.quantidade, 0
    );
  };

  const handleFinalizarPedido = () => {
    if (!clienteInfo) return;

    const numeroPedido = criarPedido(
      clienteInfo.id,
      clienteInfo.nome,
      {
        rua: clienteInfo.rua,
        numero: clienteInfo.numero,
        bairro: clienteInfo.bairro,
        complemento: clienteInfo.complemento || undefined,
        referencia: clienteInfo.referencia || undefined,
      },
      formaPagamento,
      itensCarrinho,
      calcularTotal()
    );

    toast({
      title: 'Pedido Direto criado!',
      description: `Pedido #${numeroPedido} criado com sucesso.`,
    });

    navigate('/admin');
  };

  const goBack = () => {
    if (step === 'adicionais') {
      setStep('tamanho');
      setProdutoSelecionado(null);
    } else if (step === 'tamanho') {
      if (itensCarrinho.length > 0) {
        setStep('resumo');
      } else {
        setStep('cliente');
      }
    } else if (step === 'resumo') {
      setStep('tamanho');
    } else {
      navigate('/admin');
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'cliente': return 'Selecionar Cliente';
      case 'tamanho': return 'Escolha o Tamanho';
      case 'adicionais': return 'Adicionais';
      case 'resumo': return 'Resumo do Pedido';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="gradient-hero py-6 px-4 sticky top-0 z-10">
        <div className="container max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Voltar</span>
          </button>

          <h1 className="font-display font-bold text-primary-foreground">
            {getTitle()}
          </h1>

          {itensCarrinho.length > 0 && step !== 'resumo' && (
            <button 
              onClick={() => setStep('resumo')}
              className="relative"
            >
              <ShoppingCart className="h-6 w-6 text-primary-foreground" />
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itensCarrinho.length}
              </span>
            </button>
          )}
          {itensCarrinho.length === 0 && step !== 'resumo' && <div className="w-6" />}
          {step === 'resumo' && <div className="w-6" />}
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Step: Cliente */}
        {step === 'cliente' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
              <label className="block text-sm font-medium text-foreground mb-2">
                Selecione o cliente
              </label>
              <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingClientes ? "Carregando..." : "Escolha um cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{cliente.nome}</span>
                        <span className="text-muted-foreground">- {cliente.telefone}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {clienteInfo && (
              <div className="bg-muted rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-2">Endereço de entrega</h3>
                <p className="text-sm text-muted-foreground">
                  {clienteInfo.rua}, {clienteInfo.numero}
                </p>
                <p className="text-sm text-muted-foreground">
                  {clienteInfo.bairro}
                </p>
                {clienteInfo.complemento && (
                  <p className="text-sm text-muted-foreground">
                    {clienteInfo.complemento}
                  </p>
                )}
              </div>
            )}

            <Button
              variant="acai"
              size="lg"
              className="w-full"
              disabled={!clienteSelecionado}
              onClick={() => setStep('tamanho')}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step: Tamanho */}
        {step === 'tamanho' && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            {produtosAtivos.map((produto) => (
              <ProductCard
                key={produto.id}
                produto={produto}
                onSelect={handleSelectProduto}
                selected={produtoSelecionado?.id === produto.id}
              />
            ))}
          </div>
        )}

        {/* Step: Adicionais */}
        {step === 'adicionais' && produtoSelecionado && (
          <div className="animate-fade-in">
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 mb-6 flex items-center gap-3">
              <span className="text-4xl">🥣</span>
              <div>
                <h3 className="font-display font-bold text-foreground">
                  Açaí {TAMANHO_LABELS[produtoSelecionado.tamanho]}
                </h3>
                <p className="text-sm text-muted-foreground">{produtoSelecionado.peso}</p>
              </div>
              <span className="ml-auto font-bold text-primary text-lg">
                R$ {produtoSelecionado.preco.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="bg-tropical-light rounded-xl p-4 mb-6 flex items-start gap-3">
              <div>
                <p className="text-sm font-semibold text-tropical">3 adicionais grátis!</p>
                <p className="text-xs text-tropical/80">A partir do 4º adicional, R$ 2,00 cada</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-semibold text-foreground">
                Escolha os adicionais
                <span className="text-muted-foreground font-normal ml-2">
                  ({adicionaisSelecionados.length} selecionados)
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {adicionaisAtivos.map((adicional) => {
                  const isSelected = adicionaisSelecionados.includes(adicional.nome);
                  const selectedIndex = adicionaisSelecionados.indexOf(adicional.nome);
                  const isFree = selectedIndex < 3;

                  return (
                    <AdicionalChip
                      key={adicional.id}
                      nome={adicional.nome}
                      selected={isSelected}
                      onToggle={() => toggleAdicional(adicional.nome)}
                      isFree={!isSelected || isFree}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step: Resumo */}
        {step === 'resumo' && (
          <div className="animate-fade-in space-y-4">
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">{clienteInfo?.nome}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {clienteInfo?.rua}, {clienteInfo?.numero} - {clienteInfo?.bairro}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-foreground">Itens do Pedido</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('tamanho')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {itensCarrinho.map((item) => (
                <div key={item.id} className="bg-card rounded-xl p-4 shadow-card border border-border/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Açaí {TAMANHO_LABELS[item.produto.tamanho]}
                      </h4>
                      {item.adicionais.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          + {item.adicionais.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">
                        R$ {(item.valorUnitario + item.valorAdicionais).toFixed(2).replace('.', ',')}
                      </span>
                      <button
                        onClick={() => removerItem(item.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
              <label className="block text-sm font-medium text-foreground mb-2">
                Forma de Pagamento
              </label>
              <Select value={formaPagamento} onValueChange={(v: any) => setFormaPagamento(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="debito">Cartão de Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar - Adicionais */}
      {step === 'adicionais' && produtoSelecionado && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-float">
          <div className="container max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor do item</p>
                <p className="font-bold text-xl text-foreground">
                  R$ {(produtoSelecionado.preco + calcularExtras()).toFixed(2).replace('.', ',')}
                </p>
              </div>
              <Button
                variant="acai"
                size="lg"
                onClick={handleAddToCart}
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar - Resumo */}
      {step === 'resumo' && itensCarrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-float">
          <div className="container max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total do Pedido</p>
                <p className="font-bold text-xl text-foreground">
                  R$ {calcularTotal().toFixed(2).replace('.', ',')}
                </p>
              </div>
              <Button
                variant="acai"
                size="lg"
                onClick={handleFinalizarPedido}
                className="gap-2"
              >
                <Check className="h-5 w-5" />
                Finalizar Pedido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
