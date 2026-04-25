import type { AltitudeItem } from '../data/altitudeItems';

export function AltitudeObject({ item, top }: { item: AltitudeItem; top: number }) {
  return (
    <figure className="world-object" style={{ top, left: `${item.x}%`, width: `${item.size}px` }}>
      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" /> : <div className="fallback-dot" />}
      <figcaption>
        <strong>{item.name}</strong>
        <span>{item.displayAltitude}</span>
        {item.fact ? <small>{item.fact}</small> : null}
      </figcaption>
    </figure>
  );
}
