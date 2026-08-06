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
    await streamAsk({ question: 'hi', history: [], locale: 'en', onChunk: (t) => chunks.push(t) });
    expect(chunks).toEqual(['Hello', ' world']);
  });

  it('throws when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 429 }))
    );
    await expect(
      streamAsk({ question: 'hi', history: [], locale: 'en', onChunk: () => {} })
    ).rejects.toThrow('ask failed: 429');
  });

  it('forwards the abort signal to fetch', async () => {
    const fetchMock = vi.fn(async () => new Response(new ReadableStream({ start: (c) => c.close() }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    await streamAsk({ question: 'hi', history: [], locale: 'en', onChunk: () => {}, signal: controller.signal });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ask',
      expect.objectContaining({ signal: controller.signal })
    );
  });

  it('includes the passed locale in the request body', async () => {
    const fetchMock = vi.fn(async () => new Response(new ReadableStream({ start: (c) => c.close() }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await streamAsk({ question: 'hi', history: [], locale: 'pt-BR', onChunk: () => {} });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ask',
      expect.objectContaining({
        body: JSON.stringify({ question: 'hi', history: [], locale: 'pt-BR' }),
      })
    );
  });
});
