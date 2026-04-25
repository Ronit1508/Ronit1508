import * as THREE from 'three';

export type GameState = 'start' | 'playing' | 'gameover' | 'victory';

export interface Bullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  radius: number;
  damage: number;
  fromEnemy: boolean;
  life: number;
}

export interface Enemy {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  health: number;
  radius: number;
  fireTimer: number;
  fireCadence: number;
  isBoss?: boolean;
  phase?: number;
}

export interface Obstacle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  radius: number;
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export interface HudState {
  score: number;
  health: number;
  wave: number;
  time: number;
  gameState: GameState;
  bossHealth?: number;
  bossMaxHealth?: number;
}
