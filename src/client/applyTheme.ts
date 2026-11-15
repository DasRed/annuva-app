/**
 * Applies a theme preference ("system", "light" or "dark") to the document immediately.
 */
export default function applyTheme(theme: string): void {
    const root = document.documentElement;
    root.dataset.themePreference = theme;
    root.dataset.theme = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
}
