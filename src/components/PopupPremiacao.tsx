import { Trophy, X, Sparkles, RotateCcw } from 'lucide-react';
import type { Premio } from '../types/database';

interface PopupPremiacaoProps {
  nomeIndicador: string;
  premio: Premio;
  onFechar: () => void;
  onTentarNovamente?: () => void;
}

export function PopupPremiacao({ nomeIndicador, premio, onFechar, onTentarNovamente }: PopupPremiacaoProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 tablet:p-6 lg:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg tablet:max-w-xl lg:max-w-lg w-full p-6 tablet:p-8 lg:p-8 relative transform animate-scaleIn">
        <button
          onClick={onFechar}
          className="absolute top-4 right-4 text-white-400 hover:text-white-600 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="relative inline-block mb-5 tablet:mb-6 lg:mb-6">
            <div className="absolute inset-0 bg-black rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-20 h-20 tablet:w-24 tablet:h-24 lg:w-24 lg:h-24 bg-gradient-to-br bg-green-800 rounded-full flex items-center justify-center">
              <img src="public/genia.png" alt="" className="w-14 h-14 tablet:w-16 tablet:h-16 lg:w-16 lg:h-16 object-contain" />
            </div>
          </div>

          <h2 className="text-2xl tablet:text-3xl lg:text-3xl font-bold text-white-900 mb-2">
            Parabéns, {nomeIndicador}!
          </h2>

          <div className="flex items-center justify-center gap-2 mb-5 tablet:mb-6 lg:mb-6">
            <p className="text-base tablet:text-lg lg:text-lg text-white-600 font-medium">
              Você ganhou:
            </p>
          </div>

          <div
            className="mb-5 tablet:mb-6 lg:mb-6 p-5 tablet:p-6 lg:p-6 rounded-2xl"
            style={{ backgroundColor: `${premio.cor}20` }}
          >
            <p
              className="text-2xl tablet:text-3xl lg:text-3xl font-bold"
              style={{ color: premio.cor }}
            >
              {premio.descricao}
            </p>
          </div>

          <div className="bg-gradient-to-r from-cinza-custom to-verde-claro/10 rounded-xl p-4 mb-5 tablet:mb-6 lg:mb-6">
            <p className="text-sm tablet:text-base lg:text-sm text-white-700 leading-relaxed">
              {onTentarNovamente ? (
                <>
                  Mostre ao apresentador esse prêmio.
                </>
              ) : (
                <>
                  Parabéns! Você ganhou um prêmio.
                  <span className="font-semibold"> Fique de olho nas suas mensagens!</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col tablet:flex-row lg:flex-row gap-3">
            <button
              onClick={onFechar}
              className="flex-1 bg-gradient-to-r bg-laranja text-white font-bold py-3.5 tablet:py-4 lg:py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-verde-escuro/90 hover:to-verde-claro/90 transform hover:-translate-y-0.5 transition-all text-base tablet:text-base lg:text-base"
            >
              Nova Indicação!
            </button>
            
            {onTentarNovamente && (
              <button
                onClick={onTentarNovamente}
                className="flex-1 bg-gradient-to-r from-laranja to-yellow-500 text-white font-bold py-3.5 tablet:py-4 lg:py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-laranja/90 hover:to-yellow-500/90 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-base tablet:text-base lg:text-base"
              >
                <RotateCcw className="w-5 h-5" />
                Tentar Novamente
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
