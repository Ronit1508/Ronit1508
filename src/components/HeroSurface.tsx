export function HeroSurface({ top }: { top: number }) {
  return (
    <section className="hero" style={{ top }}>
      <div className="hero-title-wrap">
        <h1>From Earth to Space</h1>
        <p>Scroll up to ascend through the atmosphere.</p>
        <div className="hero-cue">↑ Scroll up to ascend</div>
      </div>

      <div className="ground-illustration">
        <div className="ground-skyline" />
        <div className="ground-tree t-left" />
        <div className="ground-tree t-right" />
        <div className="ground-human h-one" />
        <div className="ground-human h-two" />
        <div className="ground-kid" />
        <div className="ground-dog" />
        <div className="ground-bird b-one" />
        <div className="ground-bird b-two" />
        <div className="hero-cloud c-one" />
        <div className="hero-cloud c-two" />
      </div>
    </section>
  );
}
