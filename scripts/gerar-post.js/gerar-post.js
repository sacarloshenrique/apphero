const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Inicializa a IA com a chave de API do ambiente
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Erro: A variável de ambiente GEMINI_API_KEY não está definida.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function gerarPost() {
  console.log("Iniciando a geração do artigo de blog...");

  try {
    // Utiliza o modelo especificado
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = "Gere um artigo de blog com 600 palavras sobre produtividade, TDAH e gamificação. O retorno deve ser SOMENTE código HTML válido, utilizando tags <h2>, <h3>, <p> e listas. Não inclua as tags <html>, <head> ou <body>. NUNCA envolva a resposta em blocos de código Markdown (como ```html), retorne apenas a string limpa.";

    console.log("Enviando prompt para o modelo...");

    // Gera o conteúdo via API
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("Conteúdo gerado com sucesso! Preparando para salvar...");

    // Gera o nome do arquivo com base no timestamp (em segundos)
    const timestamp = Math.floor(Date.now() / 1000);
    const fileName = `artigo-${timestamp}.html`;

    // Define os caminhos dos diretórios
    const rootDir = path.join(__dirname, '..');
    const blogDir = path.join(rootDir, 'blog');

    // Garante que o diretório blog/ exista
    if (!fs.existsSync(blogDir)) {
      console.log("Diretório blog/ não encontrado. Criando diretório na raiz do projeto...");
      fs.mkdirSync(blogDir, { recursive: true });
    }

    const filePath = path.join(blogDir, fileName);

    // Salva o arquivo em disco
    fs.writeFileSync(filePath, text, 'utf8');

    console.log(`Sucesso! O artigo foi criado e salvo em: ${filePath}`);

  } catch (error) {
    console.error("Falha na geração ou gravação do artigo de blog. Erro encontrado:", error);
  }
}

gerarPost();
