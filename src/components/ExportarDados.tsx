import { Download } from 'lucide-react';
import { api } from '../services/api';

export function ExportarDados() {
  const handleExportar = () => {
    api.exportarDados();
  };

  return (
    <button
      onClick={handleExportar}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transform hover:-translate-y-1 transition-all flex items-center gap-2"
      title="Exportar dados para CSV"
    >
      <Download className="w-5 h-5" />
      Exportar CSV
    </button>
  );
}
