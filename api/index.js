import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://*.vercel.app', 'https://*.vercel.com'],
  credentials: true
}));
app.use(express.json());

// Para desenvolvimento local, use o diretório server/data
// Para produção (Vercel), use /tmp para armazenamento temporário
const DATA_DIR = process.env.NODE_ENV === 'production' 
  ? '/tmp/data' 
  : path.join(__dirname, '../server/data');

// Garante que o diretório existe
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.log('Diretório já existe ou erro ao criar:', error.message);
  }
}

await ensureDataDir();

// Caminhos dos arquivos CSV
const FILES = {
  INDICADORES: path.join(DATA_DIR, 'indicadores.csv'),
  LEADS: path.join(DATA_DIR, 'leads.csv'),
};

// Função auxiliar para ler CSV
async function readCSV(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    if (!data.trim()) return [];
    
    const lines = data.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
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
    await fs.writeFile(filePath, headers.join(',') + '\n', 'utf8');
    return;
  }
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n') + '\n';
  
  await fs.writeFile(filePath, csvContent, 'utf8');
}

// Função para gerar IDs únicos
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ===== ROTAS PARA INDICADORES =====

// GET /api/indicadores - Listar todos os indicadores
app.get('/api/indicadores', async (req, res) => {
  try {
    const indicadores = await readCSV(FILES.INDICADORES);
    res.json(indicadores);
  } catch (error) {
    console.error('Erro ao buscar indicadores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/indicadores/:id - Buscar um indicador por ID
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
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/indicadores - Criar um novo indicador
app.post('/api/indicadores', async (req, res) => {
  try {
    const { nome, cpf, telefone, email } = req.body;
    
    // Validação básica
    if (!nome || !cpf || !telefone || !email) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    const indicadores = await readCSV(FILES.INDICADORES);
    
    // Verifica se já existe indicador com o mesmo CPF
    const indicadorExistente = indicadores.find(i => i.cpf === cpf);
    if (indicadorExistente) {
      return res.status(409).json({ error: 'Já existe um indicador cadastrado com este CPF' });
    }
    
    const novoIndicador = {
      id: generateId(),
      nome,
      cpf,
      telefone,
      email,
      dataGeracao: new Date().toISOString().split('T')[0],
      codigoIndicacao: Math.random().toString(36).substr(2, 8).toUpperCase()
    };
    
    indicadores.push(novoIndicador);
    
    const headers = ['id', 'nome', 'cpf', 'telefone', 'email', 'dataGeracao', 'codigoIndicacao'];
    await writeCSV(FILES.INDICADORES, indicadores, headers);
    
    res.status(201).json(novoIndicador);
  } catch (error) {
    console.error('Erro ao criar indicador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS PARA LEADS =====

// GET /api/leads - Listar todos os leads
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await readCSV(FILES.LEADS);
    res.json(leads);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/leads/indicador/:idIndicador - Buscar leads de um indicador específico
app.get('/api/leads/indicador/:idIndicador', async (req, res) => {
  try {
    const { idIndicador } = req.params;
    const leads = await readCSV(FILES.LEADS);
    const leadsDoIndicador = leads.filter(lead => lead.idIndicador === idIndicador);
    res.json(leadsDoIndicador);
  } catch (error) {
    console.error('Erro ao buscar leads do indicador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/leads/:id - Buscar um lead por ID
app.get('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leads = await readCSV(FILES.LEADS);
    const lead = leads.find(l => l.id === id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    res.json(lead);
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/leads - Criar um novo lead
app.post('/api/leads', async (req, res) => {
  try {
    const { codigoIndicacao, nome, cpf, telefone, email, valor } = req.body;
    
    // Validação básica
    if (!codigoIndicacao || !nome || !cpf || !telefone || !email || !valor) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    // Busca o indicador pelo código
    const indicadores = await readCSV(FILES.INDICADORES);
    const indicador = indicadores.find(i => i.codigoIndicacao === codigoIndicacao);
    
    if (!indicador) {
      return res.status(404).json({ error: 'Código de indicação inválido' });
    }
    
    const leads = await readCSV(FILES.LEADS);
    
    // Verifica se já existe lead com o mesmo CPF
    const leadExistente = leads.find(l => l.cpf === cpf);
    if (leadExistente) {
      return res.status(409).json({ error: 'Já existe um lead cadastrado com este CPF' });
    }
    
    const novoLead = {
      id: generateId(),
      idIndicador: indicador.id,
      codigoIndicacao,
      nome,
      cpf,
      telefone,
      email,
      valor: parseFloat(valor).toFixed(2),
      dataGeracao: new Date().toISOString().split('T')[0],
      status: 'PENDENTE'
    };
    
    leads.push(novoLead);
    
    const headers = ['id', 'idIndicador', 'codigoIndicacao', 'nome', 'cpf', 'telefone', 'email', 'valor', 'dataGeracao', 'status'];
    await writeCSV(FILES.LEADS, leads, headers);
    
    res.status(201).json(novoLead);
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/leads/:id/status - Atualizar status de um lead
app.put('/api/leads/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const statusValidos = ['PENDENTE', 'EM_ANALISE', 'APROVADO', 'REJEITADO'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const leads = await readCSV(FILES.LEADS);
    const leadIndex = leads.findIndex(l => l.id === id);
    
    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    leads[leadIndex].status = status;
    
    const headers = ['id', 'idIndicador', 'codigoIndicacao', 'nome', 'cpf', 'telefone', 'email', 'valor', 'dataGeracao', 'status'];
    await writeCSV(FILES.LEADS, leads, headers);
    
    res.json(leads[leadIndex]);
  } catch (error) {
    console.error('Erro ao atualizar status do lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTA PARA ESTATÍSTICAS =====

// GET /api/stats - Obter estatísticas gerais
app.get('/api/stats', async (req, res) => {
  try {
    const indicadores = await readCSV(FILES.INDICADORES);
    const leads = await readCSV(FILES.LEADS);
    
    const stats = {
      totalIndicadores: indicadores.length,
      totalLeads: leads.length,
      leadsAprovados: leads.filter(l => l.status === 'APROVADO').length,
      leadsPendentes: leads.filter(l => l.status === 'PENDENTE').length,
      valorTotalLeads: leads.reduce((total, lead) => total + parseFloat(lead.valor || 0), 0),
      valorLeadsAprovados: leads
        .filter(l => l.status === 'APROVADO')
        .reduce((total, lead) => total + parseFloat(lead.valor || 0), 0)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando!', timestamp: new Date().toISOString() });
});

// Para Vercel, exportamos o app como handler padrão
export default app;