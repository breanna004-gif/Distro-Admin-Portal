import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly themeKey = 'admin_theme';

  constructor() {
    this.initializeTheme();
  }


  /**
   * Initialize the application theme.
   *
   * If the user has already selected a theme,
   * use their saved preference.
   *
   * If no preference exists yet, use dark mode
   * because dark blue is the platform's primary
   * visual identity.
   */
  initializeTheme(): void {

    const savedTheme = localStorage.getItem(this.themeKey);

    if (savedTheme === 'light') {
      this.applyTheme('light');
      return;
    }

    this.applyTheme('dark');
  }


  /**
   * Apply a specific theme.
   */
  private applyTheme(theme: 'light' | 'dark'): void {

    const isDark = theme === 'dark';

    document.documentElement.setAttribute(
      'data-theme',
      theme
    );

    document.body.classList.toggle(
      'dark-mode',
      isDark
    );

    const favicon = document.getElementById('app-favicon');
    favicon?.setAttribute(
      'href',
      isDark ? '/mydistro-logo-dark.svg' : '/mydistro-logo-light.svg'
    );

    localStorage.setItem(
      this.themeKey,
      theme
    );
  }


  /**
   * Check whether dark mode is currently active.
   */
  isDarkMode(): boolean {

    return document.documentElement.getAttribute('data-theme') === 'dark';
  }


  /**
   * Toggle between dark and light mode.
   */
  toggleTheme(): void {

    const nextTheme = this.isDarkMode()
      ? 'light'
      : 'dark';

    this.applyTheme(nextTheme);
  }


  /**
   * Explicitly switch to dark mode.
   */
  setDarkMode(): void {

    this.applyTheme('dark');
  }


  /**
   * Explicitly switch to light mode.
   */
  setLightMode(): void {

    this.applyTheme('light');
  }
}
