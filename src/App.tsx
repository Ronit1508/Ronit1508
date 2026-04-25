import { useEffect, useMemo, useRef, useState } from 'react';
import { GAME_TITLE, TUNING } from './game/constants';
import { Game } from './game/Game';
import type { HudState } from './game/entities';

const initialHud: HudState = {
  score: 0,
  health: TUNING.playerHealth,
  wave: 1,
  time: 0,
  gameState: 'start',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [hud, setHud] = useState<HudState>(initialHud);

  useEffect(() => {
    if (!mountRef.current) return;

    const game = new Game(mountRef.current, {
      onHudUpdate: (nextHud) => setHud(nextHud),
    });
    gameRef.current = game;

    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  const healthPct = useMemo(() => Math.max(0, Math.min(100, (hud.health / TUNING.playerHealth) * 100)), [hud.health]);
  const bossHealthPct = useMemo(() => {
    if (!hud.bossHealth || !hud.bossMaxHealth) return 0;
    return Math.max(0, Math.min(100, (hud.bossHealth / hud.bossMaxHealth) * 100));
  }, [hud.bossHealth, hud.bossMaxHealth]);

  return (
    <div className="app-shell">
      <div className="game-canvas" ref={mountRef} />

      <div className="hud">
        <div className="hud-row">
          <div className="hud-card">
            <p className="label">Health</p>
            <div className="bar-track">
              <div className="bar-fill health" style={{ width: `${healthPct}%` }} />
            </div>
            <p className="value">{Math.ceil(hud.health)}</p>
          </div>

          <div className="hud-card center">
            <p className="label">{hud.bossHealth ? 'Boss Encounter' : 'Wave'}</p>
            <p className="value">{hud.bossHealth ? 'Overlord Sigma' : `${hud.wave}/${TUNING.totalWaves}`}</p>
            <p className="sub">Time {formatTime(hud.time)}</p>
          </div>

          <div className="hud-card right">
            <p className="label">Score</p>
            <p className="value">{hud.score.toString().padStart(6, '0')}</p>
          </div>
        </div>

        {hud.bossHealth !== undefined && (
          <div className="boss-bar-wrap">
            <p className="label">Boss Hull Integrity</p>
            <div className="bar-track boss">
              <div className="bar-fill boss" style={{ width: `${bossHealthPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {hud.gameState === 'start' && (
        <div className="overlay">
          <h1>{GAME_TITLE}</h1>
          <p className="tagline">Retro rail-shooter through collapsing neon rifts.</p>
          <div className="controls-grid">
            <p><strong>Move:</strong> Arrow Keys / WASD</p>
            <p><strong>Shoot:</strong> Space or Click/Tap</p>
            <p><strong>Dodge Roll:</strong> Shift</p>
            <p><strong>Touch:</strong> Drag to steer</p>
          </div>
          <p className="prompt">Press Enter to Start</p>
        </div>
      )}

      {hud.gameState === 'gameover' && (
        <div className="overlay">
          <h1>Mission Failed</h1>
          <p>Your final score: {hud.score}</p>
          <p className="prompt">Press R to Restart</p>
        </div>
      )}

      {hud.gameState === 'victory' && (
        <div className="overlay victory">
          <h1>Sector Cleared</h1>
          <p>Final score: {hud.score}</p>
          <p className="prompt">Press R to Run Again</p>
        </div>
      )}
    </div>
  );
}
