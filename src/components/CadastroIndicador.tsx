import { useState } from 'react';
import { UserPlus, Mail, Phone, CreditCard, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { formatarCPF, formatarTelefone, validarCPF, validarEmail } from '../utils/validation';
import type { CreateIndicadorDTO } from '../types/database';

interface CadastroIndicadorProps {
  onCadastroCompleto: (idIndicador: string) => void;
}

export function CadastroIndicador({ onCadastroCompleto }: CadastroIndicadorProps) {
  const [formData, setFormData] = useState<CreateIndicadorDTO>({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
  });

  const [erros, setErros] = useState<Partial<Record<keyof CreateIndicadorDTO, string>>>({});
  const [loading, setLoading] = useState(false);

  const validarCampo = (campo: keyof CreateIndicadorDTO, valor: string): string | null => {
    switch (campo) {
      case 'nome':
        return valor.length < 3 ? 'Nome deve ter no mínimo 3 caracteres' : null;
      case 'email':
        return !validarEmail(valor) ? 'E-mail inválido' : null;
      case 'telefone':
        return valor.replace(/\D/g, '').length < 10 ? 'Telefone inválido' : null;
      case 'cpf':
        return !validarCPF(valor) ? 'CPF inválido' : null;
      default:
        return null;
    }
  };

  const handleChange = (campo: keyof CreateIndicadorDTO, valor: string) => {
    let valorFormatado = valor;

    if (campo === 'cpf') {
      valorFormatado = formatarCPF(valor);
    } else if (campo === 'telefone') {
      valorFormatado = formatarTelefone(valor);
    }

    setFormData(prev => ({ ...prev, [campo]: valorFormatado }));

    if (erros[campo]) {
      setErros(prev => ({ ...prev, [campo]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const novosErros: Partial<Record<keyof CreateIndicadorDTO, string>> = {};

    (Object.keys(formData) as Array<keyof CreateIndicadorDTO>).forEach(campo => {
      const erro = validarCampo(campo, formData[campo]);
      if (erro) {
        novosErros[campo] = erro;
      }
    });

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    setLoading(true);
    try {
      const indicador = await api.criarIndicador({
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
      });
      onCadastroCompleto(indicador.id);
    } catch (error) {
      alert('Erro ao cadastrar indicador. Verifique se o CPF ou e-mail já não estão cadastrados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Torne-se um Indicador de Sucesso
          </h1>
          <p className="text-lg text-gray-600">
            Cadastre-se, indique leads e ganhe prêmios exclusivos!
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                    erros.nome ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Digite seu nome completo"
                />
              </div>
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
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                    erros.email ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="seu@email.com"
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
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                    erros.telefone ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="(00) 00000-0000"
                />
              </div>
              {erros.telefone && <p className="mt-1 text-sm text-red-600">{erros.telefone}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CPF *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => handleChange('cpf', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                    erros.cpf ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="000.000.000-00"
                />
              </div>
              {erros.cpf && <p className="mt-1 text-sm text-red-600">{erros.cpf}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar e Indicar Leads'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
