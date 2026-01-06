import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Produto, TAMANHO_LABELS } from '@/types';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import { ProductCard } from '@/components/ProductCard';
import { AdicionalQuantity } from '@/components/AdicionalQuantity';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useProdutos } from '@/hooks/useProdutos';
import { ArrowLeft, ShoppingCart, ShoppingBag, AlertCircle } from 'lucide-react';

export default function NovoPedido() {
  const navigate = useNavigate();
  const { adicionarItem, quantidadeTotal, total } = useCarrinho();
  const { toast } = useToast();
  const [step, setStep] = useState<'tamanho' | 'adicionais'>('tamanho');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [adicionaisQuantidades, setAdicionaisQuantidades] = useState<Record<string, number>>({});

  const { produtos, adicionais, isLoading } = useProdutos();

  const produtosAtivos = produtos.filter(p => p.ativo);
  const adicionaisAtivos = adicionais.filter(a => a.ativo);

  const handleSelectProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setStep('adicionais');
    setAdicionaisQuantidades({});
  };

  const handleQuantidadeChange = (nome: string, quantidade: number) => {
    setAdicionaisQuantidades(prev => {
      if (quantidade === 0) {
        const { [nome]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [nome]: quantidade };
    });
  };

  // Conta o total de adicionais (considerando quantidades)
  const totalAdicionais = Object.values(adicionaisQuantidades).reduce((sum, qty) => sum + qty, 0);

  const calcularExtras = () => {
    const extras = Math.max(0, totalAdicionais - 3);
    return extras * 2;
  };

  // Converte o objeto de quantidades para array de nomes (repetindo conforme quantidade)
  const getAdicionaisArray = () => {
    const result: string[] = [];
    Object.entries(adicionaisQuantidades).forEach(([nome, quantidade]) => {
      for (let i = 0; i < quantidade; i++) {
        result.push(nome);
      }
    });
    return result;
  };

  const handleAddToCart = (goToCart: boolean = false) => {
    if (!produtoSelecionado) return;

    adicionarItem(produtoSelecionado, getAdicionaisArray());
    toast({
      title: 'Adicionado ao carrinho!',
      description: `Açaí ${TAMANHO_LABELS[produtoSelecionado.tamanho]} adicionado.`,
    });

    if (goToCart) {
      navigate('/carrinho');
    } else {
      // Reset for new item
      setStep('tamanho');
      setProdutoSelecionado(null);
      setAdicionaisQuantidades({});
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="gradient-hero py-6 px-4 sticky top-0 z-10">
        <div className="container max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => step === 'adicionais' ? setStep('tamanho') : navigate('/')}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">
              {step === 'adicionais' ? 'Tamanhos' : 'Voltar'}
            </span>
          </button>

          <h1 className="font-display font-bold text-primary-foreground">
            {step === 'tamanho' ? 'Escolha o Tamanho' : 'Adicionais'}
          </h1>

          <Link to="/carrinho" className="relative">
            <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            {quantidadeTotal > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {quantidadeTotal}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        {step === 'tamanho' ? (
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
        ) : (
          <div className="animate-fade-in">
            {/* Selected Product Summary */}
            {produtoSelecionado && (
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
            )}

            {/* Free additionals info */}
            <div className="bg-tropical-light rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-tropical mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-tropical">3 adicionais grátis!</p>
                <p className="text-xs text-tropical/80">A partir do 4º adicional, R$ 2,00 cada</p>
              </div>
            </div>

            {/* Additionals Grid */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-foreground">
                Escolha seus adicionais
                <span className="text-muted-foreground font-normal ml-2">
                  ({totalAdicionais} selecionados)
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {adicionaisAtivos.map((adicional) => {
                  const quantidade = adicionaisQuantidades[adicional.nome] || 0;
                  // Calcula quantos gratuitos ainda restam para este adicional
                  let gratuitosUsados = 0;
                  for (const [nome, qty] of Object.entries(adicionaisQuantidades)) {
                    if (nome === adicional.nome) break;
                    gratuitosUsados += qty;
                  }
                  const gratuitosRestantes = Math.max(0, 3 - gratuitosUsados);

                  return (
                    <AdicionalQuantity
                      key={adicional.id}
                      nome={adicional.nome}
                      quantidade={quantidade}
                      onQuantidadeChange={(qty) => handleQuantidadeChange(adicional.nome, qty)}
                      gratuitos={gratuitosRestantes}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {step === 'adicionais' && produtoSelecionado && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-float animate-slide-in-right">
          <div className="container max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Valor do item</p>
                <p className="font-bold text-xl text-foreground">
                  R$ {(produtoSelecionado.preco + calcularExtras()).toFixed(2).replace('.', ',')}
                </p>
                {calcularExtras() > 0 && (
                  <p className="text-xs text-accent">
                    + R$ {calcularExtras().toFixed(2).replace('.', ',')} (adicionais extras)
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={() => handleAddToCart(false)}
                className="flex-1 gap-2 bg-violet-400 hover:bg-violet-500 text-white"
              >
                Continuar Comprando
              </Button>
              <Button
                size="lg"
                onClick={() => handleAddToCart(true)}
                className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
              >
                <ShoppingBag className="h-5 w-5" />
                Finalizar Compra
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
