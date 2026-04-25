import { useMemo } from 'react';
import { altitudeItems } from '../data/altitudeItems';
import { toWorldTop } from '../lib/scale';
import { AltitudeObject } from './AltitudeObject';

export function AltitudeWorld({ onBack }: { onBack: () => void }) {
  const placedItems = useMemo(() => {
    const sorted = [...altitudeItems].sort((a, b) => a.altitudeMeters - b.altitudeMeters);
    const minGap = 96;
    let previousTop = Number.POSITIVE_INFINITY;

    return sorted.map((item) => {
      let top = toWorldTop(item.altitudeMeters);
      if (previousTop - top < minGap) top = previousTop - minGap;
      previousTop = top;
      return { item, top };
    });
  }, []);

  const moon = placedItems.find((entry) => entry.item.id === 'moon');

  return (
    <>
      {placedItems.map(({ item, top }) => (
        <AltitudeObject key={item.id} item={item} top={top} />
      ))}

      {moon && (
        <section className="moon-ending" style={{ top: moon.top - 520 }}>
          <h2>MOON</h2>
          <p className="moon-alt">384,400 km</p>
          <p>From the ground beneath your feet to the Moon above.</p>
          <button onClick={onBack}>Back to Earth</button>
        </section>
      )}
    </>
  );
}
