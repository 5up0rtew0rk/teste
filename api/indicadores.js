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
  const indicadoresPath = path.join(DATA_DIR, 'indicadores.csv');

  try {
    if (req.method === 'GET') {
      const indicadores = await readCSV(indicadoresPath);
      return res.json(indicadores);
    }

    if (req.method === 'POST') {
      const body = req.body || JSON.parse(await getBody(req));
      const { nome, cpf, telefone, email } = body;
      
      if (!nome || !cpf || !telefone || !email) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }
      
      const indicadores = await readCSV(indicadoresPath);
      
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
      await writeCSV(indicadoresPath, indicadores, headers);
      
      return res.status(201).json(novoIndicador);
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('Erro na API indicadores:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}