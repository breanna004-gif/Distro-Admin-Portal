import { ThemeService } from './theme';

describe('ThemeService', () => {
  let themeService: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark-mode');
    themeService = new ThemeService();
  });

  it('switches from dark to light and persists the selection', () => {
    themeService.toggleTheme();

    expect(themeService.isDarkMode()).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(localStorage.getItem('admin_theme')).toBe('light');
  });

  it('switches back to dark on the next toggle', () => {
    themeService.toggleTheme();
    themeService.toggleTheme();

    expect(themeService.isDarkMode()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(localStorage.getItem('admin_theme')).toBe('dark');
  });
});
