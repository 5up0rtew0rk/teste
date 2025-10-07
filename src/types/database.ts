export interface Indicador {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_cadastro: string;
}

export interface Lead {
  id: string;
  id_indicador: string;
  nome: string;
  email: string;
  telefone: string;
  data_cadastro: string;
}

export interface PremioGanho {
  id: string;
  id_indicador: string;
  premio_descricao: string;
  premio_index: number;
  data_premiacao: string;
}

export interface CreateIndicadorDTO {
  nome: string;
  email: string;
  telefone: string;
}

export interface CreateLeadDTO {
  nome: string;
  email: string;
  telefone: string;
}

export interface Premio {
  descricao: string;
  cor: string;
}
