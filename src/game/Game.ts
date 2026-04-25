import * as THREE from 'three';
import { GAME_TITLE, LANES, TUNING } from './constants';
import type { HudState, Particle, WorldActor } from './entities';
import { InputController } from './input';

interface PlayerRig {
  rearWheel: THREE.Mesh;
  frontWheel: THREE.Mesh;
  swingArm: THREE.Group;
  handle: THREE.Group;
  rider: THREE.Group;
}

export class Game {
  private scene = new THREE.Scene();
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private frame = 0;

  private input = new InputController();

  private player = new THREE.Group();
  private playerRig!: PlayerRig;
  private playerLaneX = 0;
  private playerZ = 12;
  private speed = TUNING.baseSpeed;
  private attackCooldown = 0;
  private attackTimer = 0;

  private actors: WorldActor[] = [];
  private particles: Particle[] = [];

  private roadSegments: THREE.Group[] = [];
  private laneMarkers: THREE.Mesh[] = [];
  private props: THREE.Object3D[] = [];
  private horizonProps: THREE.Object3D[] = [];

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
  private collisionFlash = 0;
  private nearMissFlash = 0;

  private cameraLookTarget = new THREE.Vector3();
  private skyDome = new THREE.Mesh();

  constructor(private host: HTMLDivElement, private onHud: (hud: HudState) => void) {
    this.scene.background = new THREE.Color('#d3c0a1');
    this.scene.fog = new THREE.Fog('#d6c2a1', 48, 235);

    this.camera = new THREE.PerspectiveCamera(64, host.clientWidth / host.clientHeight, 0.1, 1100);
    this.camera.position.set(0, 5.1, 18.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(this.renderer.domElement);

    this.setupAtmosphere();
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

  private setupAtmosphere() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#6ca2cf');
      grad.addColorStop(0.4, '#9bc4de');
      grad.addColorStop(0.7, '#f0c083');
      grad.addColorStop(1, '#f2d8a9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    this.skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(900, 28, 22),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false }),
    );
    this.skyDome.position.y = -100;
    this.scene.add(this.skyDome);
  }

  private setupLights() {
    const hemi = new THREE.HemisphereLight('#fff6db', '#8a6447', 0.75);
    this.scene.add(hemi);

    const ambient = new THREE.AmbientLight('#f8d7af', 0.25);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight('#ffe4ba', 2.6);
    sun.position.set(55, 82, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -130;
    sun.shadow.camera.right = 130;
    sun.shadow.camera.top = 130;
    sun.shadow.camera.bottom = -130;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 340;
    sun.shadow.bias = -0.00012;
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight('#7ba8dc', 0.55);
    rim.position.set(-45, 15, -25);
    this.scene.add(rim);
  }

  private createWorld() {
    const asphalt = this.makeRoadTexture();
    asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
    asphalt.repeat.set(1, 10);

    const roadMat = new THREE.MeshStandardMaterial({
      map: asphalt,
      roughness: 0.92,
      metalness: 0.08,
      color: '#85878a',
    });
    const shoulderMat = new THREE.MeshStandardMaterial({ color: '#8f6f52', roughness: 1, metalness: 0 });
    const rumbleMat = new THREE.MeshStandardMaterial({ color: '#c8ad7d', roughness: 0.8 });
    const markerMat = new THREE.MeshStandardMaterial({ color: '#ece7d5', emissive: '#f8edbf', emissiveIntensity: 0.12 });

    for (let i = 0; i < 18; i += 1) {
      const seg = new THREE.Group();
      const z = -i * 48;

      const road = new THREE.Mesh(new THREE.BoxGeometry(22.5, 0.25, 50), roadMat);
      road.receiveShadow = true;
      road.castShadow = false;
      road.position.y = -0.13;
      seg.add(road);

      const leftShoulder = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.2, 50), shoulderMat);
      leftShoulder.position.set(-17.1, -0.14, 0);
      leftShoulder.receiveShadow = true;
      seg.add(leftShoulder);

      const rightShoulder = leftShoulder.clone();
      rightShoulder.position.x = 17.1;
      seg.add(rightShoulder);

      const leftRumble = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 50), rumbleMat);
      leftRumble.position.set(-10.9, 0.02, 0);
      seg.add(leftRumble);
      const rightRumble = leftRumble.clone();
      rightRumble.position.x = 10.9;
      seg.add(rightRumble);

      for (let m = 0; m < 10; m += 1) {
        const marker = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 2.4), markerMat);
        marker.position.set(0, 0.03, -22 + m * 5);
        marker.receiveShadow = true;
        seg.add(marker);
        this.laneMarkers.push(marker);
      }

      seg.position.set(0, 0, z);
      this.scene.add(seg);
      this.roadSegments.push(seg);
    }

    const terrainMat = new THREE.MeshStandardMaterial({ color: '#b69064', roughness: 1 });
    const terrain = new THREE.Mesh(new THREE.PlaneGeometry(500, 1300), terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.2;
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    for (let i = 0; i < 190; i += 1) {
      this.spawnRoadsideProp(i);
    }

    for (let i = 0; i < 55; i += 1) {
      const dune = new THREE.Mesh(
        new THREE.ConeGeometry(14 + Math.random() * 16, 12 + Math.random() * 18, 6),
        new THREE.MeshStandardMaterial({ color: '#b08358', roughness: 0.97 }),
      );
      dune.position.set((Math.random() > 0.5 ? 1 : -1) * (45 + Math.random() * 120), 5 + Math.random() * 8, -120 - i * 45);
      dune.rotation.y = Math.random() * Math.PI;
      this.scene.add(dune);
      this.horizonProps.push(dune);
    }

    for (let i = 0; i < 24; i += 1) {
      const massif = new THREE.Mesh(
        new THREE.ConeGeometry(35 + Math.random() * 24, 48 + Math.random() * 26, 7),
        new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#89684e' : '#7f5d44', roughness: 0.98 }),
      );
      massif.position.set(i % 2 === 0 ? -180 - Math.random() * 55 : 180 + Math.random() * 55, 30, -220 - i * 110);
      massif.rotation.y = Math.random() * Math.PI;
      this.scene.add(massif);
      this.horizonProps.push(massif);
    }
  }

  private makeRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#404346';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 16000; i += 1) {
        const gray = 45 + Math.floor(Math.random() * 45);
        ctx.fillStyle = `rgba(${gray},${gray},${gray},${Math.random() * 0.18})`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }

      for (let i = 0; i < 400; i += 1) {
        const y = (i / 400) * canvas.height;
        ctx.fillStyle = `rgba(255,255,255,${0.018 + Math.random() * 0.03})`;
        ctx.fillRect(0, y, canvas.width, 1);
      }

      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 10; i += 1) {
        ctx.beginPath();
        ctx.moveTo(0, i * 200 + Math.random() * 30);
        ctx.lineTo(canvas.width, i * 200 + 50 + Math.random() * 30);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  private spawnRoadsideProp(index: number) {
    const z = -index * 30 - Math.random() * 20;
    const side = Math.random() > 0.5 ? 1 : -1;
    const x = side * (14 + Math.random() * 15);
    const type = Math.floor(Math.random() * 7);
    let root = new THREE.Group();

    if (type === 0) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.11, 4.2, 8),
        new THREE.MeshStandardMaterial({ color: '#7f8387', roughness: 0.6 }),
      );
      pole.castShadow = true;
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 1.2, 0.2),
        new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? '#2c6bc7' : '#2e9a57', roughness: 0.55 }),
      );
      sign.position.y = 1.5;
      sign.castShadow = true;
      root.add(pole, sign);
    } else if (type === 1) {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.34, 2.7, 8),
        new THREE.MeshStandardMaterial({ color: '#3c5f3f', roughness: 0.9 }),
      );
      const armL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 1.25, 8),
        new THREE.MeshStandardMaterial({ color: '#3b6a43', roughness: 0.9 }),
      );
      armL.rotation.z = Math.PI / 2;
      armL.position.set(-0.52, 0.36, 0);
      const armR = armL.clone();
      armR.position.x = 0.52;
      root.add(body, armL, armR);
    } else if (type === 2) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.75 + Math.random() * 0.8),
        new THREE.MeshStandardMaterial({ color: '#82664f', roughness: 1 }),
      );
      rock.scale.y = 0.75;
      root.add(rock);
    } else if (type === 3) {
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.5, 0.35),
        new THREE.MeshStandardMaterial({ color: '#bca26f', roughness: 0.7 }),
      );
      barrier.position.y = 0.25;
      root.add(barrier);
    } else if (type === 4) {
      const bush = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.6 + Math.random() * 0.4, 0),
        new THREE.MeshStandardMaterial({ color: '#7d6947', roughness: 1 }),
      );
      bush.scale.y = 0.6;
      root.add(bush);
    } else if (type === 5) {
      const wreckBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.5, 2.3),
        new THREE.MeshStandardMaterial({ color: '#5d3932', roughness: 0.8 }),
      );
      wreckBody.rotation.y = Math.random() * 0.4;
      wreckBody.position.y = 0.25;
      root.add(wreckBody);
    } else {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 1.8, 8),
        new THREE.MeshStandardMaterial({ color: '#6b6c70', roughness: 0.6 }),
      );
      post.position.y = 0.9;
      const reflector = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.22, 0.06),
        new THREE.MeshStandardMaterial({ color: '#f1d9a3', emissive: '#f1d9a3', emissiveIntensity: 0.3 }),
      );
      reflector.position.y = 1.65;
      root.add(post, reflector);
    }

    root.position.set(x, 0.6, z);
    root.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    this.scene.add(root);
    this.props.push(root);
  }

  private createPlayer() {
    const bike = new THREE.Group();

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.45, 3.3),
      new THREE.MeshStandardMaterial({ color: '#9a1010', metalness: 0.72, roughness: 0.23 }),
    );
    frame.position.y = 0.7;

    const tank = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.42, 1.25, 8, 10),
      new THREE.MeshStandardMaterial({ color: '#cc2020', metalness: 0.66, roughness: 0.24 }),
    );
    tank.rotation.x = Math.PI / 2;
    tank.position.set(0, 0.98, 0.1);

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.2, 1.1),
      new THREE.MeshStandardMaterial({ color: '#111317', roughness: 0.65 }),
    );
    seat.position.set(0, 0.95, 0.78);

    const fairing = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: '#171c24', metalness: 0.5, roughness: 0.3 }),
    );
    fairing.rotation.x = -Math.PI / 2;
    fairing.position.set(0, 0.9, -1.45);

    const windscreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.12),
      new THREE.MeshStandardMaterial({ color: '#9cc3de', transparent: true, opacity: 0.65, metalness: 0.8, roughness: 0.1 }),
    );
    windscreen.position.set(0, 1.2, -1.35);

    const rearWheel = this.makeWheel(0.45, 0.15);
    rearWheel.position.set(0, 0.34, 1.35);

    const frontWheel = this.makeWheel(0.45, 0.15);
    frontWheel.position.set(0, 0.34, -1.28);

    const swingArm = new THREE.Group();
    const forkL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: '#a3a6aa', metalness: 0.85, roughness: 0.22 }),
    );
    forkL.position.set(-0.21, 0.78, -1.17);
    forkL.rotation.x = 0.36;
    const forkR = forkL.clone();
    forkR.position.x = 0.21;
    swingArm.add(forkL, forkR);

    const handle = new THREE.Group();
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.7, 10),
      new THREE.MeshStandardMaterial({ color: '#9b9fa4', metalness: 0.85, roughness: 0.2 }),
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.2, -0.95);
    handle.add(bar);

    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.13, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: '#7c7f83', metalness: 0.9, roughness: 0.3 }),
    );
    exhaust.rotation.z = Math.PI / 2;
    exhaust.position.set(-0.52, 0.52, 0.8);

    const rider = new THREE.Group();
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.74, 6, 10),
      new THREE.MeshStandardMaterial({ color: '#11151a', roughness: 0.7 }),
    );
    torso.position.set(0, 1.44, 0.2);
    torso.rotation.x = -0.2;

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 14, 12),
      new THREE.MeshStandardMaterial({ color: '#171d23', roughness: 0.4, metalness: 0.35 }),
    );
    helmet.position.set(0, 1.9, -0.2);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.11, 0.13),
      new THREE.MeshStandardMaterial({ color: '#97b8d3', metalness: 0.7, roughness: 0.22 }),
    );
    visor.position.set(0, 1.87, -0.42);

    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.56, 4, 8), new THREE.MeshStandardMaterial({ color: '#13171d', roughness: 0.7 }));
    legL.position.set(-0.2, 1.02, 0.65);
    legL.rotation.x = 0.4;
    const legR = legL.clone();
    legR.position.x = 0.2;

    rider.add(torso, helmet, visor, legL, legR);

    bike.add(frame, tank, seat, fairing, windscreen, rearWheel, frontWheel, swingArm, handle, exhaust, rider);
    bike.position.set(0, 0.5, this.playerZ);
    bike.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    this.player.add(bike);
    this.player.position.copy(bike.position);
    this.scene.add(this.player);

    this.playerRig = { rearWheel, frontWheel, swingArm, handle, rider };
  }

  private makeWheel(radius: number, tube: number) {
    const tire = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 14, 24),
      new THREE.MeshStandardMaterial({ color: '#16191d', roughness: 0.96 }),
    );
    tire.rotation.y = Math.PI / 2;

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.22, 10),
      new THREE.MeshStandardMaterial({ color: '#90979f', metalness: 0.75, roughness: 0.2 }),
    );
    hub.rotation.z = Math.PI / 2;

    const wheel = new THREE.Group();
    wheel.add(tire, hub);

    const spokeMat = new THREE.MeshStandardMaterial({ color: '#a4acb3', metalness: 0.82, roughness: 0.2 });
    for (let i = 0; i < 8; i += 1) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, radius * 1.65), spokeMat);
      spoke.rotation.x = (Math.PI * 2 * i) / 8;
      wheel.add(spoke);
    }

    return wheel as unknown as THREE.Mesh;
  }

  private createEnemyBike(x: number, z: number): WorldActor {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.42, 2.8),
      new THREE.MeshStandardMaterial({ color: '#1d2c74', metalness: 0.5, roughness: 0.4 }),
    );
    body.position.y = 0.62;
    const rider = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.25, 0.62, 4, 8),
      new THREE.MeshStandardMaterial({ color: '#1a2128', roughness: 0.7 }),
    );
    rider.position.set(0, 1.2, 0.15);
    const front = this.makeWheel(0.35, 0.12);
    front.position.set(0, 0.35, -1.08);
    const rear = this.makeWheel(0.35, 0.12);
    rear.position.set(0, 0.35, 1.08);
    g.add(body, rider, front, rear);
    g.position.set(x, 0.12, z);
    g.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) (obj as THREE.Mesh).castShadow = true;
    });
    this.scene.add(g);
    return { mesh: g, kind: 'enemy', lane: x, z, speed: TUNING.enemyBaseSpeed + Math.random() * 20, radius: 1.02, health: 1 };
  }

  private createTraffic(x: number, z: number): WorldActor {
    const truck = Math.random() < 0.4;
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(truck ? 2.4 : 1.95, truck ? 1.85 : 1.3, truck ? 6.2 : 4.4),
      new THREE.MeshStandardMaterial({
        color: truck ? '#8d672f' : '#7b1f2c',
        metalness: 0.28,
        roughness: 0.52,
      }),
    );
    body.position.y = truck ? 0.95 : 0.66;

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(truck ? 2.0 : 1.45, 0.62, truck ? 1.8 : 1.2),
      new THREE.MeshStandardMaterial({ color: '#9cc1dc', metalness: 0.72, roughness: 0.16, transparent: true, opacity: 0.82 }),
    );
    cabin.position.set(0, truck ? 1.55 : 1.12, truck ? -1.85 : -1.25);

    const brakeLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.1, 0.07),
      new THREE.MeshStandardMaterial({ color: '#ce3f31', emissive: '#ce3f31', emissiveIntensity: 0.6 }),
    );
    brakeLight.position.set(0.65, truck ? 0.95 : 0.7, 2.1);
    const brakeLight2 = brakeLight.clone();
    brakeLight2.position.x = -0.65;

    g.add(body, cabin, brakeLight, brakeLight2);
    g.position.set(x, 0.03, z);
    g.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    this.scene.add(g);
    return { mesh: g, kind: 'traffic', lane: x, z, speed: 30 + Math.random() * 30, radius: truck ? 1.7 : 1.35, health: 4 };
  }

  private createDino(z: number): WorldActor {
    const g = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: '#4f6a52', roughness: 0.92, metalness: 0.04 });
    const darkSkin = new THREE.MeshStandardMaterial({ color: '#3b4d3d', roughness: 0.95, metalness: 0.03 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(1.45, 4.0, 12, 16), skin);
    torso.rotation.z = Math.PI / 2;
    torso.position.y = 2.9;

    const hips = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 12), darkSkin);
    hips.position.set(-2.1, 2.5, 0);

    const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.52, 2.2, 9, 11), skin);
    neck.position.set(2.7, 3.85, -0.25);
    neck.rotation.z = -0.46;

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.92, 2.2), skin);
    head.position.set(4.22, 3.72, -0.3);

    const jaw = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.28, 1.8), darkSkin);
    jaw.position.set(4.33, 3.26, -0.3);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.52, 4.3, 12), darkSkin);
    tail.position.set(-4.2, 2.65, 0);
    tail.rotation.z = -Math.PI / 2;

    const legGeo = new THREE.CylinderGeometry(0.33, 0.4, 2.7, 10);
    const legFL = new THREE.Mesh(legGeo, darkSkin);
    legFL.position.set(1.1, 1.25, -0.95);
    const legFR = legFL.clone();
    legFR.position.z = 0.95;
    const legBL = legFL.clone();
    legBL.position.x = -1.4;
    const legBR = legFR.clone();
    legBR.position.x = -1.4;

    g.add(torso, hips, neck, head, jaw, tail, legFL, legFR, legBL, legBR);
    g.position.set(-16, 0, z);
    g.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    this.scene.add(g);

    return {
      mesh: g,
      kind: 'dino',
      lane: 0,
      z,
      speed: 45,
      radius: 3,
      health: 10,
      aggressive: false,
      roarTimer: 2.8,
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
    this.player.position.set(0, 0.5, this.playerZ);
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
    this.collisionFlash = 0;
    this.nearMissFlash = 0;

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
    this.speed = THREE.MathUtils.clamp(this.speed, TUNING.minSpeed, TUNING.maxSpeed + this.difficulty * 12);

    this.playerLaneX += this.input.steer * TUNING.steerRate * dt * (0.6 + this.speed / 230);
    this.playerLaneX = THREE.MathUtils.clamp(this.playerLaneX, -TUNING.roadHalfWidth + 0.85, TUNING.roadHalfWidth - 0.85);

    const bob = Math.sin(this.distance * 48) * 0.03;
    const accelPitch = (this.input.accelerate ? -0.04 : 0) + (this.input.brake ? 0.06 : 0);
    this.player.rotation.z = THREE.MathUtils.lerp(this.player.rotation.z, -this.input.steer * 0.38, dt * 11);
    this.player.rotation.y = THREE.MathUtils.lerp(this.player.rotation.y, -this.input.steer * 0.08, dt * 8);
    this.player.rotation.x = THREE.MathUtils.lerp(this.player.rotation.x, accelPitch, dt * 8);
    this.player.position.x = THREE.MathUtils.lerp(this.player.position.x, this.playerLaneX, dt * 12);
    this.player.position.y = 0.5 + bob;

    this.playerRig.rearWheel.rotation.x += dt * (this.speed * 0.34);
    this.playerRig.frontWheel.rotation.x += dt * (this.speed * 0.34);
    this.playerRig.handle.rotation.y = THREE.MathUtils.lerp(this.playerRig.handle.rotation.y, this.input.steer * 0.25, dt * 8);
    this.playerRig.swingArm.position.y = THREE.MathUtils.lerp(this.playerRig.swingArm.position.y, this.input.brake ? -0.05 : 0, dt * 10);
    this.playerRig.rider.rotation.z = THREE.MathUtils.lerp(this.playerRig.rider.rotation.z, -this.input.steer * 0.12, dt * 8);

    if (this.input.consumeAttack() && this.attackCooldown <= 0) {
      this.attackCooldown = TUNING.playerAttackCooldown;
      this.attackTimer = TUNING.playerAttackWindow;
      this.spawnSparks(this.player.position.clone().add(new THREE.Vector3(1.0, 0.95, -1.2)), 12, '#ffd898', 2.4);
    }

    this.enemySpawn += dt;
    this.trafficSpawn += dt;
    this.dinoSpawn -= dt;

    const enemyCadence = Math.max(0.45, TUNING.enemySpawnInterval - this.difficulty * 0.2);
    const trafficCadence = Math.max(0.4, TUNING.trafficSpawnInterval - this.difficulty * 0.13);

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

    const speedNorm = THREE.MathUtils.clamp(this.speed / 240, 0, 1);
    const fovTarget = 63 + speedNorm * 26 + this.nearMissFlash * 2.5;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, fovTarget, dt * 3.2);
    this.camera.updateProjectionMatrix();

    const camTarget = new THREE.Vector3(
      this.player.position.x * 0.58,
      5 + speedNorm * 1.5 + this.collisionFlash * 0.15,
      this.player.position.z + 19.5 - speedNorm * 2.5,
    );
    this.camera.position.lerp(camTarget, dt * 5.8);

    this.cameraLookTarget.set(
      this.player.position.x * 0.2,
      1.2 + speedNorm * 0.5,
      this.player.position.z - 18,
    );
    this.camera.lookAt(this.cameraLookTarget);
    this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, -this.input.steer * 0.06 + this.collisionFlash * 0.02, dt * 6);

    if (this.health <= 0) this.gameOver();
    this.updateHud();
  }

  private updateActors(dt: number) {
    const passed: WorldActor[] = [];

    for (const actor of this.actors) {
      if (actor.kind === 'dino') {
        actor.roarTimer = Math.max(0, (actor.roarTimer ?? 0) - dt);
        if (actor.roarTimer! < 2.0 && !actor.aggressive) {
          actor.aggressive = true;
          actor.mesh.position.x = -11;
          this.shake = Math.max(this.shake, 0.5);
          for (let i = 0; i < 3; i += 1) {
            this.spawnDustBurst(actor.mesh.position.clone().add(new THREE.Vector3(0, 0.2, (i - 1) * 1.5)), 16);
          }
        }

        if (actor.aggressive) {
          actor.mesh.position.x = THREE.MathUtils.lerp(actor.mesh.position.x, 10, dt * (1.35 + this.difficulty * 0.16));
          actor.mesh.rotation.y = 0.22;
        }

        actor.mesh.position.z += (this.speed - actor.speed) * dt;
        actor.mesh.position.y = Math.abs(Math.sin(performance.now() * 0.004)) * 0.2;
      } else {
        actor.mesh.position.z += (this.speed - actor.speed) * dt;
        if (actor.kind === 'enemy') {
          const pull = THREE.MathUtils.clamp((this.player.position.x - actor.mesh.position.x) * 0.75, -1, 1);
          actor.mesh.position.x += pull * dt * (2.4 + this.difficulty * 0.4);
          actor.mesh.rotation.z = THREE.MathUtils.lerp(actor.mesh.rotation.z, -pull * 0.3, dt * 6);
          actor.mesh.rotation.x = Math.sin((actor.mesh.position.z + performance.now() * 0.02) * 0.18) * 0.03;
        }
      }

      actor.z = actor.mesh.position.z;

      if (actor.z > this.playerZ + 27) {
        passed.push(actor);
        continue;
      }

      const dz = actor.z - this.playerZ;
      if (dz > -8.5 && dz < 0.6 && Math.abs(actor.mesh.position.x - this.player.position.x) < actor.radius + 1.05) {
        this.handleCollision(actor);
      }

      if (actor.kind !== 'dino' && actor.z > this.playerZ && !this.nearMissLock.has(actor)) {
        const laneDelta = Math.abs(actor.mesh.position.x - this.player.position.x);
        if (laneDelta < 2.0) {
          this.score += TUNING.nearMissBonus;
          this.nearMissLock.add(actor);
          this.nearMissFlash = 1;
          this.spawnSparks(this.player.position.clone().add(new THREE.Vector3(0, 0.3, -0.7)), 8, '#f9dd9b', 1.8);
        }
      }

      if (actor.kind === 'enemy' && this.attackTimer > 0) {
        const lateral = Math.abs(actor.mesh.position.x - this.player.position.x);
        const closeZ = actor.z > this.playerZ - 3.4 && actor.z < this.playerZ + 1.8;
        if (lateral < 2.15 && closeZ && actor.health > 0) {
          actor.health = 0;
          actor.dead = true;
          this.takedowns += 1;
          this.score += TUNING.takedownBonus;
          this.spawnSparks(actor.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 20, '#ff9e62', 4.4);
          actor.mesh.rotation.z += (Math.random() > 0.5 ? 1 : -1) * 0.8;
          actor.speed = 10;
          this.shake = Math.max(this.shake, 0.2);
        }
      }

      if (actor.kind === 'enemy' && actor.z > this.playerZ + 2.1 && !actor.dead) {
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
      actor.mesh.rotation.x += dt * 6.5;
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
    this.speed *= 0.55;
    this.shake = Math.max(this.shake, actor.kind === 'dino' ? 0.86 : 0.42);
    this.collisionFlash = 1;

    this.spawnSparks(this.player.position.clone().add(new THREE.Vector3(0, 0.45, -0.4)), 32, '#ffcd85', 6.3);
    this.spawnSparks(actor.mesh.position.clone().add(new THREE.Vector3(0, 0.9, 0)), 20, '#ff764f', 4.2);

    if (actor.kind !== 'dino') {
      actor.dead = true;
      actor.speed = 0;
      actor.mesh.rotation.z += (Math.random() * 0.7 + 0.4) * (Math.random() > 0.5 ? 1 : -1);
    }

    if (actor.kind === 'dino') {
      actor.aggressive = true;
      this.dinoWarning = 1.8;
      this.spawnDustBurst(this.player.position.clone().add(new THREE.Vector3(0, 0.2, -1.2)), 22);
    }
  }

  private updateEnvironment(dt: number) {
    const travel = this.speed * dt;
    this.dustTimer += dt * (0.45 + this.speed / 130);

    if (this.dustTimer > 0.032) {
      this.dustTimer = 0;
      this.spawnDustTrail();
    }

    for (const seg of this.roadSegments) {
      seg.position.z += travel;
      seg.position.x = Math.sin((this.distance * 2.2 + seg.position.z) * 0.004) * 0.45;
      if (seg.position.z > this.playerZ + 45) seg.position.z -= 18 * 48;
    }

    for (const obj of this.props) {
      obj.position.z += travel;
      if (obj.position.z > this.playerZ + 65) {
        obj.position.z -= TUNING.worldLength + Math.random() * 360;
        obj.position.x = (obj.position.x > 0 ? 1 : -1) * (14 + Math.random() * 15);
      }
    }

    for (const obj of this.horizonProps) {
      obj.position.z += travel * 0.28;
      if (obj.position.z > this.playerZ + 240) obj.position.z -= 3000;
    }

    this.camera.position.x += (Math.random() - 0.5) * this.shake;
    this.camera.position.y += (Math.random() - 0.5) * this.shake;
    this.shake = THREE.MathUtils.lerp(this.shake, 0, dt * 6.2);
  }

  private updateEffects(dt: number) {
    if (this.dinoWarning > 0) this.dinoWarning = Math.max(0, this.dinoWarning - dt);
    this.collisionFlash = Math.max(0, this.collisionFlash - dt * 3.5);
    this.nearMissFlash = Math.max(0, this.nearMissFlash - dt * 2.2);
    this.renderer.toneMappingExposure = 1.07 + this.collisionFlash * 0.2 + this.nearMissFlash * 0.08;
  }

  private spawnEnemy() {
    const lane = LANES[Math.floor(Math.random() * LANES.length)] + (Math.random() - 0.5) * 0.55;
    const enemy = this.createEnemyBike(lane, -150 - Math.random() * 140);
    this.actors.push(enemy);
  }

  private spawnTraffic() {
    const lane = LANES[Math.floor(Math.random() * LANES.length)] + (Math.random() - 0.5) * 0.45;
    const traffic = this.createTraffic(lane, -170 - Math.random() * 140);
    this.actors.push(traffic);
  }

  private spawnDinoEvent() {
    const dino = this.createDino(-190 - Math.random() * 80);
    this.actors.push(dino);
    this.dinoWarning = 4.4;
    this.shake = Math.max(this.shake, 0.62);
    this.score += 150;

    const ringCenter = new THREE.Vector3(0, 0.2, this.playerZ - 80);
    for (let i = 0; i < 4; i += 1) {
      this.spawnDustBurst(ringCenter.clone().add(new THREE.Vector3((i - 1.5) * 3.2, 0, 0)), 18);
    }
  }

  private spawnDustTrail() {
    const spread = this.input.steer === 0 ? 0.72 : 1.0;
    const pos = this.player.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * spread, -0.24, 1.25));
    this.spawnParticle(pos, '#ceb28f', 0.85 + Math.random() * 0.52, new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 1.0, 3.2 + Math.random() * 2.3), 0.12 + Math.random() * 0.15);
  }

  private spawnDustBurst(origin: THREE.Vector3, count: number) {
    for (let i = 0; i < count; i += 1) {
      const vel = new THREE.Vector3((Math.random() - 0.5) * 4.4, Math.random() * 2.6, (Math.random() - 0.5) * 2.5);
      this.spawnParticle(origin, '#c2a57f', 0.62 + Math.random() * 0.36, vel, 0.13 + Math.random() * 0.2);
    }
  }

  private spawnSparks(origin: THREE.Vector3, count: number, color: string, speed: number) {
    for (let i = 0; i < count; i += 1) {
      const vel = new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed * 0.5, (Math.random() - 0.5) * speed);
      this.spawnParticle(origin, color, 0.35 + Math.random() * 0.35, vel, 0.05 + Math.random() * 0.08);
    }
  }

  private spawnParticle(origin: THREE.Vector3, color: string, life: number, velocity: THREE.Vector3, size: number) {
    if (this.particles.length >= TUNING.maxParticles) return;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 6, 6),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, roughness: 0.45, transparent: true }),
    );
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.particles.push({ mesh, life, maxLife: life, velocity });
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= dt * 5;
      const scale = Math.max(0, p.life / p.maxLife);
      p.mesh.scale.setScalar(scale);
      const mat = p.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = scale;
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
    this.spawnSparks(this.player.position.clone(), 70, '#ff6f5a', 8.2);
    this.updateHud();
  }

  private updateHud() {
    let warning: string | null = null;
    if (this.gameState === 'playing' && this.dinoWarning > 0) warning = `⚠ DINO ALERT · IMPACT WINDOW ${this.dinoWarning.toFixed(1)}s`;
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
