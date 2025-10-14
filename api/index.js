// Função serverless simples para Vercel
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

  const { url: requestUrl, method } = req;
  console.log(`[API] ${method} ${requestUrl}`); // Debug log

  try {
    // Rota de teste básica
    return res.json({ 
      message: 'API funcionando!', 
      method,
      url: requestUrl,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}