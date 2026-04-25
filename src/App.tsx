import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { HeroSurface } from './components/HeroSurface';
import { LayerBackground } from './components/LayerBackground';
import { AltitudeWorld } from './components/AltitudeWorld';
import { Credits } from './components/Credits';
import { WORLD_HEIGHT, WORLD_TOP, WORLD_BOTTOM, altitudeLayerName, formatAltitude, mapYToAltitude } from './lib/scale';

export default function App() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const targetRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 900);
  const [touchY, setTouchY] = useState<number | null>(null);

  useEffect(() => {
    const resize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const loop = () => {
      setProgress((prev) => prev + (targetRef.current - prev) * 0.12);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const root = viewportRef.current;
    if (!root) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      targetRef.current = Math.max(0, Math.min(1, targetRef.current - event.deltaY * 0.0005));
    };

    const onTouchStart = (event: TouchEvent) => setTouchY(event.touches[0]?.clientY ?? null);

    const onTouchMove = (event: TouchEvent) => {
      if (touchY == null) return;
      event.preventDefault();
      const current = event.touches[0]?.clientY ?? touchY;
      const delta = touchY - current;
      targetRef.current = Math.max(0, Math.min(1, targetRef.current + delta * 0.0016));
      setTouchY(current);
    };

    const onTouchEnd = () => setTouchY(null);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') targetRef.current = Math.min(1, targetRef.current + 0.03);
      if (event.key === 'ArrowDown') targetRef.current = Math.max(0, targetRef.current - 0.03);
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: false });
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    root.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [touchY]);

  const maxTop = WORLD_HEIGHT - viewportHeight;
  const cameraTop = (1 - progress) * maxTop;
  const worldTransform = -cameraTop;

  const distanceFromGround = progress * (WORLD_HEIGHT - WORLD_TOP - WORLD_BOTTOM);
  const liveAltitude = mapYToAltitude(distanceFromGround);
  const layer = altitudeLayerName(liveAltitude);

  const hintHidden = progress > 0.08;

  const moonCreditsTop = useMemo(() => WORLD_TOP + 860, []);

  return (
    <div className="viewport" ref={viewportRef}>
      <div className="status-pill">{formatAltitude(liveAltitude)} · {layer}</div>

      <div className="world" style={{ transform: `translate3d(0, ${worldTransform}px, 0)` }}>
        <LayerBackground />
        <HeroSurface top={WORLD_HEIGHT - viewportHeight - 120} />
        <AltitudeWorld onBack={() => (targetRef.current = 0)} />
        <Credits top={moonCreditsTop} />
      </div>

      <div className={`input-hint ${hintHidden ? 'hidden' : ''}`}>Use wheel ↑ / swipe ↑ / ↑ key</div>
    </div>
  );
}
