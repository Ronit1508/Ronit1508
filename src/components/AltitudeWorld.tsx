import { useMemo } from 'react';
import { altitudeItems } from '../data/altitudeItems';
import { altitudeToTop } from '../lib/scale';
import { AltitudeObject } from './AltitudeObject';

type Props = {
  imageMap: Record<string, string>;
};

export function AltitudeWorld({ imageMap }: Props) {
  const placed = useMemo(() => {
    const sorted = [...altitudeItems].sort((a, b) => a.altitudeMeters - b.altitudeMeters);
    let prevTop = Number.POSITIVE_INFINITY;

    return sorted.map((item) => {
      let top = altitudeToTop(item.altitudeMeters);
      if (prevTop !== Number.POSITIVE_INFINITY && prevTop - top < 92) {
        top = prevTop - 92;
      }
      prevTop = top;
      return { item, top };
    });
  }, []);

  return (
    <>
      <div className="atmo-band lower" />
      <div className="atmo-band cloud" />
      <div className="atmo-band upper" />
      <div className="atmo-band strato" />
      <div className="atmo-band meso" />
      <div className="atmo-band thermo" />
      <div className="atmo-band exo" />
      <div className="atmo-band moon" />
      <div className="world-axis" />
      <div className="stars" />
      <div className="meteors" />
      <div className="earth-glow" />

      {placed.map(({ item, top }) => (
        <AltitudeObject key={item.id} item={item} top={top} imageUrl={imageMap[item.id]} />
      ))}
    </>
  );
}
