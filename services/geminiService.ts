export const generateGameAssignments = async (theme: string, playerCount: number, spyCount: number) => {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme, playerCount, spyCount })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Ошибка генерации');
  }

  return res.json();
};
