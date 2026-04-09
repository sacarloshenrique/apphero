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
        <nav>
            <div class="logo"><i class="ph-fill ph-lightning" style="color: var(--dourado);"></i> RotinaHero</div>
            <div class="nav-links">
                <a href="/index.html#features">Benefícios</a>
                <a href="/blog.html" style="color: var(--roxo-hero);">Blog</a>
                <a href="/index.html#planos">Planos</a>
            </div>
            <div class="nav-actions">
                <a href="https://play.google.com/store/apps/details?id=com.sa.carlos.rotinaai" class="btn btn-primary">Baixar App</a>
            </div>
        </nav>

        <section class="seo-content" style="margin-top: 40px; margin-bottom: 40px;">
            ${content}
        </section>
        
        <footer>
            <div>&copy; 2026 AppHero. Vencendo a procrastinação.</div>
            <div class="footer-links">
                <a href="/index.html">Home</a>
                <a href="/sobre.html">Sobre</a>
                <a href="mailto:suporte@apphero.com.br">Suporte</a>
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

        const prompt = `Gere um artigo de blog com 600 palavras sobre produtividade, TDAH e gamificação no ecossistema de apps. 
        Retorne o resultado EXATAMENTE neste formato JSON puro (sem marcação markdown json):
        {
            "titulo": "Título curto e chamativo do artigo aqui",
            "conteudo_html": "AQUI VAI SOMENTE O CÓDIGO HTML DO ARTIGO (com tags <h2>, <h3>, <p>, <ul>, <li>). Sem tags <html>, <head> ou <body>."
        }`;

        console.log("Enviando prompt para o modelo...");
        const result = await model.generateContent(prompt);
        let text = result.response.text();

        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const responseData = JSON.parse(text);

        console.log("Conteúdo gerado! Salvando arquivos...");

        const timestamp = Math.floor(Date.now() / 1000);
        const fileName = `artigo-${timestamp}.html`;

        const rootDir = path.join(__dirname, '..');
        const blogDir = path.join(rootDir, 'blog');
        const indexJsonPath = path.join(blogDir, 'index.json');

        if (!fs.existsSync(blogDir)) {
            fs.mkdirSync(blogDir, { recursive: true });
        }

        // 1. Salva o HTML físico do artigo
        const filePath = path.join(blogDir, fileName);
        const fullHtml = generateFullHtml(responseData.conteudo_html, responseData.titulo);
        fs.writeFileSync(filePath, fullHtml, 'utf8');
        console.log(`Sucesso! Artigo criado: ${filePath}`);

        // 2. Atualiza o banco de dados JSON
        let indexData = [];
        if (fs.existsSync(indexJsonPath)) {
            const fileContent = fs.readFileSync(indexJsonPath, 'utf8');
            try {
                indexData = JSON.parse(fileContent);
            } catch (e) {
                console.warn("Aviso: index.json estava vazio ou corrompido. Criando um novo.");
            }
        }

        // Coloca o artigo novo no topo da lista
        indexData.unshift({
            titulo: responseData.titulo,
            link: `/blog/${fileName}`,
            data: new Date().toISOString()
        });

        fs.writeFileSync(indexJsonPath, JSON.stringify(indexData, null, 2), 'utf8');
        console.log("Sucesso Absoluto! index.json atualizado.");

    } catch (error) {
        console.error("Falha na geração ou gravação do artigo:", error);
    }
}

gerarPost();