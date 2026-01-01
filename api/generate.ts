// api/generate.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { theme, playerCount, spyCount } = req.body;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Сгенерируй назначения для игры «Шпион» для ${playerCount} игроков.
Тема: ${theme}.
Ровно ${spyCount} игроков — шпионы.
Остальные ${playerCount - spyCount} — мирные жители.

Вывод строго в JSON:
{
  "theme": "${theme}",
  "assignments": [
    {"playerId": 1, "word": "...", "isSpy": true/false}
  ]
}`,
      config: {
        responseMimeType: 'application/json',
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

    if (!response.text) throw new Error('Нет ответа от AI');

    res.status(200).json(JSON.parse(response.text));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
