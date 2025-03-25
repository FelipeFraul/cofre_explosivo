const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Permitir que a porta seja especificada como argumento da linha de comando
const PORT = process.argv[2] ? parseInt(process.argv[2]) : 3002;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// Armazenamento de tokens válidos (em memória - em produção seria melhor usar um banco de dados)
let validTokens = [
  // Token padrão para administrador
  { token: '1234', label: 'admin', createdAt: new Date().toISOString(), lastUsed: null }
];

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Normalize URL by removing query parameters and making sure it starts with '/'
  let url = req.url.split('?')[0];
  if (!url.startsWith('/')) url = '/' + url;
  
  // API para gerenciar tokens
  if (url === '/api/tokens') {
    handleTokensAPI(req, res);
    return;
  }
  
  // Se URL ends with '/', serve index.html
  if (url.endsWith('/')) url += 'index.html';
  
  // Get the file path
  const filePath = path.join(__dirname, url);
  
  // Get the file extension
  const extname = path.extname(filePath).toLowerCase();
  
  // Get the MIME type
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        console.error(`File not found: ${filePath}`);
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
          if (err) {
            // Can't even serve index.html
            res.writeHead(500);
            res.end('Error: Cannot serve index.html');
          } else {
            // Serve index.html instead
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        // Server error
        console.error(`Server error: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

/**
 * Manipula as requisições para a API de tokens
 * @param {http.IncomingMessage} req - Requisição HTTP
 * @param {http.ServerResponse} res - Resposta HTTP
 */
function handleTokensAPI(req, res) {
  // Configurar cabeçalhos CORS e tipo de conteúdo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  // Lidar com requisições OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Verificar autenticação para todas as operações exceto validação de token
  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
  const action = urlParams.get('action');
  
  if (action !== 'validate' && !isAdminAuthenticated(req)) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: 'Não autorizado' }));
    return;
  }
  
  // Processar a requisição com base no método HTTP e ação
  if (req.method === 'GET') {
    if (action === 'list') {
      // Listar todos os tokens
      res.writeHead(200);
      res.end(JSON.stringify(validTokens));
    } else if (action === 'validate') {
      // Validar um token
      const token = urlParams.get('token');
      const isValid = validateToken(token);
      res.writeHead(200);
      res.end(JSON.stringify({ valid: isValid }));
    } else if (action === 'create') {
      // Criar um novo token
      const label = urlParams.get('label') || 'convidado';
      const newToken = generateToken(label);
      res.writeHead(200);
      res.end(JSON.stringify(newToken));
    } else {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Ação inválida' }));
    }
  } else if (req.method === 'DELETE') {
    // Revogar um token
    const token = urlParams.get('token');
    const success = revokeToken(token);
    res.writeHead(success ? 200 : 404);
    res.end(JSON.stringify({ success }));
  } else {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Método não permitido' }));
  }
}

/**
 * Verifica se a requisição é autenticada como administrador
 * @param {http.IncomingMessage} req - Requisição HTTP
 * @returns {boolean} - Verdadeiro se autenticado como administrador
 */
function isAdminAuthenticated(req) {
  // Verificar cabeçalho de autorização
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  // Extrair e verificar o token
  const token = authHeader.split(' ')[1];
  return token === '1234'; // Token fixo para o administrador
}

/**
 * Gera um novo token de acesso
 * @param {string} label - Rótulo para identificar o token
 * @returns {Object} - Objeto contendo o token e informações relacionadas
 */
function generateToken(label = 'convidado') {
  // Gera um token numérico de 4 dígitos
  const token = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Verifica se o token já existe
  if (validTokens.some(t => t.token === token)) {
    // Se já existir, gera outro recursivamente
    return generateToken(label);
  }
  
  // Cria um objeto com informações do token
  const tokenObj = {
    token: token,
    label: label,
    createdAt: new Date().toISOString(),
    lastUsed: null
  };
  
  // Adiciona o token à lista de tokens válidos
  validTokens.push(tokenObj);
  
  return tokenObj;
}

/**
 * Verifica se um token é válido
 * @param {string} token - Token a ser verificado
 * @returns {boolean} - Verdadeiro se o token for válido
 */
function validateToken(token) {
  const tokenObj = validTokens.find(t => t.token === token);
  
  if (tokenObj) {
    // Atualiza a data de último uso
    tokenObj.lastUsed = new Date().toISOString();
    return true;
  }
  
  return false;
}

/**
 * Revoga um token específico
 * @param {string} token - Token a ser revogado
 * @returns {boolean} - Verdadeiro se o token foi revogado com sucesso
 */
function revokeToken(token) {
  const initialLength = validTokens.length;
  validTokens = validTokens.filter(t => t.token !== token);
  return validTokens.length < initialLength;
}

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
