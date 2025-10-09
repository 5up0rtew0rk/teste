import { useState } from 'react';
import { UserPlus, Mail, Phone } from 'lucide-react';
import { api } from '../services/apiBackend';
import { formatarTelefone, validarEmail, validarNome } from '../utils/validation';
import type { CreateIndicadorDTO } from '../types/database';

interface CadastroIndicadorProps {
  onCadastroCompleto: (idIndicador: string) => void;
}

export function CadastroIndicador({ onCadastroCompleto }: CadastroIndicadorProps) {
  const [formData, setFormData] = useState<CreateIndicadorDTO>({
    nome: '',
    email: '',
    telefone: '',
  });

  const [erros, setErros] = useState<Partial<Record<keyof CreateIndicadorDTO, string>>>({});
  const [loading, setLoading] = useState(false);



  const handleChange = (campo: keyof CreateIndicadorDTO, valor: string) => {
  let valorFormatado = valor;

  if (campo === 'telefone') {
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
    const erroNome = validarNome(formData.nome);
    const erroEmail = !validarEmail(formData.email) ? 'E-mail inválido' : null;
    const erroTelefone = formData.telefone.replace(/\D/g, '').length < 10 ? 'Telefone inválido' : null;

    if (erroNome) novosErros.nome = erroNome;
    if (erroEmail) novosErros.email = erroEmail;
    if (erroTelefone) novosErros.telefone = erroTelefone;

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    setLoading(true);
    try {
      const indicador = await api.salvarIndicador({
        ...formData,
        telefone: formData.telefone.replace(/\D/g, ''),
      });
      onCadastroCompleto(indicador.id);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao cadastrar indicador. Verifique se o e-mail já não está cadastrado.';
      alert(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002f25] to-[#003d32] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Marca d'água - fora do padding */}
      <img 
        src="/teste.png" 
        alt="Marca d'água" 
        className="fixed 0 w-80 h-80 object-contain pointer-events-none z-50"
        style={{ top: '-104px', right: '30px' }}
      />
      
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/lampada.png" alt="Lâmpada" className="w-40 h-30 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-7xl font-extrabold text-white mb-3">
            FAÇA INDICAÇÕES E <br />  <span className="text-6xl text-laranja">GANHE PRÊMIOS!</span>
          </h1>
          <p className="text-lg text-white font-bold">
            COMECE SE CADASTRANDO
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-grey-700 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-verde-claro focus:border-verde-claro transition-all ${
                    erros.nome ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Digite seu nome completo"
                />
              </div>
              {erros.nome && <p className="mt-1 text-sm text-red-600">{erros.nome}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white-700 mb-2">
                E-mail *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-verde-claro focus:border-verde-claro transition-all ${
                    erros.email ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="seu@email.com"
                />
              </div>
              {erros.email && <p className="mt-1 text-sm text-red-600">{erros.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white-700 mb-2">
                Telefone/WhatsApp *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white-400" />
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-verde-claro focus:border-verde-claro transition-all ${
                    erros.telefone ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="(00) 00000-0000"
                />
              </div>
              {erros.telefone && <p className="mt-1 text-sm text-red-600">{erros.telefone}</p>}
            </div>

            {/* CPF removido */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-laranja to-laranja text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl hover:from-laranja/90 hover:to-laranja/90 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar-se'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
