import { useState } from 'react';
import { UserPlus, Mail, Phone, Trash2, Users, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { formatarTelefone, validarEmail } from '../utils/validation';
import type { CreateLeadDTO } from '../types/database';

interface CadastroLeadsProps {
  idIndicador: string;
  nomeIndicador: string;
  onConcluido: () => void;
}

export function CadastroLeads({ idIndicador, nomeIndicador, onConcluido }: CadastroLeadsProps) {
  const [leadAtual, setLeadAtual] = useState<CreateLeadDTO>({
    nome: '',
    email: '',
    telefone: '',
  });

  const [leadsAdicionados, setLeadsAdicionados] = useState<CreateLeadDTO[]>([]);
  const [erros, setErros] = useState<Partial<Record<keyof CreateLeadDTO, string>>>({});
  const [loading, setLoading] = useState(false);

  const MIN_LEADS = 3;
  const MAX_LEADS = 5;
  const totalLeads = leadsAdicionados.length;
  const podeGirar = totalLeads >= MIN_LEADS && totalLeads <= MAX_LEADS;

  const validarCampo = (campo: keyof CreateLeadDTO, valor: string): string | null => {
    switch (campo) {
      case 'nome':
        return valor.length < 3 ? 'Nome deve ter no mínimo 3 caracteres' : null;
      case 'email':
        return !validarEmail(valor) ? 'E-mail inválido' : null;
      case 'telefone':
        return valor.replace(/\D/g, '').length < 10 ? 'Telefone inválido' : null;
      default:
        return null;
    }
  };

  const handleChange = (campo: keyof CreateLeadDTO, valor: string) => {
    let valorFormatado = valor;

    if (campo === 'telefone') {
      valorFormatado = formatarTelefone(valor);
    }

    setLeadAtual(prev => ({ ...prev, [campo]: valorFormatado }));

    if (erros[campo]) {
      setErros(prev => ({ ...prev, [campo]: undefined }));
    }
  };

  const adicionarLead = () => {
    if (totalLeads >= MAX_LEADS) {
      alert(`Você já atingiu o limite de ${MAX_LEADS} leads!`);
      return;
    }

    const novosErros: Partial<Record<keyof CreateLeadDTO, string>> = {};

    (Object.keys(leadAtual) as Array<keyof CreateLeadDTO>).forEach(campo => {
      const erro = validarCampo(campo, leadAtual[campo]);
      if (erro) {
        novosErros[campo] = erro;
      }
    });

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    setLeadsAdicionados(prev => [...prev, {
      ...leadAtual,
      telefone: leadAtual.telefone.replace(/\D/g, ''),
    }]);

    setLeadAtual({ nome: '', email: '', telefone: '' });
    setErros({});
  };

  const removerLead = (index: number) => {
    setLeadsAdicionados(prev => prev.filter((_, i) => i !== index));
  };

  const handleGirarRoleta = async () => {
    if (!podeGirar) return;

    setLoading(true);
    try {
      await api.criarLeads(idIndicador, leadsAdicionados);
      onConcluido();
    } catch (error) {
      alert('Erro ao salvar leads. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Indique seus Leads e Gire a Roleta da Sorte!
          </h1>
          <p className="text-lg text-gray-600">
            Olá, <span className="font-semibold text-indigo-600">{nomeIndicador}</span>! Adicione de 3 a 5 leads para liberar sua premiação.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-indigo-600" />
              Adicionar Lead
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={leadAtual.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                    erros.nome ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Nome do lead"
                />
                {erros.nome && <p className="mt-1 text-sm text-red-600">{erros.nome}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  E-mail *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={leadAtual.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                      erros.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="email@exemplo.com"
                  />
                </div>
                {erros.email && <p className="mt-1 text-sm text-red-600">{erros.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefone/WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={leadAtual.telefone}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                      erros.telefone ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                {erros.telefone && <p className="mt-1 text-sm text-red-600">{erros.telefone}</p>}
              </div>

              <button
                type="button"
                onClick={adicionarLead}
                disabled={totalLeads >= MAX_LEADS}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar Lead
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" />
                Leads Adicionados
              </h2>
              <div className={`text-lg font-bold px-4 py-2 rounded-full ${
                podeGirar ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {totalLeads} / 5
              </div>
            </div>

            <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
              {leadsAdicionados.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>Nenhum lead adicionado ainda</p>
                </div>
              ) : (
                leadsAdicionados.map((lead, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 flex items-start justify-between gap-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{lead.nome}</p>
                      <p className="text-sm text-gray-600 truncate">{lead.email}</p>
                      <p className="text-sm text-gray-600">{formatarTelefone(lead.telefone)}</p>
                    </div>
                    <button
                      onClick={() => removerLead(index)}
                      className="text-red-500 hover:text-red-700 transition-colors p-2"
                      title="Remover lead"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4">
              {!podeGirar && (
                <p className="text-center text-sm text-gray-600 mb-3">
                  {totalLeads < MIN_LEADS
                    ? `Adicione ${MIN_LEADS - totalLeads} lead${MIN_LEADS - totalLeads > 1 ? 's' : ''} para liberar a roleta`
                    : 'Pronto para girar!'}
                </p>
              )}

              <button
                onClick={handleGirarRoleta}
                disabled={!podeGirar || loading}
                className={`w-full font-bold py-4 px-6 rounded-lg shadow-lg transition-all ${
                  podeGirar
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-xl hover:from-yellow-500 hover:to-orange-600 transform hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  'Salvando...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Girar a Roleta
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
