import { evaluateFighterPose, renderFighter, renderTrainingRock } from './animation';
import { ArenaRenderer, createArenaLayout } from './arena';
import { SoundEngine } from './audio';
import { BREATHING_STYLES } from './breathing';
import { getCharacterById } from './characters';
import { ARENA_LEFT, ARENA_RIGHT, GROUND_Y, HEAVY_ATTACK_COOLDOWN, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { DEMON_TEMPLATES } from './demons';
import { ParticleSystem } from './particles';
import { createEmptyRagdoll } from './physics';
import {
  ArenaObstacle,
  ArenaPlatform,
  CutsceneActorCue,
  CutsceneBeat,
  CutsceneDef,
  Fighter,
  FighterActionState,
} from './types';

function makeActorFighter(cue: CutsceneActorCue): Fighter {
  if (cue.role === 'demon') {
    const arch = cue.demonArchetype ?? 'basic';
    const tpl = DEMON_TEMPLATES[arch];
    return {
      id: cue.id,
      name: cue.name,
      subtitle: tpl.rankLabel,
      role: 'demon',
      demonArchetype: arch,
      visual: { ...tpl.visual },
      breathingStyle: 'water',
      damageMult: 1,
      speedMult: 1,
      attackSpeedMult: 1,
      energyRegen: 0,
      x: cue.x,
      y: cue.y ?? GROUND_Y,
      vx: 0,
      vy: 0,
      facing: cue.facing,
      grounded: true,
      coyoteTimer: 0.1,
      jumpBufferTimer: 0,
      hp: tpl.baseHp,
      maxHp: tpl.baseHp,
      displayHp: tpl.baseHp,
      energy: 50,
      maxEnergy: 100,
      state: 'IDLE',
      stateTimer: 0,
      animTime: 0,
      lastPose: null,
      blendFromPose: null,
      blendTimer: 0,
      blendDuration: 0.08,
      currentAttack: null,
      attackSwingId: 0,
      hitTargetsThisSwing: new Set(),
      comboStep: 0,
      comboResetTimer: 0,
      queuedNextCombo: false,
      secondHitFired: false,
      heavyCooldown: 0,
      maxHeavyCooldown: HEAVY_ATTACK_COOLDOWN,
      formCooldowns: [0, 0, 0, 0, 0],
      dodgeCooldown: 0,
      invulnTimer: 0,
      counterWindowTimer: 0,
      hitFlashTimer: 0,
      parryFlashTimer: 0,
      poisonTimer: 0,
      poisonDps: 0,
      chillTimer: 0,
      regenTimer: 0,
      bossPhase: 1,
      scarfPoints: Array.from({ length: 5 }, (_, idx) => ({
        x: cue.x - cue.facing * idx * 8,
        y: (cue.y ?? GROUND_Y) - 82 + idx * 3,
      })),
      ragdoll: createEmptyRagdoll(),
      recoveryStartPose: null,
      recoveryDuration: 0.4,
      width: 48,
      height: 108,
      hitCount: 0,
      damageTaken: 0,
    };
  }

  const charDef = getCharacterById(cue.characterId ?? 'tanjiro');
  return {
    id: cue.id,
    name: cue.name,
    subtitle: charDef.title,
    role: cue.role === 'hashira' || cue.role === 'ally' ? 'ally' : 'player',
    characterId: charDef.id,
    visual: {
      skinColor: charDef.skinColor,
      hairColor: charDef.hairColor,
      uniformColor: charDef.uniformColor,
      haoriPrimary: charDef.haoriPrimary,
      haoriAccent: charDef.haoriAccent,
      scarfColor: charDef.scarfColor,
      eyeColor: charDef.eyeColor,
      bladeColor: charDef.bladeColor,
      weapon: charDef.weapon,
      scale: charDef.id === 'gyomei' ? 1.15 : 1.0,
      bodyBuild: charDef.id === 'gyomei' ? 'hulk' : charDef.id === 'shinobu' || charDef.id === 'kanao' ? 'slim' : 'standard',
    },
    breathingStyle: charDef.defaultBreathing,
    damageMult: 1,
    speedMult: 1,
    attackSpeedMult: 1,
    energyRegen: 8,
    x: cue.x,
    y: cue.y ?? GROUND_Y,
    vx: 0,
    vy: 0,
    facing: cue.facing,
    grounded: true,
    coyoteTimer: 0.1,
    jumpBufferTimer: 0,
    hp: charDef.maxHp,
    maxHp: charDef.maxHp,
    displayHp: charDef.maxHp,
    energy: 80,
    maxEnergy: 100,
    state: 'IDLE',
    stateTimer: 0,
    animTime: 0,
    lastPose: null,
    blendFromPose: null,
    blendTimer: 0,
    blendDuration: 0.08,
    currentAttack: null,
    attackSwingId: 0,
    hitTargetsThisSwing: new Set(),
    comboStep: 0,
    comboResetTimer: 0,
    queuedNextCombo: false,
    secondHitFired: false,
    heavyCooldown: 0,
    maxHeavyCooldown: HEAVY_ATTACK_COOLDOWN,
    formCooldowns: [0, 0, 0, 0, 0],
    dodgeCooldown: 0,
    invulnTimer: 0,
    counterWindowTimer: 0,
    hitFlashTimer: 0,
    parryFlashTimer: 0,
    poisonTimer: 0,
    poisonDps: 0,
    chillTimer: 0,
    regenTimer: 0,
    bossPhase: 1,
    scarfPoints: Array.from({ length: 5 }, (_, idx) => ({
      x: cue.x - cue.facing * idx * 8,
      y: (cue.y ?? GROUND_Y) - 82 + idx * 3,
    })),
    ragdoll: createEmptyRagdoll(),
    recoveryStartPose: null,
    recoveryDuration: 0.4,
    width: 42,
    height: 98,
    hitCount: 0,
    damageTaken: 0,
  };
}

function actionToFighterState(action: CutsceneActorCue['action']): FighterActionState {
  switch (action) {
    case 'walk':
      return 'WALK';
    case 'run':
      return 'RUN';
    case 'jump':
      return 'JUMP';
    case 'slash':
      return 'LIGHT_ATTACK';
    case 'heavy':
      return 'HEAVY_ATTACK';
    case 'breathing':
      return 'BREATHING_FORM';
    case 'block':
      return 'BLOCK';
    case 'dodge':
      return 'DODGE';
    case 'hurt':
      return 'HURT';
    case 'bda':
    case 'transform':
      return 'BDA_CAST';
    default:
      return 'IDLE';
  }
}

export class CutsceneEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cutscene: CutsceneDef;
  private sound: SoundEngine;
  private onComplete: () => void;
  private subtitlesEnabled: boolean;

  private arena = new ArenaRenderer();
  private particles = new ParticleSystem();
  private platforms: ArenaPlatform[] = [];
  private obstacles: ArenaObstacle[] = [];
  private actors = new Map<string, Fighter>();

  private beatIndex = 0;
  private beatTimer = 0;
  private beatFxFired = false;
  private paused = false;
  private completed = false;

  private cameraX = 820;
  private cameraZoom = 1.05;
  private shakeIntensity = 0;
  private fadeAlpha = 1.0;

  private viewW = 1280;
  private viewH = 720;
  private dpr = 1;
  private rafId = 0;
  private lastTs = 0;

  constructor(
    canvas: HTMLCanvasElement,
    cutscene: CutsceneDef,
    sound: SoundEngine,
    subtitlesEnabled: boolean,
    onComplete: () => void
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cutscene Canvas 2D unavailable');
    this.ctx = ctx;
    this.cutscene = cutscene;
    this.sound = sound;
    this.subtitlesEnabled = subtitlesEnabled;
    this.onComplete = onComplete;

    const layout = createArenaLayout(cutscene.mapId, true);
    this.platforms = layout.platforms;
    this.obstacles = layout.obstacles;

    const first = cutscene.beats[0];
    if (first) {
      this.cameraX = first.cameraX;
      this.cameraZoom = first.cameraZoom;
      this.enterBeat(0);
    }

    this.resize();
    this.sound.setMusicContext('cutscene', cutscene.mapId, false, undefined, first?.actors[0]?.characterId);
    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  public setSubtitlesEnabled(enabled: boolean): void {
    this.subtitlesEnabled = enabled;
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public togglePause(): boolean {
    this.paused = !this.paused;
    this.lastTs = performance.now();
    return this.paused;
  }

  public skip(): void {
    this.finish();
  }

  public resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.viewW = Math.max(320, rect.width || window.innerWidth);
    this.viewH = Math.max(240, rect.height || window.innerHeight);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.viewW * this.dpr);
    this.canvas.height = Math.round(this.viewH * this.dpr);
  }

  public destroy(): void {
    cancelAnimationFrame(this.rafId);
  }

  private finish(): void {
    if (this.completed) return;
    this.completed = true;
    cancelAnimationFrame(this.rafId);
    this.onComplete();
  }

  private enterBeat(index: number): void {
    this.beatIndex = index;
    this.beatTimer = 0;
    this.beatFxFired = false;
    const beat = this.cutscene.beats[index];
    if (!beat) return;

    if (beat.shake) {
      this.shakeIntensity = Math.max(this.shakeIntensity, beat.shake);
    }

    for (const cue of beat.actors) {
      let fighter = this.actors.get(cue.id);
      if (!fighter) {
        fighter = makeActorFighter(cue);
        this.actors.set(cue.id, fighter);
      }
      fighter.facing = cue.facing;
      fighter.state = actionToFighterState(cue.action);
      fighter.stateTimer = 0;
      if (cue.emotion) {
        fighter.subtitle = `__emo:${cue.emotion}`;
      }
      if (cue.action === 'breathing') {
        fighter.currentAttack = {
          kind: 'BREATHING_1',
          damage: 25,
          startup: 0.08,
          active: 0.45,
          recovery: 0.25,
          knockbackX: 250,
          knockbackY: -120,
          triggersRagdoll: true,
          hitstop: 0,
          range: 145,
          reachY: 110,
          forwardImpulse: 180,
          breathingStyle: fighter.breathingStyle,
          formIndex: 1,
        };
      } else if (cue.action === 'heavy' || cue.action === 'slash') {
        fighter.currentAttack = {
          kind: cue.action === 'heavy' ? 'HEAVY' : 'LIGHT_1',
          technique: cue.action === 'heavy' ? 'heavy_overhead' : 'horizontal_slash',
          damage: 20,
          startup: 0.1,
          active: 0.35,
          recovery: 0.2,
          knockbackX: 200,
          knockbackY: -80,
          triggersRagdoll: cue.action === 'heavy',
          hitstop: 0,
          range: 120,
          reachY: 100,
          forwardImpulse: 120,
        };
      } else {
        fighter.currentAttack = null;
      }
    }
  }

  private loop = (ts: number): void => {
    const dt = Math.min(0.05, Math.max(0.001, (ts - this.lastTs) / 1000));
    this.lastTs = ts;

    if (!this.paused) {
      this.update(dt);
    }
    this.render();
    if (!this.completed) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  private update(dt: number): void {
    this.arena.update(dt, this.cutscene.mapId, this.platforms, WORLD_WIDTH);
    this.particles.update(dt);
    this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 28);

    const beat = this.cutscene.beats[this.beatIndex];
    if (!beat) {
      this.finish();
      return;
    }

    this.beatTimer += dt;
    if (this.beatIndex === 0 && this.beatTimer < 0.45) {
      this.fadeAlpha = 1 - this.beatTimer / 0.45;
    } else if (this.beatIndex === this.cutscene.beats.length - 1 && this.beatTimer > beat.duration - 0.4) {
      this.fadeAlpha = Math.max(0, (this.beatTimer - (beat.duration - 0.4)) / 0.4);
    } else {
      this.fadeAlpha = 0;
    }

    // Smooth camera pan & zoom toward target beat framing
    this.cameraX += (beat.cameraX - this.cameraX) * Math.min(1, dt * 3.8);
    this.cameraZoom += (beat.cameraZoom - this.cameraZoom) * Math.min(1, dt * 3.5);

    // One-shot beat cinematic SFX & VFX
    if (!this.beatFxFired && this.beatTimer >= 0.15) {
      this.beatFxFired = true;
      this.triggerBeatFx(beat);
    }

    // Animate actor positions, loops, and scarf chains
    for (const cue of beat.actors) {
      const f = this.actors.get(cue.id);
      if (!f) continue;
      f.animTime += dt;
      f.stateTimer += dt;
      f.x += (cue.x - f.x) * Math.min(1, dt * 3.2);
      const targetY = cue.y ?? GROUND_Y;
      f.y += (targetY - f.y) * Math.min(1, dt * 4.0);
      f.x = Math.max(ARENA_LEFT + 35, Math.min(ARENA_RIGHT - 35, f.x));

      const pose = evaluateFighterPose(f);
      f.scarfPoints[0].x = pose.chest.x - f.facing * 4;
      f.scarfPoints[0].y = pose.chest.y - 6;
      for (let i = 1; i < f.scarfPoints.length; i++) {
        const prev = f.scarfPoints[i - 1];
        const curr = f.scarfPoints[i];
        curr.x += (-f.facing * 35 + Math.sin(f.animTime * 6 + i) * 16) * dt;
        curr.y += (28 + Math.cos(f.animTime * 5 + i) * 12) * dt;
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const d = Math.hypot(dx, dy) || 0.001;
        if (d > 9) {
          curr.x = prev.x + (dx / d) * 9;
          curr.y = prev.y + (dy / d) * 9;
        }
      }
    }

    if (this.beatTimer >= beat.duration) {
      if (this.beatIndex + 1 < this.cutscene.beats.length) {
        this.enterBeat(this.beatIndex + 1);
      } else {
        this.finish();
      }
    }
  }

  private triggerBeatFx(beat: CutsceneBeat): void {
    const heroCue = beat.actors[0];
    const hx = heroCue ? heroCue.x : 900;
    const hy = (heroCue?.y ?? GROUND_Y) - 48;

    if (beat.fxKind === 'breathing') {
      const f = heroCue ? this.actors.get(heroCue.id) : null;
      const style = f?.breathingStyle ?? 'water';
      this.sound.playBreathingStyle(style, 3);
      this.particles.spawnBreathingEffect(style, 3, 'dragon_finisher', hx, GROUND_Y, heroCue?.facing ?? 1, 180);
    } else if (beat.fxKind === 'clash') {
      this.sound.playSwordClash();
      this.particles.spawnParrySparks(hx + 65, hy, true);
    } else if (beat.fxKind === 'bda') {
      this.sound.playBdaCast();
      this.particles.spawnHitBurst(hx + 120, hy, -1, true, true);
    } else if (beat.fxKind === 'transform') {
      this.sound.playTransformation();
      this.sound.playDemonRoar();
      this.particles.spawnHitBurst(hx + 140, hy, -1, true, true);
    } else if (beat.fxKind === 'boulder_split') {
      this.sound.playRockCrack(true);
      this.particles.spawnRockShards(1060, GROUND_Y, true);
    } else if (beat.fxKind === 'sunrise') {
      this.sound.playVictory();
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const beat = this.cutscene.beats[this.beatIndex];
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    this.arena.renderBackground(ctx, this.cutscene.mapId, this.cameraX, this.viewW, this.viewH);

    const baseScale = Math.max(0.54, Math.min(1.18, this.viewH / WORLD_HEIGHT)) * this.cameraZoom;
    const shakeX = this.shakeIntensity > 0 ? (Math.random() - 0.5) * 2 * this.shakeIntensity : 0;
    const shakeY = this.shakeIntensity > 0 ? (Math.random() - 0.5) * 2 * this.shakeIntensity : 0;

    ctx.save();
    ctx.translate(this.viewW * 0.5 + shakeX, this.viewH - WORLD_HEIGHT * baseScale * 0.96 + shakeY);
    ctx.scale(baseScale, baseScale);
    ctx.translate(-this.cameraX, 0);

    this.arena.renderWorldBehindCharacters(
      ctx,
      this.cutscene.mapId,
      this.platforms,
      this.obstacles,
      this.cameraX,
      WORLD_WIDTH
    );

    if (this.cutscene.id === 'cs_tutorial_boulder') {
      renderTrainingRock(ctx, 1080, GROUND_Y, this.beatIndex >= 1 ? 0 : 100, 100);
    }

    if (beat) {
      for (const cue of beat.actors) {
        const fighter = this.actors.get(cue.id);
        if (!fighter) continue;
        const pose = evaluateFighterPose(fighter);
        renderFighter(ctx, fighter, pose);
      }
    }

    this.particles.render(ctx, []);
    this.arena.renderWorldForeground(ctx, this.cutscene.mapId, this.cameraX, WORLD_WIDTH);

    // Speech Bubbles anchored directly over speaking characters
    if (beat) {
      for (const cue of beat.actors) {
        if (!cue.bubbleText) continue;
        const f = this.actors.get(cue.id);
        if (!f) continue;
        this.drawSpeechBubble(ctx, f.x, f.y - 135 * f.visual.scale, cue.name, cue.bubbleText, cue.role === 'demon');
      }
    }

    ctx.restore();

    // Mood atmospheric wash
    if (beat) {
      const tint =
        beat.lightingMood === 'crimson'
          ? 'rgba(136, 19, 55, 0.16)'
          : beat.lightingMood === 'dawn'
            ? 'rgba(253, 224, 71, 0.14)'
            : beat.lightingMood === 'castle_gold'
              ? 'rgba(217, 119, 6, 0.14)'
              : 'rgba(15, 23, 42, 0.1)';
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }

    // Cinematic 2.39:1 top/bottom framing bars
    const barH = Math.round(this.viewH * 0.08);
    ctx.fillStyle = '#03050a';
    ctx.fillRect(0, 0, this.viewW, barH);
    ctx.fillRect(0, this.viewH - barH, this.viewW, barH);

    // Optional subtitle ONLY if toggled on in Settings
    if (this.subtitlesEnabled && beat?.subtitle) {
      ctx.font = '600 15px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      const w = Math.min(this.viewW - 80, ctx.measureText(beat.subtitle).width + 36);
      ctx.fillRect(this.viewW * 0.5 - w * 0.5, this.viewH - barH + 10, w, 28);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(beat.subtitle, this.viewW * 0.5, this.viewH - barH + 29);
    }

    if (this.fadeAlpha > 0.01) {
      ctx.fillStyle = `rgba(3, 5, 10, ${Math.min(1, this.fadeAlpha)})`;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }

    ctx.restore();
  }

  private drawSpeechBubble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    speaker: string,
    text: string,
    isDemon: boolean
  ): void {
    ctx.save();
    ctx.font = '600 13px "Inter", sans-serif';
    const textW = ctx.measureText(text).width;
    const padX = 14;
    const boxW = Math.max(115, Math.min(275, textW + padX * 2));
    const boxH = 44;
    const bx = x - boxW * 0.5;
    const by = y - boxH;

    ctx.fillStyle = isDemon ? 'rgba(24, 9, 18, 0.92)' : 'rgba(9, 14, 28, 0.92)';
    ctx.strokeStyle = isDemon ? '#fb7185' : '#38bdf8';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    // Pointer triangle toward character
    ctx.beginPath();
    ctx.moveTo(x - 7, by + boxH);
    ctx.lineTo(x + 7, by + boxH);
    ctx.lineTo(x, by + boxH + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 10px "Cinzel", sans-serif';
    ctx.fillStyle = isDemon ? '#fda4af' : '#7dd3fc';
    ctx.textAlign = 'left';
    ctx.fillText(speaker.toUpperCase(), bx + 11, by + 15);

    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillStyle = '#f8fafc';
    const trimmed = text.length > 38 ? `${text.slice(0, 36)}…` : text;
    ctx.fillText(trimmed, bx + 11, by + 33);
    ctx.restore();
  }
}

export function getBreathingGlow(styleId: keyof typeof BREATHING_STYLES): string {
  return BREATHING_STYLES[styleId].primaryColor;
}
