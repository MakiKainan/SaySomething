// Real model inference runs on the Hugging Face Space in /space. Gradio's REST
// API is two steps: POST queues the job, then GET streams its result as SSE.
// (Underscore prefix keeps Vercel from exposing this file as a route.)
export async function predict(text: string, model: string) {
  const url = `${process.env.SPACE_URL}/gradio_api/call/predict`;
  const queued = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [text, model] }),
  });
  if (!queued.ok) {
    throw new Error(`Model server returned ${queued.status}: ${await queued.text()}`);
  }
  const { event_id } = await queued.json();

  const stream = await (await fetch(`${url}/${event_id}`)).text();
  const events = [...stream.matchAll(/^event: (\w+)\ndata: (.*)$/gm)];
  const [, event, data] = events.at(-1) ?? [];
  if (event !== 'complete') {
    throw new Error(`Model server error: ${data ?? stream}`);
  }
  return JSON.parse(data)[0];
}
