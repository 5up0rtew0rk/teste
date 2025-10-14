import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Sparkles } from 'lucide-react';
import type { Premio } from '../types/database';
import { useImagePreloader } from './ImagePreloader';

// Prêmios disponíveis com probabilidades
const PREMIOS: Premio[] = [
  { descricao: 'Copo', cor: '#ff9700' },
  { descricao: 'Espelho', cor: '#04d38a' },
  { descricao: 'Planner', cor: '#04d38a' },
  { descricao: 'Não foi dessa vez', cor: '#04d38a' },
  { descricao: 'Que pena', cor: '#04d38a' },
  { descricao: 'Quase!!', cor: '#04d38a' },
];

// Sistema de probabilidades (total = 100%)
const PROBABILIDADES = {
  'Copo': 5,
  'Planner': 10,
  'Espelho': 15,
  'Não foi dessa vez': 23.33,
  'Que pena': 23.33,
  'Quase!!': 23.34
};

interface RoletaDaSorteProps {
  idIndicador: string;
  nomeIndicador: string;
  onPremioRevelado: (premio: Premio) => void;
}

export const RoletaDaSorte = memo(function RoletaDaSorte({ nomeIndicador, onPremioRevelado }: RoletaDaSorteProps) {
  const [premioSorteado, setPremioSorteado] = useState<{ premio: Premio; index: number; variacao?: number } | null>(null);
  const [rotacao, setRotacao] = useState(0);
  const [velocidade, setVelocidade] = useState(0);
  const [girando, setGirando] = useState(false);
  const [ativo, setAtivo] = useState(false);
  const [parando, setParando] = useState(false);
  const [premioDestacado, setPremioDestacado] = useState(false);

  const premioGeradoRef = useRef(false);
  const roletaRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const timerRef = useRef<number | null>(null);
  const lampadaRef = useRef<HTMLDivElement>(null);
  const touchMovesRef = useRef(0);

  const imagesToPreload = useMemo(() => ['/lampada.png', '/logo.png', '/teste.png'], []);
  const { isLoading: imagesLoading } = useImagePreloader(imagesToPreload);

  const grausPorSegmento = useMemo(() => 360 / PREMIOS.length, []);
  const premiosMemoized = useMemo(() => PREMIOS, []);

  // Função para sortear prêmio com base nas probabilidades
  const sortearPremio = useCallback(() => {
    if (premioGeradoRef.current) return;
    premioGeradoRef.current = true;
    
    const random = Math.random() * 100;
    let acumulado = 0;
    let premioSelecionado = premiosMemoized[0];
    let premioIndex = 0;
    
    for (let i = 0; i < premiosMemoized.length; i++) {
      const premio = premiosMemoized[i];
      acumulado += PROBABILIDADES[premio.descricao as keyof typeof PROBABILIDADES];
      
      if (random <= acumulado) {
        premioSelecionado = premio;
        premioIndex = i;
        break;
      }
    }
    
    const variacaoDentroSegmento = (Math.random() - 0.5) * 0.6; // Reduzido para ±30%
    
    console.log('🎲 PRÊMIO SORTEADO:', premioSelecionado.descricao, '| Index:', premioIndex);
    console.log('📊 Probabilidade:', PROBABILIDADES[premioSelecionado.descricao as keyof typeof PROBABILIDADES] + '%');
    
    setPremioSorteado({ premio: premioSelecionado, index: premioIndex, variacao: variacaoDentroSegmento });
  }, [premiosMemoized]);

  // Função para resetar a roleta
  const resetarRoleta = useCallback(() => {
    setRotacao(0);
    setVelocidade(0);
    setGirando(false);
    setAtivo(false);
    setParando(false);
    setPremioSorteado(null);
    setPremioDestacado(false);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    if (roletaRef.current) {
      roletaRef.current.style.transition = '';
      roletaRef.current.style.transform = 'rotate(0deg)';
    }
    
    premioGeradoRef.current = false;
  }, []);

  useEffect(() => {
    resetarRoleta();
    sortearPremio();
  }, [sortearPremio, resetarRoleta]);

  // NOVA LÓGICA: Calcula a rotação final de forma SIMPLES e DIRETA
  const pararRoleta = useCallback(() => {
    if (!premioSorteado || parando) return;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛑 PARANDO ROLETA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    setParando(true);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // EXPLICAÇÃO DA LÓGICA:
    // 1. O ponteiro está fixo em 0° (topo da tela)
    // 2. A roleta gira no sentido HORÁRIO (positivo)
    // 3. Os segmentos são desenhados com índices de 0 a 5
    // 4. Segmento 0 começa em -90° (topo) e vai até -30°
    // 5. Para o segmento N ficar no ponteiro, precisamos girar a roleta
    //    de forma que o CENTRO do segmento fique em 0°
    
    // Ângulo do CENTRO de cada segmento no SVG (SEM rotação da roleta)
    // Segmento 0: -90° + 30° = -60° (centro)
    // Segmento 1: -30° + 30° = 0° (centro)
    // Segmento 2: 30° + 30° = 60° (centro)
    // etc...
    const startAngleSegmento = premioSorteado.index * grausPorSegmento;
    const centroSegmento = startAngleSegmento + grausPorSegmento / 2;
    const variacaoAngulo = (premioSorteado.variacao || 0) * grausPorSegmento;
    const posicaoFinalSegmento = centroSegmento + variacaoAngulo;

    
    console.log('📍 POSIÇÃO DO SEGMENTO (sem rotação):');
    console.log('   Prêmio:', premioSorteado.premio.descricao);
    console.log('   Index:', premioSorteado.index);
    console.log('   Início do segmento:', startAngleSegmento + '°');
    console.log('   Centro do segmento:', centroSegmento + '°');
    console.log('   Variação:', variacaoAngulo.toFixed(2) + '°');
    console.log('   Posição final alvo:', posicaoFinalSegmento.toFixed(2) + '°');
    
    // Para alinhar o segmento com o ponteiro (0°):
    // rotacao_necessaria = -posicao_do_segmento
    // Mas queremos valores positivos, então:
    // rotacao_necessaria = 360 - posicao_do_segmento (se posicao > 0)
    // rotacao_necessaria = -posicao_do_segmento (se posicao < 0)
    
    let anguloParaAlinhar;
    if (posicaoFinalSegmento >= 0) {
      anguloParaAlinhar = 360 - posicaoFinalSegmento;
    } else {
      anguloParaAlinhar = -posicaoFinalSegmento;
    }
    
    // Adiciona voltas completas (entre 6 e 8) para o efeito dramático
    const voltasCompletas = 6 + Math.random() * 2;
    const anguloVoltas = voltasCompletas * 360;
    
    // Rotação final = voltas + ajuste para alinhar
    const rotacaoFinal = anguloVoltas + anguloParaAlinhar;
    
    console.log('🎯 CÁLCULO DA ROTAÇÃO:');
    console.log('   Ângulo para alinhar:', anguloParaAlinhar.toFixed(2) + '°');
    console.log('   Voltas completas:', voltasCompletas.toFixed(1));
    console.log('   Rotação final:', rotacaoFinal.toFixed(2) + '°');
    
    // Verificação: após rotacionar, onde o segmento estará?
    const posicaoFinalVerificacao = (posicaoFinalSegmento + rotacaoFinal) % 360;
    console.log('✅ VERIFICAÇÃO:');
    console.log('   Posição final do segmento após rotação:', posicaoFinalVerificacao.toFixed(2) + '° (deve ser ~0°)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    setGirando(false);
    setVelocidade(0);
    
    if (roletaRef.current) {
      roletaRef.current.style.transition = 'transform 12s cubic-bezier(0.17, 0.67, 0.35, 0.99)';
      roletaRef.current.style.transform = `rotate(${rotacaoFinal}deg)`;
      
      setTimeout(() => {
        setRotacao(rotacaoFinal);
        setParando(false);
        setPremioDestacado(true);
        
        setTimeout(() => {
          setPremioDestacado(false);
          onPremioRevelado(premioSorteado.premio);
        }, 2000);
      }, 12100);
    }
  }, [premioSorteado, parando, grausPorSegmento, onPremioRevelado]);

  const iniciarRoleta = useCallback(() => {
    if (ativo || !premioSorteado || parando) return;
    
    setAtivo(true);
    setGirando(true);
    setVelocidade(25);
    
    timerRef.current = setTimeout(() => {
      pararRoleta();
    }, 8000);
  }, [ativo, premioSorteado, parando, pararRoleta]);

  useEffect(() => {
    if (!girando || parando) return;

    const animar = () => {
      setRotacao(prev => prev + velocidade);
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

  const handleMouseEnter = useCallback(() => {
    if (!ativo && premioSorteado && !parando) {
      iniciarRoleta();
    }
  }, [ativo, premioSorteado, parando, iniciarRoleta]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!ativo && premioSorteado && !parando) {
      touchMovesRef.current = 0;
      e.preventDefault();
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }
  }, [ativo, premioSorteado, parando]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!ativo && premioSorteado && !parando) {
      touchMovesRef.current += 1;
      e.preventDefault();
      
      if (touchMovesRef.current >= 3) {
        iniciarRoleta();
      }
    }
  }, [ativo, premioSorteado, parando, iniciarRoleta]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!ativo && premioSorteado && !parando) {
      e.preventDefault();
    }
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }, [ativo, premioSorteado, parando]);

  useEffect(() => {
    const handleGlobalCleanup = () => {
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mouseup', handleGlobalCleanup);

    return () => {
      window.removeEventListener('mouseup', handleGlobalCleanup);
      
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      
      if (roletaRef.current) {
        roletaRef.current.style.transition = '';
        roletaRef.current.style.transform = 'rotate(0deg)';
      }
      
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    };
  }, []);

  if (imagesLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#002f25] to-[#003d32] flex items-center justify-center p-4 overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando roleta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#002f25] to-[#003d32] flex items-center justify-center p-4 tablet:p-6 lg:p-4 overflow-hidden">
      <img 
        src="/teste.png" 
        alt="Marca d'água" 
        className="hidden lg:block fixed 0 w-80 h-80 object-contain pointer-events-none z-50"
        style={{ top: '-104px', right: '30px' }}
        loading="eager"
        decoding="async"
      />
      <div className="max-w-6xl tablet:max-w-5xl lg:max-w-6xl w-full">
        <div className="text-center mb-6 tablet:mb-8 lg:mb-8">
          <h1 className="text-4xl tablet:text-5xl lg:text-5xl font-bold text-white mb-2 tablet:mb-3 lg:mb-3 flex items-center justify-center gap-3">
            <Sparkles className="w-10 tablet:w-12 lg:w-12 h-10 tablet:h-12 lg:h-12 text-laranja" />
            Sua Sorte está Lançada!
          </h1>
          <p className="text-lg tablet:text-xl lg:text-xl text-purple-200">
            Parabéns, <span className="font-bold text-yellow-400">{nomeIndicador}</span>! Descubra seu prêmio!
          </p>
        </div>

        <div className="flex flex-col tablet:flex-row lg:flex-row items-center justify-center gap-8 tablet:gap-16 lg:gap-32 mb-6 tablet:mb-8 lg:mb-8">
          <div className="flex flex-col items-center justify-center order-1 tablet:order-1 lg:order-1 gap-4">
            {!ativo && !parando && (
              <p className="lg:hidden text-yellow-300 text-base tablet:text-lg font-semibold animate-pulse text-center px-4">
                ✨ Esfregue a lâmpada para começar!
              </p>
            )}
            
            <div
              ref={lampadaRef}
              onMouseEnter={handleMouseEnter}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="cursor-pointer transition-all duration-300 hover:scale-105 flex-shrink-0 touch-none"
              title={!ativo && !parando ? "Passe o mouse ou esfregue a lâmpada mágica para ativar a roleta!" : ""}
            >
              <img 
                src="/lampada.png" 
                alt="Lâmpada Mágica" 
                className={`w-64 tablet:w-80 lg:w-[32rem] h-auto object-contain transition-all duration-300 ${
                  !ativo && !parando 
                  ? 'drop-shadow-[0_10px_30px_rgba(250,204,21,0.6)] animate-pulse' 
                  : 'drop-shadow-[0_10px_30px_rgba(250,204,21,0.4)]'
                } ${ativo ? 'animate-bounce' : ''}`}
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          <div className="text-center flex-shrink-0 order-2 tablet:order-2 lg:order-2">
            <div className="relative">
              <div 
                ref={roletaRef}
                className="relative mx-auto w-[400px] h-[400px] tablet:w-[500px] tablet:h-[500px] lg:w-[600px] lg:h-[600px]"
                style={{ 
                  transform: `rotate(${rotacao}deg)`,
                  willChange: girando ? 'transform' : 'auto'
                }}
              >
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                  style={{ willChange: girando ? 'transform' : 'auto' }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src="/logo.png" 
                      alt="Logo" 
                      className="w-20 h-20 tablet:w-24 tablet:h-24 lg:w-28 lg:h-28 object-contain"
                      style={{
                        filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.7)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
                        transform: 'translateZ(0)'
                      }}
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                </div>
                <svg className="w-full h-full" viewBox="0 0 400 400">
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

                    const isVencedor = premioDestacado && premioSorteado?.index === index;

                    return (
                      <g key={index}>
                        <path
                          d={`M 200 200 L ${x1} ${y1} A 190 190 0 0 1 ${x2} ${y2} Z`}
                          fill={premio.cor}
                          stroke={isVencedor ? "#ffd700" : "white"}
                          strokeWidth={isVencedor ? "8" : "3"}
                          style={{
                            filter: isVencedor ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.9))' : 'none',
                            transition: 'all 0.5s ease'
                          }}
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
                </svg>
              </div>

              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3">
                <div className="w-0 h-0 border-l-[24px] border-r-[24px] border-t-[48px] tablet:border-l-[30px] tablet:border-r-[30px] tablet:border-t-[60px] lg:border-l-[36px] lg:border-r-[36px] lg:border-t-[72px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          {!ativo && !parando && !premioDestacado && (
            <p className="hidden lg:block text-yellow-300 text-xl font-semibold animate-pulse">
              ✨ Passe o mouse sobre a lâmpada mágica para ativar a roleta!
            </p>
          )}
          
          {premioDestacado && (
            <div className="animate-bounce">
              <p className="text-yellow-300 text-2xl tablet:text-3xl lg:text-4xl font-bold drop-shadow-lg">
                🎉 Você ganhou!
              </p>
              <p className="text-white text-lg tablet:text-xl lg:text-2xl font-semibold mt-2">
                Preparando seu prêmio...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});