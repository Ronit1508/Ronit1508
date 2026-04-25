import { useEffect, useMemo, useRef, useState } from 'react';
import { GAME_TITLE, TUNING } from './game/constants';
import { Game } from './game/Game';
import type { HudState } from './game/entities';

const initialHud: HudState = {
  score: 0,
  health: TUNING.playerHealth,
  wave: 1,
  time: 0,
  combo: 1,
  earlyRush: true,
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
  const [hud, setHud] = useState<HudState>(initialHud);

  useEffect(() => {
    if (!mountRef.current) return;

    const game = new Game(mountRef.current, {
      onHudUpdate: (nextHud) => setHud(nextHud),
    });

    return () => game.dispose();
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
            <p className="label">{hud.bossHealth ? 'Boss Encounter' : hud.bossWarning ? 'Incoming' : 'Wave'}</p>
            <p className="value">{hud.bossHealth ? 'Overlord Sigma' : hud.bossWarning ? 'WARNING' : `${hud.wave}/${TUNING.totalWaves}`}</p>
            <p className="sub">Time {formatTime(hud.time)} · Combo x{hud.combo.toFixed(1)}</p>
          </div>

          <div className="hud-card right">
            <p className="label">Score</p>
            <p className="value">{hud.score.toString().padStart(6, '0')}</p>
            {hud.earlyRush && <p className="rush-tag">EARLY RUSH BONUS</p>}
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

        {hud.bossWarning !== undefined && (
          <div className="boss-warning">
            <p>BOSS ALERT · ETA {hud.bossWarning.toFixed(1)}s</p>
          </div>
        )}
      </div>

      {hud.gameState === 'start' && (
        <div className="overlay start">
          <h1>{GAME_TITLE}</h1>
          <p className="tagline">Dive into neon warp lanes and survive the first 30-second rush.</p>
          <div className="controls-grid">
            <p><strong>Move:</strong> Arrow Keys / WASD / Drag</p>
            <p><strong>Shoot:</strong> Space / Click / Tap (auto-fire while dragging on touch)</p>
            <p><strong>Dodge Roll:</strong> Shift</p>
            <p><strong>Restart:</strong> R</p>
          </div>
          <p className="prompt">Press Enter to Start Mission</p>
        </div>
      )}

      {hud.gameState === 'gameover' && (
        <div className="overlay gameover">
          <h1>Mission Failed</h1>
          <p>Final score: {hud.score.toLocaleString()}</p>
          <p>Longest combo multiplier: x{hud.combo.toFixed(1)}</p>
          <p className="prompt">Press R to Launch Again</p>
        </div>
      )}

      {hud.gameState === 'victory' && (
        <div className="overlay victory">
          <h1>Sector Cleared</h1>
          <p>Final score: {hud.score.toLocaleString()}</p>
          <p>You shattered the Overlord dreadnought.</p>
          <p className="prompt">Press R to Run Again</p>
        </div>
      )}
    </div>
  );
}
