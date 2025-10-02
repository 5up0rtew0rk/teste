import { csvStorage } from './csvStorage';
import type { CreateIndicadorDTO, CreateLeadDTO, Indicador, Lead, Premio } from '../types/database';

const PREMIOS: Premio[] = [
  { descricao: '10% de Comissão Extra', cor: '#FFD700' },
  { descricao: 'R$ 50 em Vale-Compras', cor: '#FF6B6B' },
  { descricao: 'Consultoria Grátis', cor: '#4ECDC4' },
  { descricao: 'Brinde Exclusivo', cor: '#95E1D3' },
  { descricao: 'R$ 100 em Desconto', cor: '#F38181' },
  { descricao: 'Kit Premium', cor: '#AA96DA' },
  { descricao: '15% de Comissão Extra', cor: '#FCBAD3' },
  { descricao: 'Acesso VIP 3 Meses', cor: '#A8E6CF' },
];

export const api = {
  async criarIndicador(data: CreateIndicadorDTO): Promise<Indicador> {
    try {
      return csvStorage.salvarIndicador(data);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao cadastrar indicador');
    }
  },

  async criarLeads(idIndicador: string, leads: CreateLeadDTO[]): Promise<Lead[]> {
    try {
      return csvStorage.salvarLeads(idIndicador, leads);
    } catch (error) {
      throw new Error('Erro ao cadastrar leads');
    }
  },

  async girarRoleta(idIndicador: string): Promise<{ premio: Premio; index: number }> {
    const premioIndex = Math.floor(Math.random() * PREMIOS.length);
    const premio = PREMIOS[premioIndex];

    try {
      csvStorage.salvarPremio({
        id_indicador: idIndicador,
        premio_descricao: premio.descricao,
        premio_index: premioIndex,
      });

      return { premio, index: premioIndex };
    } catch (error) {
      throw new Error('Erro ao registrar prêmio');
    }
  },

  async buscarIndicador(id: string): Promise<Indicador | null> {
    return csvStorage.buscarIndicador(id);
  },

  getPremios(): Premio[] {
    return PREMIOS;
  },

  exportarDados() {
    csvStorage.exportarCSV();
  },
};
