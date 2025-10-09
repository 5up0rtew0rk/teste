import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Diretório para armazenar os CSVs
const DATA_DIR = path.join(__dirname, 'data');

// Garante que o diretório existe
await fs.mkdir(DATA_DIR, { recursive: true });

// Caminhos dos arquivos CSV
const FILES = {
  INDICADORES: path.join(DATA_DIR, 'indicadores.csv'),
  LEADS: path.join(DATA_DIR, 'leads.csv'),
  PREMIOS: path.join(DATA_DIR, 'premios.csv'),
};

// Função auxiliar para ler CSV
async function readCSV(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    
    if (lines.length === 0 || !lines[0]) return [];
    
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
      });
      
      data.push(obj);
    }
    
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Função auxiliar para escrever CSV
async function writeCSV(filePath, data, headers) {
  if (data.length === 0) {
    await fs.writeFile(filePath, headers.join(',') + '\n', 'utf-8');
    return;
  }
  
  const lines = [headers.join(',')];
  
  data.forEach(item => {
    const values = headers.map(header => {
      const value = item[header] || '';
      // Escapa vírgulas e aspas
      if (value.toString().includes(',') || value.toString().includes('"')) {
        return `"${value.toString().replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(values.join(','));
  });
  
  await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
}

// Função para gerar UUID simples
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== ROTAS =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend CSV está rodando' });
});

// ===== INDICADORES =====

// Listar todos os indicadores
app.get('/api/indicadores', async (req, res) => {
  try {
    const indicadores = await readCSV(FILES.INDICADORES);
    res.json(indicadores);
  } catch (error) {
    console.error('Erro ao ler indicadores:', error);
    res.status(500).json({ error: 'Erro ao ler indicadores' });
  }
});

// Buscar indicador por ID
app.get('/api/indicadores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const indicadores = await readCSV(FILES.INDICADORES);
    const indicador = indicadores.find(i => i.id === id);
    
    if (!indicador) {
      return res.status(404).json({ error: 'Indicador não encontrado' });
    }
    
    res.json(indicador);
  } catch (error) {
    console.error('Erro ao buscar indicador:', error);
    res.status(500).json({ error: 'Erro ao buscar indicador' });
  }
});

// Criar novo indicador
app.post('/api/indicadores', async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;
    
    // Validação básica
    if (!nome || !email || !telefone) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    const indicadores = await readCSV(FILES.INDICADORES);
    
    // Verifica se email já existe
    if (indicadores.some(i => i.email === email)) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }
    
    
    const novoIndicador = {
      id: generateId(),
      nome,
      email,
      telefone,
      data_cadastro: new Date().toISOString(),
    };
    
    indicadores.push(novoIndicador);
    
    await writeCSV(FILES.INDICADORES, indicadores, [
      'id', 'nome', 'email', 'telefone', 'data_cadastro'
    ]);
    
    res.status(201).json(novoIndicador);
  } catch (error) {
    console.error('Erro ao criar indicador:', error);
    res.status(500).json({ error: 'Erro ao criar indicador' });
  }
});

// ===== LEADS =====

// Listar todos os leads
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await readCSV(FILES.LEADS);
    res.json(leads);
  } catch (error) {
    console.error('Erro ao ler leads:', error);
    res.status(500).json({ error: 'Erro ao ler leads' });
  }
});

// Listar leads de um indicador
app.get('/api/leads/indicador/:idIndicador', async (req, res) => {
  try {
    const { idIndicador } = req.params;
    const leads = await readCSV(FILES.LEADS);
    const leadsDoIndicador = leads.filter(l => l.id_indicador === idIndicador);
    res.json(leadsDoIndicador);
  } catch (error) {
    console.error('Erro ao ler leads:', error);
    res.status(500).json({ error: 'Erro ao ler leads' });
  }
});

// Criar novos leads
app.post('/api/leads', async (req, res) => {
  try {
    const { id_indicador, leads: leadsData } = req.body;
    
    if (!id_indicador || !Array.isArray(leadsData) || leadsData.length === 0) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    
    // Verifica se o indicador existe
    const indicadores = await readCSV(FILES.INDICADORES);
    if (!indicadores.some(i => i.id === id_indicador)) {
      return res.status(404).json({ error: 'Indicador não encontrado' });
    }
    
    const todosLeads = await readCSV(FILES.LEADS);
    
    const novosLeads = leadsData.map(lead => ({
      id: generateId(),
      id_indicador,
      nome: lead.nome,
      email: lead.email,
      telefone: lead.telefone,
      data_cadastro: new Date().toISOString(),
    }));
    
    todosLeads.push(...novosLeads);
    
    await writeCSV(FILES.LEADS, todosLeads, [
      'id', 'id_indicador', 'nome', 'email', 'telefone', 'data_cadastro'
    ]);
    
    res.status(201).json(novosLeads);
  } catch (error) {
    console.error('Erro ao criar leads:', error);
    res.status(500).json({ error: 'Erro ao criar leads' });
  }
});

// ===== PRÊMIOS =====

// Listar todos os prêmios
app.get('/api/premios', async (req, res) => {
  try {
    const premios = await readCSV(FILES.PREMIOS);
    res.json(premios);
  } catch (error) {
    console.error('Erro ao ler prêmios:', error);
    res.status(500).json({ error: 'Erro ao ler prêmios' });
  }
});

// Buscar prêmio de um indicador
app.get('/api/premios/indicador/:idIndicador', async (req, res) => {
  try {
    const { idIndicador } = req.params;
    const premios = await readCSV(FILES.PREMIOS);
    const premiosDoIndicador = premios.filter(p => p.id_indicador === idIndicador);
    
    if (premiosDoIndicador.length === 0) {
      return res.status(404).json({ error: 'Nenhum prêmio encontrado' });
    }
    
    const premioMaisRecente = premiosDoIndicador.sort((a, b) =>
      new Date(b.data_premiacao).getTime() - new Date(a.data_premiacao).getTime()
    )[0];
    
    res.json(premioMaisRecente);
  } catch (error) {
    console.error('Erro ao ler prêmios do indicador:', error);
    res.status(500).json({ error: 'Erro ao ler prêmios' });
  }
});

// Registrar prêmio
app.post('/api/premios', async (req, res) => {
  try {
    const { id_indicador, premio_descricao, premio_index } = req.body;
    
    if (!id_indicador || !premio_descricao || premio_index === undefined) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    
    // Verifica se o indicador existe
    const indicadores = await readCSV(FILES.INDICADORES);
    if (!indicadores.some(i => i.id === id_indicador)) {
      return res.status(404).json({ error: 'Indicador não encontrado' });
    }
    
    const premios = await readCSV(FILES.PREMIOS);
    
    const novoPremio = {
      id: generateId(),
      id_indicador,
      premio_descricao,
      premio_index: premio_index.toString(),
      data_premiacao: new Date().toISOString(),
    };
    
    premios.push(novoPremio);
    
    await writeCSV(FILES.PREMIOS, premios, [
      'id', 'id_indicador', 'premio_descricao', 'premio_index', 'data_premiacao'
    ]);
    
    res.status(201).json(novoPremio);
  } catch (error) {
    console.error('Erro ao criar prêmio:', error);
    res.status(500).json({ error: 'Erro ao criar prêmio' });
  }
});

// ===== EXPORTAR =====

// Exportar todos os dados
app.get('/api/exportar', async (req, res) => {
  try {
    const indicadores = await readCSV(FILES.INDICADORES);
    const leads = await readCSV(FILES.LEADS);
    const premios = await readCSV(FILES.PREMIOS);
    
    res.json({
      indicadores,
      leads,
      premios,
      total: {
        indicadores: indicadores.length,
        leads: leads.length,
        premios: premios.length,
      }
    });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

// Download CSV individual
app.get('/api/download/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    
    let filePath;
    let filename;
    
    switch (tipo) {
      case 'indicadores':
        filePath = FILES.INDICADORES;
        filename = 'indicadores.csv';
        break;
      case 'leads':
        filePath = FILES.LEADS;
        filename = 'leads.csv';
        break;
      case 'premios':
        filePath = FILES.PREMIOS;
        filename = 'premios.csv';
        break;
      default:
        return res.status(400).json({ error: 'Tipo inválido' });
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    console.error('Erro ao baixar CSV:', error);
    res.status(500).json({ error: 'Erro ao baixar CSV' });
  }
});

// ===== INICIAR SERVIDOR =====

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
  console.log(`🌐 Frontend disponível em http://localhost:5173`);
  console.log(`📁 Dados salvos em: ${DATA_DIR}`);
});
