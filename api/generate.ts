// api/generate.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { theme, playerCount, spyCount } = req.body;

    // Проверяем ключ
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY отсутствует!");
      return res.status(500).json({ error: "OPENAI_API_KEY не найден на сервере" });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    {"playerId": 1, "word": "тест", "isSpy": false},
    {"playerId": 2, "word": "тест", "isSpy": true}
  ]
}

Только JSON, ничего лишнего.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8
    });

    const text = completion.choices?.[0]?.message?.content;

    if (!text) {
      console.error("AI не вернул ответ");
      return res.status(500).json({ error: "AI не вернул ответ" });
    }

    // Безопасный парсинг JSON
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("Ошибка парсинга AI ответа:", text);
      // fallback: возвращаем захардкоденный тест
      json = {
        theme,
        assignments: Array.from({ length: playerCount }, (_, i) => ({
          playerId: i + 1,
          word: "тест",
          isSpy: i < spyCount
        }))
      };
    }

    res.status(200).json(json);
  } catch (err: any) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message || "Неизвестная ошибка сервера" });
  }
}
