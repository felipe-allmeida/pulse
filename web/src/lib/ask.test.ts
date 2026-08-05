import { describe, expect, it, vi } from 'vitest';
import { streamAsk } from './ask';

describe('streamAsk', () => {
  it('streams chunks to onChunk', async () => {
    const enc = new TextEncoder();
    const body = new ReadableStream({
      start(c) {
        c.enqueue(enc.encode('Hello'));
        c.enqueue(enc.encode(' world'));
        c.close();
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body, { status: 200 }))
    );
    const chunks: string[] = [];
    await streamAsk({ question: 'hi', history: [], onChunk: (t) => chunks.push(t) });
    expect(chunks).toEqual(['Hello', ' world']);
  });
});
