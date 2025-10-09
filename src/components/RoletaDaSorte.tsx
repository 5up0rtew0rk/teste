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

// Mensagens motivacionais que aparecem durante o jogo
const MENSAGENS_MOTIVACIONAIS = [
  "🔥 Quanto mais rápido, melhor o prêmio!",
  "⚡ Continue esfregando para a sorte grande!",
  "💪 Não pare! Seu prêmio está chegando!",
  "🎯 Velocidade é tudo! Acelere!",
  "✨ Está quase lá! Continue!",
  "🚀 Mais rápido = Prêmios melhores!",
  "💎 A sorte favorece os rápidos!",
  "⭐ Você está arrasando! Continue!"
];

// Mensagens quando está perdendo velocidade
const MENSAGENS_PERDENDO_VELOCIDADE = [
  "⚠️ Perdendo velocidade! Volte e acelere!",
  "🔄 Suas chances estão diminuindo!",
  "⏰ Não deixe a sorte escapar!",
  "🎯 Retome o controle da roleta!",
  "💨 A velocidade está caindo!"
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
  const [mouseNaZona, setMouseNaZona] = useState(false);
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);
  const [tempoExpirado, setTempoExpirado] = useState(false);
  const [parando, setParando] = useState(false);
  const [mensagemAtual, setMensagemAtual] = useState<string>('');
  const [perdendoVelocidade, setPerdendoVelocidade] = useState(false);
  const [desacelerandoFinal, setDesacelerandoFinal] = useState(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const premioGeradoRef = useRef(false);
  const roletaRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const mensagemIntervalRef = useRef<number | null>(null);

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

  // Função para sortear prêmio com useCallback para evitar re-renders
  const sortearPremio = useCallback(async () => {
    // Previne sorteio duplicado durante o mesmo ciclo
    if (premioGeradoRef.current) {
      console.log('⚠️ Tentativa de sortear prêmio duplicado - ignorando');
      return;
    }

    premioGeradoRef.current = true;
    
    // Sorteia um prêmio aleatório
    const premioIndex = Math.floor(Math.random() * premiosMemoized.length);
    const premio = premiosMemoized[premioIndex];
    
    console.log('🎲 Prêmio sorteado:', premio.descricao, 'Index:', premioIndex);
    
    setPremioSorteado({ premio, index: premioIndex });
  }, [idIndicador, premiosMemoized]);

  // Função para resetar a roleta
  const resetarRoleta = useCallback(() => {
    // Reset de todos os estados
    setRotacao(0);
    setVelocidade(0);
    setGirando(false);
    setMouseNaZona(false);
    setTempoRestante(null);
    setTempoExpirado(false);
    setParando(false);
    setMensagemAtual('');
    setPerdendoVelocidade(false);
    setDesacelerandoFinal(false);
    setPremioSorteado(null);
    
    // Limpar todos os timers de forma mais robusta
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mensagemIntervalRef.current) {
      clearInterval(mensagemIntervalRef.current);
      mensagemIntervalRef.current = null;
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
    
    // Reset da posição do mouse
    lastMousePosRef.current = { x: 0, y: 0 };
    premioGeradoRef.current = false;
  }, []);

  useEffect(() => {
    resetarRoleta();
    sortearPremio();
  }, [sortearPremio, resetarRoleta]);

  // Otimização: função para parar a roleta usando CSS transitions
  const pararRoleta = useCallback(() => {
    // Múltiplas verificações de segurança para evitar execuções duplicadas
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
    const anguloAlvo = premioSorteado.index * grausPorSegmento + (grausPorSegmento / 2);
    
    // Calcula quantos graus faltam para chegar no prêmio correto
    let ajuste = (360 - anguloAlvo + 90) % 360;
    
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

  // Animação com desaceleração contínua
  useEffect(() => {
    if (!girando) return;

    const animar = () => {
      setRotacao(prev => prev + velocidade);

      // Sempre desacelera quando não está parando, mesmo sem mouse
      if (!parando && velocidade > 0) {
        let fatorDesaceleracao;
        
        if (mouseNaZona) {
          fatorDesaceleracao = 0.995; // Desacelera muito pouco com mouse
        } else if (tempoExpirado) {
          fatorDesaceleracao = 0.975; // Desacelera mais rápido quando tempo expira
        } else {
          fatorDesaceleracao = 0.985; // Desacelera normalmente sem mouse
        }
        
        setVelocidade(prev => Math.max(0, prev * fatorDesaceleracao));
        
        // Detecta se está perdendo velocidade
        setPerdendoVelocidade(!mouseNaZona && velocidade < 10 && velocidade > 0.5 && !tempoExpirado);
        
        // Detecta se está na desaceleração final (tempo expirado mas ainda girando)
        setDesacelerandoFinal(tempoExpirado && velocidade > 0.5);
      }

      // Para apenas quando velocidade muito baixa (independente do tempo)
      if (velocidade < 0.5 && !parando && premioSorteado) {
        pararRoleta();
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
  }, [girando, velocidade, mouseNaZona, premioSorteado, tempoExpirado, parando, pararRoleta]);

  // Detecção de movimento otimizada - sem debounce para máxima responsividade
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseNaZona || !premioSorteado || tempoExpirado || parando) return;

    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    
    // Cálculo simplificado - sem sqrt para melhor performance
    const movimento = Math.abs(deltaX) + Math.abs(deltaY);

    // Velocidade mais responsiva e suave
    setVelocidade(Math.min(movimento * 0.8, 25));
    setGirando(true);

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [mouseNaZona, premioSorteado, tempoExpirado, parando]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (tempoExpirado) return;
    
    setMouseNaZona(true);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    
    // Inicia o timer de 10 segundos
    setTempoRestante(TEMPO_LIMITE);
    
    // Define a primeira mensagem
    setMensagemAtual(MENSAGENS_MOTIVACIONAIS[0]);
    
    // Alterna as mensagens a cada 2 segundos
    let mensagemIndex = 0;
    mensagemIntervalRef.current = setInterval(() => {
      mensagemIndex = (mensagemIndex + 1) % MENSAGENS_MOTIVACIONAIS.length;
      setMensagemAtual(MENSAGENS_MOTIVACIONAIS[mensagemIndex]);
    }, 2000);
    
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
    
    // Timer para expirar após 10 segundos
    timerRef.current = setTimeout(() => {
      setTempoExpirado(true);
      setMouseNaZona(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (mensagemIntervalRef.current) clearInterval(mensagemIntervalRef.current);
      setTempoRestante(null);
      setMensagemAtual('');
    }, TEMPO_LIMITE * 1000);
  }, [tempoExpirado, TEMPO_LIMITE]);

  const handleMouseLeave = useCallback(() => {
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
    if (mensagemIntervalRef.current) {
      clearInterval(mensagemIntervalRef.current);
      mensagemIntervalRef.current = null;
    }
    setTempoRestante(null);
    
    // Se ainda há velocidade, mostra mensagens de perda de velocidade
    if (velocidade > 0.5 && !tempoExpirado) {
      let mensagemIndex = 0;
      setMensagemAtual(MENSAGENS_PERDENDO_VELOCIDADE[0]);
      
      mensagemIntervalRef.current = setInterval(() => {
        mensagemIndex = (mensagemIndex + 1) % MENSAGENS_PERDENDO_VELOCIDADE.length;
        setMensagemAtual(MENSAGENS_PERDENDO_VELOCIDADE[mensagemIndex]);
      }, 1500);
    } else {
      setMensagemAtual('');
    }
  }, [velocidade, tempoExpirado]);

  // Cleanup dos timers quando o componente desmontar
  useEffect(() => {
    return () => {
      // Limpa todos os timers e animações
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (mensagemIntervalRef.current) {
        clearInterval(mensagemIntervalRef.current);
        mensagemIntervalRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      
      // Reset da transformação CSS para evitar problemas visuais
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
          {/* Zona de Ativação - Esquerda */}
          <div
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="text-center cursor-pointer flex-shrink-0 p-8 rounded-3xl transition-all"
            style={{
              minWidth: '700px',
              minHeight: '700px',
              backgroundColor: mouseNaZona ? 'rgba(255, 255, 255, 0.1)' : 
                              desacelerandoFinal ? 'rgba(255, 0, 0, 0.1)' :
                              perdendoVelocidade ? 'rgba(255, 165, 0, 0.1)' : 'transparent',
              border: mouseNaZona ? '3px dashed #FFD700' : 
                     desacelerandoFinal ? '3px dashed #FF0000' :
                     perdendoVelocidade ? '3px dashed #FFA500' : '3px dashed rgba(255, 255, 255, 0.3)'
            }}
          >
            <img 
              src="/lampada.png" 
              alt="Lâmpada" 
              className={`w-[550px] h-[350px] mx-auto mb-6 transition-transform will-change-transform ${
                mouseNaZona ? 'animate-bounce scale-110' : 
                desacelerandoFinal ? 'animate-pulse scale-100 opacity-60' :
                perdendoVelocidade ? 'animate-pulse scale-105 opacity-80' : 'scale-100'
              }`}
              loading="eager"
              decoding="async"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)', // Força hardware acceleration
                filter: desacelerandoFinal ? 'brightness(0.6) sepia(0.5) hue-rotate(-15deg)' :
                        perdendoVelocidade ? 'brightness(0.8) sepia(0.3) hue-rotate(15deg)' : 'none'
              }}
            />
            <p className="text-3xl font-bold text-white mb-3">
              Zona de Ativação
            </p>
            {tempoRestante !== null && !tempoExpirado && (
              <>
                <p className="text-laranja font-bold text-6xl mb-4 animate-pulse">
                  {tempoRestante}s
                </p>
                {mensagemAtual && (
                  <p className="text-yellow-300 font-bold text-2xl mb-2 animate-pulse">
                    {mensagemAtual}
                  </p>
                )}
              </>
            )}
            {desacelerandoFinal ? (
              <div className="text-center">
                <p className="text-red-400 font-bold text-2xl mb-2 animate-pulse">
                  ⏰ Tempo esgotado! Desacelerando...
                </p>
                <p className="text-orange-300 font-medium text-xl">
                  Velocidade: {Math.round(velocidade * 10)}% | Aguarde o resultado!
                </p>
              </div>
            ) : tempoExpirado ? (
              <p className="text-red-400 font-medium text-2xl">
                Tempo esgotado! Aguarde o resultado...
              </p>
            ) : perdendoVelocidade ? (
              <div className="text-center">
                <p className="text-orange-400 font-bold text-2xl mb-2 animate-pulse">
                  {mensagemAtual}
                </p>
                <p className="text-yellow-300 font-medium text-xl">
                  Velocidade: {Math.round(velocidade * 10)}% | Volte para acelerar!
                </p>
              </div>
            ) : !mouseNaZona ? (
              <p className="text-white font-medium text-2xl">
                Passe o mouse aqui e esfregue por 10 segundos!
              </p>
            ) : null}
          </div>

          {/* Roleta - Direita */}
          <div className="relative w-[650px] h-[650px] flex-shrink-0">
            <div
              ref={roletaRef}
              className="w-full h-full will-change-transform"
              style={{ 
                transform: `rotate(${rotacao}deg)`,
                backfaceVisibility: 'hidden',
                transformOrigin: 'center center'
              }}
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 400 400"
                style={{ willChange: 'auto' }}
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
});