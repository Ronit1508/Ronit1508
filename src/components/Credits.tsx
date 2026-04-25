import { imageCredits } from '../data/altitudeItems';

export function Credits({ top }: { top: number }) {
  return (
    <section className="credits" style={{ top }}>
      <h3>Image Sources</h3>
      <ul>
        {imageCredits.map((source) => (
          <li key={source.url}>
            <span>{source.label}</span>
            <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
