/**
 * Applies the "system" theme before the first paint and follows OS changes, without flicker.
 */
export default function ThemeScript() {
    const script = `(function(){var d=document.documentElement;var m=window.matchMedia('(prefers-color-scheme: dark)');function a(){if((d.dataset.themePreference||'system')==='system'){d.dataset.theme=m.matches?'dark':'light';}}a();m.addEventListener('change',a);})();`;
    return <script dangerouslySetInnerHTML={{__html: script}}/>;
}
