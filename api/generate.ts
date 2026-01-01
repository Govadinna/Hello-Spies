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

    const prompt = `Тема: "${theme}"
Игроков: ${playerCount}
Шпионов: ${spyCount}

Сгенерируй роли для игры "Шпион":
- Всем мирным жителям дай одно и то же слово/локацию, связанное с темой.
- Шпионам дай слово "Шпион".
- Ровно ${spyCount} шпионов.
- Игроки нумеруются от 1 до ${playerCount}.

Ответ строго в формате JSON без лишнего текста:
{
  "theme": "${theme}",
  "assignments": [
    {"playerId": 1, "word": "слово или Шпион", "isSpy": true или false}
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return new Response('Ошибка: пустой ответ от ИИ', { status: 500 });
    }

    return new Response(content, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error(error);
    return new Response('Ошибка сервера: ' + error.message, { status: 500 });
  }
}
