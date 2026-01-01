// pages/api/generate.ts  (или app/api/generate/route.ts — в зависимости от структуры)
import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Инициализация клиента OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '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',
  baseURL: 'https://openrouter.ai/api/v1',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { theme, playerCount, spyCount } = req.body;

    // Базовая валидация входных данных
    if (!theme || typeof theme !== 'string' || theme.trim() === '') {
      return res.status(400).json({ error: 'Тема обязательна и должна быть строкой' });
    }
    if (!Number.isInteger(playerCount) || playerCount < 3 || playerCount > 30) {
      return res.status(400).json({ error: 'Количество игроков должно быть целым числом от 3 до 30' });
    }
    if (!Number.isInteger(spyCount) || spyCount < 1 || spyCount >= playerCount) {
      return res.status(400).json({ error: 'Количество шпионов должно быть от 1 и меньше общего числа игроков' });
    }

    const prompt = `Ты — генератор ролей для игры "Шпион".

Тема игры: "${theme}"

Всего игроков: ${playerCount}
Из них шпионов: ${spyCount}
Мирных жителей: ${playerCount - spyCount}

Твоя задача:
- Придумать одну общую локацию/слово/понятие для всех мирных жителей.
- Шпионам дать слово "Шпион" или пустую строку.
- Равномерно распределить роли: ровно ${spyCount} шпионов, остальные — мирные.
- Игроки нумеруются от 1 до ${playerCount}.

Ответ должен быть СТРОГО в формате JSON (ни одного лишнего символа, без пояснений):

{
  "theme": "${theme}",
  "assignments": [
    {"playerId": 1, "word": "какое-то слово или Шпион", "isSpy": true/false},
    ...
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct:free', // мощная и бесплатная модель
      // альтернативы, если одна не работает:
      // 'google/gemma-2-27b-it:free'
      // 'mistralai/mistral-small-24b-instruct:free'
      // 'qwen/qwen2.5-72b-instruct:free'

      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000,
      response_format: { type: 'json_object' }, // гарантирует чистый JSON
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Пустой ответ от модели');
    }

    // Защита от HTML-ошибок OpenRouter (когда лимит исчерпан)
    if (content.startsWith('<') || content.toLowerCase().includes('server error') || content.toLowerCase().includes('rate limit')) {
      throw new Error('Лимит OpenRouter исчерпан или ошибка сервера. Подожди до завтра или пополни кредиты на openrouter.ai');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('Не удалось распарсить JSON:', content);
      throw new Error('Модель вернула некорректный JSON');
    }

    // Финальная проверка структуры
    if (!parsed.theme || !Array.isArray(parsed.assignments) || parsed.assignments.length !== playerCount) {
      throw new Error('Некорректная структура ответа от модели');
    }

    res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Ошибка в /api/generate:', error);

    // Дружелюбное сообщение для пользователя
    const message = error.message.includes('лимит') || error.message.includes('rate limit')
      ? 'Лимит бесплатных запросов на сегодня исчерпан. Подожди до завтра (сброс в 3:00 по МСК) или пополни баланс на openrouter.ai (10$ дадут 1000+ запросов в день бесплатно).'
      : error.message || 'Неизвестная ошибка генерации';

    res.status(500).json({ error: message });
  }
}

// Если используешь App Router (Next.js 13+), закомментируй выше и раскомментируй ниже:
/*
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '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',
  baseURL: 'https://openrouter.ai/api/v1',
});

export async function POST(req: NextRequest) {
  // ... (тот же код, что внутри handler выше)
}
*/
