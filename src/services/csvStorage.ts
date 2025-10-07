import type { Indicador, Lead, PremioGanho } from '../types/database';

const STORAGE_KEYS = {
  INDICADORES: 'indicadores_csv',
  LEADS: 'leads_csv',
  PREMIOS: 'premios_csv',
};

export const csvStorage = {
  getIndicadores(): Indicador[] {
    const data = localStorage.getItem(STORAGE_KEYS.INDICADORES);
    return data ? JSON.parse(data) : [];
  },

  salvarIndicador(indicador: Omit<Indicador, 'id' | 'data_cadastro'>): Indicador {
    const indicadores = this.getIndicadores();

    const emailExiste = indicadores.some(i => i.email === indicador.email);
    if (emailExiste) {
      throw new Error('E-mail já cadastrado');
    }

    const novoIndicador: Indicador = {
      ...indicador,
      id: crypto.randomUUID(),
      data_cadastro: new Date().toISOString(),
    };

    indicadores.push(novoIndicador);
    localStorage.setItem(STORAGE_KEYS.INDICADORES, JSON.stringify(indicadores));

    return novoIndicador;
  },

  buscarIndicador(id: string): Indicador | null {
    const indicadores = this.getIndicadores();
    return indicadores.find(i => i.id === id) || null;
  },

  getLeads(): Lead[] {
    const data = localStorage.getItem(STORAGE_KEYS.LEADS);
    return data ? JSON.parse(data) : [];
  },

  salvarLeads(idIndicador: string, leads: Omit<Lead, 'id' | 'id_indicador' | 'data_cadastro'>[]): Lead[] {
    const todosLeads = this.getLeads();

    const novosLeads: Lead[] = leads.map(lead => ({
      ...lead,
      id: crypto.randomUUID(),
      id_indicador: idIndicador,
      data_cadastro: new Date().toISOString(),
    }));

    todosLeads.push(...novosLeads);
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(todosLeads));

    return novosLeads;
  },

  getPremios(): PremioGanho[] {
    const data = localStorage.getItem(STORAGE_KEYS.PREMIOS);
    return data ? JSON.parse(data) : [];
  },

  salvarPremio(premio: Omit<PremioGanho, 'id' | 'data_premiacao'>): PremioGanho {
    const premios = this.getPremios();

    const novoPremio: PremioGanho = {
      ...premio,
      id: crypto.randomUUID(),
      data_premiacao: new Date().toISOString(),
    };

    premios.push(novoPremio);
    localStorage.setItem(STORAGE_KEYS.PREMIOS, JSON.stringify(premios));

    return novoPremio;
  },

  buscarPremio(idIndicador: string): PremioGanho | null {
    const premios = this.getPremios();
    const premiosDoIndicador = premios.filter(p => p.id_indicador === idIndicador);

    if (premiosDoIndicador.length === 0) return null;

    return premiosDoIndicador.sort((a, b) =>
      new Date(b.data_premiacao).getTime() - new Date(a.data_premiacao).getTime()
    )[0];
  },

  exportarCSV() {
    const indicadores = this.getIndicadores();
    const leads = this.getLeads();
    const premios = this.getPremios();

  const indicadoresCSV = this.converterParaCSV(indicadores, ['id', 'nome', 'email', 'telefone', 'data_cadastro']);
    const leadsCSV = this.converterParaCSV(leads, ['id', 'id_indicador', 'nome', 'email', 'telefone', 'data_cadastro']);
    const premiosCSV = this.converterParaCSV(premios, ['id', 'id_indicador', 'premio_descricao', 'premio_index', 'data_premiacao']);

    this.downloadCSV('indicadores.csv', indicadoresCSV);
    this.downloadCSV('leads.csv', leadsCSV);
    this.downloadCSV('premios.csv', premiosCSV);
  },

  converterParaCSV(data: any[], colunas: string[]): string {
    if (data.length === 0) {
      return colunas.join(',') + '\n';
    }

    const header = colunas.join(',');
    const rows = data.map(item =>
      colunas.map(col => {
        const value = item[col] ?? '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );

    return header + '\n' + rows.join('\n');
  },

  downloadCSV(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
