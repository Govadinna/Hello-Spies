// api/generate.ts
import OpenAI from 'openai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const { theme, playerCount, spyCount } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY отсутствует!");
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY не найден на сервере" }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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
      temperature: 0.8,
    });

    const text = completion.choices?.[0]?.message?.content;

    let json;
    if (!text) {
      console.error("AI не вернул ответ");
      // fallback
      json = {
        theme,
        assignments: Array.from({ length: playerCount }, (_, i) => ({
          playerId: i + 1,
          word: "тест",
          isSpy: i < spyCount,
        })),
      };
    } else {
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.error("Ошибка парсинга AI ответа:", text);
        // fallback на тестовые данные
        json = {
          theme,
          assignments: Array.from({ length: playerCount }, (_, i) => ({
            playerId: i + 1,
            word: "тест",
            isSpy: i < spyCount,
          })),
        };
      }
    }

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error("Server Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Неизвестная ошибка сервера" }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
