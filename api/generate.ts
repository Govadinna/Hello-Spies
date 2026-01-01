import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { theme, playerCount, spyCount } = req.body;

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
      return res.status(500).json({ error: 'ИИ не ответил' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(content);
  } catch (error: any) {
    console.error('Groq error:', error);
    res.status(500).json({ error: error.message || 'Неизвестная ошибка' });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
