
import { GoogleGenAI, Type } from "@google/genai";
import { GameSetup } from "../types";

export const generateGameAssignments = async (theme: string, playerCount: number, spyCount: number): Promise<GameSetup> => {
  const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
  });

  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Сгенерируй назначения для игры «Шпион» для ${playerCount} игроков. 
      Тема: ${theme}. 
      Ровно ${spyCount} игроков должны быть шпионами. 
      Оставшиеся ${playerCount - spyCount} игроков — мирные жители.
      
      Правила:
      1. Выбери одно общее секретное слово для мирных жителей.
      2. Для каждого из ${spyCount} шпионов выбери другое секретное слово, которое очень тесно связано с темой и словом мирных жителей, но отличается от него.
      3. Крайне важно, чтобы слова были похожи по смыслу, чтобы шпиона было трудно вычислить.
      4. ВСЕ СЛОВА И ТЕКСТ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ.
      
      Вывод должен быть валидным JSON, соответствующим указанной схеме.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          theme: { type: Type.STRING },
          assignments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                playerId: { type: Type.INTEGER },
                word: { type: Type.STRING },
                isSpy: { type: Type.BOOLEAN }
              },
              required: ["playerId", "word", "isSpy"]
            }
          }
        },
        required: ["theme", "assignments"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Не удалось сгенерировать слова");
  return JSON.parse(text) as GameSetup;
};
