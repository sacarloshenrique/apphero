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

// --- TEMPLATE MESTRE ---
// Essa é a "fôrma de bolo" com o estilo do teu site.
function generateFullHtml(content, title) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Blog do Herói - RotinaHero</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <div class="container">
        <nav style="padding: 20px 0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee;">
            <div class="logo" style="color: #4C1D95; font-weight: 800; font-size: 1.5rem; text-decoration: none;">
                <i class="ph-fill ph-lightning" style="color: var(--dourado);"></i> RotinaHero
            </div>
            <div class="nav-links" style="display: flex; gap: 20px;">
                <a href="/index.html" style="text-decoration: none; color: #666;">Home</a>
                <a href="/blog.html" style="text-decoration: none; color: #4C1D95; font-weight: bold;">Blog</a>
                <a href="/index.html#planos" style="text-decoration: none; color: #666;">Planos</a>
            </div>
        </nav>

        <article class="article-detail" style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
            ${content}
        </article>
        
        <footer style="margin-top: 60px; padding: 40px 0; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 0.9rem; color: #666;">
            <div>&copy; 2026 AppHero. Vencendo a procrastinação.</div>
            <div class="footer-links" style="display: flex; gap: 15px;">
                <a href="/index.html" style="text-decoration: none; color: #666;">Home</a>
                <a href="/sobre.html" style="text-decoration: none; color: #666;">Sobre</a>
                <a href="mailto:suporte@apphero.com.br" style="text-decoration: none; color: #666;">Suporte</a>
            </div>
        </footer>
    </div>
</body>
</html>`;
}
// --- FIM DO TEMPLATE MESTRE ---

async function gerarPost() {
    console.log("Iniciando a geração do artigo de blog...");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Prompt AJUSTADO para receber Título e Conteúdo HTML limpo
        const prompt = `Gere um artigo de blog com 600 palavras sobre produtividade, TDAH e gamificação no ecossistema de apps. 
        Retorne o resultado EXATAMENTE neste formato JSON puro (sem marcação markdown json):
        {
            "titulo": "Título curto e chamativo do artigo aqui",
            "conteudo_html": "AQUI VAI SOMENTE O CÓDIGO HTML DO ARTIGO (com tags <h2>, <h3>, <p>, <ul>, <li>). Sem tags <html>, <head> ou <body>."
        }`;

        console.log("Enviando prompt para o modelo...");
        const result = await model.generateContent(prompt);
        let text = result.response.text();

        // Limpeza básica se a IA teimar em colocar markdown json
        text = text.replace('```json', '').replace('```', '').trim();
        const responseData = JSON.parse(text);

        console.log("Conteúdo gerado! Envelopando no template mestre...");

        // Gera o nome do arquivo com timestamp
        const timestamp = Math.floor(Date.now() / 1000);
        const fileName = `artigo-${timestamp}.html`;

        // Define os caminhos
        const rootDir = path.join(__dirname, '..');
        const blogDir = path.join(rootDir, 'blog');
        const blogHtmlPath = path.join(rootDir, 'blog.html');

        if (!fs.existsSync(blogDir)) {
            fs.mkdirSync(blogDir, { recursive: true });
        }

        const filePath = path.join(blogDir, fileName);

        // 1. Envelopa o conteúdo no template completo
        const fullHtml = generateFullHtml(responseData.conteudo_html, responseData.titulo);

        // 2. Salva o arquivo em disco
        fs.writeFileSync(filePath, fullHtml, 'utf8');
        console.log(`Sucesso! O artigo completo e estilizado foi criado em: ${filePath}`);

        // 3. Atualiza a página do blog.html
        if (fs.existsSync(blogHtmlPath)) {
            let blogHtmlContent = fs.readFileSync(blogHtmlPath, 'utf8');

            // Cria o HTML do novo card (styled using the same template/style)
            const novoCardHtml = `
            <div class="card card-roxo" style="display: block; width: 100%; border-radius: 12px; padding: 25px; margin-bottom: 20px; text-decoration: none;">
                <h3 style="color: var(--dourado); margin-bottom: 10px; font-weight: bold;">${responseData.titulo}</h3>
                <a href="/blog/${fileName}" style="color: white; font-weight: bold; text-decoration: none; display: inline-block; margin-top: 10px;">Ler artigo completo &rarr;</a>
            </div>`;

            // Injeta o card logo depois da âncora
            blogHtmlContent = blogHtmlContent.replace(
                '',
                `\n${novoCardHtml}`
            );

            fs.writeFileSync(blogHtmlPath, blogHtmlContent, 'utf8');
            console.log("Sucesso Absoluto! Página blog.html foi atualizada com o novo card.");
        } else {
            console.error("Erro Fatal: Arquivo blog.html não encontrado na raiz para atualização!");
        }

    } catch (error) {
        console.error("Falha na geração ou gravação do artigo:", error);
    }
}

gerarPost();