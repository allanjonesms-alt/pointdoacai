import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import { usePedidoFavorito } from '@/hooks/usePedidoFavorito';
import { useLojaStatus } from '@/hooks/useLojaStatus';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { LojaFechadaModal } from '@/components/LojaFechadaModal';
import { ShoppingBag, ClipboardList, User, LogOut, ShoppingCart, Heart, RefreshCw, Loader2, Package } from 'lucide-react';
import { TAMANHO_LABELS, EMBALAGEM_LABELS } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function ClienteHome() {
  const { user, logout } = useAuth();
  const { quantidadeTotal, adicionarItem } = useCarrinho();
  const { pedidoFavorito, isLoading: isLoadingFavorito } = usePedidoFavorito(user?.id);
  const { lojaAberta, horarioAbertura, horarioFechamento, diasFuncionamento, isLoading: isLoadingLoja } = useLojaStatus();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLojaFechadaModal, setShowLojaFechadaModal] = useState(false);

  const handleNovoPedidoClick = (e: React.MouseEvent) => {
    if (!lojaAberta) {
      e.preventDefault();
      setShowLojaFechadaModal(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRepetirCompra = () => {
    if (!lojaAberta) {
      setShowLojaFechadaModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmarPedido = () => {
    if (!pedidoFavorito) return;
    
    const { item } = pedidoFavorito;
    adicionarItem(item.produto, item.adicionais, item.embalagem);
    setShowConfirmModal(false);
    navigate('/carrinho');
  };

  const calcularValorTotal = () => {
    if (!pedidoFavorito) return 0;
    const { item } = pedidoFavorito;
    return item.valorUnitario + item.valorAdicionais;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="gradient-hero pt-8 pb-20 px-4">
        <div className="container max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Logo size="sm" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <div className="text-center">
            <p className="text-primary-foreground/80 mb-1">Olá,</p>
            <h1 className="text-2xl font-display font-bold text-primary-foreground mb-4">
              {user?.nome?.split(' ')[0]} 👋
            </h1>
            <p className="text-primary-foreground/70 text-sm">
              O que você vai querer hoje?
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-md mx-auto px-4 -mt-12">
        <div className="space-y-4 animate-fade-in-up">
          {/* Novo Pedido */}
          <Link to={lojaAberta ? "/novo-pedido" : "#"} onClick={handleNovoPedidoClick}>
            <div className={`bg-card rounded-2xl p-4 sm:p-6 shadow-float border border-border/50 flex items-center gap-3 sm:gap-4 hover:scale-[1.02] transition-transform ${!lojaAberta ? 'opacity-75' : ''}`}>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 ${lojaAberta ? 'gradient-acai' : 'bg-muted'} rounded-xl flex items-center justify-center shadow-button flex-shrink-0`}>
                <ShoppingBag className={`h-6 w-6 sm:h-7 sm:w-7 ${lojaAberta ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-base sm:text-lg text-foreground">Novo Pedido</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {lojaAberta ? 'Monte seu açaí personalizado' : 'Loja fechada no momento'}
                </p>
              </div>
              {quantidadeTotal > 0 && lojaAberta && (
                <div className="relative flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
                    {quantidadeTotal}
                  </span>
                </div>
              )}
              {!lojaAberta && (
                <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-medium flex-shrink-0">
                  Fechada
                </span>
              )}
            </div>
          </Link>

          {/* Meus Pedidos */}
          <Link to="/meus-pedidos">
            <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card border border-border/50 flex items-center gap-3 sm:gap-4 hover:shadow-float transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-tropical rounded-xl flex items-center justify-center flex-shrink-0">
                <ClipboardList className="h-6 w-6 sm:h-7 sm:w-7 text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-base sm:text-lg text-foreground">Meus Pedidos</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Acompanhe seus pedidos</p>
              </div>
            </div>
          </Link>

          {/* Perfil */}
          <Link to="/perfil">
            <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card border border-border/50 flex items-center gap-3 sm:gap-4 hover:shadow-float transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 sm:h-7 sm:w-7 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-base sm:text-lg text-foreground">Meu Perfil</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Gerencie seus dados</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Pedido Favorito Card */}
        <div className="mt-6">
          {isLoadingFavorito ? (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pedidoFavorito ? (
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-5 shadow-card border border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-primary fill-primary" />
                <h3 className="font-display font-bold text-foreground">Pedido Favorito</h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  Pedido {pedidoFavorito.vezesComprado}x
                </span>
              </div>
              
              <div className="bg-card/80 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 gradient-acai rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {pedidoFavorito.item.produto.nome} {TAMANHO_LABELS[pedidoFavorito.item.produto.tamanho]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pedidoFavorito.item.produto.peso} • {EMBALAGEM_LABELS[pedidoFavorito.item.embalagem]}
                    </p>
                  </div>
                  <p className="font-bold text-primary">
                    R$ {calcularValorTotal().toFixed(2).replace('.', ',')}
                  </p>
                </div>
                
                {pedidoFavorito.item.adicionais.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pedidoFavorito.item.adicionais.map((adicional, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                      >
                        {adicional}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                variant="acai" 
                className="w-full"
                onClick={handleRepetirCompra}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Repetir Compra
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="text-6xl animate-float inline-block">🥣</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Confirmar Pedido
            </DialogTitle>
            <DialogDescription>
              Revise os detalhes antes de adicionar ao carrinho
            </DialogDescription>
          </DialogHeader>

          {pedidoFavorito && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 gradient-acai rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {pedidoFavorito.item.produto.nome}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {TAMANHO_LABELS[pedidoFavorito.item.produto.tamanho]} • {pedidoFavorito.item.produto.peso}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Embalagem</span>
                    <span className="font-medium">{EMBALAGEM_LABELS[pedidoFavorito.item.embalagem]}</span>
                  </div>
                  
                  {pedidoFavorito.item.adicionais.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Adicionais:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pedidoFavorito.item.adicionais.map((adicional, idx) => (
                          <span 
                            key={idx}
                            className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                          >
                            {adicional}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Valor Total</span>
                <span className="text-xl font-bold text-primary">
                  R$ {calcularValorTotal().toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="acai" onClick={handleConfirmarPedido} className="flex-1">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Loja Fechada */}
      <LojaFechadaModal 
        open={showLojaFechadaModal} 
        onOpenChange={setShowLojaFechadaModal}
        horarioAbertura={horarioAbertura}
        horarioFechamento={horarioFechamento}
        diasFuncionamento={diasFuncionamento}
      />
    </div>
  );
}
