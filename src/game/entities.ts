import * as THREE from 'three';

export type GameState = 'start' | 'playing' | 'paused' | 'gameover';
export type ObstacleKind = 'enemy' | 'traffic' | 'dino';

export interface HudState {
  gameState: GameState;
  speed: number;
  health: number;
  score: number;
  distance: number;
  takedowns: number;
  warning: string | null;
}

export interface WorldActor {
  mesh: THREE.Group;
  kind: ObstacleKind;
  lane: number;
  z: number;
  speed: number;
  radius: number;
  health: number;
  dead?: boolean;
  aggressive?: boolean;
  roarTimer?: number;
}

export interface Particle {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  velocity: THREE.Vector3;
}
