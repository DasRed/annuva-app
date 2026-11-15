/**
 * Legend above the plot; planned values are shown with a lighter, dashed swatch.
 */
export default function ChartLegend({items}: { items: { color: string; dashed?: boolean; label: string; line?: boolean }[] }) {
    return (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-soft">
            {items.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-1.5">
                    {item.line === true
                     ? <span className="inline-block h-0.5 w-4 rounded" style={{background: item.color}}/>
                     : <span className="inline-block size-3 rounded-sm" style={{background: item.color, border: item.dashed === true ? `1px dashed ${item.color}` : undefined, opacity: item.dashed === true ? 0.45 : 1}}/>}
                    {item.label}
                </li>
            ))}
        </ul>
    );
}
