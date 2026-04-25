export function HeroSurface({ top }: { top: number }) {
  return (
    <section className="hero-surface" style={{ top }}>
      <div className="hero-sky" />
      <div className="hero-copy">
        <h1>From Earth to Space</h1>
        <p>Scroll up to ascend through the atmosphere.</p>
        <span>↑ Scroll up to ascend</span>
      </div>
      <div className="surface-world">
        <div className="surface-skyline" />
        <div className="surface-tree tree-left" />
        <div className="surface-tree tree-right" />
        <div className="surface-person person-a" />
        <div className="surface-person person-b" />
        <div className="surface-kid" />
        <div className="surface-dog" />
        <div className="surface-bird bird-a" />
        <div className="surface-bird bird-b" />
        <div className="surface-cloud cloud-a" />
        <div className="surface-cloud cloud-b" />
      </div>
    </section>
  );
}
