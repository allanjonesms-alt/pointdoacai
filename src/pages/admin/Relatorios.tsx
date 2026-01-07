import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, TrendingUp, Calendar, DollarSign, Trophy, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PedidoData {
  id: string;
  valor_total: number;
  created_at: string;
  status: string;
}

interface PedidoItemData {
  produto_nome: string;
  tamanho: string;
  quantidade: number;
}

interface AdicionalData {
  adicional_nome: string;
}

export default function AdminRelatorios() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<PedidoData[]>([]);
  const [pedidoItens, setPedidoItens] = useState<PedidoItemData[]>([]);
  const [adicionais, setAdicionais] = useState<AdicionalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dozeAtras = subMonths(new Date(), 12);
        
        // Buscar pedidos
        const { data: pedidosData, error: pedidosError } = await supabase
          .from('pedidos')
          .select('id, valor_total, created_at, status')
          .gte('created_at', dozeAtras.toISOString())
          .order('created_at', { ascending: true });

        if (pedidosError) throw pedidosError;
        setPedidos(pedidosData || []);

        // Buscar itens de pedido para ranking de produtos
        const { data: itensData, error: itensError } = await supabase
          .from('pedido_itens')
          .select('produto_nome, tamanho, quantidade');

        if (itensError) throw itensError;
        setPedidoItens(itensData || []);

        // Buscar adicionais para ranking
        const { data: adicionaisData, error: adicionaisError } = await supabase
          .from('pedido_item_adicionais')
          .select('adicional_nome');

        if (adicionaisError) throw adicionaisError;
        setAdicionais(adicionaisData || []);

      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Dados da semana atual (domingo a sábado)
  const dadosSemana = useMemo(() => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 }); // Domingo
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 0 }); // Sábado
    
    const diasSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });
    
    return diasSemana.map(dia => {
      const pedidosDia = pedidos.filter(p => 
        isSameDay(new Date(p.created_at), dia)
      );
      
      return {
        dia: format(dia, 'EEE', { locale: ptBR }),
        diaCompleto: format(dia, 'dd/MM', { locale: ptBR }),
        quantidade: pedidosDia.length,
        valor: pedidosDia.reduce((acc, p) => acc + Number(p.valor_total), 0),
      };
    });
  }, [pedidos]);

  // Dados mensais (últimos 6 meses)
  const dadosMensais = useMemo(() => {
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const mesRef = subMonths(new Date(), i);
      const inicioMes = startOfMonth(mesRef);
      const fimMes = endOfMonth(mesRef);
      
      const pedidosMes = pedidos.filter(p => {
        const dataPedido = new Date(p.created_at);
        return dataPedido >= inicioMes && dataPedido <= fimMes;
      });
      
      meses.push({
        mes: format(mesRef, 'MMM', { locale: ptBR }),
        mesCompleto: format(mesRef, 'MMMM yyyy', { locale: ptBR }),
        quantidade: pedidosMes.length,
        valor: pedidosMes.reduce((acc, p) => acc + Number(p.valor_total), 0),
      });
    }
    return meses;
  }, [pedidos]);

  // Totais da semana
  const totalSemana = useMemo(() => {
    return {
      quantidade: dadosSemana.reduce((acc, d) => acc + d.quantidade, 0),
      valor: dadosSemana.reduce((acc, d) => acc + d.valor, 0),
    };
  }, [dadosSemana]);

  // Totais do mês atual
  const totalMesAtual = useMemo(() => {
    const mesAtual = dadosMensais[dadosMensais.length - 1];
    return mesAtual || { quantidade: 0, valor: 0 };
  }, [dadosMensais]);

  // Ranking de produtos mais vendidos
  const rankingProdutos = useMemo(() => {
    const contagem: Record<string, number> = {};
    
    pedidoItens.forEach(item => {
      const key = `${item.produto_nome} - ${item.tamanho}`;
      contagem[key] = (contagem[key] || 0) + item.quantidade;
    });

    return Object.entries(contagem)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [pedidoItens]);

  // Ranking de adicionais mais vendidos
  const rankingAdicionais = useMemo(() => {
    const contagem: Record<string, number> = {};
    
    adicionais.forEach(item => {
      contagem[item.adicional_nome] = (contagem[item.adicional_nome] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [adicionais]);

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
          <h1 className="font-display font-bold text-primary-foreground">Relatórios</h1>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Semana</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalSemana.quantidade}</p>
            <p className="text-xs text-muted-foreground">pedidos</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Semana</span>
            </div>
            <p className="text-2xl font-bold text-primary">R$ {totalSemana.valor.toFixed(2).replace('.', ',')}</p>
            <p className="text-xs text-muted-foreground">faturado</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Mês</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalMesAtual.quantidade}</p>
            <p className="text-xs text-muted-foreground">pedidos</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Mês</span>
            </div>
            <p className="text-2xl font-bold text-primary">R$ {totalMesAtual.valor.toFixed(2).replace('.', ',')}</p>
            <p className="text-xs text-muted-foreground">faturado</p>
          </div>
        </div>

        {/* Gráfico Semanal */}
        <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">
            Vendas da Semana (Domingo a Sábado)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosSemana} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="dia" 
                  tick={{ fontSize: 12 }} 
                  className="fill-muted-foreground"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }} 
                  className="fill-muted-foreground"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }} 
                  className="fill-muted-foreground"
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [
                    name === 'valor' ? `R$ ${value.toFixed(2).replace('.', ',')}` : value,
                    name === 'valor' ? 'Valor' : 'Quantidade'
                  ]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.diaCompleto || label}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="quantidade" 
                  name="Quantidade"
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="valor" 
                  name="Valor (R$)"
                  fill="hsl(var(--tropical))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Mensal */}
        <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">
            Comparativo Mensal (Últimos 6 Meses)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosMensais} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }} 
                  className="fill-muted-foreground"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }} 
                  className="fill-muted-foreground"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }} 
                  className="fill-muted-foreground"
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [
                    name === 'valor' ? `R$ ${value.toFixed(2).replace('.', ',')}` : value,
                    name === 'valor' ? 'Valor' : 'Quantidade'
                  ]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.mesCompleto || label}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="quantidade" 
                  name="Quantidade"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="valor" 
                  name="Valor (R$)"
                  stroke="hsl(var(--tropical))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--tropical))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ranking de Produtos */}
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-display font-bold text-lg text-foreground">
                Produtos Mais Vendidos
              </h2>
            </div>
            {rankingProdutos.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {rankingProdutos.map((item, index) => (
                  <div key={item.nome} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.nome}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary">{item.quantidade}</span>
                      <span className="text-xs text-muted-foreground ml-1">un.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ranking de Adicionais */}
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-tropical" />
              <h2 className="font-display font-bold text-lg text-foreground">
                Adicionais Mais Pedidos
              </h2>
            </div>
            {rankingAdicionais.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {rankingAdicionais.map((item, index) => (
                  <div key={item.nome} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.nome}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-tropical">{item.quantidade}</span>
                      <span className="text-xs text-muted-foreground ml-1">vezes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
