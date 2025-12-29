import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PRODUTOS, ADICIONAIS, Produto, TAMANHO_LABELS } from '@/types';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import { ProductCard } from '@/components/ProductCard';
import { AdicionalChip } from '@/components/AdicionalChip';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShoppingCart, Plus, AlertCircle } from 'lucide-react';

export default function NovoPedido() {
  const navigate = useNavigate();
  const { adicionarItem, quantidadeTotal, total } = useCarrinho();
  const { toast } = useToast();
  const [step, setStep] = useState<'tamanho' | 'adicionais'>('tamanho');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<string[]>([]);

  const produtosAtivos = PRODUTOS.filter(p => p.ativo);
  const adicionaisAtivos = ADICIONAIS.filter(a => a.ativo);

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

    adicionarItem(produtoSelecionado, adicionaisSelecionados);
    toast({
      title: 'Adicionado ao carrinho!',
      description: `Açaí ${TAMANHO_LABELS[produtoSelecionado.tamanho]} adicionado.`,
    });

    // Reset for new item
    setStep('tamanho');
    setProdutoSelecionado(null);
    setAdicionaisSelecionados([]);
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
                  ({adicionaisSelecionados.length} selecionados)
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {adicionaisAtivos.map((adicional, index) => {
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
    </div>
  );
}
