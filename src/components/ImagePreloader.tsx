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
        
        img.onload = () => {
          // Armazenar no cache do navegador
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          resolve(src);
        };
        
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

// Hook para usar em outros componentes
export function useImagePreloader(images: string[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const imagePromises = images.map((src) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          // Criar um cache em memória
          if (!document.querySelector(`link[href="${src}"]`)) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
          }
          
          resolve(src);
        };
        
        img.onerror = reject;
        img.src = src;
      });
    });

    Promise.all(imagePromises)
      .then((loadedSrcs) => {
        setLoadedImages(new Set(loadedSrcs));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Erro ao carregar imagens:', error);
        setIsLoading(false);
      });
  }, [images]);

  return { isLoading, loadedImages };
}