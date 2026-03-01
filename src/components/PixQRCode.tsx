import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PixQRCodeProps {
  valor: number;
  descricao: string;
  pedidoId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PixData {
  qr_code: string;
  qr_code_base64: string;
  payment_id: number;
}

export function PixQRCode({ valor, descricao, pedidoId, onSuccess, onCancel }: PixQRCodeProps) {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPago, setIsPago] = useState(false);
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const gerarPix = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fnError } = await supabase.functions.invoke('gerar-pix', {
          body: { valor, descricao },
        });

        if (fnError) {
          throw new Error(fnError.message || 'Erro ao gerar PIX');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setPixData(data);

        // Save payment_id to the order
        if (pedidoId && data.payment_id) {
          await supabase
            .from('pedidos')
            .update({ pix_payment_id: String(data.payment_id) } as any)
            .eq('id', pedidoId);
        }
      } catch (err) {
        console.error('Erro ao gerar PIX:', err);
        setError(err instanceof Error ? err.message : 'Erro ao gerar código PIX');
      } finally {
        setIsLoading(false);
      }
    };

    gerarPix();
  }, [valor, descricao, pedidoId]);

  // Auto-check payment status every 5 seconds
  useEffect(() => {
    if (!pixData?.payment_id || isPago) return;

    const checkStatus = async () => {
      try {
        setChecking(true);
        const { data, error: fnError } = await supabase.functions.invoke('verificar-pix', {
          body: { payment_id: pixData.payment_id, pedido_id: pedidoId },
        });

        if (fnError) return;

        if (data?.is_pago) {
          setIsPago(true);
          toast({
            title: 'Pagamento confirmado!',
            description: 'Seu PIX foi aprovado com sucesso.',
          });
          // Clear interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          // Auto-advance after 2 seconds
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } catch (err) {
        console.error('Erro ao verificar PIX:', err);
      } finally {
        setChecking(false);
      }
    };

    // Check immediately
    const timer = setTimeout(checkStatus, 3000);
    // Then every 5 seconds
    intervalRef.current = setInterval(checkStatus, 5000);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pixData?.payment_id, isPago, pedidoId, onSuccess, toast]);

  const handleCopy = async () => {
    if (!pixData?.qr_code) return;

    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      toast({
        title: 'Código copiado!',
        description: 'Cole no app do seu banco para pagar.',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast({
        title: 'Erro ao copiar',
        description: 'Tente copiar manualmente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground">Gerando código PIX...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-destructive text-center">{error}</p>
        <Button variant="outline" onClick={onCancel}>
          Voltar
        </Button>
      </div>
    );
  }

  if (isPago) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-lg font-bold text-green-600">Pagamento Confirmado!</p>
        <p className="text-sm text-muted-foreground">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 py-4">
      {/* Valor */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Valor a pagar</p>
        <p className="text-3xl font-bold text-primary">
          R$ {valor.toFixed(2).replace('.', ',')}
        </p>
      </div>

      {/* QR Code */}
      {pixData?.qr_code_base64 && (
        <div className="bg-white p-4 rounded-xl shadow-md">
          <img
            src={`data:image/png;base64,${pixData.qr_code_base64}`}
            alt="QR Code PIX"
            className="w-56 h-56"
          />
        </div>
      )}

      {/* Status check indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Aguardando pagamento...</span>
      </div>

      {/* Código Copia e Cola */}
      {pixData?.qr_code && (
        <div className="w-full space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Ou copie o código abaixo:
          </p>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs font-mono break-all text-foreground/80 line-clamp-3">
              {pixData.qr_code}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar código PIX
              </>
            )}
          </Button>
        </div>
      )}

      {/* Ações */}
      <div className="w-full space-y-3 pt-4 border-t border-border">
        <Button variant="ghost" className="w-full" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
