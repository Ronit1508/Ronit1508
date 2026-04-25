export class InputController {
  accelerate = false;
  brake = false;
  steer = 0;

  private attackPressed = false;
  private startPressed = false;
  private restartPressed = false;
  private pausePressed = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }

  consumeAttack() {
    const pressed = this.attackPressed;
    this.attackPressed = false;
    return pressed;
  }

  consumeStart() {
    const pressed = this.startPressed;
    this.startPressed = false;
    return pressed;
  }

  consumeRestart() {
    const pressed = this.restartPressed;
    this.restartPressed = false;
    return pressed;
  }

  consumePause() {
    const pressed = this.pausePressed;
    this.pausePressed = false;
    return pressed;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (key === 'w' || key === 'arrowup') this.accelerate = true;
    if (key === 's' || key === 'arrowdown') this.brake = true;
    if (key === 'a' || key === 'arrowleft') this.steer = -1;
    if (key === 'd' || key === 'arrowright') this.steer = 1;

    if (key === ' ') {
      this.attackPressed = true;
      event.preventDefault();
    }

    if (key === 'enter') this.startPressed = true;
    if (key === 'r') this.restartPressed = true;
    if (key === 'p') this.pausePressed = true;
  };

  private onKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (key === 'w' || key === 'arrowup') this.accelerate = false;
    if (key === 's' || key === 'arrowdown') this.brake = false;

    if (key === 'a' || key === 'arrowleft') {
      if (this.steer < 0) this.steer = 0;
    }

    if (key === 'd' || key === 'arrowright') {
      if (this.steer > 0) this.steer = 0;
    }

    if (key === ' ') event.preventDefault();
  };

  private onBlur = () => {
    this.accelerate = false;
    this.brake = false;
    this.steer = 0;
    this.attackPressed = false;
  };
}
