import { useState } from 'react';
import { CadastroIndicador } from './components/CadastroIndicador';
import { CadastroLeads } from './components/CadastroLeads';
import { RoletaDaSorte } from './components/RoletaDaSorte';
import { PopupPremiacao } from './components/PopupPremiacao';
import { ExportarDados } from './components/ExportarDados';
import type { Premio } from './types/database';

type Etapa = 'cadastro-indicador' | 'cadastro-leads' | 'roleta';

interface DadosIndicador {
  id: string;
  nome: string;
}

function App() {
  const [etapa, setEtapa] = useState<Etapa>('cadastro-indicador');
  const [indicador, setIndicador] = useState<DadosIndicador | null>(null);
  const [premioRevelado, setPremioRevelado] = useState<Premio | null>(null);
  const [mostrarPopup, setMostrarPopup] = useState(false);

  const handleCadastroIndicador = async (idIndicador: string) => {
    const { csvStorage } = await import('./services/csvStorage');
    const data = csvStorage.buscarIndicador(idIndicador);

    if (data) {
      setIndicador({ id: idIndicador, nome: data.nome });
      setEtapa('cadastro-leads');
    }
  };

  const handleCadastroLeadsConcluido = () => {
    setEtapa('roleta');
  };

  const handlePremioRevelado = (premio: Premio) => {
    setPremioRevelado(premio);
    setMostrarPopup(true);
  };

  const handleFecharPopup = () => {
    setMostrarPopup(false);
  };

  return (
    <>
      {etapa === 'cadastro-indicador' && (
        <CadastroIndicador onCadastroCompleto={handleCadastroIndicador} />
      )}

      {etapa === 'cadastro-leads' && indicador && (
        <CadastroLeads
          idIndicador={indicador.id}
          nomeIndicador={indicador.nome}
          onConcluido={handleCadastroLeadsConcluido}
        />
      )}

      {etapa === 'roleta' && indicador && (
        <RoletaDaSorte
          idIndicador={indicador.id}
          nomeIndicador={indicador.nome}
          onPremioRevelado={handlePremioRevelado}
        />
      )}

      {mostrarPopup && premioRevelado && indicador && (
        <PopupPremiacao
          nomeIndicador={indicador.nome}
          premio={premioRevelado}
          onFechar={handleFecharPopup}
        />
      )}

      <ExportarDados />
    </>
  );
}

export default App;
