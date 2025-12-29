import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone, Mail, MapPin, LogOut } from 'lucide-react';

export default function Perfil() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero py-6 px-4">
        <div className="container max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display font-bold text-primary-foreground">Meu Perfil</h1>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 text-center">
          <div className="w-20 h-20 gradient-acai rounded-full flex items-center justify-center mx-auto mb-4 shadow-button">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="font-display font-bold text-xl text-foreground">{user.nome}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Total em compras: R$ {user.valorTotalCompras.toFixed(2).replace('.', ',')}
          </p>
        </div>

        {/* Info Cards */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-semibold text-foreground">{user.telefone}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-semibold text-foreground">{user.email}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Endereço</p>
              <p className="font-semibold text-foreground">
                {user.endereco.rua}, {user.endereco.numero}
              </p>
              <p className="text-sm text-foreground">
                {user.endereco.bairro}
                {user.endereco.complemento && ` - ${user.endereco.complemento}`}
              </p>
              {user.endereco.referencia && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ref: {user.endereco.referencia}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sair da conta
        </Button>
      </div>
    </div>
  );
}
