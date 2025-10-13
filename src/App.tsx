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
  const [roletaKey, setRoletaKey] = useState(0); // Key para forçar remontagem da roleta

  const handleCadastroIndicador = async (idIndicador: string) => {
    const { api } = await import('./services/apiBackend');
    try {
      const data = await api.getIndicador(idIndicador);
      if (data) {
        setIndicador({ id: idIndicador, nome: data.nome });
        setEtapa('cadastro-leads');
      }
    } catch (error) {
      console.error('Erro ao buscar indicador:', error);
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
    // Reinicia o jogo para o próximo usuário
    setPremioRevelado(null);
    setIndicador(null);
    setEtapa('cadastro-indicador');
  };

  const handleTentarNovamente = () => {
    setMostrarPopup(false);
    setPremioRevelado(null);
    // Incrementa a key para forçar remontagem completa da roleta
    setRoletaKey(prev => prev + 1);
    // Volta para a roleta sem resetar o indicador
    setEtapa('roleta');
  };

  // Funções para DevNavigation
  const handleDevChangeEtapa = (novaEtapa: Etapa) => {
    setMostrarPopup(false);
    setPremioRevelado(null);
    setEtapa(novaEtapa);
  };

  const handleSetIndicadorTeste = async () => {
    if (indicador) return;

    const { api } = await import('./services/apiBackend');

    try {
      const indicadorTeste = await api.salvarIndicador({
        nome: 'Desenvolvedor Teste',
        telefone: '11999999999',
        cargo: 'Desenvolvedor',
      });

      setIndicador({ id: indicadorTeste.id, nome: indicadorTeste.nome });
    } catch (error) {
      console.error('Erro ao criar indicador de teste:', error);
      const mensagem = error instanceof Error
        ? error.message
        : 'Não foi possível criar o indicador de teste.';
      alert(mensagem);
    }
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
          key={roletaKey}
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
          onTentarNovamente={handleTentarNovamente}
        />
      )}
    </>
  );
}

export default App;
