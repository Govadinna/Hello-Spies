// api/generate.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Инициализация клиента Groq (полностью совместим с OpenAI SDK)
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY ',
  baseURL: 'https://api.groq.com/openai/v1',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { theme, playerCount, spyCount } = req.body;

    // Валидация входных данных
    if (!theme || typeof theme !== 'string' || theme.trim() === '') {
      return res.status(400).json({ error: 'Тема обязательна' });
    }
    if (!Number.isInteger(playerCount) || playerCount < 3 || playerCount > 30) {
      return res.status(400).json({ error: 'Игроков должно быть от 3 до 30' });
    }
    if (!Number.isInteger(spyCount) || spyCount < 1 || spyCount >= playerCount) {
      return res.status(400).json({ error: 'Шпионов должно быть от 1 и меньше общего числа игроков' });
    }

    const prompt = `Ты — генератор ролей для игры "Шпион".

Тема: "${theme}"
Всего игроков: ${playerCount}
Шпионов: ${spyCount}
Мирных: ${playerCount - spyCount}

Правила:
- Всем мирным жителям дай ОДНО и то же слово/локацию, связанное с темой.
- Шпионам дай слово "Шпион".
- Игроки нумеруются от 1 до ${playerCount}.
- Ровно ${spyCount} игроков с isSpy: true.

Ответ ТОЛЬКО в формате JSON, без текста до или после:

{
  "theme": "${theme}",
  "assignments": [
    {"playerId": 1, "word": "слово или Шпион", "isSpy": true/false},
    ...
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',     // самая мощная и актуальная на январь 2026
      // альтернативы: 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'
      
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }, // гарантирует чистый JSON
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Пустой ответ от Groq');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('Не удалось распарсить JSON от Groq:', content);
      throw new Error('Модель вернула некорректный JSON');
    }

    // Проверка структуры
    if (!parsed.theme || !Array.isArray(parsed.assignments) || parsed.assignments.length !== playerCount) {
      throw new Error('Неверная структура данных');
    }

    res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Ошибка в /api/generate:', error);
    
    res.status(500).json({ 
      error: error.message || 'Ошибка генерации ролей. Попробуй ещё раз.' 
    });
  }
}
