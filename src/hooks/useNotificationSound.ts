import { useCallback, useRef } from 'react';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playCountRef = useRef(0);

  const playNotification = useCallback(() => {
    try {
      // Reutiliza a instância ou cria uma nova
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.volume = 0.7;
      }

      const audio = audioRef.current;
      playCountRef.current = 0;

      const playNext = () => {
        if (playCountRef.current < 3) {
          audio.currentTime = 0;
          audio.play().catch(() => {
            // Autoplay bloqueado pelo navegador — ignora silenciosamente
            console.log('Autoplay bloqueado; aguardando interação do usuário.');
          });
          playCountRef.current++;
        } else {
          // Remove o listener após 3 toques
          audio.onended = null;
        }
      };

      // Configura o listener para tocar sequencialmente
      audio.onended = playNext;

      // Inicia o primeiro toque
      playNext();
    } catch (error) {
      console.log('Audio playback not supported');
    }
  }, []);

  return { playNotification };
}
