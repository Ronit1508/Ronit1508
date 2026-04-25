import { useEffect, useMemo, useRef, useState } from 'react';
import { altitudeItems } from './data/altitudeItems';
import { Credits } from './components/Credits';
import { HeroSurface } from './components/HeroSurface';
import { MoonArrival } from './components/MoonArrival';
import { AltitudeWorld } from './components/AltitudeWorld';
import { WORLD_HEIGHT_PX, WORLD_TOP_PADDING, formatAltitude, getLayerByAltitude, mapWorldYToAltitude } from './lib/scale';

const fallbackImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%233d78d3"/><stop offset="1" stop-color="%23030818"/></linearGradient></defs><rect width="640" height="480" fill="url(%23g)"/></svg>';

function useWikiImageMap() {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const pairs = await Promise.all(
        altitudeItems.map(async (item) => {
          try {
            const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.wikiTitle)}`);
            if (!response.ok) throw new Error('Image fetch failed');
            const data = await response.json();
            return [item.id, data.thumbnail?.source ?? data.originalimage?.source ?? fallbackImage] as const;
          } catch {
            return [item.id, fallbackImage] as const;
          }
        }),
      );
      if (!cancelled) setImages(Object.fromEntries(pairs));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return images;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef(0);
  const targetProgressRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 900);
  const [touchY, setTouchY] = useState<number | null>(null);

  const imageMap = useWikiImageMap();

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const tick = () => {
      setProgress((prev) => prev + (targetProgressRef.current - prev) * 0.12);
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = -event.deltaY * 0.00048;
      targetProgressRef.current = Math.max(0, Math.min(1, targetProgressRef.current + delta));
    };

    const onTouchStart = (event: TouchEvent) => setTouchY(event.touches[0]?.clientY ?? null);

    const onTouchMove = (event: TouchEvent) => {
      if (touchY == null) return;
      event.preventDefault();
      const current = event.touches[0]?.clientY ?? touchY;
      const delta = touchY - current;
      targetProgressRef.current = Math.max(0, Math.min(1, targetProgressRef.current + delta * 0.0016));
      setTouchY(current);
    };

    const onTouchEnd = () => setTouchY(null);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') targetProgressRef.current = Math.min(1, targetProgressRef.current + 0.025);
      if (event.key === 'ArrowDown') targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.025);
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

  const maxCameraTop = WORLD_HEIGHT_PX - viewportHeight;
  const cameraTop = (1 - progress) * maxCameraTop;
  const worldY = -cameraTop;

  const cameraWorldDistance = progress * (WORLD_HEIGHT_PX - WORLD_TOP_PADDING - 900);
  const altitude = mapWorldYToAltitude(cameraWorldDistance);
  const layer = getLayerByAltitude(altitude);

  const credits = useMemo(
    () => Array.from(new Map(altitudeItems.map((item) => [item.imageSource, { credit: item.imageCredit, source: item.imageSource }])).values()),
    [],
  );

  return (
    <div className="app-shell" ref={containerRef}>
      <div className="micro-status">{formatAltitude(altitude)} · {layer}</div>

      <div className="world-root" style={{ transform: `translate3d(0, ${worldY}px, 0)` }}>
        <HeroSurface top={WORLD_HEIGHT_PX - viewportHeight - 100} />
        <AltitudeWorld imageMap={imageMap} />
        <MoonArrival top={WORLD_TOP_PADDING + 120} moonImage={imageMap.moon ?? fallbackImage} onBack={() => (targetProgressRef.current = 0)} />
        <Credits top={WORLD_TOP_PADDING + 760} credits={credits} />
      </div>

      <div className={`interaction-hint ${progress > 0.08 ? 'hidden' : ''}`}>Use wheel ↑ / swipe ↑ / ↑ key</div>
    </div>
  );
}
