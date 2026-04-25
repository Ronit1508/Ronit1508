export const GAME_TITLE = 'Dino Rash: Highway Chaos';

export const LANES = [-6, -2, 2, 6];

export const TUNING = {
  maxSpeed: 210,
  minSpeed: 0,
  baseSpeed: 70,
  accelRate: 68,
  brakeRate: 92,
  drag: 18,
  steerRate: 12,
  roadHalfWidth: 9.5,
  worldLength: 700,

  playerHealth: 100,
  playerAttackCooldown: 0.55,
  playerAttackWindow: 0.2,

  enemyBaseSpeed: 66,
  enemySpawnInterval: 1.4,
  trafficSpawnInterval: 1.1,
  dinoSpawnInterval: 16,
  dinoSpawnJitter: 8,

  collisionDamageBike: 26,
  collisionDamageTraffic: 34,
  collisionDamageDino: 45,

  nearMissBonus: 35,
  overtakeBonus: 80,
  takedownBonus: 250,
  distanceScoreFactor: 1.6,

  maxParticles: 280,
};
