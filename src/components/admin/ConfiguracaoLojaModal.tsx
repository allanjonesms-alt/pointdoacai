import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Save, X, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { DiaSemana, ConfiguracoesLoja, PrintConfig } from '@/hooks/useLojaStatus';

interface ConfiguracaoLojaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: Omit<ConfiguracoesLoja, 'lojaAberta'>;
  onSave: (config: Omit<ConfiguracoesLoja, 'lojaAberta'>) => Promise<void>;
}

const DIAS_SEMANA: { id: DiaSemana; label: string }[] = [
  { id: 'domingo', label: 'Domingo' },
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
  { id: 'sabado', label: 'Sábado' },
];

const FONTES_DISPONIVEIS = [
  'Arial',
  'Courier New',
  'Times New Roman',
  'Verdana',
  'Georgia',
  'Tahoma',
  'Trebuchet MS',
  'monospace',
];

export function ConfiguracaoLojaModal({ 
  open, 
  onOpenChange, 
  config,
  onSave 
}: ConfiguracaoLojaModalProps) {
  const [horarioAbertura, setHorarioAbertura] = useState(config.horarioAbertura);
  const [horarioFechamento, setHorarioFechamento] = useState(config.horarioFechamento);
  const [diasFuncionamento, setDiasFuncionamento] = useState<DiaSemana[]>(config.diasFuncionamento);
  const [printConfig, setPrintConfig] = useState<PrintConfig>(config.printConfig);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setHorarioAbertura(config.horarioAbertura);
    setHorarioFechamento(config.horarioFechamento);
    setDiasFuncionamento(config.diasFuncionamento);
    setPrintConfig(config.printConfig);
  }, [config]);

  const handleDiaToggle = (dia: DiaSemana) => {
    setDiasFuncionamento(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const handleSave = async () => {
    if (diasFuncionamento.length === 0) {
      toast.error('Selecione pelo menos um dia de funcionamento');
      return;
    }

    if (!horarioAbertura || !horarioFechamento) {
      toast.error('Preencha os horários de funcionamento');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        horarioAbertura,
        horarioFechamento,
        diasFuncionamento,
        printConfig,
      });
      toast.success('Configurações salvas com sucesso!');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Configurações da Loja
          </DialogTitle>
          <DialogDescription>
            Defina os horários de funcionamento e configurações de impressão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Horários */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Horário de Atendimento
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horario-abertura">Abertura</Label>
                <Input
                  id="horario-abertura"
                  type="time"
                  value={horarioAbertura}
                  onChange={(e) => setHorarioAbertura(e.target.value)}
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horario-fechamento">Fechamento</Label>
                <Input
                  id="horario-fechamento"
                  type="time"
                  value={horarioFechamento}
                  onChange={(e) => setHorarioFechamento(e.target.value)}
                  className="text-center"
                />
              </div>
            </div>
          </div>

          {/* Dias de Funcionamento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Dias de Funcionamento
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {DIAS_SEMANA.map((dia) => (
                <label
                  key={dia.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    id={dia.id}
                    checked={diasFuncionamento.includes(dia.id)}
                    onCheckedChange={() => handleDiaToggle(dia.id)}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {dia.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Configurações de Impressão */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Printer className="h-4 w-4 text-primary" />
              Configurações de Impressão
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="print-largura">Largura (mm)</Label>
                <Input
                  id="print-largura"
                  type="number"
                  min={40}
                  max={300}
                  value={printConfig.largura}
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, largura: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="print-altura">Altura (mm)</Label>
                <Input
                  id="print-altura"
                  type="number"
                  min={0}
                  max={500}
                  value={printConfig.altura}
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, altura: Number(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">0 = automático</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="print-fonte-tamanho">Tamanho da Fonte</Label>
                <Input
                  id="print-fonte-tamanho"
                  type="number"
                  min={6}
                  max={24}
                  value={printConfig.fonteTamanho}
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, fonteTamanho: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Fonte</Label>
                <Select
                  value={printConfig.fonteTipo}
                  onValueChange={(value) => setPrintConfig(prev => ({ ...prev, fonteTipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTES_DISPONIVEIS.map((fonte) => (
                      <SelectItem key={fonte} value={fonte}>
                        <span style={{ fontFamily: fonte }}>{fonte}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            variant="acai"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
