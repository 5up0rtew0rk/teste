import { useState, useCallback, useEffect } from 'react';
import { Phone, User, CheckCircle, AlertCircle, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/apiBackend';
import { formatarTelefone, validarNome, validarTelefone } from '../utils/validation';
import type { CreateLeadDTO } from '../types/database';

interface CadastroLeadsProps {
  idIndicador: string;
  nomeIndicador: string;
  onConcluido: () => void;
}

type Indicacao = {
  nome: string;
  telefone: string;
};

type ValidationError = {
  nome?: string;
  telefone?: string;
};

type FormStatus = 'idle' | 'validating' | 'submitting' | 'success' | 'error';

export function CadastroLeads({ idIndicador, onConcluido }: CadastroLeadsProps) {
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([
    { nome: '', telefone: '' },
    { nome: '', telefone: '' },
    { nome: '', telefone: '' },
  ]);

  const [erros, setErros] = useState<Record<number, ValidationError>>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [leadAtual, setLeadAtual] = useState(0);
  const [leadsCompletos, setLeadsCompletos] = useState<boolean[]>([false, false, false]);

  // Função para validar um campo específico
  const validarCampo = useCallback((valor: string, campo: keyof Indicacao): string | undefined => {
    if (campo === 'nome') {
      return validarNome(valor) || undefined;
    }
    
    if (campo === 'telefone') {
      return validarTelefone(valor) || undefined;
    }
    
    return undefined;
  }, []);

  // Função para verificar se um lead está completo
  const verificarLeadCompleto = useCallback((indicacao: Indicacao): boolean => {
    const nomeValido = indicacao.nome.trim().length > 0;
    const telefoneValido = indicacao.telefone.trim().length > 0;
    const nomePassouValidacao = !validarCampo(indicacao.nome, 'nome');
    const telefonePassouValidacao = !validarCampo(indicacao.telefone, 'telefone');
    
    const completo = nomeValido && telefoneValido && nomePassouValidacao && telefonePassouValidacao;
    
    // Debug temporário
    console.log(`Lead completo check:`, {
      nome: indicacao.nome,
      telefone: indicacao.telefone,
      nomeValido,
      telefoneValido,
      nomePassouValidacao,
      telefonePassouValidacao,
      completo
    });
    
    return completo;
  }, [validarCampo]);

  // Função para avançar para o próximo lead
  const avancarProximoLead = useCallback(() => {
    if (leadAtual < 2) {
      setLeadAtual(prev => prev + 1);
    }
  }, [leadAtual]);

  // Função para voltar ao lead anterior
  const voltarLeadAnterior = useCallback(() => {
    if (leadAtual > 0) {
      setLeadAtual(prev => prev - 1);
    }
  }, [leadAtual]);

  // Função otimizada para lidar com mudanças nos campos
  const handleChange = useCallback((index: number, campo: keyof Indicacao, valor: string) => {
    let valorFormatado = valor;
    if (campo === 'telefone') {
      valorFormatado = formatarTelefone(valor);
    }

    // Validação em tempo real após a primeira tentativa de envio
    if (submitAttempted) {
      const erro = validarCampo(valorFormatado, campo);
      setErros(prev => {
        const novos = { ...prev };
        if (erro) {
          novos[index] = { ...novos[index], [campo]: erro };
        } else {
          delete novos[index]?.[campo];
          if (novos[index] && Object.keys(novos[index]).length === 0) {
            delete novos[index];
          }
        }
        return novos;
      });
    }

    // Atualizar status de lead completo usando os dados mais recentes
    setIndicacoes(prevIndicacoes => {
      const novasIndicacoes = [...prevIndicacoes];
      novasIndicacoes[index] = { ...novasIndicacoes[index], [campo]: valorFormatado };
      
      const leadEstaCompleto = verificarLeadCompleto(novasIndicacoes[index]);
      
      setLeadsCompletos(prev => {
        const novos = [...prev];
        novos[index] = leadEstaCompleto;
        return novos;
      });

      return novasIndicacoes;
    });
  }, [submitAttempted, validarCampo, verificarLeadCompleto]);

  // Validação completa do formulário
  const validarFormulario = useCallback(() => {
    const novosErros: Record<number, ValidationError> = {};
    let formValido = true;

    indicacoes.forEach((indicacao, index) => {
      const errosDaIndicacao: ValidationError = {};
      
      const erroNome = validarCampo(indicacao.nome, 'nome');
      const erroTelefone = validarCampo(indicacao.telefone, 'telefone');
      
      if (erroNome) {
        errosDaIndicacao.nome = erroNome;
        formValido = false;
      }
      
      if (erroTelefone) {
        errosDaIndicacao.telefone = erroTelefone;
        formValido = false;
      }
      
      if (Object.keys(errosDaIndicacao).length > 0) {
        novosErros[index] = errosDaIndicacao;
      }
    });

    setErros(novosErros);
    return formValido;
  }, [indicacoes, validarCampo]);

  // Função de submit melhorada
  const handleSubmit = useCallback(async () => {
    setSubmitAttempted(true);
    setStatus('validating');

    if (!validarFormulario()) {
      setStatus('error');
      return;
    }

    setStatus('submitting');
    
    try {
      const leadsParaSalvar: CreateLeadDTO[] = indicacoes.map(indicacao => ({
        nome: indicacao.nome.trim(),
        telefone: indicacao.telefone.replace(/\D/g, ''),
      }));

      await api.salvarLeads(idIndicador, leadsParaSalvar);
      
      setStatus('success');
      setSuccessMessage('Contatos salvos com sucesso! Você está participando da promoção.');
      
      // Aguarda um momento para mostrar a mensagem de sucesso
      setTimeout(() => {
        onConcluido();
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao salvar leads:", error);
      setStatus('error');
      setSuccessMessage('Erro ao salvar os contatos. Por favor, tente novamente.');
    }
  }, [indicacoes, validarFormulario, idIndicador, onConcluido]);

  // Status de carregamento
  const isLoading = status === 'submitting' || status === 'validating';
  const isSuccess = status === 'success';
  const hasErrors = Object.keys(erros).length > 0;

  // Debug temporário
  useEffect(() => {
    console.log('Estado leads completos:', leadsCompletos, 'Todos completos:', leadsCompletos.every(Boolean));
  }, [leadsCompletos]);

  // Navegação com teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Não processar se estiver digitando em um campo
      if (event.target instanceof HTMLInputElement) return;
      
      if (event.key === 'ArrowRight' && leadAtual < 2 && leadsCompletos[leadAtual]) {
        event.preventDefault();
        avancarProximoLead();
      } else if (event.key === 'ArrowLeft' && leadAtual > 0) {
        event.preventDefault();
        voltarLeadAnterior();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [leadAtual, leadsCompletos, avancarProximoLead, voltarLeadAnterior]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002f25] to-[#003d32] flex items-center justify-center p-4 tablet:p-6 lg:p-8 relative overflow-hidden">
      {/* Marca d'água - apenas em desktop */}
      <img 
        src="/teste.png" 
        alt="Marca d'água" 
        className="hidden lg:block fixed 0 w-80 h-80 object-contain pointer-events-none z-50"
        style={{ top: '-104px', right: '30px' }}
      />
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-emerald-300/10 rounded-full blur-lg animate-bounce"></div>
      </div>

      <div className="w-full max-w-[120rem] mx-auto z-10 px-2 tablet:px-4 lg:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-8 items-center">
          
          {/* Lado Esquerdo: Título e Lâmpada */}
            <div className="text-white text-center flex flex-col items-center justify-center order-2 lg:order-1">
              {/* Imagem da Lâmpada */}
              <div className="mt-6 flex justify-center relative">
              <img 
                src="/lampada.png" 
                alt="Lâmpada Mágica" 
                className="w-64 tablet:w-72 lg:w-[35rem] h-auto object-contain drop-shadow-[0_10px_30px_rgba(250,204,21,0.4)] hover:scale-105 transition-transform duration-300 mb-6 animate-suspense" 
              />
              </div>

<h1 className="font-extrabold uppercase text-center leading-none mb-6">
  <span className="block text-[clamp(2rem,5vw,4.5rem)] tablet:text-[clamp(2.5rem,5.5vw,4.5rem)] lg:text-[clamp(2rem,6vw,5rem)] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
    LIBERTE A{' '}
    <span className="text-laranja relative animate-weighted">
      GÊNI<span className="text-white">.</span>IA
    </span>
  </span>
  <span className="block text-[clamp(1.5rem,4vw,3.5rem)] tablet:text-[clamp(1.75rem,4.5vw,3.5rem)] lg:text-[clamp(1.5rem,5vw,4rem)] mt-2 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
    DA LÂMPADA MÁGICA
  </span>
</h1>


            <p className="text-xl tablet:text-2xl lg:text-2xl font-extrabold uppercase leading-tight drop-shadow-lg mb-4 text-center">INDIQUE <span className="text-laranja">3 PESSOAS</span> QUE PODEM SE <br />BENEFICIAR COM O WORKMONITOR!</p>


            </div>

          {/* Lado Direito: Formulário */}
            <div className="order-1 lg:order-2 relative lg:ml-[-15rem] flex justify-center items-center">
            {/* Setas de Navegação - Fora do Card */}
            {/* Seta para voltar */}
            {leadAtual > 0 && (
              <button
              type="button"
              onClick={voltarLeadAnterior}
              className="absolute left-1 tablet:left-4 lg:left-24 top-1/2 -translate-y-1/2 z-30 bg-gray-600 hover:bg-gray-500 text-white p-2 tablet:p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
              title="Clique para voltar ao contato anterior"
              >
              <ChevronLeft className="w-5 h-5 tablet:w-6 tablet:h-6" />
              </button>
            )}

            {/* Seta para avançar quando lead está completo */}
            {leadAtual < 2 && leadsCompletos[leadAtual] && (
              <button
                type="button"
                onClick={avancarProximoLead}
                className="absolute right-1 tablet:right-4 lg:right-24 top-1/2 -translate-y-1/2 z-30 bg-emerald-500 hover:bg-emerald-400 text-black p-2 tablet:p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 animate-pulse"
                title="Clique para ir ao próximo contato"
              >
                <ChevronRight className="w-5 h-5 tablet:w-6 tablet:h-6" />
              </button>
            )}

            {/* Indicação para finalizar no último lead */}
            {leadAtual === 2 && leadsCompletos[leadAtual] && (
              <div className="absolute right-1 tablet:right-4 lg:right-0 top-1/2 -translate-y-1/2 z-30 bg-emerald-500 text-black p-2 tablet:p-3 rounded-full shadow-lg animate-pulse">
                <Send className="w-5 h-5 tablet:w-6 tablet:h-6" />
              </div>
            )}

            <div className="bg-black/90 backdrop-blur-sm border border-emerald-400/30 rounded-xl shadow-2xl p-6 tablet:p-7 lg:p-8 w-full relative overflow-hidden max-w-lg mx-auto">
              {/* Fundo decorativo do formulário */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>
              
              {/* Header do formulário */}
              <div className="relative z-10 mb-4 text-center">
                <h2 className="text-xl tablet:text-2xl lg:text-2xl font-bold text-white mb-2">Cadastre seus Contatos</h2>
                <p className="text-gray-400 text-sm tablet:text-base lg:text-sm">Preencha um por vez</p>
              </div>

              {/* Mensagem de sucesso */}
              {isSuccess && (
                <div className="mb-3 p-3 bg-emerald-500/20 border border-emerald-400/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-emerald-400 font-semibold text-sm">Sucesso!</h3>
                      <p className="text-emerald-300 text-sm">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagem de erro geral */}
              {status === 'error' && hasErrors && (
                <div className="mb-3 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-red-400 font-semibold text-sm">Atenção!</h3>
                      <p className="text-red-300 text-sm">Corrija os campos destacados.</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="relative z-10">
                {/* Indicador de progresso */}
                <div className="flex justify-center mb-5">
                  <div className="flex gap-3">
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        className={`w-12 h-2.5 rounded-full transition-all duration-300 ${
                          index === leadAtual
                            ? 'bg-emerald-400'
                            : leadsCompletos[index]
                            ? 'bg-emerald-600'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Carrossel do formulário */}
                <div className="relative overflow-hidden">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${leadAtual * 100}%)` }}
                  >
                    {indicacoes.map((indicacao, index) => (
                      <div key={index} className="w-full flex-shrink-0">
                        <div className="p-4 tablet:p-5 lg:p-5 bg-gray-900/30 rounded-lg border border-gray-700/30 hover:border-emerald-400/30 transition-colors">
                          {/* Header do lead atual */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                leadsCompletos[index] ? 'bg-emerald-400/30' : 'bg-emerald-400/20'
                              }`}>
                                {leadsCompletos[index] ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <span className="text-emerald-400 font-bold text-sm">{index + 1}</span>
                                )}
                              </div>
                              <h3 className="font-semibold text-white text-base tablet:text-lg lg:text-base">
                                {index === 0 ? '1ª Indicação' : index === 1 ? '2ª Indicação' : '3ª Indicação'}
                              </h3>
                            </div>
                            <span className="text-sm tablet:text-base lg:text-sm text-gray-400">{index + 1}/3</span>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Campo Nome Completo */}
                            <div>
                              <label htmlFor={`nome-${index}`} className="block text-sm tablet:text-base lg:text-sm font-medium text-gray-300 mb-1.5">
                                Nome Completo *
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="text"
                                  id={`nome-${index}`}
                                  value={indicacao.nome}
                                  onChange={(e) => handleChange(index, 'nome', e.target.value)}
                                  className={`w-full bg-gray-800/50 text-white border rounded-lg pl-11 pr-11 py-3 tablet:py-3.5 lg:py-3 text-base tablet:text-base lg:text-base focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all placeholder:text-gray-500 ${
                                    erros[index]?.nome ? 'border-red-500 bg-red-500/10' : 'border-gray-600 hover:border-gray-500'
                                  }`}
                                  placeholder="Digite o nome completo"
                                  disabled={isLoading}
                                />
                                {indicacao.nome && !erros[index]?.nome && (
                                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                                )}
                              </div>
                              {erros[index]?.nome && (
                                <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  {erros[index]?.nome}
                                </p>
                              )}
                            </div>
                            
                            {/* Campo Telefone */}
                            <div>
                              <label htmlFor={`telefone-${index}`} className="block text-sm tablet:text-base lg:text-sm font-medium text-gray-300 mb-1.5">
                                Telefone *
                              </label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="tel"
                                  id={`telefone-${index}`}
                                  value={indicacao.telefone}
                                  onChange={(e) => handleChange(index, 'telefone', e.target.value)}
                                  className={`w-full bg-gray-800/50 text-white border rounded-lg pl-11 pr-11 py-3 tablet:py-3.5 lg:py-3 text-base tablet:text-base lg:text-base focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all placeholder:text-gray-500 ${
                                    erros[index]?.telefone ? 'border-red-500 bg-red-500/10' : 'border-gray-600 hover:border-gray-500'
                                  }`}
                                  placeholder="(11) 99999-9999"
                                  disabled={isLoading}
                                />
                                {indicacao.telefone && !erros[index]?.telefone && (
                                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                                )}
                              </div>
                              {erros[index]?.telefone && (
                                <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  {erros[index]?.telefone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botão de Finalizar (apenas no último lead) */}
                {leadAtual === 2 && (
                  <div className="mt-5">
                    <button
                      type="submit"
                      disabled={isLoading || !leadsCompletos.every(Boolean)}
                      className={`w-full py-3.5 tablet:py-4 lg:py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2.5 text-base tablet:text-lg lg:text-base font-semibold ${
                        isLoading
                          ? 'bg-gray-600 text-gray-300 cursor-wait'
                          : isSuccess
                          ? 'bg-emerald-600 text-white'
                          : leadsCompletos.every(Boolean)
                          ? 'bg-emerald-500 text-black hover:bg-emerald-400 hover:-translate-y-0.5'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                          {status === 'validating' ? 'Validando...' : 'Enviando...'}
                        </>
                      ) : isSuccess ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Enviado com Sucesso!
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Participar do Sorteio
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Dica de preenchimento */}
                {!leadsCompletos[leadAtual] && leadAtual < 2 && (
                  <p className="mt-3 text-sm tablet:text-base lg:text-sm text-gray-400 text-center">
                    Complete os campos para continuar
                  </p>
                )}

                {/* Dica de navegação */}
                {leadsCompletos[leadAtual] && leadAtual < 2 && (
                  <p className="mt-3 text-sm tablet:text-base lg:text-sm text-emerald-400 text-center flex items-center justify-center gap-1.5">
                    <span>Use as setas</span>
                    <ChevronRight className="w-4 h-4" />
                    <span>ou clique na seta para continuar</span>
                  </p>
                )}

                {/* Resumo dos leads completos */}
                {leadAtual === 2 && leadsCompletos.filter(Boolean).length > 0 && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-400/30 rounded-lg text-center">
                    <p className="text-sm tablet:text-base lg:text-sm text-emerald-400">
                      {leadsCompletos.filter(Boolean).length}/3 contatos preenchidos
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}