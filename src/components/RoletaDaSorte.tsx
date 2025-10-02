import { useState, useEffect, useRef } from 'react';
import { Sparkles, Hand } from 'lucide-react';
import { api } from '../services/api';
import type { Premio } from '../types/database';

interface RoletaDaSorteProps {
  idIndicador: string;
  nomeIndicador: string;
  onPremioRevelado: (premio: Premio) => void;
}

export function RoletaDaSorte({ idIndicador, nomeIndicador, onPremioRevelado }: RoletaDaSorteProps) {
  const [premioSorteado, setPremioSorteado] = useState<{ premio: Premio; index: number } | null>(null);
  const [rotacao, setRotacao] = useState(0);
  const [velocidade, setVelocidade] = useState(0);
  const [girando, setGirando] = useState(false);
  const [mouseNaZona, setMouseNaZona] = useState(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const premios = api.getPremios();

  useEffect(() => {
    const sortearPremio = async () => {
      const resultado = await api.girarRoleta(idIndicador);
      setPremioSorteado(resultado);
    };
    sortearPremio();
  }, [idIndicador]);

  useEffect(() => {
    if (!girando) return;

    const animar = () => {
      setRotacao(prev => prev + velocidade);

      if (velocidade > 0) {
        setVelocidade(prev => Math.max(0, prev * 0.985));
      }

      if (velocidade < 0.1 && !mouseNaZona) {
        if (premioSorteado) {
          const grausPorSegmento = 360 / premios.length;
          const anguloAlvo = premioSorteado.index * grausPorSegmento;
          const rotacaoFinal = 360 * 5 + (360 - anguloAlvo);

          setRotacao(rotacaoFinal);
          setVelocidade(0);
          setGirando(false);

          setTimeout(() => {
            onPremioRevelado(premioSorteado.premio);
          }, 2000);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animar);
    };

    animationFrameRef.current = requestAnimationFrame(animar);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [girando, velocidade, mouseNaZona, premioSorteado, premios.length, onPremioRevelado]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseNaZona || !premioSorteado) return;

    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    const movimento = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    setVelocidade(Math.min(movimento * 0.5, 30));
    setGirando(true);

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMouseNaZona(true);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseLeave = () => {
    setMouseNaZona(false);
  };

  const grausPorSegmento = 360 / premios.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <Sparkles className="w-12 h-12 text-yellow-400" />
            Sua Sorte está Lançada!
          </h1>
          <p className="text-xl text-purple-200">
            Parabéns, <span className="font-bold text-yellow-400">{nomeIndicador}</span>! Descubra seu prêmio!
          </p>
        </div>

        <div className="relative flex items-center justify-center mb-8">
          <div className="relative w-96 h-96">
            <svg
              className="w-full h-full transition-transform duration-200 ease-out"
              style={{ transform: `rotate(${rotacao}deg)` }}
              viewBox="0 0 400 400"
            >
              {premios.map((premio, index) => {
                const startAngle = index * grausPorSegmento - 90;
                const endAngle = startAngle + grausPorSegmento;

                const x1 = 200 + 190 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 200 + 190 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 200 + 190 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 200 + 190 * Math.sin((endAngle * Math.PI) / 180);

                const midAngle = startAngle + grausPorSegmento / 2;
                const textX = 200 + 130 * Math.cos((midAngle * Math.PI) / 180);
                const textY = 200 + 130 * Math.sin((midAngle * Math.PI) / 180);

                return (
                  <g key={index}>
                    <path
                      d={`M 200 200 L ${x1} ${y1} A 190 190 0 0 1 ${x2} ${y2} Z`}
                      fill={premio.cor}
                      stroke="white"
                      strokeWidth="3"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                      style={{ pointerEvents: 'none' }}
                    >
                      <tspan x={textX} dy="0">{premio.descricao.split(' ')[0]}</tspan>
                      <tspan x={textX} dy="14">{premio.descricao.split(' ').slice(1).join(' ')}</tspan>
                    </text>
                  </g>
                );
              })}
              <circle cx="200" cy="200" r="40" fill="white" />
              <circle cx="200" cy="200" r="35" fill="#4F46E5" />
            </svg>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 shadow-2xl cursor-pointer transform transition-all ${
              mouseNaZona ? 'scale-105 shadow-yellow-500/50' : 'scale-100'
            }`}
          >
            <div className="text-center">
              <Hand className={`w-16 h-16 mx-auto mb-3 text-white ${mouseNaZona ? 'animate-bounce' : ''}`} />
              <p className="text-2xl font-bold text-white mb-2">
                Zona de Ativação
              </p>
              <p className="text-white font-medium">
                {mouseNaZona ? 'Mova o mouse para girar!' : 'Passe o mouse aqui para girar!'}
              </p>
            </div>
          </div>
        </div>

        {girando && velocidade > 5 && (
          <p className="text-center text-yellow-300 text-lg font-semibold mt-6 animate-pulse">
            Girando a roleta...
          </p>
        )}

        {girando && velocidade < 5 && velocidade > 0.1 && (
          <p className="text-center text-yellow-300 text-lg font-semibold mt-6 animate-pulse">
            Parando...
          </p>
        )}
      </div>
    </div>
  );
}
