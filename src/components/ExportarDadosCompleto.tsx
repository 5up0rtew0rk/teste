import { Download } from 'lucide-react';
import { useState } from 'react';
import { csvStorage } from '../services/csvStorage';
import { api } from '../services/apiBackend';

export function ExportarDadosCompleto() {
  const [mode, setMode] = useState<'localStorage' | 'backend'>('backend');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleExportarLocalStorage = () => {
    csvStorage.exportarCSV();
    setMessage('Dados exportados do localStorage!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleExportarBackend = async () => {
    setLoading(true);
    setMessage('');
    try {
      const dados = await api.exportarDados();
      
      // Mostra informações sobre os dados
      setMessage(
        `Exportado: ${dados.total.indicadores} indicadores, ` +
        `${dados.total.leads} leads, ${dados.total.premios} prêmios`
      );
      
      // Você pode fazer download ou mostrar os dados aqui
      console.log('Dados exportados:', dados);
      
    } catch (error) {
      console.error('Erro ao exportar:', error);
      setMessage('Erro ao exportar dados do backend');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleDownloadCSV = (tipo: 'indicadores' | 'leads' | 'premios') => {
    api.downloadCSV(tipo);
    setMessage(`Download de ${tipo}.csv iniciado!`);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 items-end">
      {message && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {message}
        </div>
      )}

      {/* Seletor de modo */}
      <div className="bg-white rounded-lg shadow-lg p-3 flex gap-2">
        <button
          onClick={() => setMode('localStorage')}
          className={`px-3 py-1 rounded ${
            mode === 'localStorage'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-white-700'
          }`}
        >
          LocalStorage
        </button>
        <button
          onClick={() => setMode('backend')}
          className={`px-3 py-1 rounded ${
            mode === 'backend'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-white-700'
          }`}
        >
          Backend
        </button>
      </div>

      {/* Botões de exportação */}
      {mode === 'localStorage' ? (
        <button
          onClick={handleExportarLocalStorage}
          className="bg-gradient-to-r from-verde-escuro to-verde-claro text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl hover:from-verde-escuro/90 hover:to-verde-claro/90 transform hover:-translate-y-1 transition-all flex items-center gap-2"
          title="Exportar dados para CSV (localStorage)"
        >
          <Download className="w-5 h-5" />
          Exportar CSV
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleExportarBackend}
            disabled={loading}
            className="bg-gradient-to-r from-verde-escuro to-verde-claro text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl hover:from-verde-escuro/90 hover:to-verde-claro/90 transform hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50"
            title="Exportar todos os dados (backend)"
          >
            <Download className="w-5 h-5" />
            {loading ? 'Exportando...' : 'Ver Dados'}
          </button>

          <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1">
            <button
              onClick={() => handleDownloadCSV('indicadores')}
              className="text-sm px-3 py-2 rounded hover:bg-gray-100 text-left"
            >
              📥 Baixar Indicadores
            </button>
            <button
              onClick={() => handleDownloadCSV('leads')}
              className="text-sm px-3 py-2 rounded hover:bg-gray-100 text-left"
            >
              📥 Baixar Leads
            </button>
            <button
              onClick={() => handleDownloadCSV('premios')}
              className="text-sm px-3 py-2 rounded hover:bg-gray-100 text-left"
            >
              📥 Baixar Prêmios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
