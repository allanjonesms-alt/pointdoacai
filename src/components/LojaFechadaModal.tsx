import React, { useState, useEffect } from 'react';
import { Clock, XCircle, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LojaFechadaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HORARIO_ABERTURA = 13.5; // 13:30
const HORARIO_FECHAMENTO = 22; // 22:00

const DIAS_FUNCIONAMENTO = [
  { nome: 'Segunda-Feira', abre: true },
  { nome: 'Terça-Feira', abre: true },
  { nome: 'Quarta-Feira', abre: true },
  { nome: 'Quinta-Feira', abre: false },
  { nome: 'Sexta-Feira', abre: true },
  { nome: 'Sábado', abre: true },
  { nome: 'Domingo', abre: true },
];

const MENSAGENS_CRIATIVAS = [
  "🍇 O açaí está descansando para ficar ainda mais gostoso!",
  "🌴 Nossos potes de açaí estão recarregando as energias da Amazônia!",
  "🥣 Shh... O açaí está tirando uma soneca gelada!",
  "💜 Estamos preparando a melhor experiência açaí para você!",
  "🍃 O açaí mais fresco da cidade volta já já!",
];

export function LojaFechadaModal({ open, onOpenChange }: LojaFechadaModalProps) {
  const [tempoRestante, setTempoRestante] = useState('');
  const [mensagem] = useState(() => 
    MENSAGENS_CRIATIVAS[Math.floor(Math.random() * MENSAGENS_CRIATIVAS.length)]
  );

  useEffect(() => {
    const calcularTempoRestante = () => {
      const agora = new Date();
      const diaAtual = agora.getDay(); // 0 = Domingo, 1 = Segunda...
      const horaAtual = agora.getHours() + agora.getMinutes() / 60;

      // Mapear dias da semana (JS usa 0=Dom, precisamos ajustar para nosso array)
      const diasMap = [6, 0, 1, 2, 3, 4, 5]; // Dom=6, Seg=0, Ter=1...
      const diaIndex = diasMap[diaAtual];

      // Encontrar próximo horário de abertura
      let diasAteAbrir = 0;
      let proximoDiaIndex = diaIndex;

      // Se estamos antes do horário de abertura hoje e a loja abre hoje
      if (horaAtual < HORARIO_ABERTURA && DIAS_FUNCIONAMENTO[diaIndex].abre) {
        diasAteAbrir = 0;
      } else {
        // Procurar próximo dia que abre
        for (let i = 1; i <= 7; i++) {
          proximoDiaIndex = (diaIndex + i) % 7;
          if (DIAS_FUNCIONAMENTO[proximoDiaIndex].abre) {
            diasAteAbrir = i;
            break;
          }
        }
      }

      // Calcular tempo restante
      const proximaAbertura = new Date(agora);
      proximaAbertura.setDate(proximaAbertura.getDate() + diasAteAbrir);
      proximaAbertura.setHours(Math.floor(HORARIO_ABERTURA), (HORARIO_ABERTURA % 1) * 60, 0, 0);

      const diff = proximaAbertura.getTime() - agora.getTime();
      
      if (diff <= 0) {
        setTempoRestante('Em breve');
        return;
      }

      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (horas >= 24) {
        const dias = Math.floor(horas / 24);
        const horasRestantes = horas % 24;
        setTempoRestante(`${dias}d ${horasRestantes}h ${minutos}min`);
      } else if (horas > 0) {
        setTempoRestante(`${horas}h ${minutos}min`);
      } else {
        setTempoRestante(`${minutos} minutos`);
      }
    };

    calcularTempoRestante();
    const interval = setInterval(calcularTempoRestante, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-6 w-6" />
            Loja Fechada
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {mensagem}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Countdown */}
          <div className="bg-primary/10 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Abrimos em</p>
            <p className="text-2xl font-bold text-primary">{tempoRestante}</p>
          </div>

          {/* Horário */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Horário de Atendimento</span>
            </div>
            <p className="text-center text-lg font-bold text-primary mb-4">
              13:30 às 22:00
            </p>

            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Dias de Funcionamento</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DIAS_FUNCIONAMENTO.filter(d => d.abre).map((dia) => (
                <div 
                  key={dia.nome}
                  className="bg-background rounded-lg px-3 py-2 text-center text-sm font-medium text-foreground"
                >
                  {dia.nome}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              * Fechado às Quintas-Feiras
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          Entendi
        </Button>
      </DialogContent>
    </Dialog>
  );
}
