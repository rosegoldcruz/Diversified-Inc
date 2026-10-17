/**
 * Waypoint walker for the full-page robot. Pure logic, pixel units, origin = viewport center (matches the
 * orthographic r3f camera at zoom 1). The robot walks between waypoints in the lower band of the screen,
 * turns toward its heading, and pauses to wave or talk at each stop.
 */
import type { RobotMove } from "./clips";

export type WalkerState = {
  x: number;
  y: number;
  heading: number; // rotation.y in radians, 0 = facing the viewer
  move: RobotMove;
};

const SPEED = 110; // px/s
const TURN = 6; // rad/s smoothing

export class Walker {
  s: WalkerState;
  private target = { x: 0, y: 0 };
  private pauseLeft = 1.2;
  private pauseMove: RobotMove = "wave";
  private w = 1;
  private h = 1;
  private size = 140;
  /** set by the voice hook: freezes walking and faces the viewer */
  engaged: false | "listen" | "talk" = false;

  constructor(w: number, h: number, size: number) {
    this.resize(w, h, size);
    this.s = { x: w / 2 - size, y: -h / 2 + 16, heading: 0, move: "wave" };
    this.pickTarget();
  }

  resize(w: number, h: number, size: number) {
    this.w = w;
    this.h = h;
    this.size = size;
  }

  private pickTarget() {
    const m = this.size * 0.6;
    const minX = -this.w / 2 + m;
    const maxX = this.w / 2 - m;
    // stay in the lower ~30% of the screen so content stays readable
    const minY = -this.h / 2 + 12;
    const maxY = -this.h / 2 + Math.max(24, this.h * 0.3 - this.size);
    let x = minX + Math.random() * (maxX - minX);
    // prefer long, attention-grabbing walks
    if (Math.abs(x - this.s.x) < this.w * 0.25) x = this.s.x > 0 ? minX + Math.random() * this.w * 0.2 : maxX - Math.random() * this.w * 0.2;
    this.target = { x, y: minY + Math.random() * (maxY - minY) };
  }

  /** Park in the bottom-right corner (reduced motion). */
  park() {
    this.s = { x: this.w / 2 - this.size * 0.7, y: -this.h / 2 + 12, heading: 0, move: "idle" };
  }

  step(dt: number): WalkerState {
    const s = this.s;
    let desiredHeading = 0;
    if (this.engaged) {
      s.move = this.engaged;
    } else if (this.pauseLeft > 0) {
      this.pauseLeft -= dt;
      s.move = this.pauseLeft > 0 ? this.pauseMove : "idle";
      if (this.pauseLeft <= 0) this.pickTarget();
    } else {
      const dx = this.target.x - s.x;
      const dy = this.target.y - s.y;
      const d = Math.hypot(dx, dy);
      if (d < 4) {
        this.pauseLeft = 2.2 + Math.random() * 2.5;
        this.pauseMove = (["wave", "talk", "point", "idle"] as RobotMove[])[Math.floor(Math.random() * 4)];
      } else {
        const v = Math.min(d, SPEED * dt);
        s.x += (dx / d) * v;
        s.y += (dy / d) * v;
        s.move = "walk";
        // side-on when walking horizontally, three-quarter when moving up/down the screen
        desiredHeading = Math.sign(dx || 1) * (Math.PI / 2) * Math.min(1, Math.abs(dx) / (d || 1) + 0.25);
      }
    }
    s.heading += (desiredHeading - s.heading) * Math.min(1, TURN * dt);
    // clamp in case of resize
    s.x = Math.max(-this.w / 2 + this.size * 0.4, Math.min(this.w / 2 - this.size * 0.4, s.x));
    return s;
  }
}
