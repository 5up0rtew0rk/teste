import { useEffect, useState } from 'react';

interface ImagePreloaderProps {
  images: string[];
  onAllLoaded?: () => void;
}

export function ImagePreloader({ images, onAllLoaded }: ImagePreloaderProps) {
  useEffect(() => {
    const imagePromises = images.map((src) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = reject;
        img.src = src;
      });
    });

    Promise.all(imagePromises)
      .then(() => {
        onAllLoaded?.();
      })
      .catch((error) => {
        console.error('Erro ao carregar imagens:', error);
      });
  }, [images, onAllLoaded]);

  return null; // Componente invisível
}

// Hook simplificado para usar em outros componentes
export function useImagePreloader(images: string[]) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const imagePromises = images.map((src) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = reject;
        img.src = src;
      });
    });

    Promise.all(imagePromises)
      .then(() => {
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Erro ao carregar imagens:', error);
        setIsLoading(false);
      });
  }, [images]);

  return { isLoading };
}