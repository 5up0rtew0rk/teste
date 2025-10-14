import { useState } from 'react';
import { UserPlus, Phone, Briefcase } from 'lucide-react';
import { api } from '../services/apiBackend';
import { formatarTelefone, validarNome, validarTelefone, validarCargo } from '../utils/validation';
import type { CreateIndicadorDTO } from '../types/database';

interface CadastroIndicadorProps {
  onCadastroCompleto: (idIndicador: string) => void;
}

export function CadastroIndicador({ onCadastroCompleto }: CadastroIndicadorProps) {
  const [formData, setFormData] = useState<CreateIndicadorDTO>({
    nome: '',
    telefone: '',
    cargo: '',
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
    const erroTelefone = validarTelefone(formData.telefone);
    const erroCargo = validarCargo(formData.cargo);

    if (erroNome) novosErros.nome = erroNome;
    if (erroTelefone) novosErros.telefone = erroTelefone;
    if (erroCargo) novosErros.cargo = erroCargo;

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
      const mensagem = error instanceof Error ? error.message : 'Erro ao cadastrar indicador';
      alert(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002f25] to-[#003d32] flex items-center justify-center p-4 tablet:p-6 lg:p-4 relative overflow-hidden">
      {/* Marca d'água - apenas em desktop */}
      <img 
        src="/teste.png" 
        alt="Marca d'água" 
        className="hidden lg:block fixed 0 w-80 h-80 object-contain pointer-events-none z-50"
        style={{ top: '-104px', right: '30px' }}
      />
      
      <div className="max-w-3xl tablet:max-w-2xl lg:max-w-3xl w-full">
        <div className="text-center mb-6 tablet:mb-8 lg:mb-8">
          <div className="inline-flex items-center justify-center mb-3 tablet:mb-4 lg:mb-4">
            <img 
              src="/lampada.png" 
              alt="Lâmpada" 
              className="w-32 tablet:w-36 lg:w-40 h-24 tablet:h-28 lg:h-30 object-contain drop-shadow-lg animate-heavy-swing" 
            />
          </div>
          <h1 className="text-5xl tablet:text-6xl lg:text-7xl font-extrabold text-white mb-2 tablet:mb-3 lg:mb-3">
            FAÇA INDICAÇÕES E <br />  <span className="text-4xl tablet:text-5xl lg:text-6xl text-laranja animate-tension">GANHE PRÊMIOS!</span>
          </h1>
          <p className="text-base tablet:text-lg lg:text-lg text-white font-bold">
            COMECE SE CADASTRANDO
          </p>
        </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 tablet:p-7 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-5 tablet:space-y-6 lg:space-y-6">
            <div>
              <label className="block text-sm tablet:text-base lg:text-sm font-semibold text-grey-700 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 tablet:py-3.5 lg:py-3 border-2 rounded-lg focus:ring-2 focus:ring-verde-claro focus:border-verde-claro transition-all text-base tablet:text-base lg:text-base ${
                    erros.nome ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Digite seu nome completo"
                />
              </div>
              {erros.nome && <p className="mt-1 text-sm text-red-600">{erros.nome}</p>}
            </div>

            <div>
              <label className="block text-sm tablet:text-base lg:text-sm font-semibold text-grey-700 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 tablet:py-3.5 lg:py-3 border-2 rounded-lg focus:ring-2 focus:ring-verde-claro focus:border-verde-claro transition-all text-base tablet:text-base lg:text-base ${
                    erros.telefone ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="(00) 00000-0000"
                />
              </div>
              {erros.telefone && <p className="mt-1 text-sm text-red-600">{erros.telefone}</p>}
            </div>

            <div>
              <label className="block text-sm tablet:text-base lg:text-sm font-semibold text-grey-700 mb-2">
                Cargo
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => handleChange('cargo', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 tablet:py-3.5 lg:py-3 border-2 rounded-lg focus:ring-2 focus:ring-verde-claro focus:border-verde-claro transition-all text-base tablet:text-base lg:text-base ${
                    erros.cargo ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Digite seu cargo"
                />
              </div>
              {erros.cargo && <p className="mt-1 text-sm text-red-600">{erros.cargo}</p>}
            </div>

            {/* CPF removido */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-laranja to-laranja text-white font-bold py-3.5 tablet:py-4 lg:py-4 px-6 rounded-lg shadow-lg hover:shadow-xl hover:from-laranja/90 hover:to-laranja/90 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base tablet:text-lg lg:text-base"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar-se'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
