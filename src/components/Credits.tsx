export type Credit = { credit: string; source: string };

export function Credits({ top, credits }: { top: number; credits: Credit[] }) {
  return (
    <section className="credits-panel" style={{ top }}>
      <h3>Image Credits</h3>
      <ul>
        {credits.map((entry) => (
          <li key={entry.source}>
            <span>{entry.credit}</span>
            <a href={entry.source} target="_blank" rel="noreferrer">{entry.source}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
