import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Produto, TAMANHO_LABELS, TipoEmbalagem, EMBALAGEM_LABELS } from '@/types';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import { ProductCard } from '@/components/ProductCard';
import { AdicionalQuantity } from '@/components/AdicionalQuantity';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useProdutos, TipoAdicional, TIPO_ADICIONAL_LABELS } from '@/hooks/useProdutos';
import { ArrowLeft, ShoppingCart, ShoppingBag, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import isoporImage from '@/assets/isopor-acai.png';
import copoImage from '@/assets/copo-acai.png';

export default function NovoPedido() {
  const navigate = useNavigate();
  const { adicionarItem, quantidadeTotal } = useCarrinho();
  const { toast } = useToast();
  const [step, setStep] = useState<'tamanho' | 'embalagem' | 'adicionais'>('tamanho');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [embalagemSelecionada, setEmbalagemSelecionada] = useState<TipoEmbalagem | null>(null);
  const [adicionaisQuantidades, setAdicionaisQuantidades] = useState<Record<string, number>>({});

  const { produtos, adicionais, isLoading } = useProdutos();

  const produtosAtivos = produtos.filter(p => p.ativo);
  const adicionaisAtivos = adicionais.filter(a => a.ativo);

  // Ordenar adicionais por categoria: Frutas primeiro, depois Doces
  const categoriasOrdenadas: TipoAdicional[] = ['frutas', 'doces', 'cereais'];
  const adicionaisOrdenados = [...adicionaisAtivos].sort((a, b) => {
    const indexA = categoriasOrdenadas.indexOf(a.tipo);
    const indexB = categoriasOrdenadas.indexOf(b.tipo);
    if (indexA !== indexB) return indexA - indexB;
    return a.nome.localeCompare(b.nome);
  });

  // Agrupar por categoria
  const adicionaisPorCategoria = categoriasOrdenadas
    .map(tipo => ({
      tipo,
      label: TIPO_ADICIONAL_LABELS[tipo],
      items: adicionaisOrdenados.filter(a => a.tipo === tipo),
    }))
    .filter(grupo => grupo.items.length > 0);

  const handleSelectProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setStep('embalagem');
    setEmbalagemSelecionada(null);
    setAdicionaisQuantidades({});
  };

  const handleSelectEmbalagem = (embalagem: TipoEmbalagem) => {
    setEmbalagemSelecionada(embalagem);
    setStep('adicionais');
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
    if (!produtoSelecionado || !embalagemSelecionada) return;

    adicionarItem(produtoSelecionado, getAdicionaisArray(), embalagemSelecionada);
    toast({
      title: 'Adicionado ao carrinho!',
      description: `Açaí ${TAMANHO_LABELS[produtoSelecionado.tamanho]} (${EMBALAGEM_LABELS[embalagemSelecionada]}) adicionado.`,
    });

    if (goToCart) {
      navigate('/carrinho');
    } else {
      // Reset for new item
      setStep('tamanho');
      setProdutoSelecionado(null);
      setEmbalagemSelecionada(null);
      setAdicionaisQuantidades({});
    }
  };

  const goBack = () => {
    if (step === 'adicionais') {
      setStep('embalagem');
    } else if (step === 'embalagem') {
      setStep('tamanho');
      setProdutoSelecionado(null);
    } else {
      navigate('/');
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'tamanho': return 'Escolha o Tamanho';
      case 'embalagem': return 'Escolha a Embalagem';
      case 'adicionais': return 'Adicionais';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="gradient-hero py-6 px-4 sticky top-0 z-10">
        <div className="container max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">
              {step === 'adicionais' ? 'Embalagem' : step === 'embalagem' ? 'Tamanhos' : 'Voltar'}
            </span>
          </button>

          <h1 className="font-display font-bold text-primary-foreground">
            {getTitle()}
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

        {step === 'embalagem' && produtoSelecionado && (
          <div className="animate-fade-in">
            {/* Selected Product Summary */}
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 mb-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-acai-light to-muted flex items-center justify-center overflow-hidden">
                {produtoSelecionado.imagem_url ? (
                  <img src={produtoSelecionado.imagem_url} alt={produtoSelecionado.nome} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🥣</span>
                )}
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">
                  {produtoSelecionado.nome}
                  <span className="text-sm font-medium text-muted-foreground ml-2">
                    {TAMANHO_LABELS[produtoSelecionado.tamanho]}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">{produtoSelecionado.peso}</p>
              </div>
              <span className="ml-auto font-bold text-primary text-lg">
                R$ {produtoSelecionado.preco.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Embalagem Options */}
            <h3 className="font-display font-semibold text-foreground mb-4">
              Escolha a embalagem
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(['copo', 'isopor'] as TipoEmbalagem[]).map((embalagem) => (
                <button
                  key={embalagem}
                  onClick={() => handleSelectEmbalagem(embalagem)}
                  className={cn(
                    'bg-card rounded-xl p-6 shadow-card border-2 transition-all flex flex-col items-center gap-3 relative',
                    embalagemSelecionada === embalagem
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border/50 hover:border-primary/50'
                  )}
                >
                  {embalagem === 'copo' ? (
                    <img src={copoImage} alt="Copo" className="w-16 h-16 object-contain" />
                  ) : (
                    <img src={isoporImage} alt="Isopor" className="w-16 h-16 object-contain" />
                  )}
                  <span className="font-semibold text-foreground">
                    {EMBALAGEM_LABELS[embalagem]}
                  </span>
                  {embalagemSelecionada === embalagem && (
                    <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'adicionais' && produtoSelecionado && embalagemSelecionada && (
          <div className="animate-fade-in">
            {/* Selected Product Summary */}
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 mb-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-acai-light to-muted flex items-center justify-center overflow-hidden">
                {produtoSelecionado.imagem_url ? (
                  <img src={produtoSelecionado.imagem_url} alt={produtoSelecionado.nome} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🥣</span>
                )}
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">
                  {produtoSelecionado.nome}
                  <span className="text-sm font-medium text-muted-foreground ml-2">
                    {TAMANHO_LABELS[produtoSelecionado.tamanho]}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {produtoSelecionado.peso} • {EMBALAGEM_LABELS[embalagemSelecionada]}
                </p>
              </div>
              <span className="ml-auto font-bold text-primary text-lg">
                R$ {produtoSelecionado.preco.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Free additionals info */}
            <div className="bg-tropical-light rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-tropical mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-tropical">3 adicionais grátis!</p>
                <p className="text-xs text-tropical/80">A partir do 4º adicional, R$ 2,00 cada</p>
              </div>
            </div>

            {/* Additionals by Category */}
            <div className="space-y-6">
              <h3 className="font-display font-semibold text-foreground">
                Escolha seus adicionais
                <span className="text-muted-foreground font-normal ml-2">
                  ({totalAdicionais} selecionados)
                </span>
              </h3>
              
              {adicionaisPorCategoria.map((categoria) => (
                <div key={categoria.tipo} className="space-y-3">
                  <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">
                    {categoria.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {categoria.items.map((adicional) => {
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
              ))}
            </div>

            {/* Add to Cart Button */}
            <div className="pt-4">
              <Button
                variant="acai"
                size="lg"
                className="w-full gap-2"
                onClick={() => handleAddToCart(true)}
              >
                <ShoppingBag className="h-5 w-5" />
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
