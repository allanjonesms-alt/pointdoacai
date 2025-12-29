import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone, Mail, MapPin, TrendingUp } from 'lucide-react';

// Mock clients data
const MOCK_CLIENTES = [
  {
    id: 'cliente-1',
    nome: 'João Silva',
    telefone: '(11) 98888-8888',
    email: 'joao@email.com',
    endereco: {
      rua: 'Rua das Flores',
      numero: '123',
      bairro: 'Centro',
    },
    valorTotalCompras: 156.00,
    totalPedidos: 8,
  },
  {
    id: 'cliente-2',
    nome: 'Maria Santos',
    telefone: '(11) 97777-7777',
    email: 'maria@email.com',
    endereco: {
      rua: 'Av. Brasil',
      numero: '456',
      bairro: 'Jardim América',
    },
    valorTotalCompras: 289.50,
    totalPedidos: 15,
  },
  {
    id: 'cliente-3',
    nome: 'Pedro Oliveira',
    telefone: '(11) 96666-6666',
    email: 'pedro@email.com',
    endereco: {
      rua: 'Rua São Paulo',
      numero: '789',
      bairro: 'Vila Nova',
    },
    valorTotalCompras: 78.00,
    totalPedidos: 4,
  },
];

export default function AdminClientes() {
  const navigate = useNavigate();

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
          <h1 className="font-display font-bold text-primary-foreground">Clientes</h1>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {MOCK_CLIENTES.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-card rounded-xl p-4 shadow-card border border-border/50 animate-fade-in"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-acai rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">{cliente.nome}</h3>
                    <p className="text-sm text-muted-foreground">{cliente.totalPedidos} pedidos</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-tropical">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-bold">
                      R$ {cliente.valorTotalCompras.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total comprado</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {cliente.telefone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {cliente.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {cliente.endereco.bairro}
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Histórico
                </Button>
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
