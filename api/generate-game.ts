import { GoogleGenerativeAI } from "@google/gemini";  // или правильный импорт из пакета
import type { GameSetup } from "../types";  // путь подправьте под вашу структуру

export const config = {
  runtime: "edge",  // или "nodejs" — edge быстрее
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { theme, playerCount, spyCount } = await req.json();

  if (!theme || !playerCount || !spyCount) {
    return new Response("Bad Request", { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("Server Error", { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });  // или ваша версия

  const prompt = `Ты — мастер игры «Шпион».
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

ОТВЕТЬ В ФОРМАТЕ JSON по схеме:
{
  "theme": string,
  "assignments": [
    {
      "playerId": number,
      "word": string,
      "isSpy": boolean
    }
  ]
}`;

  const result = await model.generateContent(prompt, {
    generationConfig: {
      responseMimeType: "application/json",
      // ваша схема, если поддерживается
    },
  });

  const text = result.response.text();

  let data: GameSetup;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return new Response("Invalid JSON from AI", { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}