export interface AskOpts {
  question: string;
  history: { role: string; content: string }[];
  onChunk: (t: string) => void;
  signal?: AbortSignal;
}

export async function streamAsk({ question, history, onChunk, signal }: AskOpts): Promise<void> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question, history }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`ask failed: ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = dec.decode(value, { stream: true });
    if (text) onChunk(text);
  }
}
