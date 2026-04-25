import * as THREE from 'three';

export class InputController {
  movement = new THREE.Vector2();
  isShooting = false;
  rollPressed = false;
  startPressed = false;
  restartPressed = false;

  private activeKeys = new Set<string>();
  private dragging = false;
  private dragAnchor: THREE.Vector2 | null = null;
  private tapShoot = false;
  private touchAutoFire = false;

  constructor(private element: HTMLElement | Window) {
    this.bindEvents();
  }

  consumeRoll(): boolean {
    if (!this.rollPressed) return false;
    this.rollPressed = false;
    return true;
  }

  consumeStart(): boolean {
    if (!this.startPressed) return false;
    this.startPressed = false;
    return true;
  }

  consumeRestart(): boolean {
    if (!this.restartPressed) return false;
    this.restartPressed = false;
    return true;
  }

  consumeShoot(): boolean {
    if (this.tapShoot) {
      this.tapShoot = false;
      return true;
    }
    return this.isShooting || this.touchAutoFire;
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);

    if (this.element instanceof HTMLElement) {
      this.element.removeEventListener('pointerdown', this.onPointerDown);
      this.element.removeEventListener('pointermove', this.onPointerMove);
      this.element.removeEventListener('pointerup', this.onPointerUp);
      this.element.removeEventListener('pointerleave', this.onPointerUp);
      this.element.removeEventListener('pointercancel', this.onPointerUp);
      this.element.removeEventListener('click', this.onClick);
    }
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);

    if (this.element instanceof HTMLElement) {
      this.element.addEventListener('pointerdown', this.onPointerDown);
      this.element.addEventListener('pointermove', this.onPointerMove);
      this.element.addEventListener('pointerup', this.onPointerUp);
      this.element.addEventListener('pointerleave', this.onPointerUp);
      this.element.addEventListener('pointercancel', this.onPointerUp);
      this.element.addEventListener('click', this.onClick);
    }
  }

  private recomputeMovement() {
    const left = this.activeKeys.has('arrowleft') || this.activeKeys.has('a');
    const right = this.activeKeys.has('arrowright') || this.activeKeys.has('d');
    const up = this.activeKeys.has('arrowup') || this.activeKeys.has('w');
    const down = this.activeKeys.has('arrowdown') || this.activeKeys.has('s');

    if (!this.dragging) {
      this.movement.set((right ? 1 : 0) - (left ? 1 : 0), (up ? 1 : 0) - (down ? 1 : 0));
      if (this.movement.lengthSq() > 1) this.movement.normalize();
    }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    this.activeKeys.add(key);

    if (key === ' ') {
      this.isShooting = true;
      event.preventDefault();
    }

    if (key === 'shift') this.rollPressed = true;
    if (key === 'enter') this.startPressed = true;
    if (key === 'r') this.restartPressed = true;

    this.recomputeMovement();
  };

  private onKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    this.activeKeys.delete(key);
    if (key === ' ') {
      this.isShooting = false;
      event.preventDefault();
    }
    this.recomputeMovement();
  };

  private onBlur = () => {
    this.activeKeys.clear();
    this.movement.set(0, 0);
    this.isShooting = false;
    this.dragging = false;
    this.touchAutoFire = false;
  };

  private onPointerDown = (event: PointerEvent) => {
    if (!(this.element instanceof HTMLElement)) return;
    this.dragging = true;
    this.dragAnchor = new THREE.Vector2(event.clientX, event.clientY);
    this.touchAutoFire = event.pointerType === 'touch';
    this.element.setPointerCapture(event.pointerId);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragging || !this.dragAnchor) return;
    const dx = (event.clientX - this.dragAnchor.x) / 90;
    const dy = (event.clientY - this.dragAnchor.y) / 90;
    this.movement.set(THREE.MathUtils.clamp(dx, -1, 1), THREE.MathUtils.clamp(-dy, -1, 1));
  };

  private onPointerUp = () => {
    this.dragging = false;
    this.dragAnchor = null;
    this.movement.set(0, 0);
    this.touchAutoFire = false;
    this.recomputeMovement();
  };

  private onClick = () => {
    this.tapShoot = true;
  };
}
