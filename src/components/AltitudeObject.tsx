import type { AltitudeItem } from '../data/altitudeItems';

type Props = {
  item: AltitudeItem;
  top: number;
  imageUrl: string;
};

export function AltitudeObject({ item, top, imageUrl }: Props) {
  return (
    <figure className={`altitude-object ${item.alignment} ${item.size}`} style={{ top }}>
      <img src={imageUrl} alt={item.name} loading="lazy" decoding="async" />
      <figcaption>
        <strong>{item.name}</strong>
        <span>{item.displayAltitude}</span>
        {item.fact && <small>{item.fact}</small>}
      </figcaption>
    </figure>
  );
}
