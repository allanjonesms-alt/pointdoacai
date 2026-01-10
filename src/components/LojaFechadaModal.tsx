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
import { DiaSemana } from '@/hooks/useLojaStatus';

interface LojaFechadaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  horarioAbertura: string;
  horarioFechamento: string;
  diasFuncionamento: DiaSemana[];
}

const DIAS_LABELS: Record<DiaSemana, string> = {
  domingo: 'Domingo',
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
};

const DIAS_MAP: Record<number, DiaSemana> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado'
};

const MENSAGENS_CRIATIVAS = [
  "🍇 O açaí está descansando para ficar ainda mais gostoso!",
  "🌴 Nossos potes de açaí estão recarregando as energias da Amazônia!",
  "🥣 Shh... O açaí está tirando uma soneca gelada!",
  "💜 Estamos preparando a melhor experiência açaí para você!",
  "🍃 O açaí mais fresco da cidade volta já já!",
];

export function LojaFechadaModal({ 
  open, 
  onOpenChange,
  horarioAbertura,
  horarioFechamento,
  diasFuncionamento
}: LojaFechadaModalProps) {
  const [tempoRestante, setTempoRestante] = useState('');
  const [mensagem] = useState(() => 
    MENSAGENS_CRIATIVAS[Math.floor(Math.random() * MENSAGENS_CRIATIVAS.length)]
  );

  useEffect(() => {
    const calcularTempoRestante = () => {
      const agora = new Date();
      const diaAtualIndex = agora.getDay();
      const diaAtual = DIAS_MAP[diaAtualIndex];
      
      const [horaAbertura, minAbertura] = horarioAbertura.split(':').map(Number);
      const horaAtual = agora.getHours();
      const minAtual = agora.getMinutes();

      // Order days starting from current day
      const diasOrdem: DiaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      
      let diasAteAbrir = 0;
      let encontrou = false;

      // If today is a working day and we're before opening time
      if (diasFuncionamento.includes(diaAtual)) {
        const minutosAbertura = horaAbertura * 60 + minAbertura;
        const minutosAtual = horaAtual * 60 + minAtual;
        
        if (minutosAtual < minutosAbertura) {
          diasAteAbrir = 0;
          encontrou = true;
        }
      }

      // Find next working day
      if (!encontrou) {
        for (let i = 1; i <= 7; i++) {
          const proximoDiaIndex = (diaAtualIndex + i) % 7;
          const proximoDia = diasOrdem[proximoDiaIndex];
          
          if (diasFuncionamento.includes(proximoDia)) {
            diasAteAbrir = i;
            encontrou = true;
            break;
          }
        }
      }

      if (!encontrou) {
        setTempoRestante('Indisponível');
        return;
      }

      // Calculate time until next opening
      const proximaAbertura = new Date(agora);
      proximaAbertura.setDate(proximaAbertura.getDate() + diasAteAbrir);
      proximaAbertura.setHours(horaAbertura, minAbertura, 0, 0);

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
    const interval = setInterval(calcularTempoRestante, 60000);

    return () => clearInterval(interval);
  }, [horarioAbertura, diasFuncionamento]);

  // Get days that are NOT working days
  const diasFolga = (['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] as DiaSemana[])
    .filter(d => !diasFuncionamento.includes(d));

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
              {horarioAbertura} às {horarioFechamento}
            </p>

            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Dias de Funcionamento</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {diasFuncionamento.map((dia) => (
                <div 
                  key={dia}
                  className="bg-background rounded-lg px-3 py-2 text-center text-sm font-medium text-foreground"
                >
                  {DIAS_LABELS[dia]}
                </div>
              ))}
            </div>
            {diasFolga.length > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                * Fechado: {diasFolga.map(d => DIAS_LABELS[d]).join(', ')}
              </p>
            )}
          </div>
        </div>

        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          Entendi
        </Button>
      </DialogContent>
    </Dialog>
  );
}
