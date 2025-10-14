import fs from 'fs/promises';
import path from 'path';

// Para produção (Vercel), use /tmp para armazenamento temporário
const DATA_DIR = '/tmp/data';

// Garante que o diretório existe
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.log('Diretório já existe ou erro ao criar:', error.message);
  }
}

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

// Handler principal para Vercel
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Garantir que o diretório de dados existe
  await ensureDataDir();

  const { url: requestUrl, method } = req;
  const url = new URL(requestUrl, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // Rota de teste
    if (pathname === '/api/test' && method === 'GET') {
      return res.json({ message: 'API funcionando!', timestamp: new Date().toISOString() });
    }

    // ===== ROTAS PARA INDICADORES =====
    
    if (pathname === '/api/indicadores' && method === 'GET') {
      const indicadores = await readCSV(FILES.INDICADORES);
      return res.json(indicadores);
    }

    if (pathname.match(/^\/api\/indicadores\/[^/]+$/) && method === 'GET') {
      const id = pathname.split('/')[3];
      const indicadores = await readCSV(FILES.INDICADORES);
      const indicador = indicadores.find(i => i.id === id);
      
      if (!indicador) {
        return res.status(404).json({ error: 'Indicador não encontrado' });
      }
      
      return res.json(indicador);
    }

    if (pathname === '/api/indicadores' && method === 'POST') {
      const body = req.body || JSON.parse(await getBody(req));
      const { nome, cpf, telefone, email } = body;
      
      if (!nome || !cpf || !telefone || !email) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }
      
      const indicadores = await readCSV(FILES.INDICADORES);
      
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
      
      return res.status(201).json(novoIndicador);
    }

    // ===== ROTAS PARA LEADS =====

    if (pathname === '/api/leads' && method === 'GET') {
      const leads = await readCSV(FILES.LEADS);
      return res.json(leads);
    }

    if (pathname.match(/^\/api\/leads\/indicador\/[^/]+$/) && method === 'GET') {
      const idIndicador = pathname.split('/')[4];
      const leads = await readCSV(FILES.LEADS);
      const leadsDoIndicador = leads.filter(lead => lead.idIndicador === idIndicador);
      return res.json(leadsDoIndicador);
    }

    if (pathname.match(/^\/api\/leads\/[^/]+$/) && method === 'GET') {
      const id = pathname.split('/')[3];
      const leads = await readCSV(FILES.LEADS);
      const lead = leads.find(l => l.id === id);
      
      if (!lead) {
        return res.status(404).json({ error: 'Lead não encontrado' });
      }
      
      return res.json(lead);
    }

    if (pathname === '/api/leads' && method === 'POST') {
      const body = req.body || JSON.parse(await getBody(req));
      const { codigoIndicacao, nome, cpf, telefone, email, valor } = body;
      
      if (!codigoIndicacao || !nome || !cpf || !telefone || !email || !valor) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }
      
      const indicadores = await readCSV(FILES.INDICADORES);
      const indicador = indicadores.find(i => i.codigoIndicacao === codigoIndicacao);
      
      if (!indicador) {
        return res.status(404).json({ error: 'Código de indicação inválido' });
      }
      
      const leads = await readCSV(FILES.LEADS);
      
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
      
      return res.status(201).json(novoLead);
    }

    if (pathname.match(/^\/api\/leads\/[^/]+\/status$/) && method === 'PUT') {
      const id = pathname.split('/')[3];
      const body = req.body || JSON.parse(await getBody(req));
      const { status } = body;
      
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
      
      return res.json(leads[leadIndex]);
    }

    // ===== ROTA PARA ESTATÍSTICAS =====

    if (pathname === '/api/stats' && method === 'GET') {
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
      
      return res.json(stats);
    }

    // Rota não encontrada
    return res.status(404).json({ error: 'Rota não encontrada' });

  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função auxiliar para ler o body da requisição
function getBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}