import { useState } from 'react';
import { Settings, User, Users, Dice6, X } from 'lucide-react';

type Etapa = 'cadastro-indicador' | 'cadastro-leads' | 'roleta';

interface DevNavigationProps {
  etapaAtual: Etapa;
  onChangeEtapa: (etapa: Etapa) => void;
  onSetIndicadorTeste: () => void | Promise<void>;
  indicador: { id: string; nome: string } | null;
}

export function DevNavigation({ etapaAtual, onChangeEtapa, onSetIndicadorTeste, indicador }: DevNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingIndicador, setIsCreatingIndicador] = useState(false);

  const etapas = [
    {
      id: 'cadastro-indicador' as Etapa,
      nome: '1. Cadastro Indicador',
      icon: User,
      cor: 'from-blue-500 to-blue-600'
    },
    {
      id: 'cadastro-leads' as Etapa,
      nome: '2. Cadastro Leads',
      icon: Users,
      cor: 'from-purple-500 to-purple-600'
    },
    {
      id: 'roleta' as Etapa,
      nome: '3. Roleta da Sorte',
      icon: Dice6,
      cor: 'from-green-500 to-green-600'
    }
  ];

  return (
    <>
      {/* Botão Flutuante */}
      <div className="fixed top-4 right-4 z-[100]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
          title="Navegação de Desenvolvimento"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Settings className="w-6 h-6 animate-spin-slow" />
          )}
        </button>
      </div>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="fixed top-20 right-4 z-[99] bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-4 min-w-[280px]">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-1">🛠️ Dev Navigation</h3>
            <p className="text-sm text-gray-600">Navegue entre as telas rapidamente</p>
          </div>

          {/* Status do Indicador */}
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm font-medium text-gray-700">
              Indicador: {indicador ? (
                <span className="text-green-600">✅ {indicador.nome} ({indicador.id})</span>
              ) : (
                <span className="text-red-500">❌ Não logado</span>
              )}
            </p>
            {!indicador && (
              <button
                onClick={async () => {
                  if (isCreatingIndicador) return;
                  try {
                    setIsCreatingIndicador(true);
                    await onSetIndicadorTeste();
                  } finally {
                    setIsCreatingIndicador(false);
                  }
                }}
                disabled={isCreatingIndicador}
                className={`mt-2 text-xs px-3 py-1 rounded-md transition-colors ${
                  isCreatingIndicador
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isCreatingIndicador ? 'Criando indicador...' : 'Criar indicador de teste'}
              </button>
            )}
          </div>

          {/* Botões de Navegação */}
          <div className="space-y-2">
            {etapas.map((etapa) => {
              const Icon = etapa.icon;
              const isAtual = etapaAtual === etapa.id;
              const isDisabled = etapa.id !== 'cadastro-indicador' && !indicador;
              
              return (
                <button
                  key={etapa.id}
                  onClick={() => {
                    if (!isDisabled) {
                      onChangeEtapa(etapa.id);
                      setIsOpen(false);
                    }
                  }}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left
                    ${isAtual 
                      ? `bg-gradient-to-r ${etapa.cor} text-white shadow-md` 
                      : isDisabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isAtual ? 'text-white' : isDisabled ? 'text-gray-400' : 'text-gray-600'}`} />
                  <div className="flex-1">
                    <div className={`font-medium ${isAtual ? 'text-white' : isDisabled ? 'text-gray-400' : 'text-gray-800'}`}>
                      {etapa.nome}
                    </div>
                    {isAtual && (
                      <div className="text-sm text-white/80">Atual</div>
                    )}
                    {isDisabled && (
                      <div className="text-xs text-gray-400">Requer indicador</div>
                    )}
                  </div>
                  {isAtual && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Informações Extras */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              🚀 Modo Desenvolvimento Ativo
            </p>
          </div>
        </div>
      )}

      {/* Overlay para fechar o menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[98]" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </>
  );
}