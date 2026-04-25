import { useEffect, useMemo, useState } from 'react';

type VisualStyle = 'ground' | 'nature' | 'architecture' | 'aircraft' | 'balloon' | 'atmosphere' | 'meteor' | 'spacecraft' | 'station' | 'satellite' | 'moon';

type AltitudeObject = {
  id: string;
  name: string;
  altitudeMeters: number;
  shortFact: string;
  type: string;
  visualStyle: VisualStyle;
};

const INTRO_HEIGHT_VH = 100;
const JOURNEY_HEIGHT = 22000;
const LINEAR_LIMIT_METERS = 100_000;
const MAX_ALTITUDE_METERS = 384_400_000;
const LINEAR_PORTION = 0.72;

// Add more entries here to extend the journey; cards and markers render automatically from this array.
const altitudeObjects: AltitudeObject[] = [
  { id: 'human', name: 'Human / Ground', altitudeMeters: 0, shortFact: 'Your launch point. Most weather and life stay close to this level.', type: 'surface', visualStyle: 'ground' },
  { id: 'trees', name: 'Trees', altitudeMeters: 10, shortFact: 'Tree canopies create their own microclimate and wind flow.', type: 'nature', visualStyle: 'nature' },
  { id: 'buildings', name: 'Tall buildings', altitudeMeters: 100, shortFact: 'At this height, wind engineering becomes a major design challenge.', type: 'architecture', visualStyle: 'architecture' },
  { id: 'burj', name: 'Burj Khalifa', altitudeMeters: 828, shortFact: 'The tallest building on Earth rises over 800 m into the sky.', type: 'architecture', visualStyle: 'architecture' },
  { id: 'village', name: 'Mountain villages', altitudeMeters: 2_000, shortFact: 'Many highland communities adapt to thinner air every day.', type: 'land', visualStyle: 'nature' },
  { id: 'camp', name: 'High mountain camps', altitudeMeters: 5_500, shortFact: 'Acclimatization becomes essential for climbing above this altitude.', type: 'mountain', visualStyle: 'nature' },
  { id: 'everest', name: 'Mount Everest', altitudeMeters: 8_848, shortFact: 'Earth’s highest natural summit reaches nearly 9 km.', type: 'mountain', visualStyle: 'nature' },
  { id: 'airliner', name: 'Commercial airliners', altitudeMeters: 11_000, shortFact: 'Most long-haul flights cruise near the top of the troposphere.', type: 'aircraft', visualStyle: 'aircraft' },
  { id: 'supersonic', name: 'Supersonic aircraft altitude', altitudeMeters: 18_000, shortFact: 'Faster aircraft often climb higher for thinner, lower-drag air.', type: 'aircraft', visualStyle: 'aircraft' },
  { id: 'balloon', name: 'Weather balloons', altitudeMeters: 25_000, shortFact: 'Research balloons carry instruments into the stratosphere.', type: 'science', visualStyle: 'balloon' },
  { id: 'jump', name: 'High-altitude jump', altitudeMeters: 39_000, shortFact: 'Human freefall records were set from near-space balloon capsules.', type: 'human', visualStyle: 'balloon' },
  { id: 'stratopause', name: 'Stratopause region', altitudeMeters: 50_000, shortFact: 'The stratosphere transitions at this upper boundary.', type: 'layer', visualStyle: 'atmosphere' },
  { id: 'meteors', name: 'Meteors begin glowing', altitudeMeters: 80_000, shortFact: 'Most shooting stars light up as they compress upper-atmosphere gases.', type: 'space', visualStyle: 'meteor' },
  { id: 'karman', name: 'Kármán line', altitudeMeters: 100_000, shortFact: 'A widely used boundary between atmosphere and space.', type: 'boundary', visualStyle: 'spacecraft' },
  { id: 'suborbital', name: 'Suborbital spacecraft', altitudeMeters: 120_000, shortFact: 'Vehicles can arc above 100 km without entering stable orbit.', type: 'spacecraft', visualStyle: 'spacecraft' },
  { id: 'iss', name: 'International Space Station', altitudeMeters: 400_000, shortFact: 'A continuously inhabited orbital laboratory circles Earth.', type: 'station', visualStyle: 'station' },
  { id: 'hubble', name: 'Hubble Space Telescope', altitudeMeters: 550_000, shortFact: 'Hubble transformed astronomy with decades of orbiting observations.', type: 'telescope', visualStyle: 'satellite' },
  { id: 'gps', name: 'GPS satellites', altitudeMeters: 20_200_000, shortFact: 'Navigation satellites orbit high enough for global coverage.', type: 'navigation', visualStyle: 'satellite' },
  { id: 'geo', name: 'Geostationary satellites', altitudeMeters: 35_786_000, shortFact: 'At this altitude, satellites match Earth’s rotation.', type: 'communications', visualStyle: 'satellite' },
  { id: 'moon', name: 'Moon', altitudeMeters: 384_400_000, shortFact: 'Earth’s natural satellite sits almost 384,400 km away on average.', type: 'deep-space', visualStyle: 'moon' },
];

const rulerTicks = [0, 100, 1_000, 5_000, 10_000, 20_000, 50_000, 100_000, 400_000, 550_000, 20_200_000, 35_786_000, 384_400_000];

const sectionTitles = [
  { title: 'The Sky Begins', min: 0, max: 2_000 },
  { title: 'Where Planes Fly', min: 2_000, max: 20_000 },
  { title: 'The Thin Blue Layer', min: 20_000, max: 85_000 },
  { title: 'Edge of Space', min: 85_000, max: 130_000 },
  { title: 'Low Earth Orbit', min: 130_000, max: 1_000_000 },
  { title: 'Far Above Home', min: 1_000_000, max: MAX_ALTITUDE_METERS },
];

const atmosphereLayers = [
  { label: 'Troposphere', start: 0, end: 12_000 },
  { label: 'Stratosphere', start: 12_000, end: 50_000 },
  { label: 'Mesosphere', start: 50_000, end: 85_000 },
  { label: 'Thermosphere', start: 85_000, end: 600_000 },
  { label: 'Exosphere', start: 600_000, end: 10_000_000 },
  { label: 'Orbit / Space', start: 100_000, end: MAX_ALTITUDE_METERS },
];

const formatMeters = (meters: number) =>
  meters >= 1_000_000 ? `${(meters / 1_000_000).toFixed(1)}M m` : meters >= 1_000 ? `${(meters / 1_000).toFixed(1)} km` : `${Math.round(meters).toLocaleString()} m`;

const altitudeToUnit = (altitudeMeters: number) => {
  const clamped = Math.max(0, Math.min(altitudeMeters, MAX_ALTITUDE_METERS));
  if (clamped <= LINEAR_LIMIT_METERS) return (clamped / LINEAR_LIMIT_METERS) * LINEAR_PORTION;
  const logMin = Math.log10(LINEAR_LIMIT_METERS);
  const logMax = Math.log10(MAX_ALTITUDE_METERS);
  const logValue = Math.log10(clamped);
  return LINEAR_PORTION + ((logValue - logMin) / (logMax - logMin)) * (1 - LINEAR_PORTION);
};

const unitToAltitude = (unit: number) => {
  const clamped = Math.max(0, Math.min(1, unit));
  if (clamped <= LINEAR_PORTION) return (clamped / LINEAR_PORTION) * LINEAR_LIMIT_METERS;
  const logMin = Math.log10(LINEAR_LIMIT_METERS);
  const logMax = Math.log10(MAX_ALTITUDE_METERS);
  const normalized = (clamped - LINEAR_PORTION) / (1 - LINEAR_PORTION);
  return Math.pow(10, logMin + normalized * (logMax - logMin));
};

export default function App() {
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 1000);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const introHeight = (INTRO_HEIGHT_VH / 100) * viewportHeight;
  const journeyProgress = Math.max(0, Math.min(1, (scrollY - introHeight) / JOURNEY_HEIGHT));
  const currentAltitude = unitToAltitude(journeyProgress);

  const activeSection = sectionTitles.find((section) => currentAltitude >= section.min && currentAltitude < section.max) ?? sectionTitles[sectionTitles.length - 1];

  const objectsWithPosition = useMemo(
    () =>
      altitudeObjects.map((item, index) => {
        const top = altitudeToUnit(item.altitudeMeters) * JOURNEY_HEIGHT;
        const inRange = Math.abs(top - journeyProgress * JOURNEY_HEIGHT) < viewportHeight * 0.85;
        return { ...item, top, side: index % 2 === 0 ? 'left' : 'right', inRange };
      }),
    [journeyProgress, viewportHeight],
  );

  const parallaxNear = journeyProgress * 140;
  const parallaxFar = journeyProgress * 55;

  return (
    <>
      <div className="progress-shell">
        <div className="progress-bar" style={{ transform: `scaleX(${journeyProgress})` }} />
      </div>

      <aside className="altitude-panel">
        <div className="altitude-value">Altitude</div>
        <strong>{Math.round(currentAltitude).toLocaleString()} m</strong>
        <div className="ruler">
          {rulerTicks.map((tick) => (
            <div key={tick} className="tick" style={{ top: `${altitudeToUnit(tick) * 100}%` }}>
              <span>{formatMeters(tick)}</span>
            </div>
          ))}
        </div>
        <div className="layer-list">
          {atmosphereLayers.map((layer) => (
            <div key={layer.label} className={`layer-chip ${currentAltitude >= layer.start && currentAltitude < layer.end ? 'active' : ''}`}>
              {layer.label}
            </div>
          ))}
        </div>
      </aside>

      <header className="intro" style={{ height: `${INTRO_HEIGHT_VH}vh` }}>
        <div className="horizon" />
        <div className="mountains" />
        <div className="cityline" />
        <div className="intro-cloud cloud-a" />
        <div className="intro-cloud cloud-b" />
        <div className="intro-content">
          <p className="eyebrow">Interactive altitude journey</p>
          <h1>From Air to Space</h1>
          <p>Scroll upward from Earth’s surface to the edge of space.</p>
          <div className="launch-hint">
            <span>Scroll to launch</span>
            <i />
          </div>
        </div>
      </header>

      <main className="journey" style={{ height: `${JOURNEY_HEIGHT}px`, ['--parallax-near' as string]: `${parallaxNear}px`, ['--parallax-far' as string]: `${parallaxFar}px` }}>
        <div className="section-title">{activeSection.title}</div>

        <div className="bg-layer lower-sky" />
        <div className="bg-layer cloud-zone" />
        <div className="bg-layer upper-atmosphere" />
        <div className="bg-layer mesosphere" />
        <div className="bg-layer edge-space" />
        <div className="bg-layer deep-space" />

        <div className="parallax-cloud p1" />
        <div className="parallax-cloud p2" />
        <div className="parallax-cloud p3" />
        <div className="star-field" />
        <div className="aurora-band" />
        <div className="earth-glow" />

        {objectsWithPosition.map((item) => (
          <article
            key={item.id}
            className={`object-card ${item.side} ${item.inRange ? 'visible' : ''}`}
            style={{ top: `${item.top}px` }}
          >
            <div className={`object-icon ${item.visualStyle}`} aria-hidden="true" />
            <div>
              <h3>{item.name}</h3>
              <p>{item.shortFact}</p>
              <small>{Math.round(item.altitudeMeters).toLocaleString()} m</small>
            </div>
          </article>
        ))}

        <button className="back-to-earth" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Back to Earth ↑
        </button>
      </main>
    </>
  );
}
