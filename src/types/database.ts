export interface Indicador {
  id: string;
  nome: string;
  telefone: string;
  cargo: string;
  data_cadastro: string;
}

export interface Lead {
  id: string;
  id_indicador: string;
  nome: string;
  telefone: string;
  data_cadastro: string;
}

export interface CreateIndicadorDTO {
  nome: string;
  telefone: string;
  cargo: string;
}

export interface CreateLeadDTO {
  nome: string;
  telefone: string;
}

export interface Premio {
  descricao: string;
  cor: string;
}
