import * as THREE from 'three';
import { GAME_TITLE, LANES, TUNING } from './constants';
import type { HudState, Particle, WorldActor } from './entities';
import { InputController } from './input';

export class Game {
  private scene = new THREE.Scene();
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private frame = 0;

  private input = new InputController();

  private player = new THREE.Group();
  private playerLaneX = 0;
  private playerZ = 12;
  private speed = TUNING.baseSpeed;
  private attackCooldown = 0;
  private attackTimer = 0;

  private actors: WorldActor[] = [];
  private particles: Particle[] = [];

  private roadSegments: THREE.Mesh[] = [];
  private laneMarkers: THREE.Mesh[] = [];
  private roadsideObjects: THREE.Object3D[] = [];
  private mountains: THREE.Mesh[] = [];

  private distance = 0;
  private score = 0;
  private health = TUNING.playerHealth;
  private takedowns = 0;
  private difficulty = 1;

  private enemySpawn = 0;
  private trafficSpawn = 0;
  private dinoSpawn = 8;
  private dinoWarning = 0;

  private shake = 0;
  private nearMissLock = new Set<WorldActor>();
  private paused = false;
  private gameState: HudState['gameState'] = 'start';

  private dustTimer = 0;
  private engineHum = 0;

  constructor(private host: HTMLDivElement, private onHud: (hud: HudState) => void) {
    this.scene.background = new THREE.Color('#8ab1d2');
    this.scene.fog = new THREE.Fog('#d8c6a6', 55, 210);

    this.camera = new THREE.PerspectiveCamera(64, host.clientWidth / host.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 4.5, 19);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    host.appendChild(this.renderer.domElement);

    this.setupLights();
    this.createWorld();
    this.createPlayer();
    this.updateHud();

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onResize);
    this.input.dispose();
    this.renderer.dispose();
    if (this.host.contains(this.renderer.domElement)) this.host.removeChild(this.renderer.domElement);
  }

  private onResize = () => {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private setupLights() {
    const hemi = new THREE.HemisphereLight('#fff7d6', '#ad7f52', 1.1);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight('#fff4cf', 2.2);
    sun.position.set(40, 58, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -90;
    sun.shadow.camera.right = 90;
    sun.shadow.camera.top = 90;
    sun.shadow.camera.bottom = -90;
    this.scene.add(sun);

    const kick = new THREE.DirectionalLight('#7db8ff', 0.7);
    kick.position.set(-26, 18, -12);
    this.scene.add(kick);
  }

  private createWorld() {
    const roadMat = new THREE.MeshStandardMaterial({ color: '#2b3038', roughness: 0.8, metalness: 0.1 });
    const shoulderMat = new THREE.MeshStandardMaterial({ color: '#74624b', roughness: 1 });
    const lineMat = new THREE.MeshStandardMaterial({ color: '#f8f2db', emissive: '#f4ddb0', emissiveIntensity: 0.2 });

    for (let i = 0; i < 18; i += 1) {
      const z = -i * 42;
      const road = new THREE.Mesh(new THREE.BoxGeometry(22, 0.3, 44), roadMat);
      road.position.set(0, -0.15, z);
      road.receiveShadow = true;
      this.scene.add(road);
      this.roadSegments.push(road);

      const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(14, 0.25, 44), shoulderMat);
      shoulderL.position.set(-18, -0.16, z);
      shoulderL.receiveShadow = true;
      this.scene.add(shoulderL);

      const shoulderR = shoulderL.clone();
      shoulderR.position.x = 18;
      this.scene.add(shoulderR);

      for (let m = 0; m < 8; m += 1) {
        const marker = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 2.2), lineMat);
        marker.position.set(0, 0.03, z - 18 + m * 5.5);
        marker.receiveShadow = true;
        this.scene.add(marker);
        this.laneMarkers.push(marker);
      }
    }

    for (let i = 0; i < 80; i += 1) {
      const signPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.11, 3.5, 8),
        new THREE.MeshStandardMaterial({ color: '#7e868f', roughness: 0.5 }),
      );
      signPole.position.set(i % 2 === 0 ? -14.5 : 14.5, 1.8, -i * 24 - 20);
      signPole.castShadow = true;
      signPole.receiveShadow = true;

      const board = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.2, 0.2),
        new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? '#2f72cc' : '#329c58' }),
      );
      board.position.set(0, 1.3, 0);
      board.castShadow = true;
      signPole.add(board);

      this.scene.add(signPole);
      this.roadsideObjects.push(signPole);

      const cactus = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.35, 2.4, 8),
        new THREE.MeshStandardMaterial({ color: '#36593a', roughness: 0.85 }),
      );
      body.castShadow = true;
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: '#3d6d42', roughness: 0.85 }),
      );
      arm.rotation.z = Math.PI / 2;
      arm.position.set(0.55, 0.2, 0);
      arm.castShadow = true;
      cactus.add(body, arm);
      cactus.position.set(i % 2 === 0 ? -24 : 24, 1.2, -i * 28 - 35);
      this.scene.add(cactus);
      this.roadsideObjects.push(cactus);
    }

    const mountainMat = new THREE.MeshStandardMaterial({ color: '#8d7258', roughness: 0.95 });
    for (let i = 0; i < 24; i += 1) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(14 + (i % 4) * 4, 24 + (i % 5) * 3, 6), mountainMat);
      m.position.set(i % 2 === 0 ? -60 - (i % 3) * 14 : 60 + (i % 3) * 14, 8, -i * 58 - 120);
      m.rotation.y = Math.random() * Math.PI;
      m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
      this.mountains.push(m);
    }
  }

  private createPlayer() {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.45, 2.9),
      new THREE.MeshStandardMaterial({ color: '#c31313', metalness: 0.6, roughness: 0.3 }),
    );
    frame.castShadow = true;

    const fairing = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.9, 6, 8),
      new THREE.MeshStandardMaterial({ color: '#161a20', metalness: 0.75, roughness: 0.25 }),
    );
    fairing.rotation.x = Math.PI / 2;
    fairing.position.set(0, 0.35, 0);
    fairing.castShadow = true;

    const rider = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.8, 4, 8),
      new THREE.MeshStandardMaterial({ color: '#0f1418', roughness: 0.6 }),
    );
    rider.position.set(0, 1.02, 0.2);
    rider.castShadow = true;

    const wheelGeo = new THREE.TorusGeometry(0.42, 0.16, 10, 18);
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#121417', roughness: 0.9 });
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.position.set(0, 0.05, -1.15);
    frontWheel.rotation.y = Math.PI / 2;
    frontWheel.castShadow = true;

    const rearWheel = frontWheel.clone();
    rearWheel.position.z = 1.15;

    this.player.add(frame, fairing, rider, frontWheel, rearWheel);
    this.player.position.set(0, 0.55, this.playerZ);
    this.player.castShadow = true;
    this.scene.add(this.player);
  }

  private createEnemyBike(x: number, z: number): WorldActor {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.4, 2.5),
      new THREE.MeshStandardMaterial({ color: '#1f2d66', metalness: 0.4, roughness: 0.45 }),
    );
    body.castShadow = true;
    const rider = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.7, 4, 8),
      new THREE.MeshStandardMaterial({ color: '#0e1015', roughness: 0.7 }),
    );
    rider.position.set(0, 0.85, 0.1);
    rider.castShadow = true;

    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.11, 8, 14),
      new THREE.MeshStandardMaterial({ color: '#0f1215', roughness: 0.9 }),
    );
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(0, 0.06, -1);
    const wheel2 = wheel.clone();
    wheel2.position.z = 1;

    g.add(body, rider, wheel, wheel2);
    g.position.set(x, 0.46, z);
    this.scene.add(g);
    return { mesh: g, kind: 'enemy', lane: x, z, speed: TUNING.enemyBaseSpeed + Math.random() * 18, radius: 0.95, health: 1 };
  }

  private createTraffic(x: number, z: number): WorldActor {
    const truck = Math.random() < 0.35;
    const g = new THREE.Group();
    const vehicle = new THREE.Mesh(
      new THREE.BoxGeometry(truck ? 2.2 : 1.8, truck ? 1.8 : 1.2, truck ? 5.8 : 4.0),
      new THREE.MeshStandardMaterial({
        color: truck ? '#b57c2b' : '#8d1f28',
        metalness: 0.25,
        roughness: 0.5,
      }),
    );
    vehicle.castShadow = true;
    vehicle.receiveShadow = true;
    vehicle.position.y = truck ? 0.9 : 0.62;

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(truck ? 1.9 : 1.4, 0.5, 0.7),
      new THREE.MeshStandardMaterial({ color: '#95cbff', metalness: 0.8, roughness: 0.2 }),
    );
    glass.position.set(0, truck ? 1.45 : 1.02, truck ? -1.9 : -1.3);
    g.add(vehicle, glass);
    g.position.set(x, 0.05, z);
    this.scene.add(g);
    return { mesh: g, kind: 'traffic', lane: x, z, speed: 35 + Math.random() * 26, radius: truck ? 1.6 : 1.3, health: 4 };
  }

  private createDino(z: number): WorldActor {
    const g = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: '#4a6652', roughness: 0.9, metalness: 0.05 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 2.8, 10, 14), skin);
    body.rotation.z = Math.PI / 2;
    body.position.y = 2.2;
    body.castShadow = true;

    const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.2, 8, 10), skin);
    neck.position.set(2.1, 3.0, -0.35);
    neck.rotation.z = -0.45;
    neck.castShadow = true;

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.8), skin);
    head.position.set(3.1, 3.1, -0.45);
    head.castShadow = true;

    const legGeo = new THREE.CylinderGeometry(0.25, 0.33, 2.2, 10);
    const leg = new THREE.Mesh(legGeo, skin);
    leg.position.set(0.95, 1.0, -0.8);
    leg.castShadow = true;
    const leg2 = leg.clone();
    leg2.position.z = 0.8;
    const leg3 = leg.clone();
    leg3.position.x = -0.95;
    const leg4 = leg2.clone();
    leg4.position.x = -0.95;

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.38, 2.6, 10), skin);
    tail.position.set(-2.5, 2.1, 0);
    tail.rotation.z = -Math.PI / 2;
    tail.castShadow = true;

    g.add(body, neck, head, leg, leg2, leg3, leg4, tail);
    g.position.set(-14, 0, z);
    this.scene.add(g);

    return {
      mesh: g,
      kind: 'dino',
      lane: 0,
      z,
      speed: 42,
      radius: 2.6,
      health: 10,
      aggressive: false,
      roarTimer: 2.2,
    };
  }

  private animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.033);

    if (this.gameState === 'start' && this.input.consumeStart()) this.startGame();
    if (this.gameState === 'gameover' && this.input.consumeRestart()) this.startGame();

    if (this.gameState === 'playing' && this.input.consumePause()) {
      this.paused = !this.paused;
      this.gameState = this.paused ? 'paused' : 'playing';
    } else if (this.gameState === 'paused' && this.input.consumePause()) {
      this.paused = false;
      this.gameState = 'playing';
    }

    if (this.gameState === 'playing' && !this.paused) this.update(dt);
    this.updateEffects(dt);

    this.renderer.render(this.scene, this.camera);
  };

  private startGame() {
    this.gameState = 'playing';
    this.paused = false;
    this.speed = TUNING.baseSpeed;
    this.playerLaneX = 0;
    this.player.position.set(0, 0.55, this.playerZ);
    this.player.rotation.set(0, 0, 0);
    this.attackCooldown = 0;
    this.attackTimer = 0;
    this.distance = 0;
    this.score = 0;
    this.health = TUNING.playerHealth;
    this.takedowns = 0;
    this.difficulty = 1;
    this.enemySpawn = 0;
    this.trafficSpawn = 0;
    this.dinoSpawn = 9;
    this.dinoWarning = 0;
    this.shake = 0;
    this.engineHum = 0;

    for (const actor of this.actors) this.scene.remove(actor.mesh);
    for (const particle of this.particles) this.scene.remove(particle.mesh);
    this.actors = [];
    this.particles = [];
    this.nearMissLock.clear();

    this.updateHud();
  }

  private update(dt: number) {
    this.difficulty += dt * 0.018;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    if (this.input.accelerate) this.speed += TUNING.accelRate * dt;
    else this.speed -= TUNING.drag * dt;
    if (this.input.brake) this.speed -= TUNING.brakeRate * dt;
    this.speed = THREE.MathUtils.clamp(this.speed, TUNING.minSpeed, TUNING.maxSpeed + this.difficulty * 10);

    this.playerLaneX += this.input.steer * TUNING.steerRate * dt * (0.6 + this.speed / 250);
    this.playerLaneX = THREE.MathUtils.clamp(this.playerLaneX, -TUNING.roadHalfWidth + 0.9, TUNING.roadHalfWidth - 0.9);

    const leanTarget = -this.input.steer * 0.36;
    this.player.rotation.z = THREE.MathUtils.lerp(this.player.rotation.z, leanTarget, dt * 10);
    this.player.rotation.y = THREE.MathUtils.lerp(this.player.rotation.y, -this.input.steer * 0.08, dt * 8);
    this.player.position.x = THREE.MathUtils.lerp(this.player.position.x, this.playerLaneX, dt * 12);

    if (this.input.consumeAttack() && this.attackCooldown <= 0) {
      this.attackCooldown = TUNING.playerAttackCooldown;
      this.attackTimer = TUNING.playerAttackWindow;
      this.spawnSparks(this.player.position.clone().add(new THREE.Vector3(0.9, 0.6, -1.2)), 12, '#ffc06a', 2.2);
    }

    this.enemySpawn += dt;
    this.trafficSpawn += dt;
    this.dinoSpawn -= dt;

    const enemyCadence = Math.max(0.45, TUNING.enemySpawnInterval - this.difficulty * 0.18);
    const trafficCadence = Math.max(0.42, TUNING.trafficSpawnInterval - this.difficulty * 0.11);

    if (this.enemySpawn >= enemyCadence) {
      this.enemySpawn = 0;
      this.spawnEnemy();
    }

    if (this.trafficSpawn >= trafficCadence) {
      this.trafficSpawn = 0;
      this.spawnTraffic();
    }

    if (this.dinoSpawn <= 0 && !this.actors.some((a) => a.kind === 'dino')) {
      this.spawnDinoEvent();
      this.dinoSpawn = TUNING.dinoSpawnInterval + Math.random() * TUNING.dinoSpawnJitter - Math.min(this.difficulty * 2, 8);
    }

    this.updateActors(dt);
    this.updateEnvironment(dt);
    this.updateParticles(dt);

    this.distance += this.speed * dt * 0.001;
    this.score += dt * (this.speed * TUNING.distanceScoreFactor + this.difficulty * 10);

    const fovTarget = 63 + this.speed / 16;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, THREE.MathUtils.clamp(fovTarget, 63, 87), dt * 4);
    this.camera.updateProjectionMatrix();

    const cameraTarget = new THREE.Vector3(this.player.position.x * 0.55, 4.7, this.player.position.z + 18.5);
    this.camera.position.lerp(cameraTarget, dt * 6.5);
    this.camera.lookAt(this.player.position.x * 0.2, 1.4, this.player.position.z - 17);

    if (this.health <= 0) this.gameOver();

    this.updateHud();
  }

  private updateActors(dt: number) {
    const passed: WorldActor[] = [];

    for (const actor of this.actors) {
      if (actor.kind === 'dino') {
        actor.roarTimer = Math.max(0, (actor.roarTimer ?? 0) - dt);
        if (actor.roarTimer! < 1.5 && !actor.aggressive) {
          actor.aggressive = true;
          actor.mesh.position.x = -10;
        }

        if (actor.aggressive) {
          actor.mesh.position.x = THREE.MathUtils.lerp(actor.mesh.position.x, 10, dt * (1.4 + this.difficulty * 0.14));
          actor.mesh.rotation.y = 0.22;
        }

        actor.mesh.position.z += (this.speed - actor.speed) * dt;
        actor.mesh.position.y = 0.2 + Math.abs(Math.sin(performance.now() * 0.006)) * 0.1;
      } else {
        actor.mesh.position.z += (this.speed - actor.speed) * dt;

        if (actor.kind === 'enemy') {
          const pull = THREE.MathUtils.clamp((this.player.position.x - actor.mesh.position.x) * 0.8, -1, 1);
          actor.mesh.position.x += pull * dt * (2 + this.difficulty * 0.35);
          actor.mesh.rotation.z = THREE.MathUtils.lerp(actor.mesh.rotation.z, -pull * 0.28, dt * 6);
        }
      }

      actor.z = actor.mesh.position.z;

      if (actor.z > this.playerZ + 24) {
        passed.push(actor);
        continue;
      }

      const dz = actor.z - this.playerZ;
      if (dz > -8 && dz < 0.3 && Math.abs(actor.mesh.position.x - this.player.position.x) < actor.radius + 1.05) {
        this.handleCollision(actor);
      }

      if (actor.kind !== 'dino' && actor.z > this.playerZ && !this.nearMissLock.has(actor)) {
        const laneDelta = Math.abs(actor.mesh.position.x - this.player.position.x);
        if (laneDelta < 1.9) {
          this.score += TUNING.nearMissBonus;
          this.nearMissLock.add(actor);
        }
      }

      if (actor.kind === 'enemy' && this.attackTimer > 0) {
        const lateral = Math.abs(actor.mesh.position.x - this.player.position.x);
        const closeZ = actor.z > this.playerZ - 3.3 && actor.z < this.playerZ + 1.7;
        if (lateral < 2.1 && closeZ && actor.health > 0) {
          actor.health = 0;
          actor.dead = true;
          this.takedowns += 1;
          this.score += TUNING.takedownBonus;
          this.spawnSparks(actor.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 20, '#ff884d', 4);
          actor.mesh.rotation.z += (Math.random() > 0.5 ? 1 : -1) * 0.8;
          actor.speed = 10;
        }
      }

      if (actor.kind === 'enemy' && actor.z > this.playerZ + 2 && !actor.dead) {
        this.score += TUNING.overtakeBonus;
        actor.dead = true;
      }
    }

    for (const actor of passed) {
      this.scene.remove(actor.mesh);
      this.actors = this.actors.filter((a) => a !== actor);
      this.nearMissLock.delete(actor);
    }

    for (const actor of this.actors.filter((a) => a.dead && a.kind === 'enemy')) {
      actor.mesh.position.y -= dt * 3;
      actor.mesh.rotation.x += dt * 7;
      if (actor.mesh.position.y < -3) {
        this.scene.remove(actor.mesh);
        this.actors = this.actors.filter((a) => a !== actor);
      }
    }
  }

  private handleCollision(actor: WorldActor) {
    let damage = TUNING.collisionDamageBike;
    if (actor.kind === 'traffic') damage = TUNING.collisionDamageTraffic;
    if (actor.kind === 'dino') damage = TUNING.collisionDamageDino;

    this.health -= damage;
    this.speed *= 0.56;
    this.shake = Math.max(this.shake, actor.kind === 'dino' ? 0.7 : 0.34);

    this.spawnSparks(this.player.position.clone().add(new THREE.Vector3(0, 0.4, -0.4)), 30, '#ffd080', 6);
    this.spawnSparks(actor.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 18, '#ff6e4d', 3.8);

    if (actor.kind !== 'dino') {
      actor.dead = true;
      actor.speed = 0;
      actor.mesh.rotation.z += (Math.random() * 0.7 + 0.4) * (Math.random() > 0.5 ? 1 : -1);
    }

    if (actor.kind === 'dino') {
      actor.aggressive = true;
      this.dinoWarning = 1.5;
    }
  }

  private updateEnvironment(dt: number) {
    const travel = this.speed * dt;
    this.dustTimer += dt * (0.6 + this.speed / 120);

    if (this.dustTimer > 0.035) {
      this.dustTimer = 0;
      this.spawnDustTrail();
    }

    for (const segment of this.roadSegments) {
      segment.position.z += travel;
      segment.position.x = Math.sin((this.distance * 3 + segment.position.z) * 0.004) * 0.5;
      if (segment.position.z > this.playerZ + 38) segment.position.z -= 18 * 42;
    }

    for (const marker of this.laneMarkers) {
      marker.position.z += travel;
      if (marker.position.z > this.playerZ + 24) marker.position.z -= 18 * 42;
    }

    for (const obj of this.roadsideObjects) {
      obj.position.z += travel;
      if (obj.position.z > this.playerZ + 60) {
        obj.position.z -= TUNING.worldLength + Math.random() * 300;
        obj.position.x += (Math.random() - 0.5) * 2;
      }
    }

    for (const mountain of this.mountains) {
      mountain.position.z += travel * 0.32;
      if (mountain.position.z > this.playerZ + 200) mountain.position.z -= 24 * 58;
    }

    this.engineHum = THREE.MathUtils.lerp(this.engineHum, this.speed / 240, dt * 3);

    this.camera.position.x += (Math.random() - 0.5) * this.shake;
    this.camera.position.y += (Math.random() - 0.5) * this.shake;
    this.shake = THREE.MathUtils.lerp(this.shake, 0, dt * 5.5);
  }

  private updateEffects(dt: number) {
    if (this.dinoWarning > 0) this.dinoWarning = Math.max(0, this.dinoWarning - dt);
  }

  private spawnEnemy() {
    const lane = LANES[Math.floor(Math.random() * LANES.length)] + (Math.random() - 0.5) * 0.55;
    const enemy = this.createEnemyBike(lane, -130 - Math.random() * 120);
    this.actors.push(enemy);
  }

  private spawnTraffic() {
    const lane = LANES[Math.floor(Math.random() * LANES.length)] + (Math.random() - 0.5) * 0.45;
    const traffic = this.createTraffic(lane, -140 - Math.random() * 120);
    this.actors.push(traffic);
  }

  private spawnDinoEvent() {
    const dino = this.createDino(-160 - Math.random() * 70);
    this.actors.push(dino);
    this.dinoWarning = 4.2;
    this.shake = Math.max(this.shake, 0.5);
    this.score += 125;
  }

  private spawnDustTrail() {
    const pos = this.player.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.9, -0.25, 1.1));
    this.spawnParticle(pos, '#c4b090', 0.8 + Math.random() * 0.5, new THREE.Vector3((Math.random() - 0.5) * 1.1, Math.random() * 0.8, 3 + Math.random() * 2));
  }

  private spawnSparks(origin: THREE.Vector3, count: number, color: string, speed: number) {
    for (let i = 0; i < count; i += 1) {
      const vel = new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed * 0.5, (Math.random() - 0.5) * speed);
      this.spawnParticle(origin, color, 0.35 + Math.random() * 0.35, vel);
    }
  }

  private spawnParticle(origin: THREE.Vector3, color: string, life: number, velocity: THREE.Vector3) {
    if (this.particles.length >= TUNING.maxParticles) return;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.06 + Math.random() * 0.1, 6, 6),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.4 }),
    );
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.particles.push({ mesh, life, maxLife: life, velocity });
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= dt * 6;
      const scale = Math.max(0, p.life / p.maxLife);
      p.mesh.scale.setScalar(scale);
      (p.mesh.material as THREE.MeshStandardMaterial).opacity = scale;
      (p.mesh.material as THREE.MeshStandardMaterial).transparent = true;
    }

    const remove = this.particles.filter((p) => p.life <= 0);
    for (const p of remove) {
      this.scene.remove(p.mesh);
      this.particles = this.particles.filter((x) => x !== p);
    }
  }

  private gameOver() {
    this.health = 0;
    this.gameState = 'gameover';
    this.paused = false;
    this.dinoWarning = 0;
    this.spawnSparks(this.player.position.clone(), 60, '#ff6a5f', 8);
    this.updateHud();
  }

  private updateHud() {
    let warning: string | null = null;
    if (this.gameState === 'playing' && this.dinoWarning > 0) warning = `⚠ DINO ALERT · ROAR INCOMING (${this.dinoWarning.toFixed(1)}s)`;
    if (this.gameState === 'paused') warning = 'PAUSED';

    this.onHud({
      gameState: this.gameState,
      speed: this.speed,
      health: this.health,
      score: this.score,
      distance: this.distance,
      takedowns: this.takedowns,
      warning,
    });

    document.title = this.gameState === 'playing' ? `${GAME_TITLE} · ${Math.round(this.score)}` : GAME_TITLE;
  }
}
