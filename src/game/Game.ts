import * as THREE from 'three';
import { InputController } from './input';
import { GAME_TITLE, LANE_Z, TUNING } from './constants';
import type { Bullet, Enemy, GameState, HudState, Obstacle, Particle } from './entities';

interface GameCallbacks {
  onHudUpdate: (hud: HudState) => void;
}

type WavePattern = 'line' | 'vee' | 'sweep';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();

  private player = new THREE.Group();
  private playerRadius = 1.1;
  private playerHealth = TUNING.playerHealth;
  private fireCooldownTimer = 0;
  private rollTimer = 0;

  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private enemyBullets: Bullet[] = [];
  private particles: Particle[] = [];
  private obstacles: Obstacle[] = [];
  private tunnelRings: THREE.Mesh[] = [];
  private stars: THREE.Points;
  private speedLines: THREE.Line[] = [];

  private input: InputController;
  private animationFrame = 0;

  private gameState: GameState = 'start';
  private score = 0;
  private combo = 1;
  private comboTimer = 0;
  private wave = 1;
  private waveTimer = 0;
  private elapsed = 0;
  private boss: Enemy | null = null;
  private bossFireTimer = 0;
  private bossWarningTimer = 0;

  private enemySpawnTimer = 0;
  private obstacleSpawnTimer = 0;
  private patternIndex = 0;
  private damageFlash = 0;
  private shakeStrength = 0;
  private hitPause = 0;

  constructor(private container: HTMLDivElement, private callbacks: GameCallbacks) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#030716');
    this.scene.fog = new THREE.Fog('#030716', 45, 250);

    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(74, width / height, 0.1, 500);
    this.camera.position.set(0, 2.3, 9.4);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.input = new InputController(this.renderer.domElement);

    this.stars = this.buildStars();
    this.scene.add(this.stars);

    this.setupLights();
    this.setupPlayer();
    this.setupTunnel();
    this.setupSpeedLines();

    window.addEventListener('resize', this.onResize);

    this.updateHud();
    this.animate();
  }

  dispose() {
    cancelAnimationFrame(this.animationFrame);
    this.input.dispose();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private animate = () => {
    this.animationFrame = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.033);

    if (this.gameState === 'start' && this.input.consumeStart()) this.startGame();
    if ((this.gameState === 'gameover' || this.gameState === 'victory') && this.input.consumeRestart()) this.startGame();

    if (this.gameState === 'playing') {
      this.updateGame(dt);
    }

    this.updateVisualEffects(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private startGame() {
    this.gameState = 'playing';
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.wave = 1;
    this.waveTimer = 0;
    this.elapsed = 0;
    this.playerHealth = TUNING.playerHealth;
    this.fireCooldownTimer = 0;
    this.rollTimer = 0;
    this.enemySpawnTimer = 0;
    this.obstacleSpawnTimer = 0;
    this.patternIndex = 0;
    this.damageFlash = 0;
    this.boss = null;
    this.bossFireTimer = 0;
    this.bossWarningTimer = 0;
    this.hitPause = 0;

    for (const e of this.enemies) this.scene.remove(e.mesh);
    for (const b of [...this.bullets, ...this.enemyBullets]) this.scene.remove(b.mesh);
    for (const p of this.particles) this.scene.remove(p.mesh);
    for (const o of this.obstacles) this.scene.remove(o.mesh);
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.particles = [];
    this.obstacles = [];

    this.player.position.set(0, 0, LANE_Z.player);
    this.player.rotation.set(0, 0, 0);
    this.updateHud();
  }

  private updateGame(dt: number) {
    if (this.hitPause > 0) {
      this.hitPause = Math.max(0, this.hitPause - dt);
      this.updateParticles(dt * 0.35);
      this.updateHud();
      return;
    }

    this.elapsed += dt;
    this.waveTimer += dt;
    this.enemySpawnTimer += dt;
    this.obstacleSpawnTimer += dt;
    this.fireCooldownTimer -= dt;
    this.rollTimer = Math.max(0, this.rollTimer - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);

    if (this.comboTimer === 0) this.combo = 1;

    this.updatePlayer(dt);

    if (this.bossWarningTimer > 0) {
      this.bossWarningTimer = Math.max(0, this.bossWarningTimer - dt);
      if (this.bossWarningTimer === 0) this.spawnBoss();
    } else {
      this.updateSpawners();
    }

    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updateObstacles(dt);
    this.updateParticles(dt);
    this.handleCollisions();

    if (!this.boss && this.bossWarningTimer === 0 && this.wave <= TUNING.totalWaves && this.waveTimer > TUNING.waveDuration) {
      this.wave += 1;
      this.waveTimer = 0;
      if (this.wave > TUNING.totalWaves) this.bossWarningTimer = TUNING.bossWarningDuration;
    }

    if (this.playerHealth <= 0) this.gameState = 'gameover';

    if (this.boss && this.boss.health <= 0) {
      this.scene.remove(this.boss.mesh);
      this.enemies = this.enemies.filter((e) => e !== this.boss);
      this.boss = null;
      this.gameState = 'victory';
      this.createExplosion(new THREE.Vector3(0, 0, -24), 150, '#76f7ff', 2.6);
      this.shakeStrength += 0.26;
    }

    this.updateHud();
  }

  private updatePlayer(dt: number) {
    const move = this.input.movement;
    const rolling = this.rollTimer > 0;
    const speed = rolling ? TUNING.playerBoostSpeed : TUNING.playerSpeed;

    this.player.position.x = THREE.MathUtils.clamp(this.player.position.x + move.x * speed * dt, -TUNING.playerBoundsX, TUNING.playerBoundsX);
    this.player.position.y = THREE.MathUtils.clamp(this.player.position.y + move.y * speed * dt, -TUNING.playerBoundsY, TUNING.playerBoundsY);

    if (this.input.consumeRoll() && this.rollTimer <= 0) this.rollTimer = TUNING.rollDuration;

    const rollPhase = rolling ? (1 - this.rollTimer / TUNING.rollDuration) * Math.PI * 2 : 0;
    this.player.rotation.z = -move.x * 0.5 + Math.sin(rollPhase) * 0.82;
    this.player.rotation.x = -move.y * 0.15;

    if (this.input.consumeShoot() && this.fireCooldownTimer <= 0) {
      this.fireCooldownTimer = TUNING.fireCooldown;
      this.spawnPlayerBullet();
      this.spawnMuzzleFlash();
    }

    const targetZ = 9.4 - move.length() * 0.26;
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.player.position.x * 0.34, 8 * dt);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 2.25 + this.player.position.y * 0.25, 8 * dt);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, 6 * dt);
    this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, -move.x * 0.12, 6 * dt);
    this.camera.rotation.x = THREE.MathUtils.lerp(this.camera.rotation.x, -move.y * 0.02, 4 * dt);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 74 + Math.min(move.length() * 4 + (this.elapsed < TUNING.earlyRushDuration ? 2 : 0), 8), 6 * dt);
    this.camera.updateProjectionMatrix();
    this.camera.position.x += (Math.random() - 0.5) * this.shakeStrength;
    this.camera.position.y += (Math.random() - 0.5) * this.shakeStrength;
    this.shakeStrength = THREE.MathUtils.lerp(this.shakeStrength, 0, dt * TUNING.shakeDamping);
  }

  private updateSpawners() {
    const rushFactor = this.elapsed < TUNING.earlyRushDuration ? 0.8 : 1;
    if (!this.boss && this.wave <= TUNING.totalWaves && this.enemySpawnTimer >= TUNING.enemySpawnRate * rushFactor) {
      this.enemySpawnTimer = 0;
      this.spawnEnemyWave();
    }

    if (!this.boss && this.obstacleSpawnTimer >= TUNING.obstacleSpawnRate) {
      this.obstacleSpawnTimer = 0;
      this.spawnObstacle();
    }
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      enemy.hitFlash = Math.max(0, (enemy.hitFlash ?? 0) - dt * 4.2);
      if (enemy.isBoss) {
        enemy.phase = (enemy.phase ?? 0) + dt;
        enemy.mesh.position.x = Math.sin((enemy.phase ?? 0) * 1.3) * 10;
        enemy.mesh.position.y = 1 + Math.sin((enemy.phase ?? 0) * 2.2) * 1.3;
        enemy.mesh.position.z = THREE.MathUtils.lerp(enemy.mesh.position.z, -44, dt * 2.2);
        this.bossFireTimer += dt;
        if (this.bossFireTimer >= TUNING.bossFireInterval) {
          this.bossFireTimer = 0;
          this.spawnBossBulletPattern(enemy.mesh.position.clone());
        }
      } else {
        enemy.phase = (enemy.phase ?? 0) + dt;
        enemy.mesh.position.addScaledVector(enemy.velocity, dt);
        enemy.mesh.position.x += Math.sin((enemy.phase ?? 0) * 3 + (enemy.laneBias ?? 0)) * dt * 3;
        enemy.mesh.rotation.z += dt * 1.2;
        enemy.mesh.rotation.y += dt * 0.9;
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0 && Math.random() < TUNING.enemyFireChance * dt) {
          enemy.fireTimer = enemy.fireCadence;
          this.spawnEnemyBullet(enemy.mesh.position.clone());
        }
      }

      if ((enemy.hitFlash ?? 0) > 0) {
        const emissive = (enemy.mesh.children[0].material as THREE.MeshStandardMaterial).emissive;
        emissive.setRGB(0.65, 0.35, 0.35);
      } else if (!enemy.isBoss) {
        (enemy.mesh.children[0].material as THREE.MeshStandardMaterial).emissive.setRGB(0.05, 0.02, 0.04);
      }
    }

    this.enemies = this.enemies.filter((enemy) => {
      if (!enemy.isBoss && enemy.mesh.position.z > LANE_Z.cleanupNear) {
        this.scene.remove(enemy.mesh);
        return false;
      }
      return true;
    });
  }

  private updateBullets(dt: number) {
    const updateBulletList = (list: Bullet[]) => {
      for (const bullet of list) {
        bullet.mesh.position.addScaledVector(bullet.velocity, dt);
        bullet.life -= dt;
        if (!bullet.fromEnemy) {
          this.spawnBulletTrail(bullet.mesh.position.clone());
        }
      }
      return list.filter((bullet) => {
        const alive = bullet.life > 0 && bullet.mesh.position.z > LANE_Z.cleanupFar && bullet.mesh.position.z < 50;
        if (!alive) this.scene.remove(bullet.mesh);
        return alive;
      });
    };

    this.bullets = updateBulletList(this.bullets);
    this.enemyBullets = updateBulletList(this.enemyBullets);
  }

  private updateObstacles(dt: number) {
    for (const obstacle of this.obstacles) {
      obstacle.mesh.position.addScaledVector(obstacle.velocity, dt);
      obstacle.mesh.rotation.x += dt * 0.85;
      obstacle.mesh.rotation.y += dt * 0.55;
    }

    this.obstacles = this.obstacles.filter((obstacle) => {
      if (obstacle.mesh.position.z > LANE_Z.cleanupNear) {
        this.scene.remove(obstacle.mesh);
        return false;
      }
      return true;
    });
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.life -= dt;
      const alpha = Math.max(p.life / p.maxLife, 0);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      p.mesh.scale.setScalar(0.35 + (1 - alpha) * 1.5);
    }

    this.particles = this.particles.filter((p) => {
      const alive = p.life > 0;
      if (!alive) this.scene.remove(p.mesh);
      return alive;
    });
  }

  private handleCollisions() {
    const playerBulletsToRemove = new Set<Bullet>();

    for (const bullet of this.bullets) {
      for (const enemy of this.enemies) {
        if (bullet.mesh.position.distanceTo(enemy.mesh.position) < bullet.radius + enemy.radius) {
          enemy.health -= bullet.damage;
          enemy.hitFlash = 1;
          playerBulletsToRemove.add(bullet);
          this.createExplosion(bullet.mesh.position.clone(), enemy.isBoss ? 12 : 9, enemy.isBoss ? '#ff5ce1' : '#ffab72', 0.8);
          this.shakeStrength += enemy.isBoss ? 0.05 : 0.02;
          this.hitPause = Math.max(this.hitPause, TUNING.hitPause * (enemy.isBoss ? 0.6 : 0.4));
          break;
        }
      }
    }

    for (const bullet of playerBulletsToRemove) this.scene.remove(bullet.mesh);
    this.bullets = this.bullets.filter((b) => !playerBulletsToRemove.has(b));

    for (const enemy of this.enemies) {
      if (enemy.health <= 0 && !enemy.isBoss) {
        this.scene.remove(enemy.mesh);
        this.combo = Math.min(8, this.combo + 0.5);
        this.comboTimer = 3.3;
        this.score += Math.floor(125 * this.combo);
        this.createExplosion(enemy.mesh.position.clone(), 30, '#ffc26e', 1.5);
      }
    }

    this.enemies = this.enemies.filter((enemy) => enemy.health > 0 || enemy.isBoss);

    const removeEnemyBullets = new Set<Bullet>();
    for (const bullet of this.enemyBullets) {
      if (bullet.mesh.position.distanceTo(this.player.position) < this.playerRadius + bullet.radius) {
        removeEnemyBullets.add(bullet);
        this.playerDamage(bullet.damage);
      }
    }
    for (const bullet of removeEnemyBullets) this.scene.remove(bullet.mesh);
    this.enemyBullets = this.enemyBullets.filter((b) => !removeEnemyBullets.has(b));

    for (const enemy of this.enemies) {
      if (enemy.mesh.position.distanceTo(this.player.position) < this.playerRadius + enemy.radius) {
        this.playerDamage(enemy.isBoss ? TUNING.bossContactDamage : 19);
        if (!enemy.isBoss) {
          enemy.health = 0;
          this.scene.remove(enemy.mesh);
        }
      }
    }

    for (const obstacle of this.obstacles) {
      if (obstacle.mesh.position.distanceTo(this.player.position) < this.playerRadius + obstacle.radius) {
        this.playerDamage(TUNING.obstacleDamage);
        this.scene.remove(obstacle.mesh);
        obstacle.radius = -1;
        this.createExplosion(obstacle.mesh.position.clone(), 18, '#9dbeff', 1.2);
      }
    }

    this.obstacles = this.obstacles.filter((o) => o.radius > 0);
  }

  private updateVisualEffects(dt: number) {
    const rushBoost = this.gameState === 'playing' && this.elapsed < TUNING.earlyRushDuration ? 8 : 0;

    for (const ring of this.tunnelRings) {
      ring.position.z += (33 + rushBoost) * dt;
      ring.rotation.z += dt * 0.18;
      if (ring.position.z > 16) {
        ring.position.z = -240;
        ring.position.x = (Math.random() - 0.5) * 7;
        ring.position.y = (Math.random() - 0.5) * 4;
      }
    }

    const starPos = this.stars.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < starPos.count; i += 1) {
      let z = starPos.getZ(i) + (68 + rushBoost * 2) * dt;
      if (z > 35) z = -340;
      starPos.setZ(i, z);
    }
    starPos.needsUpdate = true;

    for (const line of this.speedLines) {
      line.position.z += (96 + rushBoost * 2.8) * dt;
      if (line.position.z > 30) {
        line.position.z = -260;
        line.position.x = (Math.random() - 0.5) * 40;
        line.position.y = (Math.random() - 0.5) * 24;
      }
    }

    this.damageFlash = Math.max(0, this.damageFlash - dt * 2.8);
    const mix = this.damageFlash * 0.5;
    this.scene.background = new THREE.Color().lerpColors(new THREE.Color('#030716'), new THREE.Color('#50171d'), mix);
  }

  private spawnPlayerBullet() {
    const geo = new THREE.CapsuleGeometry(0.13, 1.8, 2, 6);
    const mat = new THREE.MeshBasicMaterial({ color: '#90feff' });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.copy(this.player.position).add(new THREE.Vector3(0, 0.1, -1.7));

    this.scene.add(mesh);
    this.bullets.push({
      mesh,
      velocity: new THREE.Vector3(0, 0, -TUNING.playerBulletSpeed),
      radius: 0.42,
      damage: TUNING.playerBulletDamage,
      fromEnemy: false,
      life: 3,
    });
  }

  private spawnBulletTrail(position: THREE.Vector3) {
    if (Math.random() > 0.8) return;
    const geo = new THREE.SphereGeometry(0.08, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: '#69f5ff', transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    this.scene.add(mesh);
    this.particles.push({ mesh, velocity: new THREE.Vector3(0, 0, 2), life: 0.15, maxLife: 0.15 });
  }

  private spawnEnemyBullet(position: THREE.Vector3) {
    const geo = new THREE.SphereGeometry(0.3, 10, 10);
    const mat = new THREE.MeshBasicMaterial({ color: '#ff5873' });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);

    const dir = this.player.position.clone().sub(position).normalize();
    this.scene.add(mesh);
    this.enemyBullets.push({
      mesh,
      velocity: dir.multiplyScalar(TUNING.enemyBulletSpeed),
      radius: 0.36,
      damage: TUNING.enemyBulletDamage,
      fromEnemy: true,
      life: 6,
    });
  }

  private spawnBossBulletPattern(origin: THREE.Vector3) {
    const spread = [-1.05, -0.7, -0.3, 0, 0.3, 0.7, 1.05];
    for (const sx of spread) {
      const geo = new THREE.SphereGeometry(0.35, 10, 10);
      const mat = new THREE.MeshBasicMaterial({ color: '#ff54f4' });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(origin).add(new THREE.Vector3(sx * 2.9, -0.4, 1));
      const dir = new THREE.Vector3(sx * 0.32, Math.abs(sx) * -0.06, 1).normalize();
      this.scene.add(mesh);
      this.enemyBullets.push({
        mesh,
        velocity: dir.multiplyScalar(TUNING.bossBulletSpeed),
        radius: 0.4,
        damage: 16,
        fromEnemy: true,
        life: 8,
      });
    }
  }

  private spawnEnemyWave() {
    const waveSize = this.elapsed < TUNING.earlyRushDuration ? 5 : 3 + Math.min(this.wave, 4);
    const patterns: WavePattern[] = ['line', 'vee', 'sweep'];
    const pattern = patterns[this.patternIndex % patterns.length];
    this.patternIndex += 1;

    for (let i = 0; i < waveSize; i += 1) {
      const enemy = this.createEnemyMesh();
      const xBase = (i - (waveSize - 1) / 2) * 2.7;
      let x = xBase;
      let y = 0;

      if (pattern === 'line') {
        y = ((i % 2 === 0 ? 1 : -1) * 2.5) + (Math.random() - 0.5);
      } else if (pattern === 'vee') {
        y = -Math.abs(xBase) * 0.25;
      } else {
        x = Math.sin(i * 0.8) * 9;
        y = Math.cos(i * 0.7) * 3.2;
      }

      enemy.position.set(x, y, LANE_Z.enemySpawn - i * 7.5);
      this.scene.add(enemy);

      this.enemies.push({
        mesh: enemy,
        velocity: new THREE.Vector3(0, (Math.random() - 0.5) * 0.5, TUNING.enemySpeed + this.wave * 1.1),
        health: TUNING.enemyHealth + this.wave * 8,
        maxHealth: TUNING.enemyHealth + this.wave * 8,
        radius: 1.15,
        fireTimer: Math.random() * 1.4,
        fireCadence: THREE.MathUtils.randFloat(0.8, 1.55),
        phase: Math.random() * Math.PI * 2,
        laneBias: x,
      });
    }
  }

  private spawnObstacle() {
    const geo = new THREE.IcosahedronGeometry(1 + Math.random() * 1.7, 0);
    const mat = new THREE.MeshStandardMaterial({ color: '#4f638f', flatShading: true, emissive: '#12203d' });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((Math.random() - 0.5) * 27, (Math.random() - 0.5) * 15, LANE_Z.obstacleSpawn);
    this.scene.add(mesh);

    this.obstacles.push({
      mesh,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 1.7, (Math.random() - 0.5) * 0.4, TUNING.obstacleSpeed + Math.random() * 6),
      radius: 1.4,
    });
  }

  private spawnBoss() {
    const bossMesh = this.createBossMesh();
    bossMesh.position.set(0, 1, -92);
    this.scene.add(bossMesh);

    this.boss = {
      mesh: bossMesh,
      velocity: new THREE.Vector3(0, 0, 2.8),
      health: TUNING.bossHealth,
      maxHealth: TUNING.bossHealth,
      radius: 5,
      fireTimer: 0,
      fireCadence: TUNING.bossFireInterval,
      isBoss: true,
      phase: 0,
    };
    this.enemies.push(this.boss);
  }

  private createEnemyMesh() {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 2.2, 5),
      new THREE.MeshStandardMaterial({ color: '#f35c74', flatShading: true, emissive: '#18060b' }),
    );
    body.rotation.x = Math.PI / 2;

    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.24, 0.8),
      new THREE.MeshStandardMaterial({ color: '#c83b57', flatShading: true }),
    );

    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.38, 0),
      new THREE.MeshBasicMaterial({ color: '#ff9ab5' }),
    );
    core.position.z = 0.65;

    group.add(body, wing, core);
    return group;
  }

  private createBossMesh() {
    const group = new THREE.Group();

    const hull = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 3.8, 9, 8),
      new THREE.MeshStandardMaterial({ color: '#4f2477', flatShading: true, emissive: '#1a0829' }),
    );
    hull.rotation.x = Math.PI / 2;

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 3.2, 6),
      new THREE.MeshStandardMaterial({ color: '#7437a8', flatShading: true }),
    );
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -5.6;

    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(11, 0.5, 2.3),
      new THREE.MeshStandardMaterial({ color: '#7f2ec0', flatShading: true }),
    );

    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.3, 0),
      new THREE.MeshBasicMaterial({ color: '#ff74de' }),
    );
    core.position.z = -1.6;

    group.add(hull, nose, wings, core);
    return group;
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight('#6d8dff', 0.7);
    const key = new THREE.DirectionalLight('#9ce8ff', 1.3);
    key.position.set(4, 7, 5);
    const fill = new THREE.DirectionalLight('#ff4e8a', 0.7);
    fill.position.set(-6, -2, 4);
    this.scene.add(ambient, key, fill);
  }

  private setupPlayer() {
    const hull = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 2.6, 5),
      new THREE.MeshStandardMaterial({ color: '#67ecff', flatShading: true, emissive: '#10313b' }),
    );
    hull.rotation.x = Math.PI / 2;

    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 10, 10),
      new THREE.MeshStandardMaterial({ color: '#c3fcff', emissive: '#29657c', flatShading: true }),
    );
    canopy.position.set(0, 0.25, 0.2);

    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.16, 1),
      new THREE.MeshStandardMaterial({ color: '#3ac7d5', flatShading: true }),
    );

    const rear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.95, 8),
      new THREE.MeshBasicMaterial({ color: '#8fffff' }),
    );
    rear.rotation.x = Math.PI / 2;
    rear.position.z = 1.35;

    this.player.add(hull, canopy, wings, rear);
    this.scene.add(this.player);
  }

  private setupTunnel() {
    for (let i = 0; i < 16; i += 1) {
      const radius = 14.5 + (i % 4) * 1.6;
      const geo = new THREE.TorusGeometry(radius, 0.16, 6, 44);
      const hue = 0.5 + (i % 5) * 0.05;
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.95, 0.58),
        transparent: true,
        opacity: 0.55,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.z = -i * 16;
      ring.rotation.x = Math.PI / 2;
      ring.position.x = Math.sin(i * 0.8) * 3.4;
      ring.position.y = Math.cos(i * 0.6) * 2.7;
      this.tunnelRings.push(ring);
      this.scene.add(ring);
    }
  }

  private buildStars() {
    const geo = new THREE.BufferGeometry();
    const count = 980;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 190;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 130;
      arr[i * 3 + 2] = -Math.random() * 350;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.PointsMaterial({ color: '#cae2ff', size: 0.26, transparent: true, opacity: 0.85 });
    return new THREE.Points(geo, mat);
  }

  private setupSpeedLines() {
    for (let i = 0; i < 64; i += 1) {
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -5)]);
      const material = new THREE.LineBasicMaterial({ color: '#8ad8ff', transparent: true, opacity: 0.35 });
      const line = new THREE.Line(geometry, material);
      line.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 24, -Math.random() * 260);
      this.speedLines.push(line);
      this.scene.add(line);
    }
  }

  private spawnMuzzleFlash() {
    const geo = new THREE.SphereGeometry(0.33, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: '#e9feff', transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(this.player.position).add(new THREE.Vector3(0, 0.08, -1.45));
    this.scene.add(mesh);
    this.particles.push({ mesh, velocity: new THREE.Vector3(0, 0, -4), life: 0.14, maxLife: 0.14 });
  }

  private createExplosion(origin: THREE.Vector3, count: number, color: string, speed = 1) {
    for (let i = 0; i < count; i += 1) {
      const geo = new THREE.TetrahedronGeometry(0.17 + Math.random() * 0.26);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(origin);

      const vel = new THREE.Vector3((Math.random() - 0.5) * 16 * speed, (Math.random() - 0.5) * 16 * speed, (Math.random() - 0.5) * 16 * speed);
      this.scene.add(mesh);
      this.particles.push({ mesh, velocity: vel, life: 0.5 + Math.random() * 0.45, maxLife: 1.05 });
    }
  }

  private playerDamage(amount: number) {
    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.combo = 1;
    this.comboTimer = 0;
    this.damageFlash = 1;
    this.shakeStrength += 0.11;
    this.createExplosion(this.player.position.clone().add(new THREE.Vector3(0, 0, -0.4)), 22, '#ff5f6a', 1.2);
  }

  private updateHud() {
    this.callbacks.onHudUpdate({
      score: this.score,
      health: this.playerHealth,
      wave: this.boss || this.bossWarningTimer > 0 ? TUNING.totalWaves + 1 : Math.min(this.wave, TUNING.totalWaves),
      time: this.elapsed,
      combo: this.combo,
      earlyRush: this.elapsed < TUNING.earlyRushDuration,
      gameState: this.gameState,
      bossHealth: this.boss?.health,
      bossMaxHealth: this.boss ? TUNING.bossHealth : undefined,
      bossWarning: this.bossWarningTimer || undefined,
    });
  }

  get title() {
    return GAME_TITLE;
  }
}
