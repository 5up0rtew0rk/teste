import { useEffect, useMemo, useState } from 'react';
import { Layers, Bug, UserPlus, Shuffle, X } from 'lucide-react';

type Etapa = 'cadastro-indicador' | 'cadastro-leads' | 'roleta';

interface DevNavigationProps {
  etapaAtual: Etapa;
  hasIndicador: boolean;
  onChangeEtapa: (etapa: Etapa) => void;
  onCreateIndicadorTeste: () => Promise<void> | void;
  onReset?: () => void;
}

export function DevNavigation({ etapaAtual, hasIndicador, onChangeEtapa, onCreateIndicadorTeste, onReset }: DevNavigationProps) {
  const [open, setOpen] = useState(false);

  // Mostrar por query ?dev=1 para facilitar em preview
  const enabledByQuery = useMemo(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === '1', []);

  useEffect(() => {
    if (enabledByQuery) setOpen(true);
    // Atalho: Ctrl+D abre/fecha
    const handler = (e: KeyboardEvent) => {
      const isCtrlD = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'd');
      if (isCtrlD) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabledByQuery]);

  const go = async (etapa: Etapa) => {
    if ((etapa === 'cadastro-leads' || etapa === 'roleta') && !hasIndicador) {
      await onCreateIndicadorTeste();
    }
    onChangeEtapa(etapa);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] select-none">
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Dev Navigation (Ctrl+D)"
          className="rounded-full bg-black/70 text-white shadow-xl border border-white/10 backdrop-blur px-4 py-3 flex items-center gap-2 hover:bg-black/80 transition"
        >
          <Bug className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-semibold">Dev</span>
        </button>
      )}

      {open && (
        <div className="w-80 max-w-[85vw] bg-zinc-900/95 text-white rounded-xl shadow-2xl border border-white/10 backdrop-blur p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold">Dev Navigation</span>
            </div>
            <button
              className="p-1 rounded hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => go('cadastro-indicador')}
              className={`w-full text-left px-3 py-2 rounded border transition ${
                etapaAtual === 'cadastro-indicador' ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="text-sm font-medium">Cadastro do Indicador</div>
              <div className="text-xs text-white/70">Primeira tela</div>
            </button>

            <button
              onClick={() => go('cadastro-leads')}
              className={`w-full text-left px-3 py-2 rounded border transition ${
                etapaAtual === 'cadastro-leads' ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="text-sm font-medium">Cadastro de Leads</div>
              <div className="text-xs text-white/70">Requer indicador</div>
            </button>

            <button
              onClick={() => go('roleta')}
              className={`w-full text-left px-3 py-2 rounded border transition ${
                etapaAtual === 'roleta' ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="text-sm font-medium">Roleta da Sorte</div>
              <div className="text-xs text-white/70">Requer indicador</div>
            </button>
          </div>

          <div className="h-px bg-white/10 my-3" />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onCreateIndicadorTeste()}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-semibold"
            >
              <UserPlus className="w-4 h-4" />
              Indicador teste
            </button>
            <button
              onClick={() => go(etapaAtual === 'roleta' ? 'cadastro-leads' : 'roleta')}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
            >
              <Shuffle className="w-4 h-4" />
              Alternar
            </button>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              className="mt-2 w-full text-center px-3 py-2 rounded border border-white/10 hover:bg-white/5 text-sm"
            >
              Resetar fluxo
            </button>
          )}

          <p className="mt-2 text-[11px] text-white/50">Dica: use Ctrl+D para abrir/fechar. Também pode habilitar via ?dev=1</p>
        </div>
      )}
    </div>
  );
}

export default DevNavigation;
