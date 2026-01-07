import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TAMANHO_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Package, Sparkles, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProdutos, ProdutoDB, AdicionalDB, TipoAdicional, TIPO_ADICIONAL_LABELS, CategoriaProduto, CATEGORIA_LABELS } from '@/hooks/useProdutos';
import { ProdutoModal } from '@/components/admin/ProdutoModal';
import { AdicionalModal } from '@/components/admin/AdicionalModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminProdutos() {
  const navigate = useNavigate();
  const {
    produtos,
    adicionais,
    isLoading,
    criarProduto,
    atualizarProduto,
    excluirProduto,
    toggleProdutoAtivo,
    criarAdicional,
    atualizarAdicional,
    excluirAdicional,
    toggleAdicionalAtivo,
  } = useProdutos();

  const [activeTab, setActiveTab] = useState<'produtos' | 'adicionais'>('produtos');

  // Produto modal state
  const [produtoModalOpen, setProdutoModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoDB | null>(null);

  // Adicional modal state
  const [adicionalModalOpen, setAdicionalModalOpen] = useState(false);
  const [adicionalEditando, setAdicionalEditando] = useState<AdicionalDB | null>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'produto' | 'adicional'; id: string; nome: string } | null>(null);

  const handleNovoProduto = () => {
    setProdutoEditando(null);
    setProdutoModalOpen(true);
  };

  const handleEditarProduto = (produto: ProdutoDB) => {
    setProdutoEditando(produto);
    setProdutoModalOpen(true);
  };

  const handleSaveProduto = async (data: { nome: string; tamanho: ProdutoDB['tamanho']; peso: string; preco: number; ativo: boolean; categoria: CategoriaProduto }) => {
    if (produtoEditando) {
      return atualizarProduto(produtoEditando.id, data);
    } else {
      return criarProduto(data);
    }
  };

  // Group produtos by category
  const produtosByCategoria = produtos.reduce((acc, produto) => {
    const cat = produto.categoria || 'acai';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(produto);
    return acc;
  }, {} as Record<CategoriaProduto, ProdutoDB[]>);

  const handleNovoAdicional = () => {
    setAdicionalEditando(null);
    setAdicionalModalOpen(true);
  };

  const handleEditarAdicional = (adicional: AdicionalDB) => {
    setAdicionalEditando(adicional);
    setAdicionalModalOpen(true);
  };

  const handleSaveAdicional = async (data: { nome: string; tipo: TipoAdicional; ativo: boolean }) => {
    if (adicionalEditando) {
      return atualizarAdicional(adicionalEditando.id, data);
    } else {
      return criarAdicional(data);
    }
  };

  // Group adicionais by type
  const adicionaisByType = adicionais.reduce((acc, adicional) => {
    const tipo = adicional.tipo || 'doces';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(adicional);
    return acc;
  }, {} as Record<TipoAdicional, AdicionalDB[]>);

  const handleDeleteClick = (type: 'produto' | 'adicional', id: string, nome: string) => {
    setItemToDelete({ type, id, nome });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'produto') {
      await excluirProduto(itemToDelete.id);
    } else {
      await excluirAdicional(itemToDelete.id);
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero py-6 px-4 sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display font-bold text-primary-foreground">Produtos</h1>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('produtos')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all',
              activeTab === 'produtos'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <Package className="h-4 w-4" />
            Tamanhos
          </button>
          <button
            onClick={() => setActiveTab('adicionais')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all',
              activeTab === 'adicionais'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <Sparkles className="h-4 w-4" />
            Adicionais
          </button>
        </div>

        {activeTab === 'produtos' ? (
          <div className="space-y-4">
            {/* Add Product Button */}
            <Button onClick={handleNovoProduto} variant="acai" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Produto
            </Button>

            {/* Products List by Category */}
            {(['acai', 'barcas', 'sorvetes', 'picoles', 'bebidas'] as CategoriaProduto[]).map((categoria) => {
              const produtosCategoria = produtosByCategoria[categoria] || [];
              if (produtosCategoria.length === 0) return null;
              
              const categoriaEmoji = categoria === 'acai' ? '🍇' : categoria === 'barcas' ? '🛶' : categoria === 'sorvetes' ? '🍨' : categoria === 'picoles' ? '🍦' : '🥤';
              
              return (
                <div key={categoria} className="space-y-3">
                  <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                    <span className="text-xl">{categoriaEmoji}</span>
                    {CATEGORIA_LABELS[categoria]}
                  </h3>
                  <div className="space-y-3">
                    {produtosCategoria.map((produto) => (
                      <div
                        key={produto.id}
                        className={cn(
                          'bg-card rounded-xl p-4 shadow-card border border-border/50 flex items-center gap-4 transition-opacity',
                          !produto.ativo && 'opacity-60'
                        )}
                      >
                        <div className="w-14 h-14 bg-gradient-to-br from-acai-light to-muted rounded-xl flex items-center justify-center">
                          <span className="text-3xl">{categoriaEmoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-foreground">
                            {produto.nome} - {TAMANHO_LABELS[produto.tamanho] || produto.tamanho}
                          </h3>
                          <p className="text-sm text-muted-foreground">{produto.peso}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">
                            R$ {produto.preco.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditarProduto(produto)}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick('produto', produto.id, `${produto.nome} - ${TAMANHO_LABELS[produto.tamanho] || produto.tamanho}`)}
                            className="p-2 text-destructive hover:text-destructive/80 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <Switch
                            checked={produto.ativo}
                            onCheckedChange={(checked) => toggleProdutoAtivo(produto.id, checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {produtos.length === 0 && (
              <div className="bg-card rounded-xl p-8 shadow-card border border-border/50 text-center">
                <p className="text-muted-foreground">Nenhum produto cadastrado</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add Adicional Button */}
            <Button onClick={handleNovoAdicional} variant="acai" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Adicional
            </Button>

            {/* Adicionais List by Type */}
            {(['frutas', 'doces', 'cereais'] as TipoAdicional[]).map((tipo) => (
              <div key={tipo} className="space-y-3">
                <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                  <span className="text-xl">
                    {tipo === 'frutas' ? '🍓' : tipo === 'doces' ? '🍫' : '🌾'}
                  </span>
                  {TIPO_ADICIONAL_LABELS[tipo]}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(adicionaisByType[tipo] || []).map((adicional) => (
                    <div
                      key={adicional.id}
                      className={cn(
                        'bg-card rounded-xl p-4 shadow-card border border-border/50 flex items-center justify-between transition-opacity',
                        !adicional.ativo && 'opacity-60'
                      )}
                    >
                      <span className="font-medium text-foreground">{adicional.nome}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditarAdicional(adicional)}
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick('adicional', adicional.id, adicional.nome)}
                          className="p-2 text-destructive hover:text-destructive/80 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Switch
                          checked={adicional.ativo}
                          onCheckedChange={(checked) => toggleAdicionalAtivo(adicional.id, checked)}
                        />
                      </div>
                    </div>
                  ))}
                  {(!adicionaisByType[tipo] || adicionaisByType[tipo].length === 0) && (
                    <div className="bg-muted/50 rounded-xl p-4 border border-dashed border-border text-center col-span-2">
                      <p className="text-muted-foreground text-sm">Nenhum adicional de {TIPO_ADICIONAL_LABELS[tipo].toLowerCase()}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ProdutoModal
        open={produtoModalOpen}
        onOpenChange={setProdutoModalOpen}
        produto={produtoEditando}
        onSave={handleSaveProduto}
      />

      <AdicionalModal
        open={adicionalModalOpen}
        onOpenChange={setAdicionalModalOpen}
        adicional={adicionalEditando}
        onSave={handleSaveAdicional}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{itemToDelete?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
