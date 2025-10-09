import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Sparkles } from 'lucide-react';
import type { Premio } from '../types/database';
import { useImagePreloader } from './ImagePreloader';

// Prêmios disponíveis
const PREMIOS: Premio[] = [
  { descricao: 'teste1', cor: '#FFD700' },
  { descricao: 'teste2', cor: '#FF6B6B' },
  { descricao: 'teste3', cor: '#4ECDC4' },
  { descricao: 'teste4', cor: '#95E1D3' },
  { descricao: 'teste5', cor: '#F38181' },
  { descricao: 'teste6', cor: '#AA96DA' },
  { descricao: 'teste7', cor: '#FCBAD3' },
  { descricao: 'teste8', cor: '#A8E6CF' },
];

interface RoletaDaSorteProps {
  idIndicador: string;
  nomeIndicador: string;
  onPremioRevelado: (premio: Premio) => void;
}

export const RoletaDaSorte = memo(function RoletaDaSorte({ idIndicador, nomeIndicador, onPremioRevelado }: RoletaDaSorteProps) {
  const [premioSorteado, setPremioSorteado] = useState<{ premio: Premio; index: number } | null>(null);
  const [rotacao, setRotacao] = useState(0);
  const [velocidade, setVelocidade] = useState(0);
  const [girando, setGirando] = useState(false);
  const [ativo, setAtivo] = useState(false);
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);
  const [parando, setParando] = useState(false);
  const [mensagemAtual, setMensagemAtual] = useState<string>('');

  const premioGeradoRef = useRef(false);
  const roletaRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const TEMPO_LIMITE = 10; // 10 segundos

  // Otimização: preload das imagens
  const imagesToPreload = useMemo(() => [
    '/lampada.png',
    '/logo.png',
    '/teste.png'
  ], []);
  
  const { isLoading: imagesLoading } = useImagePreloader(imagesToPreload);

  // Otimização: memoizar cálculos pesados
  const grausPorSegmento = useMemo(() => 360 / PREMIOS.length, []);
  
  // Otimização: memoizar premios com cores
  const premiosMemoized = useMemo(() => PREMIOS, []);

  // Função para sortear prêmio
  const sortearPremio = useCallback(() => {
    if (premioGeradoRef.current) return;

    premioGeradoRef.current = true;
    const premioIndex = Math.floor(Math.random() * premiosMemoized.length);
    const premio = premiosMemoized[premioIndex];
    
    console.log('🎲 Prêmio sorteado:', premio.descricao, 'Index:', premioIndex);
    
    setPremioSorteado({ premio, index: premioIndex });
  }, [premiosMemoized]);

  // Função para resetar a roleta
  const resetarRoleta = useCallback(() => {
    setRotacao(0);
    setVelocidade(0);
    setGirando(false);
    setAtivo(false);
    setTempoRestante(null);
    setParando(false);
    setMensagemAtual('');
    setPremioSorteado(null);
    
    // Limpar todos os timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    
    // Reset CSS transition e posição inicial
    if (roletaRef.current) {
      roletaRef.current.style.transition = '';
      roletaRef.current.style.transform = 'rotate(0deg)';
    }
    
    premioGeradoRef.current = false;
  }, []);

  // Inicialização
  useEffect(() => {
    resetarRoleta();
    sortearPremio();
  }, [sortearPremio, resetarRoleta]);

  // Função para parar a roleta
  const pararRoleta = useCallback(() => {
    if (!premioSorteado || parando) return;
    
    console.log('🛑 Parando roleta - Prêmio:', premioSorteado.premio.descricao, 'Index:', premioSorteado.index);
    
    setParando(true);
    setVelocidade(0);
    setGirando(false);
    
    // Cancela a animação atual
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Calcula a posição final correta
    const rotacaoAtual = rotacao % 360;
    
    // Ajuste para alinhar com o ponteiro (que está no topo)
    const anguloAlvo = -90 + premioSorteado.index * grausPorSegmento + (grausPorSegmento / 2);
    
    console.log('🎯 DEBUG ÂNGULO:');
    console.log('   - Prêmio sorteado:', premioSorteado.premio.descricao);
    console.log('   - Index:', premioSorteado.index);
    console.log('   - Graus por segmento:', grausPorSegmento);
    console.log('   - Ângulo alvo calculado:', anguloAlvo);
    
    // Calcula quantos graus faltam para chegar no prêmio correto
    let ajuste = (360 - anguloAlvo) % 360;
    console.log('   - Ajuste final:', ajuste);
    
    // Adiciona 5 voltas completas + o ajuste final
    const rotacaoFinalAjustada = rotacao - rotacaoAtual + (360 * 5) + ajuste;
    
    // CSS transition otimizada para a parada final
    if (roletaRef.current) {
      roletaRef.current.style.transition = 'transform 2.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
      roletaRef.current.style.transform = `rotate(${rotacaoFinalAjustada}deg)`;
      
      setTimeout(() => {
        setRotacao(rotacaoFinalAjustada);
        onPremioRevelado(premioSorteado.premio);
      }, 2800);
    }
  }, [premioSorteado, parando, rotacao, grausPorSegmento, onPremioRevelado]);

  // Nova lógica: inicia automaticamente quando ativada e gira por 10 segundos
  const iniciarRoleta = useCallback(() => {
    if (ativo || !premioSorteado) return;
    
    setAtivo(true);
    setGirando(true);
    setVelocidade(20); // Velocidade inicial alta
    setTempoRestante(10);
    setMensagemAtual('🎰 Roleta ativada! Girando por 10 segundos...');
    
    // Contador regressivo
    intervalRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Timer para parar após 10 segundos
    timerRef.current = setTimeout(() => {
      setMensagemAtual('🎯 Parando a roleta...');
      setTimeout(() => pararRoleta(), 500);
    }, 10000);
    
  }, [ativo, premioSorteado, pararRoleta]);

  // Animação contínua da roleta
  useEffect(() => {
    if (!girando) return;

    const animar = () => {
      setRotacao(prev => prev + velocidade);
      
      // Desaceleração gradual após 8 segundos
      if (ativo && tempoRestante !== null && tempoRestante <= 2) {
        setVelocidade(prev => Math.max(prev * 0.96, 0.5));
      }
      
      if (velocidade > 0.1) {
        animationFrameRef.current = requestAnimationFrame(animar);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animar);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [girando, velocidade, ativo, tempoRestante]);

  // Novo handler: apenas detecta hover para iniciar
  const handleMouseEnter = useCallback(() => {
    if (!ativo && premioSorteado && !parando) {
      iniciarRoleta();
    }
  }, [ativo, premioSorteado, parando, iniciarRoleta]);

  // Cleanup dos timers quando o componente desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      
      if (roletaRef.current) {
        roletaRef.current.style.transition = '';
        roletaRef.current.style.transform = 'rotate(0deg)';
      }
    };
  }, []);

  // Mostrar loading enquanto as imagens carregam
  if (imagesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002f25] to-[#003d32] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando roleta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002f25] to-[#003d32] flex items-center justify-center p-4">
      <img 
        src="/teste.png" 
        alt="Marca d'água" 
        className="fixed 0 w-80 h-80 object-contain pointer-events-none z-50"
        style={{ top: '-104px', right: '30px' }}
        loading="eager"
        decoding="async"
      />
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <Sparkles className="w-12 h-12 text-laranja" />
            Sua Sorte está Lançada!
          </h1>
          <p className="text-xl text-purple-200">
            Parabéns, <span className="font-bold text-yellow-400">{nomeIndicador}</span>! Descubra seu prêmio!
          </p>
        </div>

        <div className="flex items-center justify-center gap-16 mb-8">
          {/* Zona de Ativação */}
          <div
            onMouseEnter={handleMouseEnter}
            className="text-center cursor-pointer flex-shrink-0 p-8 rounded-3xl transition-all"
            style={{
              minWidth: '700px',
              minHeight: '700px',
              backgroundColor: ativo ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: ativo ? '3px solid rgba(255, 255, 255, 0.3)' : '3px solid transparent',
              boxShadow: ativo ? '0 0 30px rgba(255, 255, 255, 0.2)' : 'none'
            }}
          >
            <div className="relative">
              <div 
                ref={roletaRef}
                className="relative mx-auto"
                style={{ 
                  width: '500px', 
                  height: '500px',
                  transform: `rotate(${rotacao}deg)`,
                  willChange: girando ? 'transform' : 'auto'
                }}
              >
                <svg
                  width="500"
                  height="500"
                  viewBox="0 0 400 400"
                  style={{ willChange: 'auto' }}
                >
                  {PREMIOS.map((premio: Premio, index: number) => {
                    const startAngle = index * grausPorSegmento - 90;
                    const endAngle = startAngle + grausPorSegmento;
                    
                    // Debug: log da posição dos segmentos
                    if (index === 0) {
                      console.log('🔍 SEGMENTOS DA ROLETA:');
                      PREMIOS.forEach((p, i) => {
                        const start = i * grausPorSegmento - 90;
                        const mid = start + grausPorSegmento / 2;
                        console.log(`   ${i}: ${p.descricao} - Start: ${start}°, Mid: ${mid}°`);
                      });
                    }

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
                          fill="black"
                          fontSize="16"
                          fontWeight="bold"
                          textAnchor="middle"
                          transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                          style={{ pointerEvents: 'none' }}
                        >
                          <tspan x={textX} dy="0">{premio.descricao.split(' ')[0]}</tspan>
                          <tspan x={textX} dy="18">{premio.descricao.split(' ').slice(1).join(' ')}</tspan>
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="200" cy="200" r="50" fill="white" />
                  <foreignObject x="150" y="150" width="100" height="100">
                    <img 
                      src="/logo.png" 
                      alt="Logo" 
                      className="w-full h-full object-contain rounded-full"
                      loading="eager"
                      decoding="async"
                    />
                  </foreignObject>
                </svg>
              </div>

              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3">
                <div className="w-0 h-0 border-l-[30px] border-r-[30px] border-t-[60px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Status e mensagens */}
        <div className="text-center space-y-4">
          {!ativo && !parando && (
            <p className="text-yellow-300 text-xl font-semibold animate-pulse">
              👆 Passe o mouse sobre a roleta para ativar!
            </p>
          )}
          
          {ativo && tempoRestante !== null && tempoRestante > 0 && (
            <div className="space-y-2">
              <p className="text-yellow-300 text-2xl font-bold">
                ⏱️ {tempoRestante}s restantes
              </p>
              <p className="text-white text-lg">
                {mensagemAtual}
              </p>
            </div>
          )}
          
          {parando && (
            <p className="text-green-300 text-xl font-semibold animate-pulse">
              🎯 Parando na sua sorte...
            </p>
          )}
        </div>
      </div>
    </div>
  );
});