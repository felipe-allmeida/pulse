import { describe, expect, it } from 'vitest';
import {
  basepathForLocale,
  localeFromPathname,
  pathForLocale,
  rootRedirectPath,
  routePathFromPathname,
  switchLocalePath,
} from './locale-url';

describe('localeFromPathname', () => {
  it('reads the locale off the prefix', () => {
    expect(localeFromPathname('/')).toBe('en');
    expect(localeFromPathname('/about')).toBe('en');
    expect(localeFromPathname('/pt')).toBe('pt-BR');
    expect(localeFromPathname('/pt/about')).toBe('pt-BR');
    expect(localeFromPathname('/pt/projects/pulse')).toBe('pt-BR');
  });

  it('only matches on a path boundary', () => {
    // `/ptolemy` is an English route that happens to start with the prefix.
    expect(localeFromPathname('/ptolemy')).toBe('en');
    expect(localeFromPathname('/projects/pt')).toBe('en');
  });
});

describe('path translation', () => {
  it('strips the prefix to get the router-side path', () => {
    expect(routePathFromPathname('/pt/about')).toBe('/about');
    expect(routePathFromPathname('/pt')).toBe('/');
    expect(routePathFromPathname('/about')).toBe('/about');
    expect(routePathFromPathname('/')).toBe('/');
  });

  it('adds the prefix to get the public path', () => {
    expect(pathForLocale('/about', 'pt-BR')).toBe('/pt/about');
    expect(pathForLocale('/', 'pt-BR')).toBe('/pt');
    expect(pathForLocale('/about', 'en')).toBe('/about');
    expect(pathForLocale('/', 'en')).toBe('/');
  });

  it('round-trips a path between locales', () => {
    expect(switchLocalePath('/projects/pulse', 'pt-BR')).toBe('/pt/projects/pulse');
    expect(switchLocalePath('/pt/projects/pulse', 'en')).toBe('/projects/pulse');
    expect(switchLocalePath('/pt', 'en')).toBe('/');
    expect(switchLocalePath('/', 'pt-BR')).toBe('/pt');
  });

  it('gives the router a basepath it accepts', () => {
    expect(basepathForLocale('en')).toBe('/');
    expect(basepathForLocale('pt-BR')).toBe('/pt');
  });
});

describe('rootRedirectPath', () => {
  it('sends a Portuguese-speaking first-time visitor to /pt', () => {
    expect(rootRedirectPath('/', null, ['pt-BR', 'pt'])).toBe('/pt');
    expect(rootRedirectPath('/', null, ['pt'])).toBe('/pt');
  });

  it('leaves everyone else on the English root', () => {
    expect(rootRedirectPath('/', null, ['en-US'])).toBeNull();
    expect(rootRedirectPath('/', null, [])).toBeNull();
  });

  it('prefers a stored choice over the browser languages', () => {
    expect(rootRedirectPath('/', 'en', ['pt-BR'])).toBeNull();
    expect(rootRedirectPath('/', 'pt-BR', ['en-US'])).toBe('/pt');
    // Junk in storage falls back to sniffing rather than throwing.
    expect(rootRedirectPath('/', 'klingon', ['pt-BR'])).toBe('/pt');
  });

  it('never redirects away from a URL the visitor actually asked for', () => {
    expect(rootRedirectPath('/about', 'pt-BR', ['pt-BR'])).toBeNull();
    expect(rootRedirectPath('/pt', 'en', ['en-US'])).toBeNull();
    expect(rootRedirectPath('/projects', null, ['pt-BR'])).toBeNull();
  });
});
