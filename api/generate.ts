// api/generate.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { theme, playerCount, spyCount } = await req.json();

    const prompt = `Сгенерируй роли для игры "Шпион".

Тема: "${theme}"
Игроков: ${playerCount}
Шпионов: ${spyCount}

- Всем мирным жителям дай одно и то же слово, связанное с темой.
- Шпионам дай слово "Шпион".
- Ровно ${spyCount} шпионов с isSpy: true.
- Игроки нумеруются от 1 до ${playerCount}.

Ответ строго JSON без лишнего текста:
{
  "theme": "${theme}",
  "assignments": [
    {"playerId": 1, "word": "слово или Шпион", "isSpy": true или false}
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return new Response('Ошибка: ИИ не ответил', { status: 500 });
    }

    return new Response(content, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Groq error:', error);
    return new Response(`Ошибка: ${error.message || 'Неизвестно'}`, { status: 500 });
  }
}
