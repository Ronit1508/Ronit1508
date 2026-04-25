import { useEffect, useMemo, useRef, useState } from 'react';

type Layer = 'Surface' | 'Troposphere' | 'Stratosphere' | 'Mesosphere' | 'Thermosphere' | 'Exosphere' | 'Deep Space';

type WorldObject = {
  id: string;
  name: string;
  altitudeMeters: number;
  displayAltitude: string;
  fact?: string;
  category: string;
  imageUrl?: string;
  imageCredit: string;
  imageSource: string;
  wikiTitle?: string;
  alignment: 'left' | 'right' | 'center';
  size: 'sm' | 'md' | 'lg';
  layer: Layer;
};

const MAX_ALTITUDE = 384_400_000;
const WORLD_HEIGHT = 18200;
const TOP_PADDING = 1300;
const BOTTOM_PADDING = 900;

const objects: WorldObject[] = [
  { id: 'human', name: 'HUMAN / GROUND LEVEL', altitudeMeters: 0, displayAltitude: '0 m', category: 'Surface', fact: 'Sea-level reference for the journey.', wikiTitle: 'Human', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Human', alignment: 'left', size: 'sm', layer: 'Surface' },
  { id: 'dog', name: 'DOG / PARK SCENE', altitudeMeters: 1, displayAltitude: '1 m', category: 'Surface', fact: 'Companions at the base of the atmosphere.', wikiTitle: 'Dog', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Dog', alignment: 'right', size: 'sm', layer: 'Surface' },
  { id: 'tree', name: 'TREE CANOPY', altitudeMeters: 15, displayAltitude: '15 m', category: 'Nature', wikiTitle: 'Tree', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Tree', alignment: 'left', size: 'sm', layer: 'Troposphere' },
  { id: 'bees', name: 'BUTTERFLIES / BEES', altitudeMeters: 35, displayAltitude: '35 m', category: 'Life', wikiTitle: 'Honey_bee', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Honey_bee', alignment: 'right', size: 'sm', layer: 'Troposphere' },
  { id: 'small-birds', name: 'SMALL BIRDS', altitudeMeters: 80, displayAltitude: '80 m', category: 'Life', wikiTitle: 'Passerine', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Passerine', alignment: 'left', size: 'sm', layer: 'Troposphere' },
  { id: 'building', name: 'TALL BUILDINGS', altitudeMeters: 100, displayAltitude: '100 m', category: 'Architecture', wikiTitle: 'Skyscraper', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Skyscraper', alignment: 'right', size: 'sm', layer: 'Troposphere' },
  { id: 'eiffel', name: 'EIFFEL TOWER', altitudeMeters: 330, displayAltitude: '330 m', category: 'Monument', wikiTitle: 'Eiffel_Tower', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Eiffel_Tower', alignment: 'left', size: 'md', layer: 'Troposphere' },
  { id: 'empire', name: 'EMPIRE STATE BUILDING', altitudeMeters: 381, displayAltitude: '381 m', category: 'Monument', wikiTitle: 'Empire_State_Building', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Empire_State_Building', alignment: 'right', size: 'md', layer: 'Troposphere' },
  { id: 'burj', name: 'BURJ KHALIFA', altitudeMeters: 828, displayAltitude: '828 m', category: 'Monument', wikiTitle: 'Burj_Khalifa', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Burj_Khalifa', alignment: 'center', size: 'md', layer: 'Troposphere' },
  { id: 'village', name: 'MOUNTAIN VILLAGE', altitudeMeters: 2_000, displayAltitude: '2 km', category: 'Terrain', wikiTitle: 'Mountain_village', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Mountain_village', alignment: 'left', size: 'md', layer: 'Troposphere' },
  { id: 'everest', name: 'MOUNT EVEREST', altitudeMeters: 8_849, displayAltitude: '8,849 m', category: 'Terrain', wikiTitle: 'Mount_Everest', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Mount_Everest', alignment: 'right', size: 'lg', layer: 'Troposphere' },
  { id: 'eagle', name: 'EAGLE', altitudeMeters: 4_000, displayAltitude: '4 km', category: 'Life', wikiTitle: 'Eagle', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Eagle', alignment: 'left', size: 'sm', layer: 'Troposphere' },
  { id: 'goose', name: 'BAR-HEADED GOOSE', altitudeMeters: 7_000, displayAltitude: '7 km', category: 'Life', wikiTitle: 'Bar-headed_goose', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Bar-headed_goose', alignment: 'center', size: 'sm', layer: 'Troposphere' },
  { id: 'vulture', name: 'VULTURE', altitudeMeters: 11_000, displayAltitude: '11 km', category: 'Life', wikiTitle: 'Vulture', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Vulture', alignment: 'right', size: 'sm', layer: 'Troposphere' },
  { id: 'heli', name: 'HELICOPTER ALTITUDE', altitudeMeters: 6_000, displayAltitude: '6 km', category: 'Aviation', wikiTitle: 'Helicopter', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Helicopter', alignment: 'left', size: 'md', layer: 'Troposphere' },
  { id: 'airliner', name: 'COMMERCIAL AIRPLANE', altitudeMeters: 11_000, displayAltitude: '11 km', category: 'Aviation', wikiTitle: 'Airliner', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Airliner', alignment: 'right', size: 'md', layer: 'Troposphere' },
  { id: 'private', name: 'PRIVATE JET', altitudeMeters: 14_000, displayAltitude: '14 km', category: 'Aviation', wikiTitle: 'Business_jet', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Business_jet', alignment: 'center', size: 'sm', layer: 'Stratosphere' },
  { id: 'concorde', name: 'SUPERSONIC AIRCRAFT', altitudeMeters: 18_000, displayAltitude: '18 km', category: 'Aviation', wikiTitle: 'Concorde', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Concorde', alignment: 'left', size: 'md', layer: 'Stratosphere' },
  { id: 'balloon', name: 'WEATHER BALLOON', altitudeMeters: 26_000, displayAltitude: '26 km', category: 'Science', wikiTitle: 'Weather_balloon', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Weather_balloon', alignment: 'right', size: 'md', layer: 'Stratosphere' },
  { id: 'felix', name: 'HIGH-ALTITUDE JUMP ZONE', altitudeMeters: 39_000, displayAltitude: '39 km', category: 'Human Record', wikiTitle: 'Felix_Baumgartner', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Felix_Baumgartner', alignment: 'left', size: 'sm', layer: 'Stratosphere' },
  { id: 'meteor', name: 'METEORS BEGIN GLOWING', altitudeMeters: 80_000, displayAltitude: '80 km', category: 'Upper Atmosphere', wikiTitle: 'Meteor', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Meteor', alignment: 'right', size: 'sm', layer: 'Mesosphere' },
  { id: 'karman', name: 'KÁRMÁN LINE', altitudeMeters: 100_000, displayAltitude: '100 km', category: 'Boundary', wikiTitle: 'K%C3%A1rm%C3%A1n_line', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/K%C3%A1rm%C3%A1n_line', alignment: 'center', size: 'sm', layer: 'Thermosphere' },
  { id: 'suborbital', name: 'SUBORBITAL SPACECRAFT', altitudeMeters: 120_000, displayAltitude: '120 km', category: 'Spaceflight', wikiTitle: 'Sub-orbital_spaceflight', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Sub-orbital_spaceflight', alignment: 'left', size: 'md', layer: 'Thermosphere' },
  { id: 'iss', name: 'INTERNATIONAL SPACE STATION', altitudeMeters: 408_000, displayAltitude: '408 km', category: 'Orbit', wikiTitle: 'International_Space_Station', imageCredit: 'NASA / Wikimedia Commons', imageSource: 'https://en.wikipedia.org/wiki/International_Space_Station', alignment: 'right', size: 'md', layer: 'Thermosphere' },
  { id: 'hubble', name: 'HUBBLE SPACE TELESCOPE', altitudeMeters: 540_000, displayAltitude: '540 km', category: 'Orbit', wikiTitle: 'Hubble_Space_Telescope', imageCredit: 'NASA / Wikimedia Commons', imageSource: 'https://en.wikipedia.org/wiki/Hubble_Space_Telescope', alignment: 'left', size: 'md', layer: 'Thermosphere' },
  { id: 'gps', name: 'GPS SATELLITES', altitudeMeters: 20_200_000, displayAltitude: '20,200 km', category: 'Navigation', wikiTitle: 'Global_Positioning_System', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Global_Positioning_System', alignment: 'right', size: 'sm', layer: 'Exosphere' },
  { id: 'geo', name: 'GEOSTATIONARY SATELLITES', altitudeMeters: 35_786_000, displayAltitude: '35,786 km', category: 'Communications', wikiTitle: 'Geostationary_orbit', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Geostationary_orbit', alignment: 'left', size: 'sm', layer: 'Exosphere' },
  { id: 'moon', name: 'MOON', altitudeMeters: 384_400_000, displayAltitude: '384,400 km', category: 'Destination', wikiTitle: 'Moon', imageCredit: 'NASA / Wikimedia Commons', imageSource: 'https://en.wikipedia.org/wiki/Moon', alignment: 'center', size: 'lg', layer: 'Deep Space' },
];

const fallbackImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%233d78d3"/><stop offset="1" stop-color="%23030818"/></linearGradient></defs><rect width="640" height="480" fill="url(%23g)"/><circle cx="500" cy="120" r="58" fill="%23e8f4ff" opacity="0.7"/></svg>';

/**
 * Piecewise altitude-to-world mapping.
 *
 * Why this shape:
 * - 0..100 m is heavily expanded so ground objects don't collapse into one cluster.
 * - 100 m..1 km still expanded, but less aggressive.
 * - 1..20 km keeps aviation readable.
 * - 20..100 km compresses upper atmosphere.
 * - 100..1000 km compresses orbital altitudes moderately.
 * - >1000 km uses logarithmic compression so GEO + Moon are reachable without breaking scale logic.
 */
const mapAltitudeToWorldY = (altitudeMeters: number) => {
  const a = Math.max(0, Math.min(MAX_ALTITUDE, altitudeMeters));

  if (a <= 100) return a * 1.2;
  if (a <= 1_000) return 120 + (a - 100) * 0.25;
  if (a <= 20_000) return 345 + (a - 1_000) * 0.05;
  if (a <= 100_000) return 1_295 + (a - 20_000) * 0.012;
  if (a <= 1_000_000) return 2_255 + (a - 100_000) * 0.003;

  const minLog = Math.log10(1_000_000);
  const maxLog = Math.log10(MAX_ALTITUDE);
  const currentLog = Math.log10(a);
  return 4_955 + ((currentLog - minLog) / (maxLog - minLog)) * 8_600;
};

const mapWorldYToAltitude = (worldY: number) => {
  if (worldY <= 120) return worldY / 1.2;
  if (worldY <= 345) return 100 + (worldY - 120) / 0.25;
  if (worldY <= 1_295) return 1_000 + (worldY - 345) / 0.05;
  if (worldY <= 2_255) return 20_000 + (worldY - 1_295) / 0.012;
  if (worldY <= 4_955) return 100_000 + (worldY - 2_255) / 0.003;

  const minLog = Math.log10(1_000_000);
  const maxLog = Math.log10(MAX_ALTITUDE);
  const n = (worldY - 4_955) / 8_600;
  return Math.pow(10, minLog + n * (maxLog - minLog));
};

const getLayerFromAltitude = (meters: number): Layer => {
  if (meters < 500) return 'Surface';
  if (meters < 12_000) return 'Troposphere';
  if (meters < 50_000) return 'Stratosphere';
  if (meters < 85_000) return 'Mesosphere';
  if (meters < 700_000) return 'Thermosphere';
  if (meters < 20_000_000) return 'Exosphere';
  return 'Deep Space';
};

const formatAltitude = (meters: number) => {
  if (meters < 1_000) return `${Math.round(meters).toLocaleString()} m`;
  if (meters < 1_000_000) return `${(meters / 1_000).toFixed(1)} km`;
  return `${Math.round(meters / 1_000).toLocaleString()} km`;
};

function useWikiImages(items: WorldObject[]) {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let stopped = false;

    async function load() {
      const pairs = await Promise.all(
        items.map(async (item) => {
          if (!item.wikiTitle) return [item.id, item.imageUrl ?? fallbackImage] as const;
          try {
            const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.wikiTitle)}`);
            if (!res.ok) throw new Error('no image');
            const data = await res.json();
            return [item.id, data.thumbnail?.source ?? data.originalimage?.source ?? item.imageUrl ?? fallbackImage] as const;
          } catch {
            return [item.id, item.imageUrl ?? fallbackImage] as const;
          }
        }),
      );
      if (!stopped) setImages(Object.fromEntries(pairs));
    }

    load();
    return () => {
      stopped = true;
    };
  }, [items]);

  return images;
}

export default function App() {
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [progress, setProgress] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [touchY, setTouchY] = useState<number | null>(null);

  const targetProgress = useRef(0);
  const raf = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const images = useWikiImages(objects);

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const step = () => {
      setProgress((prev) => {
        const next = prev + (targetProgress.current - prev) * 0.12;
        setVelocity(next - prev);
        return Math.abs(next - targetProgress.current) < 0.00001 ? targetProgress.current : next;
      });
      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      // wheel up (negative deltaY) should ascend, so progress increases.
      const delta = -event.deltaY * 0.00045;
      targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + delta));
    };

    const onTouchStart = (event: TouchEvent) => setTouchY(event.touches[0]?.clientY ?? null);

    const onTouchMove = (event: TouchEvent) => {
      if (touchY == null) return;
      event.preventDefault();
      const current = event.touches[0]?.clientY ?? touchY;
      const delta = touchY - current;
      targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + delta * 0.0016));
      setTouchY(current);
    };

    const onTouchEnd = () => setTouchY(null);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') targetProgress.current = Math.min(1, targetProgress.current + 0.02);
      if (event.key === 'ArrowDown') targetProgress.current = Math.max(0, targetProgress.current - 0.02);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [touchY]);

  const maxCameraTop = WORLD_HEIGHT - viewportHeight;
  const cameraTop = (1 - progress) * maxCameraTop;
  const worldTranslate = -cameraTop;

  const currentWorldY = maxCameraTop * progress;
  const currentAltitude = mapWorldYToAltitude(currentWorldY * ((WORLD_HEIGHT - TOP_PADDING - BOTTOM_PADDING) / maxCameraTop));
  const currentLayer = getLayerFromAltitude(currentAltitude);

  const placedObjects = useMemo(() => {
    const sorted = [...objects].sort((a, b) => a.altitudeMeters - b.altitudeMeters);
    let previousTop = Number.POSITIVE_INFINITY;

    return sorted.map((item) => {
      const yFromGround = mapAltitudeToWorldY(item.altitudeMeters);
      let top = WORLD_HEIGHT - BOTTOM_PADDING - yFromGround;
      // keep subtle minimum spacing so labels don't collide while preserving order.
      if (previousTop !== Number.POSITIVE_INFINITY && previousTop - top < 94) top = previousTop - 94;
      previousTop = top;
      return { ...item, top };
    });
  }, []);

  const credits = Array.from(new Map(objects.map((item) => [item.imageSource, { credit: item.imageCredit, source: item.imageSource }])).values());

  return (
    <div className="experience" ref={containerRef}>
      <div className="tiny-readout" aria-live="polite">{formatAltitude(currentAltitude)} · {currentLayer}</div>

      <div className="world" style={{ transform: `translate3d(0, ${worldTranslate}px, 0)` }}>
        <section className="hero-zone" style={{ top: `${WORLD_HEIGHT - viewportHeight - 120}px` }}>
          <div className="hero-sky" />
          <div className="hero-content">
            <h1>From Earth to Space</h1>
            <p>Scroll up to ascend through the atmosphere.</p>
            <div className="up-cue">↑ Scroll up to ascend</div>
          </div>
          <div className="park-scene">
            <div className="cityline" />
            <div className="tree tree-a" />
            <div className="tree tree-b" />
            <div className="human walk-a" />
            <div className="human walk-b" />
            <div className="dog" />
            <div className="bird bird-a" />
            <div className="bird bird-b" />
            <div className="kite" />
          </div>
        </section>

        <div className="atmo-layer lower" />
        <div className="atmo-layer cloud-band" />
        <div className="atmo-layer strato" />
        <div className="atmo-layer meso" />
        <div className="atmo-layer thermo" />
        <div className="atmo-layer exo" />
        <div className="atmo-layer moon-black" />
        <div className="cloud c1" />
        <div className="cloud c2" />
        <div className="meteor-shower" />
        <div className="starfield" />
        <div className="earth-glow" />

        <div className="axis" />

        {placedObjects.map((item) => (
          <figure
            key={item.id}
            className={`world-object ${item.alignment} ${item.size}`}
            style={{ top: `${item.top}px` }}
          >
            <img src={images[item.id] ?? fallbackImage} alt={item.name} loading="lazy" decoding="async" />
            <figcaption>
              <strong>{item.name}</strong>
              <span>{item.displayAltitude}</span>
              {item.fact && <small>{item.fact}</small>}
            </figcaption>
          </figure>
        ))}

        <section className="moon-finish" style={{ top: `${TOP_PADDING + 120}px` }}>
          <img src={images.moon ?? fallbackImage} alt="Moon" loading="lazy" decoding="async" />
          <h2>You’ve traveled from Earth’s surface to the Moon.</h2>
          <p>Continue exploring or descend back to ground level.</p>
          <button onClick={() => (targetProgress.current = 0)}>Back to Earth</button>
        </section>

        <section className="credits" style={{ top: `${TOP_PADDING + 740}px` }}>
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
      </div>

      <div className="ascent-meter" aria-hidden="true">
        <div style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className={`scroll-hint ${progress > 0.08 ? 'hide' : ''}`}>Use mouse wheel ↑ or swipe ↑</div>
      <div className={`direction-glow ${Math.abs(velocity) > 0.0006 ? 'active' : ''}`} />
    </div>
  );
}
