import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ClipboardList, User, LogOut, ShoppingCart } from 'lucide-react';

export default function ClienteHome() {
  const { user, logout } = useAuth();
  const { quantidadeTotal } = useCarrinho();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          <Link to="/novo-pedido">
            <div className="bg-card rounded-2xl p-6 shadow-float border border-border/50 flex items-center gap-4 hover:scale-[1.02] transition-transform">
              <div className="w-14 h-14 gradient-acai rounded-xl flex items-center justify-center shadow-button">
                <ShoppingBag className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="font-display font-bold text-lg text-foreground">Novo Pedido</h2>
                <p className="text-sm text-muted-foreground">Monte seu açaí personalizado</p>
              </div>
              {quantidadeTotal > 0 && (
                <div className="relative">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {quantidadeTotal}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Meus Pedidos */}
          <Link to="/meus-pedidos">
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 flex items-center gap-4 hover:shadow-float transition-shadow">
              <div className="w-14 h-14 bg-tropical rounded-xl flex items-center justify-center">
                <ClipboardList className="h-7 w-7 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="font-display font-bold text-lg text-foreground">Meus Pedidos</h2>
                <p className="text-sm text-muted-foreground">Acompanhe seus pedidos</p>
              </div>
            </div>
          </Link>

          {/* Perfil */}
          <Link to="/perfil">
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 flex items-center gap-4 hover:shadow-float transition-shadow">
              <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center">
                <User className="h-7 w-7 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="font-display font-bold text-lg text-foreground">Meu Perfil</h2>
                <p className="text-sm text-muted-foreground">Gerencie seus dados</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Fun Illustration */}
        <div className="mt-8 text-center animate-float">
          <span className="text-8xl">🥣</span>
        </div>
      </div>
    </div>
  );
}
