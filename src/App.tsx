import { useState } from 'react';
import { CadastroIndicador } from './components/CadastroIndicador';
import { CadastroLeads } from './components/CadastroLeads';
import { RoletaDaSorte } from './components/RoletaDaSorte';
import { PopupPremiacao } from './components/PopupPremiacao';
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
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/indicadores?id=eq.${idIndicador}`,
      {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      }
    );
    const data = await response.json();

    if (data && data.length > 0) {
      setIndicador({ id: idIndicador, nome: data[0].nome });
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
    </>
  );
}

export default App;
