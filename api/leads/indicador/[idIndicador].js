import fs from 'fs/promises';
import path from 'path';

// Para produção (Vercel), use /tmp para armazenamento temporário
const DATA_DIR = '/tmp/data';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Extrai o idIndicador da URL: /api/leads/indicador/[idIndicador]
    const { query } = req;
    const idIndicador = query.idIndicador;
    
    if (!idIndicador) {
      return res.status(400).json({ error: 'ID do indicador é obrigatório' });
    }

    const leadsPath = path.join(DATA_DIR, 'leads.csv');
    const leads = await readCSV(leadsPath);
    const leadsDoIndicador = leads.filter(lead => lead.idIndicador === idIndicador);
    
    return res.json(leadsDoIndicador);

  } catch (error) {
    console.error('Erro na API leads/indicador:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}