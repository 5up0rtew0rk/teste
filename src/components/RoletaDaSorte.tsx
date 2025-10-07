import { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../services/apiBackend';
import type { Premio } from '../types/database';

// Prêmios disponíveis
const PREMIOS: Premio[] = [
  { descricao: '10% de Comissão Extra', cor: '#FFD700' },
  { descricao: 'R$ 50 em Vale-Compras', cor: '#FF6B6B' },
  { descricao: 'Consultoria Grátis', cor: '#4ECDC4' },
  { descricao: 'Brinde Exclusivo', cor: '#95E1D3' },
  { descricao: 'R$ 100 em Desconto', cor: '#F38181' },
  { descricao: 'Kit Premium', cor: '#AA96DA' },
  { descricao: '15% de Comissão Extra', cor: '#FCBAD3' },
  { descricao: 'Acesso VIP 3 Meses', cor: '#A8E6CF' },
];

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
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);
  const [tempoExpirado, setTempoExpirado] = useState(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const TEMPO_LIMITE = 5; // 5 segundos

  useEffect(() => {
    const sortearPremio = async () => {
      // Sorteia um prêmio aleatório
      const premioIndex = Math.floor(Math.random() * PREMIOS.length);
      const premio = PREMIOS[premioIndex];
      
      // Salva no backend
      try {
        await api.salvarPremio({
          id_indicador: idIndicador,
          premio_descricao: premio.descricao,
          premio_index: premioIndex,
        });
      } catch (error) {
        console.error('Erro ao salvar prêmio:', error);
      }

      setPremioSorteado({ premio, index: premioIndex });
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

      // Quando a velocidade está muito baixa e não tem mais mouse na zona, finaliza
      if (velocidade < 0.1 && !mouseNaZona && premioSorteado) {
        setVelocidade(0);
        setGirando(false);
        
        // Calcula a posição final correta
        const grausPorSegmento = 360 / PREMIOS.length;
        const rotacaoAtual = rotacao % 360;
        
        // Ajuste para alinhar com o ponteiro (que está no topo)
        // O prêmio deve estar centralizado no topo quando parar
        const anguloAlvo = premioSorteado.index * grausPorSegmento + (grausPorSegmento / 2);
        
        // Calcula quantos graus faltam para chegar no prêmio correto
        let ajuste = (360 - anguloAlvo + 90) % 360;
        
        // Adiciona 5 voltas completas + o ajuste final
        const rotacaoFinalAjustada = rotacao - rotacaoAtual + (360 * 5) + ajuste;
        
        // Anima suavemente até a posição final
        const duracaoAnimacao = 3000; // 3 segundos
        const inicio = Date.now();
        const rotacaoInicial = rotacao;
        
        const animarParada = () => {
          const agora = Date.now();
          const progresso = Math.min((agora - inicio) / duracaoAnimacao, 1);
          
          // Easing para desaceleração suave (ease-out)
          const progressoSuave = 1 - Math.pow(1 - progresso, 3);
          
          const novaRotacao = rotacaoInicial + (rotacaoFinalAjustada - rotacaoInicial) * progressoSuave;
          setRotacao(novaRotacao);
          
          if (progresso < 1) {
            requestAnimationFrame(animarParada);
          } else {
            // Garante a posição final exata
            setRotacao(rotacaoFinalAjustada);
            setTimeout(() => {
              onPremioRevelado(premioSorteado.premio);
            }, 500);
          }
        };
        
        requestAnimationFrame(animarParada);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animar);
    };

    animationFrameRef.current = requestAnimationFrame(animar);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [girando, velocidade, mouseNaZona, premioSorteado, rotacao, onPremioRevelado]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseNaZona || !premioSorteado || tempoExpirado) return;

    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    const movimento = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    setVelocidade(Math.min(movimento * 0.5, 30));
    setGirando(true);

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (tempoExpirado) return;
    
    setMouseNaZona(true);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    
    // Inicia o timer de 5 segundos
    setTempoRestante(TEMPO_LIMITE);
    
    // Atualiza o contador a cada segundo
    intervalRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Timer para expirar após 5 segundos
    timerRef.current = setTimeout(() => {
      setTempoExpirado(true);
      setMouseNaZona(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTempoRestante(null);
    }, TEMPO_LIMITE * 1000);
  };

  const handleMouseLeave = () => {
    setMouseNaZona(false);
    
    // Limpa os timers se o mouse sair antes do tempo
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTempoRestante(null);
  };

  // Cleanup dos timers quando o componente desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const grausPorSegmento = 360 / PREMIOS.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-verde-escuro via-verde-escuro/90 to-verde-escuro/80 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <Sparkles className="w-12 h-12 text-laranja" />
            Sua Sorte está Lançada!
          </h1>
          <p className="text-xl text-purple-200">
            Parabéns, <span className="font-bold text-yellow-400">{nomeIndicador}</span>! Descubra seu prêmio!
          </p>
        </div>

        <div className="flex items-center justify-center gap-12 mb-8">
          {/* Zona de Ativação - Esquerda */}
          <div
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="text-center cursor-pointer flex-shrink-0"
          >
            <img 
              src="/lampada.png" 
              alt="Lâmpada" 
              className={`w-40 h-40 mx-auto mb-4 transition-transform ${mouseNaZona ? 'animate-bounce scale-110' : 'scale-100'}`}
            />
            <p className="text-2xl font-bold text-white mb-2">
              Zona de Ativação
            </p>
            {tempoRestante !== null && !tempoExpirado && (
              <p className="text-laranja font-bold text-3xl mb-2 animate-pulse">
                {tempoRestante}s
              </p>
            )}
            {tempoExpirado ? (
              <p className="text-red-400 font-medium text-lg">
                Tempo esgotado! Aguarde o resultado...
              </p>
            ) : (
              <p className="text-white font-medium text-lg">
                {mouseNaZona ? 'Mova o mouse para girar!' : 'Passe o mouse aqui para girar!'}
              </p>
            )}
          </div>

          {/* Roleta - Direita */}
          <div className="relative w-96 h-96 flex-shrink-0">
            <svg
              className="w-full h-full transition-transform duration-200 ease-out"
              style={{ transform: `rotate(${rotacao}deg)` }}
              viewBox="0 0 400 400"
            >
              {PREMIOS.map((premio: Premio, index: number) => {
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
