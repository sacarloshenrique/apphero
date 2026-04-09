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

        const prompt = "Gere um artigo de blog com 600 palavras sobre produtividade, TDAH e gamificação. O retorno deve ser SOMENTE um JSON válido contendo 3 campos: 'titulo' (título curto do artigo), 'resumo' (2 linhas de resumo) e 'html_artigo' (o artigo SOMENTE em código HTML válido, utilizando tags <h2>, <h3>, <p> e listas. Não inclua tags <html>, <head> ou <body>). NUNCA envolva a resposta em blocos de código Markdown (como ```json), retorne apenas o texto JSON limpo.";

        console.log("Enviando prompt para o modelo...");

        // Gera o conteúdo via API
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let conteudo;
        try {
            conteudo = JSON.parse(text);
        } catch (e) {
            // Tenta limpar marcações Markdown residuais, caso ocorram
            const cleanedText = text.replace(/```json\n?|```/g, '').trim();
            conteudo = JSON.parse(cleanedText);
        }

        console.log("Conteúdo gerado com sucesso! Preparando para salvar...");

        // Gera o nome do arquivo com base no timestamp (em segundos)
        const timestamp = Math.floor(Date.now() / 1000);
        const fileName = `artigo-${timestamp}.html`;

        // Define os caminhos dos diretórios
        const rootDir = path.join(__dirname, '..');
        const blogDir = path.join(rootDir, 'blog');
        const blogHtmlPath = path.join(rootDir, 'blog.html');

        // Garante que o diretório blog/ exista
        if (!fs.existsSync(blogDir)) {
            console.log("Diretório blog/ não encontrado. Criando diretório na raiz do projeto...");
            fs.mkdirSync(blogDir, { recursive: true });
        }

        const filePath = path.join(blogDir, fileName);

        // Salva o arquivo do artigo em disco
        fs.writeFileSync(filePath, conteudo.html_artigo, 'utf8');

        console.log(`Sucesso! O artigo foi criado e salvo em: ${filePath}`);

        // Atualiza a página principal do blog
        if (fs.existsSync(blogHtmlPath)) {
            let blogHtml = fs.readFileSync(blogHtmlPath, 'utf8');
            
            const novoCard = `
                <a href="blog/${fileName}" class="blog-card-link">
                    <div class="card">
                        <i class="ph-fill ph-article" style="color: var(--roxo-hero);"></i>
                        <h3>${conteudo.titulo}</h3>
                        <p>${conteudo.resumo}</p>
                        <span class="ler-mais" style="color: var(--roxo-hero);">Ler artigo &rarr;</span>
                    </div>
                </a>`;
            
            // Assumimos que o card deve entrar logo no começo da grid-features
            const anchorString = '<div class="grid-features">';
            if (blogHtml.includes(anchorString)) {
                blogHtml = blogHtml.replace(anchorString, anchorString + "\n" + novoCard);
                fs.writeFileSync(blogHtmlPath, blogHtml, 'utf8');
                console.log("A página blog.html foi atualizada com sucesso com o novo card!");
            } else {
                console.error("ERRO: A tag '<div class=\"grid-features\">' não foi encontrada no blog.html. O card não foi renderizado.");
            }
        } else {
            console.error("ERRO: O arquivo blog.html não foi encontrado na raiz do projeto.");
        }

    } catch (error) {
        console.error("Falha na geração ou gravação do artigo de blog. Erro encontrado:", error);
    }
}

gerarPost();
