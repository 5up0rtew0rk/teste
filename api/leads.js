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

  await ensureDataDir();
  const leadsPath = path.join(DATA_DIR, 'leads.csv');
  const indicadoresPath = path.join(DATA_DIR, 'indicadores.csv');

  try {
    if (req.method === 'GET') {
      const leads = await readCSV(leadsPath);
      return res.json(leads);
    }

    if (req.method === 'POST') {
      const body = req.body || JSON.parse(await getBody(req));
      
      // Verifica se é um array de leads (formato em lote) ou um lead individual
      if (body.id_indicador && body.leads && Array.isArray(body.leads)) {
        // Formato em lote: { id_indicador, leads: [...] }
        const { id_indicador, leads: leadsData } = body;
        
        const indicadores = await readCSV(indicadoresPath);
        const indicador = indicadores.find(i => i.id === id_indicador);
        
        if (!indicador) {
          return res.status(404).json({ error: 'Indicador não encontrado' });
        }
        
        const leads = await readCSV(leadsPath);
        const novosLeads = [];
        
        for (const leadData of leadsData) {
          const { nome, cpf, telefone, email, valor } = leadData;
          
          if (!nome || !cpf || !telefone || !email || !valor) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios para cada lead' });
          }
          
          // Verifica se já existe lead com o mesmo CPF
          const leadExistente = leads.find(l => l.cpf === cpf);
          if (leadExistente) {
            return res.status(409).json({ error: `Já existe um lead cadastrado com o CPF ${cpf}` });
          }
          
          const novoLead = {
            id: generateId(),
            idIndicador: id_indicador,
            codigoIndicacao: indicador.codigoIndicacao,
            nome,
            cpf,
            telefone,
            email,
            valor: parseFloat(valor).toFixed(2),
            dataGeracao: new Date().toISOString().split('T')[0],
            status: 'PENDENTE'
          };
          
          leads.push(novoLead);
          novosLeads.push(novoLead);
        }
        
        const headers = ['id', 'idIndicador', 'codigoIndicacao', 'nome', 'cpf', 'telefone', 'email', 'valor', 'dataGeracao', 'status'];
        await writeCSV(leadsPath, leads, headers);
        
        return res.status(201).json(novosLeads);
      } else {
        // Formato individual: { codigoIndicacao, nome, cpf, telefone, email, valor }
        const { codigoIndicacao, nome, cpf, telefone, email, valor } = body;
        
        if (!codigoIndicacao || !nome || !cpf || !telefone || !email || !valor) {
          return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        
        const indicadores = await readCSV(indicadoresPath);
        const indicador = indicadores.find(i => i.codigoIndicacao === codigoIndicacao);
        
        if (!indicador) {
          return res.status(404).json({ error: 'Código de indicação inválido' });
        }
        
        const leads = await readCSV(leadsPath);
        
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
        await writeCSV(leadsPath, leads, headers);
        
        return res.status(201).json(novoLead);
      }
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('Erro na API leads:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}