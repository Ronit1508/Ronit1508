import { useEffect, useRef, useState } from 'react';
import { GAME_TITLE, TUNING } from './game/constants';
import type { HudState } from './game/entities';
import { Game } from './game/Game';

const initialHud: HudState = {
  gameState: 'start',
  speed: 0,
  health: TUNING.playerHealth,
  score: 0,
  distance: 0,
  takedowns: 0,
  warning: null,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hud, setHud] = useState(initialHud);

  useEffect(() => {
    if (!mountRef.current) return;
    const game = new Game(mountRef.current, setHud);
    return () => game.dispose();
  }, []);

  const healthPct = Math.max(0, Math.min(100, hud.health));

  return (
    <div className="app">
      <div ref={mountRef} className="viewport" />

      <div className="hud-top">
        <div className="brand-chip">
          <p className="label">{GAME_TITLE}</p>
          <p className="sub">Desert Pursuit Protocol</p>
        </div>

        <div className="warning-slot">{hud.warning && <div className="warning">{hud.warning}</div>}</div>

        <div className="score-chip">
          <p className="label">Score</p>
          <p className="value">{Math.round(hud.score).toLocaleString()}</p>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="dash-card speed">
          <p className="label">Speed</p>
          <p className="value big">{Math.round(hud.speed)}</p>
          <p className="sub">km/h</p>
        </div>

        <div className="dash-card health">
          <p className="label">Hull / Health</p>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${healthPct}%` }} />
          </div>
          <p className="sub">{Math.round(healthPct)}%</p>
        </div>

        <div className="dash-card compact">
          <p className="label">Distance</p>
          <p className="value">{hud.distance.toFixed(2)} km</p>
        </div>

        <div className="dash-card compact">
          <p className="label">Takedowns</p>
          <p className="value">{hud.takedowns}</p>
        </div>
      </div>

      {hud.gameState === 'start' && (
        <div className="overlay start">
          <div className="overlay-panel">
            <h1>{GAME_TITLE}</h1>
            <p className="tagline">Ride hard. Fight dirty. Survive the dinosaur chaos on a burning desert highway.</p>
            <div className="controls-grid">
              <p><b>W / ↑</b> Accelerate</p>
              <p><b>S / ↓</b> Brake</p>
              <p><b>A / D</b> Steer</p>
              <p><b>Space</b> Attack nearby biker</p>
              <p><b>P</b> Pause</p>
              <p><b>R</b> Restart</p>
            </div>
            <button>Press Enter to Start</button>
          </div>
        </div>
      )}

      {hud.gameState === 'paused' && (
        <div className="overlay paused">
          <div className="overlay-panel mini">
            <h1>Paused</h1>
            <p>Press P to resume your run.</p>
          </div>
        </div>
      )}

      {hud.gameState === 'gameover' && (
        <div className="overlay gameover">
          <div className="overlay-panel">
            <h1>Ride Over</h1>
            <p className="tagline">You got wrecked in the chaos.</p>
            <div className="results-row">
              <div>
                <p className="label">Final Score</p>
                <p className="value">{Math.round(hud.score).toLocaleString()}</p>
              </div>
              <div>
                <p className="label">Distance</p>
                <p className="value">{hud.distance.toFixed(2)} km</p>
              </div>
              <div>
                <p className="label">Takedowns</p>
                <p className="value">{hud.takedowns}</p>
              </div>
            </div>
            <button>Press R to Restart</button>
          </div>
        </div>
      )}
    </div>
  );
}
