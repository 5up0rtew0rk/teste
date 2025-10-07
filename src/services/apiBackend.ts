import type { Indicador, Lead, PremioGanho, CreateIndicadorDTO, CreateLeadDTO } from '../types/database';

const API_URL = 'http://localhost:3001/api';

// Função auxiliar para fazer requisições
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro na requisição: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // ===== INDICADORES =====
  
  async getIndicadores(): Promise<Indicador[]> {
    return fetchAPI<Indicador[]>('/indicadores');
  },

  async getIndicador(id: string): Promise<Indicador> {
    return fetchAPI<Indicador>(`/indicadores/${id}`);
  },

  async salvarIndicador(data: CreateIndicadorDTO): Promise<Indicador> {
    return fetchAPI<Indicador>('/indicadores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ===== LEADS =====

  async getLeads(): Promise<Lead[]> {
    return fetchAPI<Lead[]>('/leads');
  },

  async getLeadsByIndicador(idIndicador: string): Promise<Lead[]> {
    return fetchAPI<Lead[]>(`/leads/indicador/${idIndicador}`);
  },

  async salvarLeads(idIndicador: string, leads: CreateLeadDTO[]): Promise<Lead[]> {
    return fetchAPI<Lead[]>('/leads', {
      method: 'POST',
      body: JSON.stringify({ id_indicador: idIndicador, leads }),
    });
  },

  // ===== PRÊMIOS =====

  async getPremios(): Promise<PremioGanho[]> {
    return fetchAPI<PremioGanho[]>('/premios');
  },

  async getPremioByIndicador(idIndicador: string): Promise<PremioGanho | null> {
    try {
      return await fetchAPI<PremioGanho>(`/premios/indicador/${idIndicador}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async salvarPremio(data: Omit<PremioGanho, 'id' | 'data_premiacao'>): Promise<PremioGanho> {
    return fetchAPI<PremioGanho>('/premios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ===== EXPORTAR =====

  async exportarDados() {
    const response = await fetchAPI<{
      indicadores: Indicador[];
      leads: Lead[];
      premios: PremioGanho[];
      total: {
        indicadores: number;
        leads: number;
        premios: number;
      };
    }>('/exportar');

    return response;
  },

  // Download de CSV individual
  downloadCSV(tipo: 'indicadores' | 'leads' | 'premios') {
    window.open(`${API_URL}/download/${tipo}`, '_blank');
  },

  // ===== HEALTH CHECK =====

  async checkHealth(): Promise<{ status: string; message: string }> {
    return fetchAPI<{ status: string; message: string }>('/health');
  },
};
