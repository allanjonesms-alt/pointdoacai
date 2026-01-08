import React, { useState, useEffect, useRef } from 'react';
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
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImagePlus, X, Loader2 } from 'lucide-react';

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
    imagem_url?: string | null;
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
  
  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useImageUpload();

  useEffect(() => {
    if (produto) {
      setNome(produto.nome);
      setTamanho(produto.tamanho);
      setPeso(produto.peso);
      setPreco(produto.preco.toString());
      setCategoria(produto.categoria || 'acai');
      setAdicionaisGratis((produto.adicionais_gratis || 0).toString());
      setPrecoAdicionalExtra((produto.preco_adicional_extra || 0).toString());
      setImagePreview(produto.imagem_url || null);
      setImageFile(null);
    } else {
      setNome('Açaí');
      setTamanho('medio');
      setPeso('');
      setPreco('');
      setCategoria('acai');
      setAdicionaisGratis('0');
      setPrecoAdicionalExtra('0');
      setImagePreview(null);
      setImageFile(null);
    }
  }, [produto, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let imagemUrl: string | null | undefined = produto?.imagem_url;

    // Upload new image if selected
    if (imageFile && produto?.id) {
      const uploadedUrl = await uploadImage(imageFile, produto.id);
      if (uploadedUrl) {
        imagemUrl = uploadedUrl;
      }
    } else if (imageFile && !produto?.id) {
      // For new products, we'll need to save first and upload after
      // Save without image first
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
      return;
    } else if (!imageFile && !imagePreview) {
      // Image was removed
      imagemUrl = null;
    }

    const success = await onSave({
      nome,
      tamanho,
      peso,
      preco: parseFloat(preco.replace(',', '.')),
      ativo: produto?.ativo ?? true,
      categoria,
      adicionais_gratis: parseInt(adicionaisGratis) || 0,
      preco_adicional_extra: parseFloat(precoAdicionalExtra.replace(',', '.')) || 0,
      imagem_url: imagemUrl,
    });

    setIsSubmitting(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{produto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Imagem do Produto</Label>
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-acai-light to-muted flex items-center justify-center overflow-hidden relative cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              
              {imagePreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="text-destructive hover:text-destructive/80"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A imagem será redimensionada para 56x56 pixels
            </p>
          </div>

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
            <Button type="submit" variant="acai" className="flex-1" disabled={isSubmitting || isUploading}>
              {isSubmitting || isUploading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
