export async function runInference(text: string, model: string) {
  const response = await fetch('/api/inference', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, model }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Inference failed with status ${response.status}`);
  }

  return response.json();
}
