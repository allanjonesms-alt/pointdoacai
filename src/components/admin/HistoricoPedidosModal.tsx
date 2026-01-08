import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Package, Calendar, CreditCard, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TAMANHO_LABELS, EMBALAGEM_LABELS, TipoEmbalagem } from '@/types';

interface PedidoItem {
  id: string;
  produto_nome: string;
  tamanho: string;
  peso: string;
  quantidade: number;
  valor_unitario: number;
  valor_adicionais: number;
  embalagem: TipoEmbalagem;
  adicionais: { adicional_nome: string }[];
}

interface Pedido {
  id: string;
  numero_pedido: string;
  status: string;
  valor_total: number;
  forma_pagamento: string;
  created_at: string;
  endereco_rua: string;
  endereco_numero: string;
  endereco_bairro: string;
}

interface HistoricoPedidosModalProps {
  clienteId: string;
  clienteNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  preparo: 'Em Preparo',
  pronto: 'Pronto',
  entrega: 'Saiu p/ Entrega',
  entregue: 'Entregue',
};

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  preparo: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  pronto: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  entrega: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  entregue: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const formaPagamentoLabels: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  credito: 'Crédito',
  debito: 'Débito',
};

export function HistoricoPedidosModal({ 
  clienteId, 
  clienteNome, 
  open, 
  onOpenChange 
}: HistoricoPedidosModalProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
  const [pedidoItens, setPedidoItens] = useState<Record<string, PedidoItem[]>>({});
  const [loadingItens, setLoadingItens] = useState<string | null>(null);

  useEffect(() => {
    if (open && clienteId) {
      fetchPedidos();
      setExpandedPedido(null);
      setPedidoItens({});
    }
  }, [open, clienteId]);

  const fetchPedidos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPedidoItens = async (pedidoId: string) => {
    if (pedidoItens[pedidoId]) return;
    
    setLoadingItens(pedidoId);
    try {
      const { data: itens, error } = await supabase
        .from('pedido_itens')
        .select('*')
        .eq('pedido_id', pedidoId);

      if (error) throw error;

      const itensComAdicionais = await Promise.all(
        (itens || []).map(async (item) => {
          const { data: adicionais } = await supabase
            .from('pedido_item_adicionais')
            .select('adicional_nome')
            .eq('pedido_item_id', item.id);
          
          return { ...item, adicionais: adicionais || [] };
        })
      );

      setPedidoItens(prev => ({ ...prev, [pedidoId]: itensComAdicionais }));
    } catch (err) {
      console.error('Erro ao buscar itens do pedido:', err);
    } finally {
      setLoadingItens(null);
    }
  };

  const handleTogglePedido = (pedidoId: string) => {
    if (expandedPedido === pedidoId) {
      setExpandedPedido(null);
    } else {
      setExpandedPedido(pedidoId);
      fetchPedidoItens(pedidoId);
    }
  };

  const totalGasto = pedidos.reduce((sum, p) => sum + Number(p.valor_total), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Histórico de {clienteNome}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de pedidos</p>
                <p className="font-bold text-lg">{pedidos.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor total</p>
                <p className="font-bold text-lg text-tropical">
                  R$ {totalGasto.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {pedidos.map((pedido) => (
                  <Collapsible
                    key={pedido.id}
                    open={expandedPedido === pedido.id}
                    onOpenChange={() => handleTogglePedido(pedido.id)}
                  >
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                      <CollapsibleTrigger className="w-full p-3 text-left hover:bg-muted/30 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">#{pedido.numero_pedido}</span>
                              {expandedPedido === pedido.id ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <Badge className={statusColors[pedido.status]}>
                              {statusLabels[pedido.status] || pedido.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {formaPagamentoLabels[pedido.forma_pagamento] || pedido.forma_pagamento}
                            </div>
                          </div>

                          <div className="flex items-start gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{pedido.endereco_rua}, {pedido.endereco_numero} - {pedido.endereco_bairro}</span>
                          </div>

                          <div className="text-right pt-1 border-t border-border">
                            <span className="font-bold text-primary">
                              R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t border-border bg-muted/20 p-3">
                          {loadingItens === pedido.id ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                          ) : pedidoItens[pedido.id]?.length ? (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Itens do pedido:</p>
                              {pedidoItens[pedido.id].map((item) => (
                                <div key={item.id} className="bg-background rounded-md p-2 text-xs space-y-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="font-medium">{item.quantidade}x {item.produto_nome}</span>
                                      <span className="text-muted-foreground ml-1">
                                        ({TAMANHO_LABELS[item.tamanho] || item.tamanho} - {item.peso})
                                      </span>
                                    </div>
                                    <span className="font-medium text-primary">
                                      R$ {((item.valor_unitario + item.valor_adicionais) * item.quantidade).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  <div className="text-muted-foreground">
                                    Embalagem: {EMBALAGEM_LABELS[item.embalagem] || item.embalagem}
                                  </div>
                                  {item.adicionais.length > 0 && (
                                    <div className="text-muted-foreground">
                                      Adicionais: {item.adicionais.map(a => a.adicional_nome).join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              Nenhum item encontrado
                            </p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
