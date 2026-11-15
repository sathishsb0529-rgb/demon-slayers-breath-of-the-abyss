import { BREATHING_STYLES } from './breathing';
import { GROUND_Y } from './constants';
import {
  BdaProjectile,
  BreathingFormSpec,
  BreathingStyleId,
  FloatingDamage,
  Particle,
  SlashTrailPoint,
} from './types';

const MAX_PARTICLES = 260;
const MAX_TRAIL_POINTS = 72;

interface BreathingEffectArc {
  style: BreathingStyleId;
  formIndex: number;
  pattern: BreathingFormSpec['motionPattern'];
  x: number;
  y: number;
  facing: 1 | -1;
  life: number;
  maxLife: number;
  range: number;
}

interface MeleeSlashArc {
  x: number;
  y: number;
  facing: 1 | -1;
  startAngle: number;
  endAngle: number;
  radius: number;
  color: string;
  heavy: boolean;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public trails: SlashTrailPoint[] = [];
  public floatingTexts: FloatingDamage[] = [];
  public breathingArcs: BreathingEffectArc[] = [];
  public meleeArcs: MeleeSlashArc[] = [];
  private bloodEffectsEnabled = false;
  private combatVisualEffects = true;
  private performanceMode = false;

  public setVisualSettings(opts: {
    bloodEffectsEnabled: boolean;
    combatVisualEffects: boolean;
    performanceMode: boolean;
  }): void {
    this.bloodEffectsEnabled = opts.bloodEffectsEnabled;
    this.combatVisualEffects = opts.combatVisualEffects;
    this.performanceMode = opts.performanceMode;
    if (!this.bloodEffectsEnabled) {
      this.particles = this.particles.filter((p) => p.kind !== 'blood');
    }
    if (!this.combatVisualEffects) {
      this.trails.length = 0;
      this.breathingArcs.length = 0;
      this.meleeArcs.length = 0;
    }
  }

  public clear(): void {
    this.particles.length = 0;
    this.trails.length = 0;
    this.floatingTexts.length = 0;
    this.breathingArcs.length = 0;
    this.meleeArcs.length = 0;
  }

  private pushParticle(p: Particle): void {
    const cap = this.performanceMode ? Math.floor(MAX_PARTICLES * 0.5) : MAX_PARTICLES;
    if (this.particles.length >= cap) {
      this.particles.shift();
    }
    this.particles.push(p);
  }

  public addTrailPoint(point: SlashTrailPoint): void {
    if (!this.combatVisualEffects) return;
    const cap = this.performanceMode ? Math.floor(MAX_TRAIL_POINTS * 0.5) : MAX_TRAIL_POINTS;
    if (this.trails.length >= cap) {
      this.trails.shift();
    }
    this.trails.push(point);
  }

  public spawnBreathingEffect(
    styleId: BreathingStyleId,
    formIndex: number,
    pattern: BreathingFormSpec['motionPattern'],
    x: number,
    y: number,
    facing: 1 | -1,
    range: number
  ): void {
    if (!this.combatVisualEffects) return;
    const style = BREATHING_STYLES[styleId];
    const scaledIntensity = Math.min(6, Math.max(1, formIndex));
    this.breathingArcs.push({
      style: styleId,
      formIndex: scaledIntensity,
      pattern,
      x,
      y: y - 50,
      facing,
      life: 0.44 + scaledIntensity * 0.045,
      maxLife: 0.44 + scaledIntensity * 0.045,
      range,
    });

    const rawCount = 20 + scaledIntensity * 6;
    const count = this.performanceMode ? Math.max(8, Math.floor(rawCount * 0.45)) : rawCount;
    const kindMap: Record<BreathingStyleId, Particle['kind']> = {
      water: 'water',
      flame: 'flame',
      thunder: 'lightning',
      beast: 'spark',
      wind: 'mist',
      insect: 'poison',
      sound: 'flame',
      mist: 'mist',
      love: 'petal',
      serpent: 'poison',
      stone: 'stone',
      sun: 'flame',
      flower: 'petal',
      moon: 'spark',
    };

    const kind = kindMap[styleId];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const spreadX = (t - 0.15) * range * facing;
      const spreadY = Math.sin(t * Math.PI * 3) * 32 + (Math.random() - 0.5) * 34;
      const speed = 120 + Math.random() * 280;
      const angle = (facing === 1 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.4;

      this.pushParticle({
        x: x + spreadX * 0.65,
        y: y - 52 + spreadY,
        vx: Math.cos(angle) * speed * 0.6 + facing * 90,
        vy: Math.sin(angle) * speed * 0.5 - (styleId === 'flame' || styleId === 'sun' ? 140 : 40),
        size: 3.5 + Math.random() * 6,
        life: 0.35 + Math.random() * 0.4,
        maxLife: 0.75,
        color: i % 3 === 0 ? style.secondaryColor : style.primaryColor,
        glowColor: style.glowColor,
        gravity: styleId === 'flame' || styleId === 'mist' || styleId === 'insect' || styleId === 'flower' ? -95 : 520,
        drag: 0.94,
        kind,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 10,
      });
    }

    this.pushParticle({
      x: x + facing * 48,
      y: y - 48,
      vx: facing * 80,
      vy: 0,
      size: 16,
      life: 0.32,
      maxLife: 0.32,
      color: style.primaryColor,
      gravity: 0,
      drag: 1,
      kind: 'ring',
      rotation: 0,
      vr: 0,
    });
  }

  public spawnAwakeningBurst(x: number, y: number, color: string): void {
    const count = this.performanceMode ? 12 : 24;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const spd = 120 + Math.random() * 220;
      this.pushParticle({
        x,
        y: y - 48,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 60,
        size: 4 + Math.random() * 4.5,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        color,
        glowColor: '#ffffff',
        gravity: -40,
        drag: 0.93,
        kind: 'spark',
        rotation: ang,
        vr: 6,
      });
    }
    this.pushParticle({
      x,
      y: y - 48,
      vx: 0,
      vy: 0,
      size: 24,
      life: 0.42,
      maxLife: 0.42,
      color,
      gravity: 0,
      drag: 1,
      kind: 'ring',
      rotation: 0,
      vr: 0,
    });
  }

  public spawnUltimateBurst(x: number, y: number, primary: string, secondary: string): void {
    const count = this.performanceMode ? 18 : 36;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const spd = 180 + Math.random() * 340;
      this.pushParticle({
        x,
        y: y - 50,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 80,
        size: 5 + Math.random() * 6,
        life: 0.55 + Math.random() * 0.3,
        maxLife: 0.85,
        color: i % 2 === 0 ? primary : secondary,
        glowColor: primary,
        gravity: -30,
        drag: 0.94,
        kind: i % 3 === 0 ? 'flame' : 'spark',
        rotation: ang,
        vr: 8,
      });
    }
  }

  public spawnFinisherAsh(x: number, y: number, color = '#94a3b8'): void {
    const count = this.performanceMode ? 14 : 28;
    for (let i = 0; i < count; i++) {
      this.pushParticle({
        x: x + (Math.random() - 0.5) * 44,
        y: y - 20 - Math.random() * 70,
        vx: (Math.random() - 0.5) * 90,
        vy: -70 - Math.random() * 140,
        size: 3 + Math.random() * 4.5,
        life: 0.7 + Math.random() * 0.6,
        maxLife: 1.3,
        color: i % 3 === 0 ? '#fde047' : i % 2 === 0 ? color : '#475569',
        gravity: -35,
        drag: 0.97,
        kind: 'dust',
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 4,
      });
    }
    if (this.bloodEffectsEnabled) {
      const bloodCount = this.performanceMode ? 6 : 14;
      for (let i = 0; i < bloodCount; i++) {
        this.pushParticle({
          x,
          y: y - 55,
          vx: (Math.random() - 0.5) * 260,
          vy: -140 - Math.random() * 220,
          size: 3.5 + Math.random() * 4,
          life: 0.45 + Math.random() * 0.35,
          maxLife: 0.8,
          color: '#dc2626',
          gravity: 1100,
          drag: 0.95,
          kind: 'blood',
          rotation: 0,
          vr: 0,
        });
      }
    }
  }

  public spawnRockShards(x: number, y: number, split: boolean): void {
    const count = split ? 34 : 10;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.9 + Math.random() * Math.PI * 0.8;
      const speed = (split ? 240 : 120) + Math.random() * (split ? 380 : 160);
      this.pushParticle({
        x: x + (Math.random() - 0.5) * 35,
        y: y - 45 + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        size: (split ? 6 : 3.5) + Math.random() * 6,
        life: 0.45 + Math.random() * 0.45,
        maxLife: 0.9,
        color: i % 2 === 0 ? '#64748b' : '#94a3b8',
        gravity: 1150,
        drag: 0.98,
        kind: 'stone',
        rotation: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 12,
      });
    }
  }

  public spawnWoodShards(x: number, y: number, broken: boolean): void {
    const count = broken ? 22 : 8;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.92 + Math.random() * Math.PI * 0.84;
      const speed = (broken ? 190 : 110) + Math.random() * 240;
      this.pushParticle({
        x: x + (Math.random() - 0.5) * 28,
        y: y - 30 + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 90,
        size: (broken ? 6 : 3.5) + Math.random() * 5,
        life: 0.4 + Math.random() * 0.35,
        maxLife: 0.75,
        color: i % 2 === 0 ? '#92400e' : '#d97706',
        gravity: 1080,
        drag: 0.96,
        kind: 'wood',
        rotation: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 14,
      });
    }
  }

  public spawnHitBurst(
    x: number,
    y: number,
    facing: 1 | -1,
    heavy: boolean,
    isDemonBlood: boolean
  ): void {
    if (!this.combatVisualEffects) return;
    const allowBlood = isDemonBlood && this.bloodEffectsEnabled;
    const rawCount = heavy ? 22 : 12;
    const count = this.performanceMode ? Math.max(5, Math.floor(rawCount * 0.5)) : rawCount;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.8;
      const angle = (facing === 1 ? 0 : Math.PI) + spread;
      const speed = (heavy ? 240 : 150) + Math.random() * (heavy ? 350 : 210);
      this.pushParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 90,
        size: (heavy ? 4.5 : 3) + Math.random() * 4,
        life: 0.24 + Math.random() * 0.24,
        maxLife: 0.48,
        color: allowBlood
          ? i % 3 === 0
            ? '#f43f5e'
            : '#a855f7'
          : isDemonBlood
            ? i % 2 === 0
              ? '#38bdf8'
              : '#a5f3fc'
            : i % 2 === 0
              ? '#fb7185'
              : '#fef08a',
        gravity: 950,
        drag: 0.94,
        kind: allowBlood ? 'blood' : 'spark',
        rotation: angle,
        vr: (Math.random() - 0.5) * 8,
      });
    }

    if (heavy) {
      this.pushParticle({
        x,
        y,
        vx: 0,
        vy: 0,
        size: 14,
        life: 0.24,
        maxLife: 0.24,
        color: isDemonBlood ? '#38bdf8' : '#f43f5e',
        gravity: 0,
        drag: 1,
        kind: 'ring',
        rotation: 0,
        vr: 0,
      });
    }
  }

  public spawnParrySparks(x: number, y: number, clash = false): void {
    const count = clash ? 26 : 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (clash ? 240 : 170) + Math.random() * 340;
      this.pushParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 2.5 + Math.random() * 3.8,
        life: 0.18 + Math.random() * 0.2,
        maxLife: 0.38,
        color: i % 2 === 0 ? '#fef08a' : '#7dd3fc',
        gravity: 700,
        drag: 0.92,
        kind: 'spark',
        rotation: angle,
        vr: 0,
      });
    }
    this.pushParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      size: clash ? 18 : 10,
      life: 0.24,
      maxLife: 0.24,
      color: clash ? '#fef08a' : '#fde047',
      gravity: 0,
      drag: 1,
      kind: 'ring',
      rotation: 0,
      vr: 0,
    });
  }

  public spawnDust(x: number, y: number, count = 7, dir = 0): void {
    for (let i = 0; i < count; i++) {
      this.pushParticle({
        x: x + (Math.random() - 0.5) * 26,
        y: Math.min(GROUND_Y - 2, y),
        vx: dir * (60 + Math.random() * 120) + (Math.random() - 0.5) * 140,
        vy: -25 - Math.random() * 75,
        size: 5 + Math.random() * 8,
        life: 0.28 + Math.random() * 0.24,
        maxLife: 0.52,
        color: 'rgba(148, 163, 184, 0.45)',
        gravity: -20,
        drag: 0.91,
        kind: 'dust',
        rotation: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 3,
      });
    }
  }

  public spawnMeleeArc(
    x: number,
    y: number,
    facing: 1 | -1,
    startAngle: number,
    endAngle: number,
    radius: number,
    color: string,
    heavy = false
  ): void {
    if (!this.combatVisualEffects) return;
    const maxLife = heavy ? 0.24 : 0.16;
    this.meleeArcs.push({
      x,
      y,
      facing,
      startAngle,
      endAngle,
      radius,
      color,
      heavy,
      life: maxLife,
      maxLife,
    });
  }

  public spawnWaterSplash(x: number, y: number, count = 6): void {
    if (!this.combatVisualEffects) return;
    const capped = this.performanceMode ? Math.max(3, Math.floor(count * 0.5)) : count;
    for (let i = 0; i < capped; i++) {
      const spreadX = (Math.random() - 0.5) * 180;
      const liftY = -85 - Math.random() * 140;
      this.pushParticle({
        x: x + (Math.random() - 0.5) * 20,
        y: Math.min(GROUND_Y - 2, y),
        vx: spreadX,
        vy: liftY,
        size: 2.5 + Math.random() * 3.5,
        life: 0.25 + Math.random() * 0.22,
        maxLife: 0.47,
        color: i % 2 === 0 ? '#7dd3fc' : '#e0f2fe',
        gravity: 680,
        drag: 0.95,
        kind: 'water',
        rotation: 0,
        vr: 0,
      });
    }
  }

  public spawnFloatingText(x: number, y: number, text: string, color: string, scale = 1): void {
    this.floatingTexts.push({
      x,
      y,
      vy: -65,
      text,
      color,
      life: 0.78,
      maxLife: 0.78,
      scale,
    });
  }

  public update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.kind === 'ring') {
        p.size += dt * 310;
        p.x += p.vx * dt;
        continue;
      }
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vr * dt;
      if (p.y > GROUND_Y - 2 && p.vy > 0) {
        p.y = GROUND_Y - 2;
        p.vy *= -0.25;
        p.vx *= 0.7;
      }
    }

    for (let i = this.trails.length - 1; i >= 0; i--) {
      const t = this.trails[i];
      t.life -= dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      if (t.life <= 0) {
        this.trails.splice(i, 1);
      }
    }

    for (let i = this.breathingArcs.length - 1; i >= 0; i--) {
      this.breathingArcs[i].life -= dt;
      if (this.breathingArcs[i].life <= 0) {
        this.breathingArcs.splice(i, 1);
      }
    }

    for (let i = this.meleeArcs.length - 1; i >= 0; i--) {
      this.meleeArcs[i].life -= dt;
      if (this.meleeArcs[i].life <= 0) {
        this.meleeArcs.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const f = this.floatingTexts[i];
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy *= 0.94;
      if (f.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, projectiles: BdaProjectile[]): void {
    this.renderSlashTrails(ctx);
    this.renderMeleeArcs(ctx);
    this.renderBreathingArcs(ctx);
    this.renderProjectiles(ctx, projectiles);

    for (const p of this.particles) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.kind === 'ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3.2 * alpha;
        ctx.stroke();
      } else if (p.kind === 'spark' || p.kind === 'lightning') {
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 2.4, -p.size * 0.42, p.size * 4.8, p.size * 0.84);
      } else if (p.kind === 'wood') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 1.1, -p.size * 0.35, p.size * 2.2, p.size * 0.7);
      } else if (p.kind === 'stone') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.55, -p.size * 0.55, p.size * 1.1, p.size * 1.1);
      } else if (p.kind === 'petal') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'mist' || p.kind === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.5 - alpha * 0.4), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'ice') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.7, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.45 + alpha * 0.55), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (const f of this.floatingTexts) {
      const alpha = Math.max(0, Math.min(1, (f.life / f.maxLife) * 1.4));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${Math.round(17 * f.scale)}px "Cinzel", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(5, 8, 17, 0.92)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  private renderSlashTrails(ctx: CanvasRenderingContext2D): void {
    if (this.trails.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < this.trails.length; i++) {
      const prev = this.trails[i - 1];
      const curr = this.trails[i];
      if (Math.hypot(curr.x - prev.x, curr.y - prev.y) > 135) continue;
      const alpha = Math.max(0, Math.min(1, curr.life / curr.maxLife));
      ctx.globalAlpha = alpha * 0.88;
      ctx.strokeStyle = curr.color;
      ctx.lineWidth = Math.max(1.5, curr.width * alpha);
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();

      if (curr.secondaryColor) {
        ctx.globalAlpha = alpha * 0.65;
        ctx.strokeStyle = curr.secondaryColor;
        ctx.lineWidth = Math.max(1, curr.width * 0.36 * alpha);
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private renderMeleeArcs(ctx: CanvasRenderingContext2D): void {
    for (const arc of this.meleeArcs) {
      const t = 1 - arc.life / arc.maxLife;
      const alpha = Math.max(0, 1 - t * t);
      ctx.save();
      ctx.translate(arc.x, arc.y);
      ctx.scale(arc.facing, 1);
      ctx.globalAlpha = alpha * 0.88;

      ctx.beginPath();
      ctx.arc(0, 0, arc.radius, arc.startAngle, arc.endAngle, arc.endAngle < arc.startAngle);
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = (arc.heavy ? 12 : 7.5) * (1 - t * 0.45);
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, arc.radius * 0.95, arc.startAngle, arc.endAngle, arc.endAngle < arc.startAngle);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = (arc.heavy ? 3.8 : 2.2) * (1 - t * 0.5);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderBreathingArcs(ctx: CanvasRenderingContext2D): void {
    for (const arc of this.breathingArcs) {
      const t = 1 - arc.life / arc.maxLife;
      const alpha = Math.max(0, 1 - t * t);
      const style = BREATHING_STYLES[arc.style];

      ctx.save();
      ctx.translate(arc.x, arc.y);
      ctx.scale(arc.facing, 1);
      ctx.globalAlpha = alpha;

      if (arc.style === 'thunder') {
        ctx.beginPath();
        ctx.moveTo(-20, 6);
        const segs = 6;
        for (let s = 1; s <= segs; s++) {
          const sx = (s / segs) * arc.range;
          const sy = (s % 2 === 0 ? -1 : 1) * (16 + Math.sin(t * 25 + s) * 8);
          ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = style.primaryColor;
        ctx.lineWidth = 6 * (1 - t * 0.5);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.4;
        ctx.stroke();
      } else if (arc.style === 'beast') {
        ctx.strokeStyle = style.secondaryColor;
        ctx.lineWidth = 5 * (1 - t * 0.5);
        ctx.beginPath();
        ctx.moveTo(15, -42);
        ctx.lineTo(arc.range * 0.85, 36);
        ctx.moveTo(15, 36);
        ctx.lineTo(arc.range * 0.85, -42);
        ctx.stroke();
      } else if (arc.style === 'moon') {
        // Luminous purple-indigo crescent moon wave + small chaos crescents
        for (let m = 0; m < 2; m++) {
          ctx.beginPath();
          ctx.arc(arc.range * (0.35 + m * 0.32), (m - 0.5) * 16, 46 + m * 14, -1.05, 1.05);
          ctx.strokeStyle = m === 0 ? style.primaryColor : style.secondaryColor;
          ctx.lineWidth = (9 - m * 4) * (1 - t * 0.45);
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      } else if (arc.style === 'flower') {
        // Graceful petal ribbon sweep
        ctx.beginPath();
        ctx.moveTo(-12, 10);
        ctx.bezierCurveTo(arc.range * 0.35, -36, arc.range * 0.72, 24, arc.range, -8);
        ctx.strokeStyle = style.primaryColor;
        ctx.lineWidth = 8 * (1 - t * 0.4);
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.strokeStyle = style.secondaryColor;
        ctx.lineWidth = 2.6;
        ctx.stroke();
      } else if (arc.style === 'serpent' || arc.style === 'love') {
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        for (let x = 0; x <= arc.range; x += 18) {
          const y = Math.sin((x / arc.range) * Math.PI * 3.5 + t * 8) * (arc.style === 'love' ? 36 : 26);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = style.primaryColor;
        ctx.lineWidth = 9 * (1 - t * 0.45);
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.strokeStyle = style.secondaryColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (arc.pattern === 'spin_wheel') {
        ctx.beginPath();
        ctx.arc(28, 0, 58 + arc.formIndex * 7, t * Math.PI, t * Math.PI + Math.PI * 1.65);
        ctx.strokeStyle = style.primaryColor;
        ctx.lineWidth = 12 * (1 - t * 0.5);
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.strokeStyle = style.secondaryColor;
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(-25, 18);
        ctx.bezierCurveTo(arc.range * 0.3, -38, arc.range * 0.72, -28, arc.range, 8);
        ctx.bezierCurveTo(arc.range * 0.7, 24, arc.range * 0.3, 12, -25, 18);
        const grad = ctx.createLinearGradient(-25, 0, arc.range, 0);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.35, style.primaryColor);
        grad.addColorStop(0.85, style.secondaryColor);
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-8, 11);
        ctx.quadraticCurveTo(arc.range * 0.55, -20, arc.range * 0.98, 6);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5 * (1 - t * 0.6);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: BdaProjectile[]): void {
    const now = performance.now() * 0.01;
    for (const p of projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.kind === 'ground_spike' || p.kind === 'tentacle_zone') {
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.glowColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-p.radius, 0);
        ctx.lineTo(0, -p.radius * 2.4);
        ctx.lineTo(p.radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (p.kind === 'swamp_pool') {
        ctx.fillStyle = '#042f2e';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radius * 2.2, p.radius * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.kind === 'temari_ball') {
        ctx.rotate(now * 1.2);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.72, -0.5, 2.3);
        ctx.stroke();
      } else if (p.kind === 'vector_arrow') {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.rotate(ang);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(p.radius * 1.4, 0);
        ctx.lineTo(-p.radius * 0.5, -p.radius * 0.8);
        ctx.lineTo(-p.radius * 0.2, -p.radius * 0.3);
        ctx.lineTo(-p.radius * 1.4, -p.radius * 0.3);
        ctx.lineTo(-p.radius * 1.4, p.radius * 0.3);
        ctx.lineTo(-p.radius * 0.2, p.radius * 0.3);
        ctx.lineTo(-p.radius * 0.5, p.radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (p.kind === 'lightning_bolt') {
        const dir = Math.sign(p.vx || 1);
        ctx.scale(dir, 1);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(-22, -6);
        ctx.lineTo(-4, 6);
        ctx.lineTo(6, -8);
        ctx.lineTo(24, 2);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else if (p.kind === 'wind_gust') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3.2;
        for (let r = 0; r < 2; r++) {
          ctx.beginPath();
          ctx.arc(0, (r - 0.5) * 10, p.radius * (0.9 + r * 0.35), -0.9, 1.4);
          ctx.stroke();
        }
      } else if (p.kind === 'wooden_dragon') {
        const dir = Math.sign(p.vx || 1);
        ctx.scale(dir, 1);
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#a3e635';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-p.radius * 1.8, 12);
        ctx.quadraticCurveTo(-p.radius * 0.5, -24, p.radius * 1.5, -4);
        ctx.lineTo(p.radius * 0.8, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(p.radius * 0.7, -4, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'ice_buddha') {
        ctx.fillStyle = 'rgba(186, 230, 253, 0.72)';
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -p.radius * 0.6, p.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-p.radius, p.radius);
        ctx.lineTo(0, -p.radius * 0.2);
        ctx.lineTo(p.radius, p.radius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (p.kind === 'compass_wave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + now * 0.3;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * p.radius * 1.4, Math.sin(a) * p.radius * 1.4);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 1.1, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === 'pellet') {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'silk_thread') {
        const dir = Math.sign(p.vx || 1);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-dir * 42, -5);
        ctx.lineTo(dir * 16, 0);
        ctx.lineTo(-dir * 42, 5);
        ctx.stroke();
      } else if (p.kind === 'blood_sickle') {
        ctx.rotate(now * 1.4);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 1.15, -Math.PI * 0.7, Math.PI * 0.7);
        ctx.stroke();
        ctx.strokeStyle = p.glowColor;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else if (p.kind === 'slash_wave') {
        const dir = Math.sign(p.vx || 1);
        ctx.scale(dir, 1);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(-8, 0, p.radius * 1.45, -Math.PI * 0.48, Math.PI * 0.48);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (p.kind === 'ice_lotus') {
        ctx.rotate(now * 0.5);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        for (let k = 0; k < 6; k++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(p.radius * 0.45, -p.radius * 0.95);
          ctx.lineTo(0, -p.radius * 1.4);
          ctx.lineTo(-p.radius * 0.45, -p.radius * 0.95);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else {
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, p.radius * 1.8);
        glow.addColorStop(0, '#ffffff');
        glow.addColorStop(0.45, p.color);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
