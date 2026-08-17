import { describe, expect, it, vi } from 'vitest';
import { mountWhenReady } from './mount-when-ready';

describe('mountWhenReady', () => {
  it('does not render before the router has loaded', async () => {
    const render = vi.fn();
    let release!: () => void;
    const load = () => new Promise<void>((resolve) => { release = resolve; });

    const done = mountWhenReady(load, render);
    // The whole point: while the route chunk is in flight the prerendered
    // markup must stay on screen, so nothing may render yet.
    expect(render).not.toHaveBeenCalled();

    release();
    await done;
    expect(render).toHaveBeenCalledOnce();
  });

  it('renders anyway when loading fails, rather than freezing the page', async () => {
    const render = vi.fn();
    await mountWhenReady(() => Promise.reject(new Error('offline')), render);
    expect(render).toHaveBeenCalledOnce();
  });

  it('does not reject when loading fails', async () => {
    await expect(mountWhenReady(() => Promise.reject(new Error('x')), () => {})).resolves.toBeUndefined();
  });
});
