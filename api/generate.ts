// api/generate.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';   // npm install openai

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { theme, playerCount, spyCount } = req.body;

    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,          // ← твой sk-or-v1-... ключ сюда
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const prompt = `Сгенерируй назначения для игры «Шпион» для ${playerCount} игроков.
Тема: ${theme}.
Ровно ${spyCount} игроков — шпионы (isSpy: true).
Остальные ${playerCount - spyCount} — мирные жители (isSpy: false).
Каждому игроку дай слово/локацию/роль (word).
Вывод строго в JSON, без лишнего текста:
{
  "theme": "${theme}",
  "assignments": [
    {"playerId": 1, "word": "...", "isSpy": true/false},
    ...
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct:free',   // бесплатная модель, очень хорошая
      // или 'mistralai/mistral-small-24b-instruct:free' — тоже бесплатно
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },   // заставляем отдавать чистый JSON
    });

    const jsonText = response.choices[0].message.content;
    if (!jsonText) throw new Error('Нет ответа от модели');

    res.status(200).json(JSON.parse(jsonText));
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Ошибка генерации' });
  }
}
