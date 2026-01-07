import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TAMANHO_LABELS } from '@/types';
import { ProdutoDB, CategoriaProduto, CATEGORIA_LABELS } from '@/hooks/useProdutos';

interface ProdutoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: ProdutoDB | null;
  onSave: (data: { 
    nome: string; 
    tamanho: ProdutoDB['tamanho']; 
    peso: string; 
    preco: number; 
    ativo: boolean; 
    categoria: CategoriaProduto;
    adicionais_gratis: number;
    preco_adicional_extra: number;
  }) => Promise<boolean>;
}

export function ProdutoModal({ open, onOpenChange, produto, onSave }: ProdutoModalProps) {
  const [nome, setNome] = useState('Açaí');
  const [tamanho, setTamanho] = useState<ProdutoDB['tamanho']>('medio');
  const [peso, setPeso] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProduto>('acai');
  const [adicionaisGratis, setAdicionaisGratis] = useState('0');
  const [precoAdicionalExtra, setPrecoAdicionalExtra] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (produto) {
      setNome(produto.nome);
      setTamanho(produto.tamanho);
      setPeso(produto.peso);
      setPreco(produto.preco.toString());
      setCategoria(produto.categoria || 'acai');
      setAdicionaisGratis((produto.adicionais_gratis || 0).toString());
      setPrecoAdicionalExtra((produto.preco_adicional_extra || 0).toString());
    } else {
      setNome('Açaí');
      setTamanho('medio');
      setPeso('');
      setPreco('');
      setCategoria('acai');
      setAdicionaisGratis('0');
      setPrecoAdicionalExtra('0');
    }
  }, [produto, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await onSave({
      nome,
      tamanho,
      peso,
      preco: parseFloat(preco.replace(',', '.')),
      ativo: produto?.ativo ?? true,
      categoria,
      adicionais_gratis: parseInt(adicionaisGratis) || 0,
      preco_adicional_extra: parseFloat(precoAdicionalExtra.replace(',', '.')) || 0,
    });

    setIsSubmitting(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{produto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaProduto)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIA_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Açaí"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tamanho">Tamanho</Label>
            <Select value={tamanho} onValueChange={(v) => setTamanho(v as ProdutoDB['tamanho'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TAMANHO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="peso">Peso</Label>
            <Input
              id="peso"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="Ex: 300g"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preco">Preço (R$)</Label>
            <Input
              id="preco"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="Ex: 17.00"
              type="text"
              inputMode="decimal"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adicionaisGratis">Adicionais Grátis</Label>
              <Input
                id="adicionaisGratis"
                value={adicionaisGratis}
                onChange={(e) => setAdicionaisGratis(e.target.value)}
                placeholder="0"
                type="number"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precoAdicionalExtra">Preço Adicional Extra (R$)</Label>
              <Input
                id="precoAdicionalExtra"
                value={precoAdicionalExtra}
                onChange={(e) => setPrecoAdicionalExtra(e.target.value)}
                placeholder="0.00"
                type="text"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="acai" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
