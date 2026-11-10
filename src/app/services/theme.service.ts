import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'omnipicks-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.readStored());

  constructor() {
    this.apply(this.theme());
  }

  toggle() {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme) {
    this.theme.set(theme);
    this.apply(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* modo privado */ }
  }

  private apply(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }

  private readStored(): Theme {
    try { return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  }
}
