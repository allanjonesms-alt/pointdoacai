export interface User {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  endereco: Endereco;
  role: 'cliente' | 'admin';
  valorTotalCompras: number;
}

export interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  complemento?: string;
  referencia?: string;
}

export interface Produto {
  id: string;
  nome: string;
  tamanho: 'pequeno' | 'medio' | 'grande' | 'gg' | 'mega';
  peso: string;
  preco: number;
  ativo: boolean;
}

export interface Adicional {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface CarrinhoItem {
  id: string;
  produto: Produto;
  quantidade: number;
  adicionais: string[];
  valorUnitario: number;
  valorAdicionais: number;
}

export interface Pedido {
  id: string;
  numeroPedido: string;
  clienteId: string;
  clienteNome: string;
  enderecoEntrega: Endereco;
  formaPagamento: 'credito' | 'debito' | 'pix' | 'dinheiro';
  status: 'pendente' | 'preparo' | 'pronto' | 'entrega';
  valorTotal: number;
  dataHora: Date;
  itens: CarrinhoItem[];
}

export type StatusPedido = 'pendente' | 'preparo' | 'pronto' | 'entrega';

export const PRODUTOS: Produto[] = [
  { id: '1', nome: 'Açaí', tamanho: 'pequeno', peso: '200g', preco: 12.00, ativo: true },
  { id: '2', nome: 'Açaí', tamanho: 'medio', peso: '300g', preco: 17.00, ativo: true },
  { id: '3', nome: 'Açaí', tamanho: 'grande', peso: '400g', preco: 20.00, ativo: true },
  { id: '4', nome: 'Açaí', tamanho: 'gg', peso: '500g', preco: 24.00, ativo: true },
  { id: '5', nome: 'Açaí', tamanho: 'mega', peso: '700g', preco: 35.00, ativo: true },
];

export const ADICIONAIS: Adicional[] = [
  { id: '1', nome: 'Leite em Pó', ativo: true },
  { id: '2', nome: 'Leite Condensado', ativo: true },
  { id: '3', nome: 'Granola', ativo: true },
  { id: '4', nome: 'Banana', ativo: true },
  { id: '5', nome: 'Morango', ativo: true },
  { id: '6', nome: 'Kiwi', ativo: true },
  { id: '7', nome: 'Paçoca', ativo: true },
  { id: '8', nome: 'Mel', ativo: true },
  { id: '9', nome: 'Nutella', ativo: true },
  { id: '10', nome: 'Amendoim', ativo: true },
  { id: '11', nome: 'Coco Ralado', ativo: true },
  { id: '12', nome: 'Chocolate Granulado', ativo: true },
];

export const TAMANHO_LABELS: Record<string, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
  gg: 'GG',
  mega: 'Mega',
};
