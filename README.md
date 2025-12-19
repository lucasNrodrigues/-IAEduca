
# 🎓 IAEduca - Inteligência Artificial para Professores

O **IAEduca** é uma plataforma web moderna e intuitiva projetada para transformar a rotina docente. Utilizando o poder da Inteligência Artificial (Google Gemini), o sistema permite que professores criem avaliações personalizadas, corrijam respostas de alunos e gerem arquivos prontos para impressão em questão de segundos.

---

## 🚀 Funcionalidades Principais

### 📝 1. Criação Inteligente de Provas
- **Geração por Parâmetros**: Defina disciplina, tópico, série e nível de dificuldade.
- **Modelo de Referência**: Carregue um PDF ou cole o texto de uma prova antiga para que a IA aprenda e replique o seu estilo de escrita e formatação.
- **Multimodalidade**: Suporte nativo para leitura de documentos via IA.

### 🛠️ 2. Editor de Questões Avançado
- **Tipos de Questões**: Suporte para questões de múltipla escolha e questões dissertativas (abertas).
- **Controle de Pesos**: Defina o peso individual de cada questão para que o cálculo da nota final seja automatizado e preciso.
- **Interface Intuitiva**: Edite enunciados, alternativas e gabaritos em tempo real.

### 🤖 3. Corretor Automático
- **Análise Semântica**: A IA não apenas verifica se a resposta é igual ao gabarito, mas analisa a coerência e o conhecimento demonstrado pelo aluno.
- **Feedback Detalhado**: Gera comentários construtivos para cada resposta do aluno.
- **Cálculo de Nota**: Processa a pontuação final baseada nos pesos definidos no editor.

### 🖨️ 4. Impressão Profissional (A4)
- **Layout Acadêmico**: Cabeçalho configurável com nome da escola, professor e campos para identificação do aluno.
- **Exportação para PDF**: Gere arquivos `.pdf` formatados seguindo o padrão A4, prontos para distribuição em sala de aula.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/) com TypeScript.
- **IA**: [Google GenAI SDK](https://ai.google.dev/) (Modelos Gemini 3 Pro e Flash).
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) para um design responsivo e moderno.
- **Ícones**: [Lucide React](https://lucide.dev/).
- **PDF**: [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) para conversão de layout HTML para documentos PDF.

---

## ⚙️ Configuração do Projeto

### Pré-requisitos
- Uma chave de API do Google Gemini (obtenha em [Google AI Studio](https://aistudio.google.com/)).

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto e adicione sua chave:
```env
API_KEY=SUA_CHAVE_AQUI
```

### Instalação
O projeto utiliza módulos ES6 diretamente via ESM.sh no `index.html`, portanto, para rodar localmente:
1. Clone o repositório.
2. Certifique-se de que o arquivo `.env` está configurado.
3. Utilize um servidor local (como Live Server do VS Code ou `npx serve .`).

---

## 📖 Como Usar

1. **Configuração Inicial**: Vá em "Configurações" e preencha o nome da sua escola e seu nome de professor. Isso automatizará o cabeçalho de todas as suas provas.
2. **Criar**: Na aba "Criar Prova", insira os dados do conteúdo. Se quiser seguir um padrão específico, anexe um arquivo PDF de uma prova anterior.
3. **Refinar**: No editor, ajuste os enunciados, defina os pesos das questões e verifique os gabaritos.
4. **Finalizar**: Visualize o layout final e clique em "Imprimir" ou "Baixar PDF".
5. **Corrigir**: Quando os alunos entregarem, cole as respostas deles na aba "Corrigir" para obter notas e feedbacks instantâneos.

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e auxílio docente. Sinta-se à vontade para expandir e personalizar.

---
*Desenvolvido com foco na excelência acadêmica e inovação tecnológica.*
