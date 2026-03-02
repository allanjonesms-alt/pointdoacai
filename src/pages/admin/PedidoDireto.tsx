import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TAMANHO_LABELS, CarrinhoItem, TipoEmbalagem, EMBALAGEM_LABELS } from '@/types';
import { useClientes } from '@/hooks/useClientes';
import { usePedidos } from '@/contexts/PedidosContext';
import { useProdutos, TipoAdicional, TIPO_ADICIONAL_LABELS, CategoriaProduto, CATEGORIA_LABELS, ProdutoDB } from '@/hooks/useProdutos';
import { ProductCardCompact } from '@/components/ProductCardCompact';
import { AdicionalQuantity } from '@/components/AdicionalQuantity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, ShoppingCart, Trash2, User, Check, Search, Phone, Truck, Store, UserPlus, CreditCard, Smartphone, QrCode, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CadastroClienteModal } from '@/components/admin/CadastroClienteModal';
import isoporImage from '@/assets/isopor-acai.png';
import copoImage from '@/assets/copo-acai.png';

type FormaPagamento = 'credito' | 'debito' | 'pix' | 'dinheiro';

const FORMAS_PAGAMENTO: { id: FormaPagamento; label: string; icon: React.ReactNode }[] = [
  { id: 'credito', label: 'Crédito', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'debito', label: 'Débito', icon: <Smartphone className="h-5 w-5" /> },
  { id: 'pix', label: 'PIX', icon: <QrCode className="h-5 w-5" /> },
  { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="h-5 w-5" /> },
];

type ModoEntrega = 'entrega' | 'retirada';
const TAXA_ENTREGA = 1.00;

export default function PedidoDireto() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clientes, isLoading: loadingClientes, fetchClientes } = useClientes();
  const { criarPedido } = usePedidos();
  const { produtos, adicionais, isLoading: loadingProdutos } = useProdutos();

  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [step, setStep] = useState<'cliente' | 'tamanho' | 'embalagem' | 'adicionais' | 'resumo'>('cliente');
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoDB | null>(null);
  const [embalagemSelecionada, setEmbalagemSelecionada] = useState<TipoEmbalagem | null>(null);
  const [adicionaisQuantidades, setAdicionaisQuantidades] = useState<Record<string, number>>({});
  const [itensCarrinho, setItensCarrinho] = useState<CarrinhoItem[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<'credito' | 'debito' | 'pix' | 'dinheiro'>('dinheiro');
  const [pedidoPago, setPedidoPago] = useState<boolean>(false);
  const [modoEntrega, setModoEntrega] = useState<ModoEntrega>('entrega');
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

  const produtosAtivos = produtos.filter(p => p.ativo);
  const adicionaisAtivos = adicionais.filter(a => a.ativo);

  // Agrupar produtos por categoria
  const categoriasOrdem: CategoriaProduto[] = ['acai', 'barcas', 'sorvetes', 'picoles', 'bebidas'];
  const produtosPorCategoria = useMemo(() => {
    return categoriasOrdem
      .map(cat => ({
        categoria: cat,
        label: CATEGORIA_LABELS[cat],
        items: produtosAtivos.filter(p => p.categoria === cat),
      }))
      .filter(grupo => grupo.items.length > 0);
  }, [produtosAtivos]);

  const clienteInfo = clientes.find(c => c.id === clienteSelecionado);

  // Filter clients based on search (name or phone)
  const clientesFiltrados = useMemo(() => {
    const searchName = busca.trim().toLowerCase();
    const searchDigits = busca.replace(/\D/g, "");

    if (!searchName && !searchDigits) return clientes;

    return clientes.filter((cliente) => {
      const nome = cliente.nome?.toLowerCase?.() ?? "";
      const telefoneDigits = (cliente.telefone ?? "").replace(/\D/g, "");

      const matchNome = searchName ? nome.includes(searchName) : false;
      const matchTelefone = searchDigits ? telefoneDigits.includes(searchDigits) : false;

      return matchNome || matchTelefone;
    });
  }, [clientes, busca]);

  const handleSelectProduto = (produto: ProdutoDB) => {
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
      if (quantidade <= 0) {
        const { [nome]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [nome]: quantidade };
    });
  };

  // Calcular total de adicionais selecionados
  const totalAdicionais = Object.values(adicionaisQuantidades).reduce((acc, qty) => acc + qty, 0);
  
  // Converter quantidades para array de nomes (para o carrinho)
  const getAdicionaisArray = () => {
    const result: string[] = [];
    Object.entries(adicionaisQuantidades).forEach(([nome, qty]) => {
      for (let i = 0; i < qty; i++) {
        result.push(nome);
      }
    });
    return result;
  };

  const calcularExtras = () => {
    const extras = Math.max(0, totalAdicionais - 3);
    return extras * 2;
  };

  const handleAddToCart = (goToSummary: boolean = false) => {
    if (!produtoSelecionado || !embalagemSelecionada) return;

    // Converter ProdutoDB para Produto
    const produtoParaCarrinho = {
      id: produtoSelecionado.id,
      nome: produtoSelecionado.nome,
      tamanho: produtoSelecionado.tamanho,
      peso: produtoSelecionado.peso,
      preco: produtoSelecionado.preco,
      ativo: produtoSelecionado.ativo,
      imagem_url: produtoSelecionado.imagem_url,
    };

    const novoItem: CarrinhoItem = {
      id: `item-${Date.now()}`,
      produto: produtoParaCarrinho,
      quantidade: 1,
      adicionais: getAdicionaisArray(),
      embalagem: embalagemSelecionada,
      valorUnitario: produtoSelecionado.preco,
      valorAdicionais: calcularExtras(),
    };

    setItensCarrinho(prev => [...prev, novoItem]);
    toast({
      title: 'Item adicionado!',
      description: `Açaí ${TAMANHO_LABELS[produtoSelecionado.tamanho]} (${EMBALAGEM_LABELS[embalagemSelecionada]}) adicionado.`,
    });

    if (goToSummary) {
      setStep('resumo');
    } else {
      setStep('tamanho');
    }
    setProdutoSelecionado(null);
    setEmbalagemSelecionada(null);
    setAdicionaisQuantidades({});
  };

  const removerItem = (itemId: string) => {
    setItensCarrinho(prev => prev.filter(item => item.id !== itemId));
  };

  const calcularSubtotal = () => {
    return itensCarrinho.reduce((acc, item) => 
      acc + (item.valorUnitario + item.valorAdicionais) * item.quantidade, 0
    );
  };

  const taxaEntrega = itensCarrinho.length > 0 && modoEntrega === 'entrega' ? TAXA_ENTREGA : 0;
  const calcularTotal = () => calcularSubtotal() + taxaEntrega;

  const handleFinalizarPedido = async () => {
    if (!clienteInfo) return;

    const result = await criarPedido(
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
      calcularTotal(),
      formaPagamento === 'dinheiro' ? valorTroco : null
    );

    toast({
      title: 'Pedido Direto criado!',
      description: `Pedido criado com sucesso.`,
    });

    navigate('/admin');
  };

  const goBack = () => {
    if (step === 'adicionais') {
      setStep('embalagem');
    } else if (step === 'embalagem') {
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
      case 'embalagem': return 'Escolha a Embalagem';
      case 'adicionais': return 'Adicionais';
      case 'resumo': return 'Resumo do Pedido';
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-background",
      step === 'resumo' ? "pb-64" : "pb-8"
    )}>
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
          {step === 'resumo' && (
            <button 
              onClick={() => navigate('/admin')}
              className="text-primary-foreground/80 hover:text-primary-foreground text-sm font-medium"
            >
              Dashboard
            </button>
          )}
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Step: Cliente */}
        {step === 'cliente' && (
          <div className="animate-fade-in space-y-4">
            {/* Search Input */}
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
              <label className="block text-sm font-medium text-foreground mb-2">
                Buscar cliente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o nome ou telefone..."
                  className="pl-10"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Add Client Button */}
            <CadastroClienteModal onSuccess={fetchClientes} />

            {/* Client List */}
            <div className="space-y-2">
              {loadingClientes ? (
                <div className="bg-card rounded-xl p-8 shadow-card border border-border/50 text-center">
                  <p className="text-muted-foreground">Carregando clientes...</p>
                </div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="bg-card rounded-xl p-8 shadow-card border border-border/50 text-center">
                  <p className="text-muted-foreground">
                    {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </p>
                </div>
              ) : (
                clientesFiltrados.map(cliente => (
                  <button
                    key={cliente.id}
                    onClick={() => {
                      setClienteSelecionado(cliente.id);
                      setStep('tamanho');
                    }}
                    className={`w-full text-left bg-card rounded-xl p-4 shadow-card border transition-all ${
                      clienteSelecionado === cliente.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        clienteSelecionado === cliente.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{cliente.nome}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{cliente.telefone}</span>
                        </div>
                        {cliente.rua && (
                          <p className="text-xs text-muted-foreground truncate">
                            {cliente.rua}, {cliente.numero} - {cliente.bairro}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step: Tamanho */}
        {step === 'tamanho' && (
          <div className="animate-fade-in space-y-6">
            {produtosPorCategoria.map((grupo) => (
              <div key={grupo.categoria}>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
                  {grupo.label}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {grupo.items.map((produto) => (
                    <ProductCardCompact
                      key={produto.id}
                      produto={produto}
                      onSelect={handleSelectProduto}
                      selected={produtoSelecionado?.id === produto.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step: Embalagem */}
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

        {/* Step: Adicionais */}
        {step === 'adicionais' && produtoSelecionado && embalagemSelecionada && (
          <div className="animate-fade-in">
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

            <div className="bg-tropical-light rounded-xl p-4 mb-6 flex items-start gap-3">
              <div>
                <p className="text-sm font-semibold text-tropical">3 adicionais grátis!</p>
                <p className="text-xs text-tropical/80">A partir do 4º adicional, R$ 2,00 cada</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-display font-semibold text-foreground">
                Escolha os adicionais
                <span className="text-muted-foreground font-normal ml-2">
                  ({totalAdicionais} selecionados)
                </span>
              </h3>
              {(['frutas', 'doces', 'cereais'] as TipoAdicional[]).map((tipo) => {
                const adicionaisDoTipo = adicionaisAtivos.filter(a => a.tipo === tipo);
                if (adicionaisDoTipo.length === 0) return null;

                const emoji = tipo === 'frutas' ? '🍓' : tipo === 'doces' ? '🍫' : '🌾';

                return (
                  <div key={tipo} className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <span>{emoji}</span>
                      {TIPO_ADICIONAL_LABELS[tipo]}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {adicionaisDoTipo.map((adicional) => {
                        const quantidade = adicionaisQuantidades[adicional.nome] || 0;
                        const adicionaisAnteriores = Object.entries(adicionaisQuantidades)
                          .filter(([nome]) => {
                            const idx = adicionaisAtivos.findIndex(a => a.nome === nome);
                            return idx < adicionaisAtivos.findIndex(a => a.nome === adicional.nome);
                          })
                          .reduce((acc, [, qty]) => acc + qty, 0);
                        const gratuitosRestantes = Math.max(0, 3 - adicionaisAnteriores);

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
                );
              })}
            </div>

            {/* Add to Cart Button */}
            <div className="pt-4">
              <Button
                variant="acai"
                size="lg"
                className="w-full gap-2"
                onClick={() => handleAddToCart(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                Adicionar ao Pedido
              </Button>
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
                      <p className="text-xs text-muted-foreground">
                        {EMBALAGEM_LABELS[item.embalagem]}
                      </p>
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

            {/* Modo de Entrega */}
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Pedido Pago */}
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
              <label className="block text-sm font-medium text-foreground mb-3">
                Pedido Pago?
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setPedidoPago(true)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                    pedidoPago
                      ? 'border-green-500 bg-green-500/10 text-green-600'
                      : 'border-border bg-card text-muted-foreground hover:border-green-500/50'
                  }`}
                >
                  ✓ Sim
                </button>
                <button
                  onClick={() => setPedidoPago(false)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                    !pedidoPago
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                      : 'border-border bg-card text-muted-foreground hover:border-amber-500/50'
                  }`}
                >
                  ✗ Não
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar - Resumo */}
      {step === 'resumo' && itensCarrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-float">
          <div className="container max-w-md mx-auto">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">R$ {calcularSubtotal().toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Entrega</span>
                <span className={cn("text-foreground", modoEntrega === 'retirada' && "text-green-600")}>
                  {modoEntrega === 'retirada' ? 'Grátis' : `R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span className="text-foreground">Total</span>
                <span className="text-primary">R$ {calcularTotal().toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
            <Button
              variant="acai"
              size="lg"
              className="w-full gap-2"
              onClick={handleFinalizarPedido}
            >
              <Check className="h-5 w-5" />
              Finalizar Pedido
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
