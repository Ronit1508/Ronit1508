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

  return (
    <div className="app">
      <div ref={mountRef} className="viewport" />

      <div className="hud">
        <div className="stat"><span>Speed</span><strong>{Math.round(hud.speed)} km/h</strong></div>
        <div className="stat"><span>Health</span><strong>{Math.max(0, Math.round(hud.health))}%</strong></div>
        <div className="stat"><span>Score</span><strong>{Math.round(hud.score).toLocaleString()}</strong></div>
        <div className="stat"><span>Distance</span><strong>{hud.distance.toFixed(2)} km</strong></div>
        <div className="stat"><span>Takedowns</span><strong>{hud.takedowns}</strong></div>
      </div>

      {hud.warning && <div className="warning">{hud.warning}</div>}

      {hud.gameState === 'start' && (
        <div className="overlay">
          <h1>{GAME_TITLE}</h1>
          <p>3D arcade highway combat. Dodge traffic, smash rivals, survive dinosaur chaos.</p>
          <ul>
            <li><b>W / ↑</b> Accelerate</li>
            <li><b>S / ↓</b> Brake</li>
            <li><b>A/D / ←/→</b> Steer</li>
            <li><b>Space</b> Attack nearby biker</li>
            <li><b>P</b> Pause</li>
            <li><b>R</b> Restart after crash</li>
          </ul>
          <button>Press Enter to Ride</button>
        </div>
      )}

      {hud.gameState === 'paused' && (
        <div className="overlay">
          <h1>Paused</h1>
          <p>Press P to resume the run.</p>
        </div>
      )}

      {hud.gameState === 'gameover' && (
        <div className="overlay gameover">
          <h1>Wrecked Out</h1>
          <p>Final Score: {Math.round(hud.score).toLocaleString()}</p>
          <p>Distance: {hud.distance.toFixed(2)} km · Takedowns: {hud.takedowns}</p>
          <button>Press R to restart</button>
        </div>
      )}
    </div>
  );
}
