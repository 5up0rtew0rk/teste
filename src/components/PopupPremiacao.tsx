import { Trophy, X, Sparkles } from 'lucide-react';
import type { Premio } from '../types/database';

interface PopupPremiacaoProps {
  nomeIndicador: string;
  premio: Premio;
  onFechar: () => void;
}

export function PopupPremiacao({ nomeIndicador, premio, onFechar }: PopupPremiacaoProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative transform animate-scaleIn">
        <button
          onClick={onFechar}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Parabéns, {nomeIndicador}!
          </h2>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <p className="text-lg text-gray-600 font-medium">
              Você ganhou:
            </p>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>

          <div
            className="mb-6 p-6 rounded-2xl"
            style={{ backgroundColor: `${premio.cor}20` }}
          >
            <p
              className="text-3xl font-bold"
              style={{ color: premio.cor }}
            >
              {premio.descricao}
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              Entraremos em contato pelo seu e-mail e WhatsApp para combinar os detalhes do seu prêmio.
              <span className="font-semibold"> Fique de olho nas suas mensagens!</span>
            </p>
          </div>

          <button
            onClick={onFechar}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all"
          >
            Entendido!
          </button>
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
