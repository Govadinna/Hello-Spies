// api/generate.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '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',
  baseURL: 'https://api.groq.com/openai/v1',
});

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { theme, playerCount, spyCount } = await req.json();

    if (!theme || playerCount < 3 || playerCount > 30 || spyCount < 1 || spyCount >= playerCount) {
      return new Response('Неверные данные', { status: 400 });
    }

    const prompt = `Тема: "${theme}". Игроков: ${playerCount}. Шпионов: ${spyCount}.
Дай всем мирным одно слово по теме, шпионам — "Шпион".
Ответ только JSON:
{
  "theme": "${theme}",
  "assignments": [{"playerId": 1, "word": "...", "isSpy": true/false}, ...]
}`;

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Пустой ответ');

    return new Response(content, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Ошибка сервера', { status: 500 });
  }
}
