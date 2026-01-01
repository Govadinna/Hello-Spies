// api/generate.ts

import OpenAI from 'openai';

// Типы для Vercel Serverless Function (без @vercel/node)
export const config = {
  api: {
    bodyParser: true,
  },
};

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY',
  baseURL: 'https://api.groq.com/openai/v1',
});

// Основная функция — Vercel вызывает её напрямую
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { theme, playerCount, spyCount } = body;

    // Валидация
    if (!theme || typeof theme !== 'string' || theme.trim() === '') {
      return new Response(JSON.stringify({ error: 'Тема обязательна' }), { status: 400 });
    }
    if (!Number.isInteger(playerCount) || playerCount < 3 || playerCount > 30) {
      return new Response(JSON.stringify({ error: 'Игроков от 3 до 30' }), { status: 400 });
    }
    if (!Number.isInteger(spyCount) || spyCount < 1 || spyCount >= playerCount) {
      return new Response(JSON.stringify({ error: 'Неверное количество шпионов' }), { status: 400 });
    }

    const prompt = `Ты — генератор ролей для игры "Шпион".

Тема: "${theme}"
Всего игроков: ${playerCount}
Шпионов: ${spyCount}
Мирных: ${playerCount - spyCount}

Правила:
- Всем мирным дай одно и то же слово/локацию по теме.
- Шпионам дай слово "Шпион".
- Игроки от 1 до ${playerCount}.
- Ровно ${spyCount} шпионов.

Ответ ТОЛЬКО чистый JSON:

{
  "theme": "${theme}",
  "assignments": [
    {"playerId": 1, "word": "слово или Шпион", "isSpy": true/false}
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
      throw new Error('Пустой ответ от Groq');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('JSON parse error:', content);
      throw new Error('Некорректный JSON от модели');
    }

    if (!parsed.theme || !Array.isArray(parsed.assignments) || parsed.assignments.length !== playerCount) {
      throw new Error('Неверная структура ответа');
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Ошибка:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Ошибка генерации ролей' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
