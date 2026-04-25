import { useEffect, useMemo, useState } from 'react';

type LayerName = 'Troposphere' | 'Stratosphere' | 'Mesosphere' | 'Thermosphere' | 'Exosphere' | 'Cislunar Space';

type JourneyItem = {
  id: string;
  name: string;
  altitudeMeters: number;
  displayAltitude: string;
  category: string;
  fact: string;
  imageUrl?: string;
  imageCredit: string;
  imageSource: string;
  wikiTitle?: string;
  alignment: 'left' | 'right';
  layer: LayerName;
};

const INTRO_VH = 100;
const JOURNEY_HEIGHT = 26000;
const LINEAR_LIMIT = 100_000;
const LINEAR_WEIGHT = 0.72;
const MAX_ALTITUDE = 384_400_000;
const CARD_GAP = 340;

const layerBands: Array<{ name: LayerName; min: number; max: number }> = [
  { name: 'Troposphere', min: 0, max: 12_000 },
  { name: 'Stratosphere', min: 12_000, max: 50_000 },
  { name: 'Mesosphere', min: 50_000, max: 85_000 },
  { name: 'Thermosphere', min: 85_000, max: 690_000 },
  { name: 'Exosphere', min: 690_000, max: 10_000_000 },
  { name: 'Cislunar Space', min: 10_000_000, max: MAX_ALTITUDE + 1 },
];

const importantTicks = [
  0,
  100,
  1_000,
  5_000,
  10_000,
  20_000,
  50_000,
  100_000,
  400_000,
  550_000,
  20_200_000,
  35_786_000,
  384_400_000,
];

// Add additional entries here: cards, credits, and timeline placement render from this array.
const journeyItems: JourneyItem[] = [
  { id: 'ground', name: 'Human / Ground Level', altitudeMeters: 0, displayAltitude: '0 m', category: 'Surface', fact: 'Sea level is the starting reference for this ascent.', wikiTitle: 'Human', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Human', alignment: 'left', layer: 'Troposphere' },
  { id: 'trees', name: 'Tree Canopy', altitudeMeters: 12, displayAltitude: '12 m', category: 'Nature', fact: 'Urban trees can cool neighborhoods by several degrees.', wikiTitle: 'Tree', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Tree', alignment: 'right', layer: 'Troposphere' },
  { id: 'butterfly', name: 'Butterflies & Bees', altitudeMeters: 40, displayAltitude: '40 m', category: 'Life', fact: 'Insects can ride thermal currents higher than many buildings.', wikiTitle: 'Butterfly', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Butterfly', alignment: 'left', layer: 'Troposphere' },
  { id: 'buildings', name: 'Tall Buildings', altitudeMeters: 100, displayAltitude: '100 m', category: 'Architecture', fact: 'Around this height, structural wind loading becomes dominant.', wikiTitle: 'Skyscraper', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Skyscraper', alignment: 'right', layer: 'Troposphere' },
  { id: 'eiffel', name: 'Eiffel Tower', altitudeMeters: 330, displayAltitude: '330 m', category: 'Monument', fact: 'The Eiffel Tower reaches roughly 330 m with antennas.', wikiTitle: 'Eiffel_Tower', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Eiffel_Tower', alignment: 'left', layer: 'Troposphere' },
  { id: 'empire', name: 'Empire State Building', altitudeMeters: 443, displayAltitude: '443 m', category: 'Monument', fact: 'Its tip stands over 440 m above Manhattan.', wikiTitle: 'Empire_State_Building', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Empire_State_Building', alignment: 'right', layer: 'Troposphere' },
  { id: 'burj', name: 'Burj Khalifa', altitudeMeters: 828, displayAltitude: '828 m', category: 'Monument', fact: 'The tallest skyscraper on Earth towers into thin urban air.', wikiTitle: 'Burj_Khalifa', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Burj_Khalifa', alignment: 'left', layer: 'Troposphere' },
  { id: 'eagle', name: 'Eagles in Soaring Flight', altitudeMeters: 2_000, displayAltitude: '2 km', category: 'Life', fact: 'Raptors exploit thermals to climb with minimal energy.', wikiTitle: 'Eagle', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Eagle', alignment: 'right', layer: 'Troposphere' },
  { id: 'village', name: 'Mountain Villages', altitudeMeters: 2_500, displayAltitude: '2.5 km', category: 'Terrain', fact: 'Millions of people live permanently above 2,000 meters.', wikiTitle: 'Mountain_village', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Mountain_village', alignment: 'left', layer: 'Troposphere' },
  { id: 'goose', name: 'Bar-headed Geese', altitudeMeters: 7_000, displayAltitude: '7 km', category: 'Life', fact: 'These geese migrate across the Himalaya in extremely thin air.', wikiTitle: 'Bar-headed_goose', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Bar-headed_goose', alignment: 'right', layer: 'Troposphere' },
  { id: 'everest', name: 'Mount Everest', altitudeMeters: 8_848, displayAltitude: '8,848 m', category: 'Terrain', fact: 'Earth’s highest mountain peak reaches the jet stream zone.', wikiTitle: 'Mount_Everest', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Mount_Everest', alignment: 'left', layer: 'Troposphere' },
  { id: 'airliner', name: 'Commercial Airliner', altitudeMeters: 11_000, displayAltitude: '11 km', category: 'Aviation', fact: 'Most long-haul jets cruise near the tropopause.', wikiTitle: 'Airliner', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Airliner', alignment: 'right', layer: 'Troposphere' },
  { id: 'privatejet', name: 'Private Jet', altitudeMeters: 14_000, displayAltitude: '14 km', category: 'Aviation', fact: 'Business jets often fly higher than commercial traffic.', wikiTitle: 'Business_jet', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Business_jet', alignment: 'left', layer: 'Stratosphere' },
  { id: 'concorde', name: 'Supersonic Flight Zone', altitudeMeters: 18_000, displayAltitude: '18 km', category: 'Aviation', fact: 'Concorde cruised around this altitude while supersonic.', wikiTitle: 'Concorde', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Concorde', alignment: 'right', layer: 'Stratosphere' },
  { id: 'balloon', name: 'Weather Balloon', altitudeMeters: 27_000, displayAltitude: '27 km', category: 'Science', fact: 'Balloons profile temperature, pressure, and humidity aloft.', wikiTitle: 'Weather_balloon', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Weather_balloon', alignment: 'left', layer: 'Stratosphere' },
  { id: 'baumgartner', name: 'High-altitude Jump Zone', altitudeMeters: 39_000, displayAltitude: '39 km', category: 'Human Record', fact: 'Felix Baumgartner’s jump crossed this near-space region.', wikiTitle: 'Felix_Baumgartner', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Felix_Baumgartner', alignment: 'right', layer: 'Stratosphere' },
  { id: 'meteor', name: 'Meteors Begin Glowing', altitudeMeters: 80_000, displayAltitude: '80 km', category: 'Upper Atmosphere', fact: 'Most meteors become visible in the mesosphere.', wikiTitle: 'Meteor', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Meteor', alignment: 'left', layer: 'Mesosphere' },
  { id: 'karman', name: 'Kármán Line', altitudeMeters: 100_000, displayAltitude: '100 km', category: 'Boundary', fact: 'A commonly used edge between atmosphere and space.', wikiTitle: 'K%C3%A1rm%C3%A1n_line', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/K%C3%A1rm%C3%A1n_line', alignment: 'right', layer: 'Thermosphere' },
  { id: 'suborbital', name: 'Suborbital Spacecraft', altitudeMeters: 120_000, displayAltitude: '120 km', category: 'Spaceflight', fact: 'Suborbital flights cross space without completing an orbit.', wikiTitle: 'Sub-orbital_spaceflight', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Sub-orbital_spaceflight', alignment: 'left', layer: 'Thermosphere' },
  { id: 'iss', name: 'International Space Station', altitudeMeters: 400_000, displayAltitude: '400 km', category: 'Orbit', fact: 'The ISS circles Earth about every 90 minutes.', wikiTitle: 'International_Space_Station', imageCredit: 'NASA / Wikimedia Commons', imageSource: 'https://en.wikipedia.org/wiki/International_Space_Station', alignment: 'right', layer: 'Thermosphere' },
  { id: 'hubble', name: 'Hubble Space Telescope', altitudeMeters: 550_000, displayAltitude: '550 km', category: 'Orbit', fact: 'Hubble’s long mission reshaped modern astronomy.', wikiTitle: 'Hubble_Space_Telescope', imageCredit: 'NASA / Wikimedia Commons', imageSource: 'https://en.wikipedia.org/wiki/Hubble_Space_Telescope', alignment: 'left', layer: 'Thermosphere' },
  { id: 'gps', name: 'GPS Constellation', altitudeMeters: 20_200_000, displayAltitude: '20,200 km', category: 'Navigation Orbit', fact: 'GPS satellites provide timing and positioning worldwide.', wikiTitle: 'Global_Positioning_System', imageCredit: 'U.S. Space Force / Wikimedia Commons', imageSource: 'https://en.wikipedia.org/wiki/Global_Positioning_System', alignment: 'right', layer: 'Exosphere' },
  { id: 'geo', name: 'Geostationary Belt', altitudeMeters: 35_786_000, displayAltitude: '35,786 km', category: 'Communications Orbit', fact: 'At geostationary altitude, satellites appear fixed in the sky.', wikiTitle: 'Geostationary_orbit', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Geostationary_orbit', alignment: 'left', layer: 'Exosphere' },
  { id: 'moon', name: 'Moon', altitudeMeters: 384_400_000, displayAltitude: '384,400 km', category: 'Deep Space', fact: 'Average Earth–Moon distance: roughly 384,400 km.', wikiTitle: 'Moon', imageCredit: 'NASA / Wikimedia Commons', imageSource: 'https://en.wikipedia.org/wiki/Moon', alignment: 'right', layer: 'Cislunar Space' },
];

const fallbackImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%233e7cd6"/><stop offset="1" stop-color="%23080d22"/></linearGradient></defs><rect width="1200" height="675" fill="url(%23g)"/><circle cx="900" cy="190" r="90" fill="%23d6e8ff" opacity="0.65"/></svg>';

const altitudeToUnit = (altitude: number) => {
  const clamped = Math.max(0, Math.min(MAX_ALTITUDE, altitude));
  if (clamped <= LINEAR_LIMIT) return (clamped / LINEAR_LIMIT) * LINEAR_WEIGHT;
  const minLog = Math.log10(LINEAR_LIMIT);
  const maxLog = Math.log10(MAX_ALTITUDE);
  const valueLog = Math.log10(clamped);
  return LINEAR_WEIGHT + ((valueLog - minLog) / (maxLog - minLog)) * (1 - LINEAR_WEIGHT);
};

const unitToAltitude = (unit: number) => {
  const clamped = Math.max(0, Math.min(1, unit));
  if (clamped <= LINEAR_WEIGHT) return (clamped / LINEAR_WEIGHT) * LINEAR_LIMIT;
  const minLog = Math.log10(LINEAR_LIMIT);
  const maxLog = Math.log10(MAX_ALTITUDE);
  const scaled = (clamped - LINEAR_WEIGHT) / (1 - LINEAR_WEIGHT);
  return Math.pow(10, minLog + scaled * (maxLog - minLog));
};

const formatTick = (meters: number) => {
  if (meters < 1000) return `${meters.toLocaleString()} m`;
  return `${(meters / 1000).toLocaleString()} km`;
};

const getLayer = (meters: number) =>
  layerBands.find((layer) => meters >= layer.min && meters < layer.max)?.name ?? 'Cislunar Space';

function useImageSummaries(items: JourneyItem[]) {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const entries = await Promise.all(
        items.map(async (item) => {
          if (!item.wikiTitle) return [item.id, item.imageUrl ?? fallbackImage] as const;
          try {
            const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.wikiTitle)}`);
            if (!response.ok) throw new Error('No summary image');
            const data = await response.json();
            return [item.id, data.thumbnail?.source ?? data.originalimage?.source ?? item.imageUrl ?? fallbackImage] as const;
          } catch {
            return [item.id, item.imageUrl ?? fallbackImage] as const;
          }
        }),
      );

      if (!cancelled) setImages(Object.fromEntries(entries));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  return images;
}

export default function App() {
  const [scrollY, setScrollY] = useState(0);
  const [viewport, setViewport] = useState(typeof window !== 'undefined' ? window.innerHeight : 900);
  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>({});

  const images = useImageSummaries(journeyItems);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    const onResize = () => setViewport(window.innerHeight);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const introHeight = (INTRO_VH / 100) * viewport;
  const progress = Math.max(0, Math.min(1, (scrollY - introHeight) / JOURNEY_HEIGHT));
  const currentAltitude = unitToAltitude(progress);
  const activeLayer = getLayer(currentAltitude);

  const positionedItems = useMemo(() => {
    const withBase = journeyItems
      .map((item) => ({ ...item, baseTop: altitudeToUnit(item.altitudeMeters) * JOURNEY_HEIGHT }))
      .sort((a, b) => a.baseTop - b.baseTop);

    let runningTop = -9999;
    return withBase.map((item) => {
      const top = Math.max(item.baseTop, runningTop + CARD_GAP);
      runningTop = top;
      return { ...item, top };
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleCards((prev) => {
          const next = { ...prev };
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.cardId;
            if (id && entry.isIntersecting) next[id] = true;
          }
          return next;
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.2 },
    );

    document.querySelectorAll<HTMLElement>('.journey-card').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [positionedItems]);

  const displayTicks = useMemo(() => {
    const raw = importantTicks.map((value) => ({
      value,
      y: altitudeToUnit(value) * 200,
      label: formatTick(value),
    }));

    let prev = -1000;
    return raw.map((tick) => {
      const y = Math.max(tick.y, prev + 14);
      prev = y;
      return { ...tick, y: Math.min(200, y) };
    });
  }, []);

  const sectionTitle =
    currentAltitude < 4_000
      ? 'The Sky Begins'
      : currentAltitude < 30_000
        ? 'Where Aircraft Rule the Air'
        : currentAltitude < 110_000
          ? 'The Thin Blue Edge'
          : currentAltitude < 1_000_000
            ? 'Low Earth Orbit'
            : currentAltitude < 40_000_000
              ? 'Far Above Home'
              : 'Toward the Moon';

  const uniqueCredits = Array.from(new Map(journeyItems.map((item) => [item.imageSource, { credit: item.imageCredit, source: item.imageSource }])).values());

  return (
    <>
      <div className="top-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <aside className="hud" aria-label="Altitude HUD">
        <div className="hud-chip">{Math.round(currentAltitude).toLocaleString()} m</div>
        <div className="hud-layer">{activeLayer}</div>
        <div className="hud-meter" role="presentation">
          {displayTicks.map((tick) => (
            <div key={tick.value} className="hud-tick" style={{ top: `${tick.y}px` }}>
              <i />
              <span>{tick.label}</span>
            </div>
          ))}
          <div className="hud-indicator" style={{ top: `${progress * 200}px` }} />
        </div>
      </aside>

      <header className="hero" style={{ height: `${INTRO_VH}vh` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="kicker">From Earth to cislunar space</p>
          <h1>From Air to Space</h1>
          <p className="subtitle">A vertical ascent through atmosphere, orbit, and beyond.</p>
          <div className="begin-ascent">Scroll up to ascend <b>↑</b></div>
        </div>
        <div className="hero-ground" />
      </header>

      <main
        className="journey"
        style={{
          height: `${JOURNEY_HEIGHT}px`,
          ['--near-shift' as string]: `${progress * 130}px`,
          ['--far-shift' as string]: `${progress * 48}px`,
        }}
      >
        <div className="journey-title">{sectionTitle}</div>
        <div className="ascent-line" />
        <div className="bg ground" />
        <div className="bg troposphere" />
        <div className="bg stratosphere" />
        <div className="bg mesosphere" />
        <div className="bg thermosphere" />
        <div className="bg exosphere" />
        <div className="bg moonspace" />
        <div className="cloud near" />
        <div className="cloud far" />
        <div className="particles" />
        <div className="stars" />
        <div className="earth-curve" />

        {positionedItems.map((item) => (
          <article
            key={item.id}
            data-card-id={item.id}
            className={`journey-card ${item.alignment} ${visibleCards[item.id] ? 'show' : ''}`}
            style={{ top: `${item.top}px` }}
          >
            <div className="card-image-wrap">
              <img src={images[item.id] ?? fallbackImage} alt={item.name} loading="lazy" decoding="async" />
              <div className="card-category">{item.category}</div>
            </div>
            <div className="card-copy">
              <h3>{item.name}</h3>
              <p>{item.fact}</p>
              <div className="card-meta">
                <span>{item.displayAltitude}</span>
                <span>{item.layer}</span>
              </div>
            </div>
          </article>
        ))}

        <section className="moon-finale" style={{ top: `${JOURNEY_HEIGHT - 780}px` }}>
          <img
            src={images.moon ?? fallbackImage}
            alt="The Moon"
            loading="lazy"
            decoding="async"
          />
          <div>
            <p className="kicker">Final destination</p>
            <h2>You’ve traveled from Earth’s surface to the Moon.</h2>
            <p>From wind, birds, and jets to orbital laboratories and cislunar darkness — this is the full vertical scale above home.</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to Earth</button>
          </div>
        </section>
      </main>

      <footer className="credits">
        <h3>Image credits & sources</h3>
        <p>Photos are loaded from Wikipedia/Wikimedia summaries and related public-domain or permissive sources.</p>
        <ul>
          {uniqueCredits.map((entry) => (
            <li key={entry.source}>
              <span>{entry.credit}</span>
              <a href={entry.source} target="_blank" rel="noreferrer">{entry.source}</a>
            </li>
          ))}
        </ul>
      </footer>
    </>
  );
}
