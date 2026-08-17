import { afterEach, describe, expect, it } from 'vitest';
import { CLARITY_PROJECT_ID, loadClarity, tagUrl } from './clarity';

function tags(): HTMLScriptElement[] {
  return [...document.querySelectorAll<HTMLScriptElement>('script[src^="https://www.clarity.ms/"]')];
}

afterEach(() => {
  for (const tag of tags()) tag.remove();
  delete window.clarity;
});

describe('loadClarity', () => {
  it('requests the project tag asynchronously', () => {
    loadClarity();

    expect(tags().map((tag) => tag.src)).toEqual([tagUrl(CLARITY_PROJECT_ID)]);
    expect(tags()[0].async).toBe(true);
  });

  /*
    The whole point of the stub: `clarity.js` is still in flight while the app
    boots, so anything reported in that window has to survive until the real
    implementation drains `q`. Losing it would be invisible — no error, just
    missing data.
  */
  it('buffers calls made before the tag arrives', () => {
    loadClarity();

    window.clarity?.('set', 'route', '/about');
    window.clarity?.('event', 'ask-submitted');

    expect(window.clarity?.q).toEqual([
      ['set', 'route', '/about'],
      ['event', 'ask-submitted'],
    ]);
  });

  it('does not install a second recorder when called again', () => {
    loadClarity();
    window.clarity?.('event', 'first');
    loadClarity();

    expect(tags()).toHaveLength(1);
    expect(window.clarity?.q).toEqual([['event', 'first']]);
  });
});
