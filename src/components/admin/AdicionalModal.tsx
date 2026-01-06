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
import { AdicionalDB } from '@/hooks/useProdutos';

interface AdicionalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adicional?: AdicionalDB | null;
  onSave: (data: { nome: string; ativo: boolean }) => Promise<boolean>;
}

export function AdicionalModal({ open, onOpenChange, adicional, onSave }: AdicionalModalProps) {
  const [nome, setNome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (adicional) {
      setNome(adicional.nome);
    } else {
      setNome('');
    }
  }, [adicional, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await onSave({
      nome,
      ativo: adicional?.ativo ?? true,
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
          <DialogTitle>{adicional ? 'Editar Adicional' : 'Novo Adicional'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Adicional</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Granola"
              required
              autoFocus
            />
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
