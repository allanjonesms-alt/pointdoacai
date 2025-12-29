import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRODUTOS, ADICIONAIS, TAMANHO_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Package, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminProdutos() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState(PRODUTOS);
  const [adicionais, setAdicionais] = useState(ADICIONAIS);
  const [activeTab, setActiveTab] = useState<'produtos' | 'adicionais'>('produtos');

  const toggleProduto = (id: string) => {
    setProdutos(prev => prev.map(p =>
      p.id === id ? { ...p, ativo: !p.ativo } : p
    ));
  };

  const toggleAdicional = (id: string) => {
    setAdicionais(prev => prev.map(a =>
      a.id === id ? { ...a, ativo: !a.ativo } : a
    ));
  };

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
          <div className="space-y-3">
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className={cn(
                  'bg-card rounded-xl p-4 shadow-card border border-border/50 flex items-center gap-4 transition-opacity',
                  !produto.ativo && 'opacity-60'
                )}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-acai-light to-muted rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🥣</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-foreground">
                    {TAMANHO_LABELS[produto.tamanho]}
                  </h3>
                  <p className="text-sm text-muted-foreground">{produto.peso}</p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-bold text-lg text-primary">
                    R$ {produto.preco.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <Switch
                  checked={produto.ativo}
                  onCheckedChange={() => toggleProduto(produto.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {adicionais.map((adicional) => (
              <div
                key={adicional.id}
                className={cn(
                  'bg-card rounded-xl p-4 shadow-card border border-border/50 flex items-center justify-between transition-opacity',
                  !adicional.ativo && 'opacity-60'
                )}
              >
                <span className="font-medium text-foreground">{adicional.nome}</span>
                <Switch
                  checked={adicional.ativo}
                  onCheckedChange={() => toggleAdicional(adicional.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
