
import { GoogleGenAI, Type } from "@google/genai";
import { Exam, Question, CorrectionResult } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateExamWithAI = async (params: {
  subject: string;
  topic: string;
  grade: string;
  count: number;
  difficulty: string;
  modelReference?: string;
  pdfData?: string;
}): Promise<Exam> => {
  const ai = getAI();
  
  const textPrompt = `Você é um especialista em pedagogia e criação de avaliações acadêmicas.
  
  Sua tarefa é criar uma prova de alta qualidade para a disciplina de ${params.subject}, nível ${params.grade}.
  O conteúdo principal a ser cobrado é: ${params.topic}.
  Nível de dificuldade exigido: ${params.difficulty}.
  Quantidade exata de questões: ${params.count}.

  ${params.modelReference || params.pdfData ? `
  IMPORTANTE - MODELO DE REFERÊNCIA:
  O professor forneceu um modelo de prova. Você deve analisar este modelo e IMITAR fielmente o estilo de linguagem, o tipo de questões (se são mais interpretativas, técnicas ou conceituais) e a estrutura organizacional deste material.
  ` : 'Crie uma prova com estrutura pedagógica moderna e equilibrada.'}
  
  Para cada questão, atribua um peso (weight) padrão de 1.0.
  Certifique-se de que cada questão tenha um gabarito preciso.`;

  const parts: any[] = [{ text: textPrompt }];
  
  if (params.pdfData) {
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: params.pdfData
      }
    });
  }

  if (params.modelReference) {
    parts.push({ text: `Texto de referência adicional:\n${params.modelReference}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Um título formal para a prova" },
          subject: { type: Type.STRING },
          grade: { type: Type.STRING },
          instructions: { type: Type.STRING, description: "Orientações gerais para a prova" },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['multiple', 'open'] },
                question: { type: Type.STRING },
                weight: { type: Type.NUMBER, description: "O peso da questão para o cálculo da nota" },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Lista de 4 ou 5 alternativas se o tipo for 'multiple'"
                },
                correctAnswer: { type: Type.STRING, description: "A resposta correta ou o gabarito esperado" }
              },
              required: ['id', 'type', 'question', 'correctAnswer', 'weight']
            }
          }
        },
        required: ['title', 'subject', 'grade', 'questions']
      }
    }
  });

  const data = JSON.parse(response.text);
  return {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toLocaleDateString('pt-BR'),
    schoolName: "Instituição de Ensino",
    teacherName: "Professor(a)"
  };
};

export const correctExamWithAI = async (
  exam: Exam, 
  studentAnswers: string
): Promise<CorrectionResult> => {
  const ai = getAI();
  const prompt = `Você é um professor assistente corrigindo uma prova de ${exam.subject}.
  
  CONTEXTO DA PROVA (QUESTÕES, GABARITOS E PESOS):
  ${JSON.stringify(exam.questions.map(q => ({ q: q.question, ans: q.correctAnswer, weight: q.weight })))}
  
  RESPOSTAS ENVIADAS PELO ALUNO:
  ${studentAnswers}
  
  REGRAS DE CORREÇÃO:
  1. Calcule a nota final com base nos PESOS de cada questão. A nota máxima deve ser normalizada para 10.
  2. Seja justo: se a resposta estiver parcialmente correta em questões abertas, dê crédito proporcional ao peso.
  3. Escreva um feedback motivador e construtivo para o aluno.
  4. Para cada questão, explique brevemente por que está correta ou onde o aluno errou.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          maxScore: { type: Type.NUMBER, description: "Sempre 10" },
          feedback: { type: Type.STRING },
          detailedCorrection: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionIndex: { type: Type.NUMBER },
                isCorrect: { type: Type.BOOLEAN },
                studentAnswer: { type: Type.STRING },
                correctAnswer: { type: Type.STRING },
                comment: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
};
