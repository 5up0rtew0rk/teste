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
    return res.json({ 
      status: 'OK', 
      message: 'API está funcionando corretamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na API health:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}