import type { Indicador, Lead, CreateIndicadorDTO, CreateLeadDTO } from '../types/database';

// Detecta automaticamente o host para funcionar em qualquer rede
const getApiUrl = () => {
  const hostname = window.location.hostname;
  // Se estiver acessando por IP, usa o mesmo IP para o backend
  // Senão, usa localhost
  return hostname === 'localhost' || hostname === '127.0.0.1' 
    ? 'http://localhost:3001/api'
    : `http://${hostname}:3001/api`;
};

const API_URL = getApiUrl();

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

  // ===== EXPORTAR =====

  async exportarDados() {
    const response = await fetchAPI<{
      indicadores: Indicador[];
      leads: Lead[];
      total: {
        indicadores: number;
        leads: number;
      };
    }>('/exportar');

    return response;
  },

  // Download de CSV individual
  downloadCSV(tipo: 'indicadores' | 'leads') {
    window.open(`${API_URL}/download/${tipo}`, '_blank');
  },

  // ===== HEALTH CHECK =====

  async checkHealth(): Promise<{ status: string; message: string }> {
    return fetchAPI<{ status: string; message: string }>('/health');
  },
};
