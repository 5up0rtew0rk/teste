import { supabase } from '../lib/supabase';
import type { CreateIndicadorDTO, CreateLeadDTO, Indicador, Lead, PremioGanho, Premio } from '../types/database';

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
    const { data: indicador, error } = await supabase
      .from('indicadores')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return indicador;
  },

  async criarLeads(idIndicador: string, leads: CreateLeadDTO[]): Promise<Lead[]> {
    const leadsComIndicador = leads.map(lead => ({
      ...lead,
      id_indicador: idIndicador,
    }));

    const { data, error } = await supabase
      .from('leads')
      .insert(leadsComIndicador)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async girarRoleta(idIndicador: string): Promise<{ premio: Premio; index: number }> {
    const premioIndex = Math.floor(Math.random() * PREMIOS.length);
    const premio = PREMIOS[premioIndex];

    const { error } = await supabase
      .from('premios_ganhos')
      .insert([{
        id_indicador: idIndicador,
        premio_descricao: premio.descricao,
        premio_index: premioIndex,
      }]);

    if (error) {
      throw new Error(error.message);
    }

    return { premio, index: premioIndex };
  },

  async buscarIndicador(id: string): Promise<Indicador | null> {
    const { data, error } = await supabase
      .from('indicadores')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async buscarPremio(idIndicador: string): Promise<PremioGanho | null> {
    const { data, error } = await supabase
      .from('premios_ganhos')
      .select()
      .eq('id_indicador', idIndicador)
      .order('data_premiacao', { ascending: false })
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  getPremios(): Premio[] {
    return PREMIOS;
  },
};
