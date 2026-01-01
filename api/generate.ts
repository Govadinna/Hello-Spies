// api/generate.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { theme, playerCount, spyCount } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY не найден в переменных окружения');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
Ты — ведущий игры "Шпион".
Сгенерируй назначения для ${playerCount} игроков.
Тема: ${theme}
Шпионов: ${spyCount}
Мирные жители: ${playerCount - spyCount}

Правила:
1. Одно секретное слово для мирных жителей.
2. Для каждого шпиона отдельное слово, связанное с темой и словом мирных жителей.
3. Слова должны быть похожи по смыслу.
4. Верни строго JSON по схеме:
{
  "theme": "${theme}",
  "assignments": [
    {"playerId": 1, "word": "...", "isSpy": true/false}
  ]
}
Только JSON, ничего лишнего.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8
    });

    const text = completion.choices[0].message?.content;

    if (!text) throw new Error('Нет ответа от AI');

    res.status(200).json(JSON.parse(text));
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
