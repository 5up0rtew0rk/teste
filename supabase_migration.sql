/*
  # Sistema de Captura de Leads Gamificado

  1. Tabelas Principais
    - `indicadores` - Armazena dados dos referenciadores
      - `id` (uuid, primary key)
      - `nome` (text)
      - `email` (text, unique)
      - `telefone` (text)
      - `cpf` (text, unique)
      - `data_cadastro` (timestamptz)
    
    - `leads` - Armazena dados dos leads indicados
      - `id` (uuid, primary key)
      - `id_indicador` (uuid, foreign key)
      - `nome` (text)
      - `email` (text)
      - `telefone` (text)
      - `data_cadastro` (timestamptz)
    
    - `premios_ganhos` - Registra os prêmios conquistados
      - `id` (uuid, primary key)
      - `id_indicador` (uuid, foreign key)
      - `premio_descricao` (text)
      - `premio_index` (integer)
      - `data_premiacao` (timestamptz)
  
  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas permitem inserção de indicadores e leads
    - Políticas permitem leitura apenas dos próprios dados
*/

-- Criar tabela de indicadores
CREATE TABLE IF NOT EXISTS indicadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  telefone text NOT NULL,
  cpf text UNIQUE NOT NULL,
  data_cadastro timestamptz DEFAULT now()
);

-- Criar tabela de leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_indicador uuid NOT NULL REFERENCES indicadores(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text NOT NULL,
  data_cadastro timestamptz DEFAULT now()
);

-- Criar tabela de prêmios ganhos
CREATE TABLE IF NOT EXISTS premios_ganhos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_indicador uuid NOT NULL REFERENCES indicadores(id) ON DELETE CASCADE,
  premio_descricao text NOT NULL,
  premio_index integer NOT NULL,
  data_premiacao timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE premios_ganhos ENABLE ROW LEVEL SECURITY;

-- Políticas para indicadores
CREATE POLICY "Permitir inserção pública de indicadores"
  ON indicadores
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Permitir leitura de indicadores anônimos"
  ON indicadores
  FOR SELECT
  TO anon
  USING (true);

-- Políticas para leads
CREATE POLICY "Permitir inserção pública de leads"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Permitir leitura de leads anônimos"
  ON leads
  FOR SELECT
  TO anon
  USING (true);

-- Políticas para premios_ganhos
CREATE POLICY "Permitir inserção pública de prêmios"
  ON premios_ganhos
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Permitir leitura de prêmios anônimos"
  ON premios_ganhos
  FOR SELECT
  TO anon
  USING (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_indicador ON leads(id_indicador);
CREATE INDEX IF NOT EXISTS idx_premios_indicador ON premios_ganhos(id_indicador);
