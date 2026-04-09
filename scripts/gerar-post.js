const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("Erro: A variável de ambiente GEMINI_API_KEY não está definida.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function gerarPost() {
    console.log("Iniciando a geração do artigo de blog...");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Prompt ajustado para retornar JSON com Título, Resumo e o HTML
        const prompt = `Gere um artigo de blog com 600 palavras sobre produtividade, TDAH e gamificação no ecossistema de apps.
        Retorne o resultado EXATAMENTE neste formato JSON puro (sem marcação markdown como \`\`\`json):
        {
            "titulo": "Título curto e chamativo aqui",
            "resumo": "Um resumo de duas linhas sobre o artigo.",
            "conteudo": "AQUI VAI SOMENTE O CÓDIGO HTML DO ARTIGO (com tags <h2>, <h3>, <p>, <ul>, <li>). Sem <html>, <head> ou <body>."
        }`;

        console.log("Enviando prompt para o modelo...");
        const result = await model.generateContent(prompt);
        let text = result.response.text();

        // Tratamento maroto pra limpar formatação markdown se a IA ignorar a regra
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const dados = JSON.parse(text);

        console.log("Conteúdo gerado com sucesso! Preparando para salvar...");

        const timestamp = Math.floor(Date.now() / 1000);
        const fileName = `artigo-${timestamp}.html`;

        const rootDir = path.join(__dirname, '..');
        const blogDir = path.join(rootDir, 'blog');
        const blogHtmlPath = path.join(rootDir, 'blog.html');

        if (!fs.existsSync(blogDir)) {
            fs.mkdirSync(blogDir, { recursive: true });
        }

        const filePath = path.join(blogDir, fileName);

        // 1. Salva o artigo físico
        fs.writeFileSync(filePath, dados.conteudo, 'utf8');
        console.log(`Sucesso! O artigo foi criado em: ${filePath}`);

        // 2. Atualiza a página principal do blog
        if (fs.existsSync(blogHtmlPath)) {
            let blogHtmlContent = fs.readFileSync(blogHtmlPath, 'utf8');

            // Cria o card que vai aparecer na listagem
            const novoCard = `
            <div class="card">
                <h3>${dados.titulo}</h3>
                <p>${dados.resumo}</p>
                <a href="/blog/${fileName}" style="color: var(--roxo-hero); font-weight: bold; margin-top: 10px; display: inline-block;">Ler artigo completo &rarr;</a>
            </div>`;

            // Injeta o card logo depois da âncora
            blogHtmlContent = blogHtmlContent.replace(
                '',
                `\n${novoCard}`
            );

            fs.writeFileSync(blogHtmlPath, blogHtmlContent, 'utf8');
            console.log("Sucesso Absoluto! Página blog.html foi atualizada com o novo card.");
        } else {
            console.error("Erro: Arquivo blog.html não encontrado na raiz!");
        }

    } catch (error) {
        console.error("Falha fatal na geração ou gravação do artigo:", error);
    }
}

gerarPost();