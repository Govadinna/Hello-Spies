
import { GoogleGenAI, Type } from "@google/genai";
import { GameSetup } from "../types";

export const generateGameAssignments = async (theme: string, playerCount: number, spyCount: number): Promise<GameSetup> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Ты — мастер игры «Шпион». 
      Твоя задача — распределить секретные слова для ${playerCount} игроков по теме: "${theme}".
      
      КОНФИГУРАЦИЯ:
      - Шпионов: ${spyCount}
      - Мирных агентов: ${playerCount - spyCount}
      
      ИНСТРУКЦИИ ПО СЛОВАМ:
      1. Выбери ОДНО основное слово для мирных агентов (например, "Трамвай").
      2. Для каждого шпиона выбери слово, которое является ближайшим аналогом или входит в ту же узкую категорию (например, "Троллейбус" или "Автобус").
      3. Слова должны быть настолько близки, чтобы при косвенных вопросах их было сложно отличить.
      4. Не используй слишком простые или абстрактные слова.
      5. Все данные должны быть на русском языке.
      
      ОТВЕТЬ В ФОРМАТЕ JSON по схеме.`,
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
  if (!text) throw new Error("Система связи недоступна");
  return JSON.parse(text) as GameSetup;
};
