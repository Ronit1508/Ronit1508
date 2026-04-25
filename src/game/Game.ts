import * as THREE from 'three';
import { InputController } from './input';
import { GAME_TITLE, LANE_Z, TUNING } from './constants';
import type { Bullet, Enemy, GameState, HudState, Obstacle, Particle } from './entities';

interface GameCallbacks {
  onHudUpdate: (hud: HudState) => void;
}

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
  private wave = 1;
  private waveTimer = 0;
  private elapsed = 0;
  private boss: Enemy | null = null;
  private bossFireTimer = 0;

  private enemySpawnTimer = 0;
  private obstacleSpawnTimer = 0;
  private damageFlash = 0;
  private shakeStrength = 0;

  constructor(private container: HTMLDivElement, private callbacks: GameCallbacks) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#040612');
    this.scene.fog = new THREE.Fog('#040612', 40, 200);

    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 500);
    this.camera.position.set(0, 2.2, 9);

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

    if (this.gameState === 'start' && this.input.consumeStart()) {
      this.startGame();
    }

    if ((this.gameState === 'gameover' || this.gameState === 'victory') && this.input.consumeRestart()) {
      this.startGame();
    }

    if (this.gameState === 'playing') {
      this.updateGame(dt);
    }

    this.updateVisualEffects(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private startGame() {
    this.gameState = 'playing';
    this.score = 0;
    this.wave = 1;
    this.waveTimer = 0;
    this.elapsed = 0;
    this.playerHealth = TUNING.playerHealth;
    this.fireCooldownTimer = 0;
    this.rollTimer = 0;
    this.enemySpawnTimer = 0;
    this.obstacleSpawnTimer = 0;
    this.damageFlash = 0;
    this.boss = null;
    this.bossFireTimer = 0;

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
    this.elapsed += dt;
    this.waveTimer += dt;
    this.enemySpawnTimer += dt;
    this.obstacleSpawnTimer += dt;
    this.fireCooldownTimer -= dt;
    this.rollTimer = Math.max(0, this.rollTimer - dt);

    this.updatePlayer(dt);
    this.updateSpawners();
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updateObstacles(dt);
    this.updateParticles(dt);
    this.handleCollisions();

    if (!this.boss && this.wave <= TUNING.totalWaves && this.waveTimer > TUNING.waveDuration) {
      this.wave += 1;
      this.waveTimer = 0;
      if (this.wave > TUNING.totalWaves) {
        this.spawnBoss();
      }
    }

    if (this.playerHealth <= 0) {
      this.gameState = 'gameover';
    }

    if (this.boss && this.boss.health <= 0) {
      this.scene.remove(this.boss.mesh);
      this.enemies = this.enemies.filter((e) => e !== this.boss);
      this.boss = null;
      this.gameState = 'victory';
      this.createExplosion(new THREE.Vector3(0, 0, -30), 80, '#76f7ff');
    }

    this.updateHud();
  }

  private updatePlayer(dt: number) {
    const move = this.input.movement.clone();
    const velocityScale = this.rollTimer > 0 ? 1.4 : 1;
    this.player.position.x = THREE.MathUtils.clamp(
      this.player.position.x + move.x * TUNING.playerSpeed * dt * velocityScale,
      -TUNING.playerBoundsX,
      TUNING.playerBoundsX,
    );
    this.player.position.y = THREE.MathUtils.clamp(
      this.player.position.y + move.y * TUNING.playerSpeed * dt * velocityScale,
      -TUNING.playerBoundsY,
      TUNING.playerBoundsY,
    );

    if (this.input.consumeRoll() && this.rollTimer <= 0) {
      this.rollTimer = TUNING.rollDuration;
    }

    const rollPhase = this.rollTimer > 0 ? (1 - this.rollTimer / TUNING.rollDuration) * Math.PI * 2 : 0;
    this.player.rotation.z = -move.x * 0.28 + Math.sin(rollPhase) * 0.55;
    this.player.rotation.x = -move.y * 0.08;

    if (this.input.consumeShoot() && this.fireCooldownTimer <= 0) {
      this.fireCooldownTimer = TUNING.fireCooldown;
      this.spawnPlayerBullet();
      this.spawnMuzzleFlash();
    }

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.player.position.x * 0.25, 6 * dt);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 2.2 + this.player.position.y * 0.18, 6 * dt);
    this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, -move.x * 0.07, 5 * dt);
    this.camera.position.x += (Math.random() - 0.5) * this.shakeStrength;
    this.camera.position.y += (Math.random() - 0.5) * this.shakeStrength;
    this.shakeStrength = THREE.MathUtils.lerp(this.shakeStrength, 0, dt * TUNING.shakeDamping);
  }

  private updateSpawners() {
    if (!this.boss && this.wave <= TUNING.totalWaves && this.enemySpawnTimer >= TUNING.enemySpawnRate) {
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
      if (enemy.isBoss) {
        enemy.phase = (enemy.phase ?? 0) + dt;
        enemy.mesh.position.x = Math.sin((enemy.phase ?? 0) * 1.2) * 8;
        this.bossFireTimer += dt;
        if (this.bossFireTimer >= TUNING.bossFireInterval) {
          this.bossFireTimer = 0;
          this.spawnBossBulletPattern(enemy.mesh.position.clone());
        }
      } else {
        enemy.mesh.position.addScaledVector(enemy.velocity, dt);
        enemy.mesh.rotation.z += dt * 0.6;
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0 && Math.random() < TUNING.enemyFireChance * dt) {
          enemy.fireTimer = enemy.fireCadence;
          this.spawnEnemyBullet(enemy.mesh.position.clone());
        }
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
      }
      return list.filter((bullet) => {
        const alive = bullet.life > 0 && bullet.mesh.position.z > LANE_Z.cleanupFar && bullet.mesh.position.z < 35;
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
      obstacle.mesh.rotation.x += dt * 0.6;
      obstacle.mesh.rotation.y += dt * 0.4;
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
      p.mesh.scale.setScalar(0.3 + (1 - alpha));
    }

    this.particles = this.particles.filter((p) => {
      const alive = p.life > 0;
      if (!alive) this.scene.remove(p.mesh);
      return alive;
    });
  }

  private handleCollisions() {
    const enemyHits = new Set<Enemy>();
    const playerBulletsToRemove = new Set<Bullet>();

    for (const bullet of this.bullets) {
      for (const enemy of this.enemies) {
        if (bullet.mesh.position.distanceTo(enemy.mesh.position) < bullet.radius + enemy.radius) {
          enemy.health -= bullet.damage;
          playerBulletsToRemove.add(bullet);
          enemyHits.add(enemy);
          this.createExplosion(bullet.mesh.position.clone(), 8, enemy.isBoss ? '#ff56ca' : '#ffa977');
          this.shakeStrength += enemy.isBoss ? 0.03 : 0.015;
          break;
        }
      }
    }

    for (const bullet of playerBulletsToRemove) this.scene.remove(bullet.mesh);
    this.bullets = this.bullets.filter((b) => !playerBulletsToRemove.has(b));

    for (const enemy of this.enemies) {
      if (enemy.health <= 0 && !enemy.isBoss) {
        this.scene.remove(enemy.mesh);
        this.score += 120;
        this.createExplosion(enemy.mesh.position.clone(), 24, '#ffb347');
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

    for (const enemy of enemyHits) {
      if (!enemy.isBoss && enemy.mesh.position.distanceTo(this.player.position) < this.playerRadius + enemy.radius + 0.2) {
        enemy.health = 0;
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.mesh.position.distanceTo(this.player.position) < this.playerRadius + enemy.radius) {
        this.playerDamage(enemy.isBoss ? TUNING.bossContactDamage : 20);
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
        this.createExplosion(obstacle.mesh.position.clone(), 12, '#9dbeff');
      }
    }
    this.obstacles = this.obstacles.filter((o) => o.radius > 0);
  }

  private updateVisualEffects(dt: number) {
    for (const ring of this.tunnelRings) {
      ring.position.z += 28 * dt;
      ring.rotation.z += dt * 0.12;
      if (ring.position.z > 14) ring.position.z = -180;
    }

    const starPos = this.stars.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < starPos.count; i += 1) {
      let z = starPos.getZ(i) + 55 * dt;
      if (z > 30) z = -320;
      starPos.setZ(i, z);
    }
    starPos.needsUpdate = true;

    for (const line of this.speedLines) {
      line.position.z += 82 * dt;
      if (line.position.z > 20) {
        line.position.z = -220;
        line.position.x = (Math.random() - 0.5) * 36;
        line.position.y = (Math.random() - 0.5) * 22;
      }
    }

    this.damageFlash = Math.max(0, this.damageFlash - dt * 2.2);
    const mix = this.damageFlash * 0.45;
    this.scene.background = new THREE.Color().lerpColors(new THREE.Color('#040612'), new THREE.Color('#3b1014'), mix);
  }

  private spawnPlayerBullet() {
    const geo = new THREE.CapsuleGeometry(0.11, 1, 2, 6);
    const mat = new THREE.MeshBasicMaterial({ color: '#8ffcff' });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.copy(this.player.position).add(new THREE.Vector3(0, 0.15, -1.6));

    this.scene.add(mesh);
    this.bullets.push({
      mesh,
      velocity: new THREE.Vector3(0, 0, -TUNING.playerBulletSpeed),
      radius: 0.35,
      damage: TUNING.playerBulletDamage,
      fromEnemy: false,
      life: 4,
    });
  }

  private spawnEnemyBullet(position: THREE.Vector3) {
    const geo = new THREE.SphereGeometry(0.26, 10, 10);
    const mat = new THREE.MeshBasicMaterial({ color: '#ff5a74' });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);

    const dir = this.player.position.clone().sub(position).normalize();
    this.scene.add(mesh);
    this.enemyBullets.push({
      mesh,
      velocity: dir.multiplyScalar(TUNING.enemyBulletSpeed),
      radius: 0.32,
      damage: TUNING.enemyBulletDamage,
      fromEnemy: true,
      life: 6,
    });
  }

  private spawnBossBulletPattern(origin: THREE.Vector3) {
    const spread = [-0.8, -0.35, 0, 0.35, 0.8];
    for (const sx of spread) {
      const geo = new THREE.SphereGeometry(0.34, 10, 10);
      const mat = new THREE.MeshBasicMaterial({ color: '#ff48f0' });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(origin).add(new THREE.Vector3(sx * 2.5, -0.4, 1.2));
      const dir = new THREE.Vector3(sx * 0.35, -0.04, 1).normalize();
      this.scene.add(mesh);
      this.enemyBullets.push({
        mesh,
        velocity: dir.multiplyScalar(TUNING.bossBulletSpeed),
        radius: 0.4,
        damage: 15,
        fromEnemy: true,
        life: 8,
      });
    }
  }

  private spawnEnemyWave() {
    const waveSize = 2 + Math.min(this.wave, 4);
    for (let i = 0; i < waveSize; i += 1) {
      const enemy = this.createEnemyMesh();
      enemy.position.set((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 12, LANE_Z.enemySpawn - i * 8);
      this.scene.add(enemy);

      this.enemies.push({
        mesh: enemy,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.4, TUNING.enemySpeed + this.wave * 0.8),
        health: TUNING.enemyHealth + this.wave * 7,
        radius: 1.15,
        fireTimer: Math.random() * 1.4,
        fireCadence: THREE.MathUtils.randFloat(1, 1.8),
      });
    }
  }

  private spawnObstacle() {
    const geo = new THREE.IcosahedronGeometry(1 + Math.random() * 1.8, 0);
    const mat = new THREE.MeshStandardMaterial({ color: '#5872a3', flatShading: true, emissive: '#101b33' });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 15, LANE_Z.obstacleSpawn);
    this.scene.add(mesh);

    this.obstacles.push({
      mesh,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 0.5, TUNING.obstacleSpeed + Math.random() * 5),
      radius: 1.4,
    });
  }

  private spawnBoss() {
    const bossMesh = this.createBossMesh();
    bossMesh.position.set(0, 1, -60);
    this.scene.add(bossMesh);

    this.boss = {
      mesh: bossMesh,
      velocity: new THREE.Vector3(0, 0, 2.5),
      health: TUNING.bossHealth,
      radius: 4.8,
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
      new THREE.MeshStandardMaterial({ color: '#f35c74', flatShading: true }),
    );
    body.rotation.x = Math.PI / 2;

    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.22, 0.8),
      new THREE.MeshStandardMaterial({ color: '#cc3f57', flatShading: true }),
    );

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#ff87ab' }),
    );
    core.position.z = 0.6;

    group.add(body, wing, core);
    return group;
  }

  private createBossMesh() {
    const group = new THREE.Group();

    const hull = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 3.4, 8, 8),
      new THREE.MeshStandardMaterial({ color: '#5a2c85', flatShading: true }),
    );
    hull.rotation.x = Math.PI / 2;

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 3, 6),
      new THREE.MeshStandardMaterial({ color: '#7f38a8', flatShading: true }),
    );
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -5;

    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.4, 2),
      new THREE.MeshStandardMaterial({ color: '#822bc2', flatShading: true }),
    );

    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.MeshBasicMaterial({ color: '#ff74de' }),
    );
    core.position.z = -1.5;

    group.add(hull, nose, wings, core);
    return group;
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight('#7a8dff', 0.65);
    const key = new THREE.DirectionalLight('#9ce8ff', 1.1);
    key.position.set(4, 7, 6);
    const fill = new THREE.DirectionalLight('#ff4e8a', 0.55);
    fill.position.set(-6, -2, 3);
    this.scene.add(ambient, key, fill);
  }

  private setupPlayer() {
    const hull = new THREE.Mesh(
      new THREE.ConeGeometry(0.75, 2.4, 5),
      new THREE.MeshStandardMaterial({ color: '#5fe8ff', flatShading: true }),
    );
    hull.rotation.x = Math.PI / 2;

    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 10, 10),
      new THREE.MeshStandardMaterial({ color: '#9df6ff', emissive: '#295d7e', flatShading: true }),
    );
    canopy.position.set(0, 0.25, 0.2);

    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.15, 1),
      new THREE.MeshStandardMaterial({ color: '#2fbecf', flatShading: true }),
    );

    const rear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.8, 8),
      new THREE.MeshBasicMaterial({ color: '#89f8ff' }),
    );
    rear.rotation.x = Math.PI / 2;
    rear.position.z = 1.3;

    this.player.add(hull, canopy, wings, rear);
    this.player.position.set(0, 0, 0);
    this.scene.add(this.player);
  }

  private setupTunnel() {
    for (let i = 0; i < 14; i += 1) {
      const radius = 15 + (i % 3) * 1.6;
      const geo = new THREE.TorusGeometry(radius, 0.12, 6, 40);
      const hue = 0.53 + (i % 4) * 0.04;
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(hue, 0.9, 0.55), transparent: true, opacity: 0.48 });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.z = -i * 14;
      ring.rotation.x = Math.PI / 2;
      ring.position.x = Math.sin(i * 0.7) * 2.8;
      ring.position.y = Math.cos(i * 0.5) * 2.4;
      this.tunnelRings.push(ring);
      this.scene.add(ring);
    }
  }

  private buildStars() {
    const geo = new THREE.BufferGeometry();
    const count = 720;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 170;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 110;
      arr[i * 3 + 2] = -Math.random() * 320;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.PointsMaterial({ color: '#b6d8ff', size: 0.24, transparent: true, opacity: 0.8 });
    return new THREE.Points(geo, mat);
  }

  private setupSpeedLines() {
    for (let i = 0; i < 36; i += 1) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -3.6),
      ]);
      const material = new THREE.LineBasicMaterial({ color: '#6dcfff', transparent: true, opacity: 0.35 });
      const line = new THREE.Line(geometry, material);
      line.position.set((Math.random() - 0.5) * 36, (Math.random() - 0.5) * 22, -Math.random() * 220);
      this.speedLines.push(line);
      this.scene.add(line);
    }
  }

  private spawnMuzzleFlash() {
    const geo = new THREE.SphereGeometry(0.24, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: '#b4f9ff', transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(this.player.position).add(new THREE.Vector3(0, 0.08, -1.45));
    this.scene.add(mesh);
    this.particles.push({ mesh, velocity: new THREE.Vector3(0, 0, -2), life: 0.12, maxLife: 0.12 });
  }

  private createExplosion(origin: THREE.Vector3, count: number, color: string) {
    for (let i = 0; i < count; i += 1) {
      const geo = new THREE.TetrahedronGeometry(0.16 + Math.random() * 0.2);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(origin);

      const vel = new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
      this.scene.add(mesh);
      this.particles.push({ mesh, velocity: vel, life: 0.45 + Math.random() * 0.5, maxLife: 0.95 });
    }
  }

  private playerDamage(amount: number) {
    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.damageFlash = 1;
    this.shakeStrength += 0.08;
    this.createExplosion(this.player.position.clone().add(new THREE.Vector3(0, 0, -0.4)), 16, '#ff5f6a');
  }

  private updateHud() {
    this.callbacks.onHudUpdate({
      score: this.score,
      health: this.playerHealth,
      wave: this.boss ? TUNING.totalWaves + 1 : Math.min(this.wave, TUNING.totalWaves),
      time: this.elapsed,
      gameState: this.gameState,
      bossHealth: this.boss?.health,
      bossMaxHealth: this.boss ? TUNING.bossHealth : undefined,
    });
  }

  get title() {
    return GAME_TITLE;
  }
}
