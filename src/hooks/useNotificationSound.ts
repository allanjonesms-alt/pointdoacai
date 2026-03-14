import { useCallback, useRef } from 'react';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotification = useCallback(() => {
    try {
      // Reutiliza a instância ou cria uma nova
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.volume = 0.7;
      }

      // Reinicia do começo caso já esteja tocando
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay bloqueado pelo navegador — ignora silenciosamente
        console.log('Autoplay bloqueado; aguardando interação do usuário.');
      });
    } catch (error) {
      console.log('Audio playback not supported');
    }
  }, []);

  return { playNotification };
}
