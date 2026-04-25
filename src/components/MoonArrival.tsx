export function MoonArrival({ top, moonImage, onBack }: { top: number; moonImage: string; onBack: () => void }) {
  return (
    <section className="moon-arrival" style={{ top }}>
      <img src={moonImage} alt="Moon" loading="lazy" decoding="async" />
      <h2>From the ground beneath your feet to the Moon above.</h2>
      <p>The atmosphere fades, orbit thins out, and the lunar horizon finally appears.</p>
      <button onClick={onBack}>Back to Earth</button>
    </section>
  );
}
