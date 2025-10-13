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
    console.log('🔄 Resetando roleta...');
    
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
    setMensagemAtual('🎯 Parando a roleta...');
    
    // Cancela a animação atual
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Calcula a posição final correta
    const rotacaoAtual = rotacao % 360;
    
    // O ponteiro está no topo (0°), então queremos que o centro do prêmio fique alinhado
    const anguloAlvoPremio = premioSorteado.index * grausPorSegmento + (grausPorSegmento / 2);
    
    console.log('🎯 DEBUG ÂNGULO:');
    console.log('   - Prêmio sorteado:', premioSorteado.premio.descricao);
    console.log('   - Index:', premioSorteado.index);
    console.log('   - Graus por segmento:', grausPorSegmento);
    console.log('   - Ângulo do prêmio:', anguloAlvoPremio);
    console.log('   - Rotação atual:', rotacaoAtual);
    
    // Calcula a diferença necessária para alinhar o prêmio com o ponteiro
    let diferencaParaPonteiro = (360 - anguloAlvoPremio) % 360;
    
    // Adiciona voltas extras para o efeito visual + a diferença para o alinhamento correto
    const voltasExtras = 360 * 3; // 3 voltas completas
    const rotacaoFinal = rotacao - rotacaoAtual + voltasExtras + diferencaParaPonteiro;
    
    console.log('   - Diferença para ponteiro:', diferencaParaPonteiro);
    console.log('   - Rotação final calculada:', rotacaoFinal);
    
    // Para a animação requestAnimationFrame e usa CSS transition para desaceleração suave
    setGirando(false);
    setVelocidade(0);
    
    // CSS transition para desaceleração de 4 segundos
    if (roletaRef.current) {
      roletaRef.current.style.transition = 'transform 4s cubic-bezier(0.15, 0, 0.25, 1)';
      roletaRef.current.style.transform = `rotate(${rotacaoFinal}deg)`;
      
      // Atualiza o state após a transição e revela o prêmio
      setTimeout(() => {
        setRotacao(rotacaoFinal);
        setParando(false);
        onPremioRevelado(premioSorteado.premio);
      }, 4100); // 4.1 segundos para garantir que a transição terminou
    }
  }, [premioSorteado, parando, rotacao, grausPorSegmento, onPremioRevelado]);

  // Lógica: inicia quando ativada e gira por exatos 10 segundos
  const iniciarRoleta = useCallback(() => {
    if (ativo || !premioSorteado || parando) return;
    
    setAtivo(true);
    setGirando(true);
    setVelocidade(20); // Velocidade constante por 10 segundos
    setTempoRestante(10);
    
    // Contador regressivo
    intervalRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Timer para parar após EXATOS 10 segundos
    timerRef.current = setTimeout(() => {
      pararRoleta();
    }, 10000);
    
  }, [ativo, premioSorteado, parando, pararRoleta]);

  // Animação contínua da roleta - velocidade constante por 10 segundos
  useEffect(() => {
    if (!girando || parando) return;

    const animar = () => {
      setRotacao(prev => prev + velocidade);
      
      // Mantém velocidade constante durante os 10 segundos
      // Não há desaceleração aqui - isso será feito pelo CSS transition
      if (girando && !parando) {
        animationFrameRef.current = requestAnimationFrame(animar);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animar);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [girando, velocidade, parando]);

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

        <div className="flex items-center justify-center gap-32 mb-8">
          {/* Lâmpada Mágica - Zona de Ativação */}
          <div className="flex items-center justify-center">
            <div
              onMouseEnter={handleMouseEnter}
              className="cursor-pointer transition-all duration-300 hover:scale-105 flex-shrink-0"
              title={!ativo && !parando ? "Esfregue a lâmpada mágica para ativar a roleta!" : ""}
            >
              <img 
              src="/lampada.png" 
              alt="Lâmpada Mágica - Esfregue para ativar a roleta!" 
              className={`w-[32rem] h-auto object-contain transition-all duration-300 ${
                !ativo && !parando 
                ? 'drop-shadow-[0_10px_30px_rgba(250,204,21,0.6)] animate-pulse' 
                : 'drop-shadow-[0_10px_30px_rgba(250,204,21,0.4)]'
              } ${ativo ? 'animate-bounce' : ''}`}
              loading="eager"
              decoding="async"
              />
            </div>
          </div>

          {/* Roleta */}
          <div className="text-center flex-shrink-0">
            <div className="relative">
              <div 
                ref={roletaRef}
                className="relative mx-auto"
                style={{ 
                  width: '600px', 
                  height: '600px',
                  transform: `rotate(${rotacao}deg)`,
                  willChange: girando ? 'transform' : 'auto'
                }}
              >
                <svg
                  width="600"
                  height="600"
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
                <div className="w-0 h-0 border-l-[36px] border-r-[36px] border-t-[72px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Status e mensagens */}
        <div className="text-center space-y-4">
          {!ativo && !parando && (
            <p className="text-yellow-300 text-xl font-semibold animate-pulse">
              ✨ Esfregue a lâmpada mágica para ativar a roleta!
            </p>
          )}
          

          
          {parando && (
            <div className="space-y-2">
              <p className="text-green-300 text-xl font-semibold animate-pulse">
                🎯 Desacelerando...
              </p>
              <p className="text-white text-sm">
                A roleta está parando no seu prêmio!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});