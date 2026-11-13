import { ARENA_LEFT, ARENA_RIGHT, GROUND_Y, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { ArenaObstacle, ArenaPlatform, MapId } from './types';

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  phase: number;
}

interface FloatingRoom {
  x: number;
  y: number;
  w: number;
  h: number;
  speedY: number;
  phase: number;
  rotAmp: number;
}

export function createArenaLayout(mapId: MapId): {
  platforms: ArenaPlatform[];
  obstacles: ArenaObstacle[];
} {
  const cx = WORLD_WIDTH * 0.5;
  const platforms: ArenaPlatform[] = [];
  const obstacles: ArenaObstacle[] = [];

  const mkPlat = (
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    kind: ArenaPlatform['kind'],
    moveAmpX = 0,
    moveAmpY = 0,
    moveSpeed = 0,
    phase = 0
  ): ArenaPlatform => ({
    id,
    x,
    y,
    w,
    h,
    kind,
    baseX: x,
    baseY: y,
    moveAmpX,
    moveAmpY,
    moveSpeed,
    phase,
  });

  const mkObs = (
    id: string,
    x: number,
    w: number,
    h: number,
    kind: ArenaObstacle['kind'],
    destructible: boolean,
    hp: number
  ): ArenaObstacle => ({
    id,
    x,
    y: GROUND_Y - h,
    w,
    h,
    kind,
    solid: true,
    destructible,
    hp,
    maxHp: hp,
    lastHitSwingId: -1,
  });

  if (mapId === 'bamboo_forest') {
    platforms.push(
      mkPlat('bf_p1', cx - 340, GROUND_Y - 125, 190, 16, 'wooden'),
      mkPlat('bf_p2', cx + 150, GROUND_Y - 125, 190, 16, 'wooden')
    );
    obstacles.push(
      mkObs('bf_rock_l', cx - 430, 56, 48, 'rock', false, 999),
      mkObs('bf_fence_r', cx + 380, 46, 56, 'fence', true, 45)
    );
  } else if (mapId === 'mountain_training' || mapId === 'snowy_mountain') {
    platforms.push(
      mkPlat('mt_p1', cx - 360, GROUND_Y - 130, 210, 18, 'stone'),
      mkPlat('mt_p2', cx + 150, GROUND_Y - 145, 210, 18, 'stone')
    );
    obstacles.push(
      mkObs('mt_rock1', cx - 460, 62, 54, 'rock', true, 75),
      mkObs('mt_rock2', cx + 410, 62, 54, 'rock', true, 75)
    );
  } else if (mapId === 'japanese_village' || mapId === 'entertainment_district') {
    platforms.push(
      mkPlat('jv_balcony_l', cx - 430, GROUND_Y - 140, 240, 18, 'bridge'),
      mkPlat('jv_balcony_m', cx - 105, GROUND_Y - 210, 210, 16, 'wooden'),
      mkPlat('jv_balcony_r', cx + 190, GROUND_Y - 140, 240, 18, 'bridge')
    );
    obstacles.push(
      mkObs('jv_crate_l', cx - 310, 52, 50, 'crate', true, 40),
      mkObs('jv_crate_r', cx + 270, 52, 50, 'crate', true, 40)
    );
  } else if (mapId === 'dark_forest' || mapId === 'spider_mountain') {
    platforms.push(
      mkPlat('df_bough_l', cx - 380, GROUND_Y - 135, 210, 16, 'wooden'),
      mkPlat('df_bough_r', cx + 170, GROUND_Y - 135, 210, 16, 'wooden')
    );
    obstacles.push(
      mkObs('df_trunk_l', cx - 470, 48, 66, 'tree_trunk', false, 999),
      mkObs('df_fence_r', cx + 420, 48, 54, 'fence', true, 45)
    );
  } else if (mapId === 'abandoned_temple' || mapId === 'hashira_grounds') {
    platforms.push(
      mkPlat('at_bridge', cx - 140, GROUND_Y - 145, 280, 18, 'bridge'),
      mkPlat('at_step_l', cx - 430, GROUND_Y - 110, 180, 16, 'wooden'),
      mkPlat('at_step_r', cx + 250, GROUND_Y - 110, 180, 16, 'wooden')
    );
    obstacles.push(
      mkObs('at_pillar_l', cx - 340, 44, 62, 'pillar', true, 65),
      mkObs('at_pillar_r', cx + 300, 44, 62, 'pillar', true, 65)
    );
  } else if (mapId === 'swordsmith_village') {
    platforms.push(
      mkPlat('sv_deck_l', cx - 400, GROUND_Y - 130, 215, 18, 'wooden'),
      mkPlat('sv_deck_r', cx + 185, GROUND_Y - 130, 215, 18, 'wooden')
    );
    obstacles.push(
      mkObs('sv_crate_l', cx - 290, 54, 52, 'crate', true, 45),
      mkObs('sv_rock_r', cx + 350, 58, 50, 'rock', false, 999)
    );
  } else if (mapId === 'infinity_castle') {
    // Rich multi-tiered Infinity Castle with moving tatami platforms, suspended staircases & destructible shoji walls
    platforms.push(
      mkPlat('ic_tatami_l', cx - 450, GROUND_Y - 130, 220, 20, 'tatami', 0, 28, 1.35, 0),
      mkPlat('ic_stair_c', cx - 125, GROUND_Y - 210, 250, 18, 'stair', 55, 18, 0.95, 1.4),
      mkPlat('ic_tatami_r', cx + 230, GROUND_Y - 130, 220, 20, 'tatami', 0, 28, 1.35, Math.PI)
    );
    obstacles.push(
      mkObs('ic_shoji_l', cx - 335, 36, 74, 'shoji_wall', true, 50),
      mkObs('ic_shoji_r', cx + 305, 36, 74, 'shoji_wall', true, 50)
    );
  }

  return { platforms, obstacles };
}

export class ArenaRenderer {
  private ambient: AmbientParticle[] = [];
  private infinityRooms: FloatingRoom[] = [];
  private time = 0;
  private nakimeShiftPulse = 0;

  constructor() {
    for (let i = 0; i < 34; i++) {
      this.ambient.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * GROUND_Y,
        vx: -24 - Math.random() * 28,
        vy: 24 + Math.random() * 34,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 2.4,
        size: 4 + Math.random() * 5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < 12; i++) {
      this.infinityRooms.push({
        x: 130 + i * 155,
        y: 110 + (i % 3) * 102,
        w: 122 + (i % 2) * 40,
        h: 82 + (i % 3) * 20,
        speedY: 0.75 + (i % 3) * 0.35,
        phase: i * 1.1,
        rotAmp: (i % 2 === 0 ? 1 : -1) * 0.11,
      });
    }
  }

  public triggerNakimeShift(): void {
    this.nakimeShiftPulse = 1.0;
  }

  public update(dt: number, mapId: MapId, platforms?: ArenaPlatform[]): void {
    this.time += dt;
    this.nakimeShiftPulse = Math.max(0, this.nakimeShiftPulse - dt * 1.4);

    if (platforms) {
      const speedBoost = 1 + this.nakimeShiftPulse * 2.4;
      for (const p of platforms) {
        if (p.moveSpeed && p.moveSpeed > 0) {
          const ph = (p.phase ?? 0) + this.time * p.moveSpeed * speedBoost;
          if (p.moveAmpX) p.x = p.baseX + Math.sin(ph) * p.moveAmpX;
          if (p.moveAmpY) p.y = p.baseY + Math.cos(ph) * p.moveAmpY;
        }
      }
    }

    const isRise =
      mapId === 'entertainment_district' ||
      mapId === 'swordsmith_village' ||
      mapId === 'infinity_castle';

    for (const p of this.ambient) {
      if (isRise) {
        p.x += Math.sin(this.time * 1.8 + p.phase) * 22 * dt;
        p.y -= (28 + p.size * 3) * dt;
        if (p.y < -20) {
          p.y = GROUND_Y + 10;
          p.x = Math.random() * WORLD_WIDTH;
        }
      } else {
        p.x += (p.vx + Math.sin(this.time * 1.5 + p.phase) * 18) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > GROUND_Y + 10) {
          p.y = -20;
          p.x = Math.random() * (WORLD_WIDTH + 180);
        }
        if (p.x < -40) p.x = WORLD_WIDTH + 30;
      }
    }
  }

  public renderBackground(
    ctx: CanvasRenderingContext2D,
    mapId: MapId,
    cameraX: number,
    viewW: number,
    viewH: number
  ): void {
    const sky = ctx.createLinearGradient(0, 0, 0, viewH);

    if (mapId === 'infinity_castle') {
      sky.addColorStop(0, '#14050c');
      sky.addColorStop(0.5, '#260a14');
      sky.addColorStop(1, '#090307');
    } else if (mapId === 'mountain_training' || mapId === 'hashira_grounds') {
      sky.addColorStop(0, '#0c1833');
      sky.addColorStop(0.5, '#1d3454');
      sky.addColorStop(1, '#263a4f');
    } else if (mapId === 'snowy_mountain') {
      sky.addColorStop(0, '#071021');
      sky.addColorStop(0.55, '#132a42');
      sky.addColorStop(1, '#1f3f59');
    } else if (mapId === 'entertainment_district' || mapId === 'swordsmith_village') {
      sky.addColorStop(0, '#120814');
      sky.addColorStop(0.5, '#2b121c');
      sky.addColorStop(1, '#1b0d14');
    } else if (mapId === 'dark_forest' || mapId === 'spider_mountain') {
      sky.addColorStop(0, '#04050e');
      sky.addColorStop(0.55, '#110d24');
      sky.addColorStop(1, '#080b16');
    } else {
      sky.addColorStop(0, '#040814');
      sky.addColorStop(0.45, '#0b1829');
      sky.addColorStop(1, '#09151d');
    }

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewW, viewH);

    if (mapId === 'infinity_castle') {
      this.renderInfinityCastleBackdrop(ctx, cameraX, viewW, viewH);
      return;
    }

    const moonX = viewW * 0.72 - cameraX * 0.06;
    const moonY = viewH * 0.22;
    const isCrimsonMoon = mapId === 'entertainment_district' || mapId === 'spider_mountain';
    const isDawn = mapId === 'mountain_training' || mapId === 'hashira_grounds';

    const halo = ctx.createRadialGradient(moonX, moonY, 30, moonX, moonY, 210);
    halo.addColorStop(
      0,
      isCrimsonMoon
        ? 'rgba(251, 113, 133, 0.34)'
        : isDawn
          ? 'rgba(253, 224, 71, 0.28)'
          : 'rgba(224, 242, 254, 0.35)'
    );
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 210, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isCrimsonMoon ? '#ffe4e6' : isDawn ? '#fef08a' : '#f1f5f9';
    ctx.beginPath();
    ctx.arc(moonX, moonY, isDawn ? 44 : 54, 0, Math.PI * 2);
    ctx.fill();

    const mColor1 = mapId === 'snowy_mountain' ? '#13273d' : '#081320';
    const mColor2 = mapId === 'snowy_mountain' ? '#1c354f' : '#0c1c28';
    this.drawMountainLayer(ctx, cameraX * 0.14, viewW, viewH, mColor1, 0.62, 108, mapId === 'snowy_mountain');
    this.drawMountainLayer(ctx, cameraX * 0.26, viewW, viewH, mColor2, 0.72, 72, mapId === 'snowy_mountain');
  }

  private renderInfinityCastleBackdrop(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    viewW: number,
    viewH: number
  ): void {
    // Rotating geometric abyssal corridors & rafters
    ctx.save();
    ctx.translate(viewW * 0.5, viewH * 0.45);
    ctx.rotate(Math.sin(this.time * 0.28) * (0.14 + this.nakimeShiftPulse * 0.18));
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.18)';
    ctx.lineWidth = 2.5;
    for (let i = -8; i <= 8; i++) {
      ctx.strokeRect(i * 110 - 45, -420, 90, 840);
      ctx.strokeRect(-650, i * 80 - 30, 1300, 60);
    }
    ctx.restore();

    // Moving suspended traditional Japanese shoji rooms & diagonal staircases
    for (let idx = 0; idx < this.infinityRooms.length; idx++) {
      const room = this.infinityRooms[idx];
      const rx = ((room.x - cameraX * 0.35 + viewW) % (viewW + 260)) - 130;
      const ry = room.y + Math.sin(this.time * room.speedY + room.phase) * 34;
      const rot = Math.sin(this.time * 0.6 + room.phase) * room.rotAmp;

      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(rot);

      // Room tatami base & timber roof
      ctx.fillStyle = '#240b12';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.42)';
      ctx.lineWidth = 2;
      ctx.fillRect(-room.w * 0.5, -room.h * 0.5, room.w, room.h);
      ctx.strokeRect(-room.w * 0.5, -room.h * 0.5, room.w, room.h);

      // Sliding shoji doors (open/close oscillation)
      const slide = (Math.sin(this.time * 1.1 + room.phase) * 0.5 + 0.5) * 14;
      ctx.fillStyle = 'rgba(251, 146, 60, 0.22)';
      ctx.fillRect(-room.w * 0.36 - slide, -room.h * 0.34, room.w * 0.34, room.h * 0.68);
      ctx.fillRect(slide, -room.h * 0.34, room.w * 0.34, room.h * 0.68);

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.26)';
      ctx.beginPath();
      ctx.moveTo(0, -room.h * 0.35);
      ctx.lineTo(0, room.h * 0.35);
      ctx.moveTo(-room.w * 0.35, 0);
      ctx.lineTo(room.w * 0.35, 0);
      ctx.stroke();

      // Suspended staircase rail beneath alternate rooms
      if (idx % 2 === 0) {
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-room.w * 0.45, room.h * 0.5);
        ctx.lineTo(room.w * 0.55, room.h * 0.5 + 48);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawMountainLayer(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    viewW: number,
    viewH: number,
    color: string,
    baseRatio: number,
    amp: number,
    snowCaps: boolean
  ): void {
    const baseY = viewH * baseRatio;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    for (let x = -40; x <= viewW + 40; x += 48) {
      const wx = x + offsetX;
      const y = baseY - Math.abs(Math.sin(wx * 0.0028) * amp + Math.cos(wx * 0.0061) * (amp * 0.45));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(viewW, viewH);
    ctx.closePath();
    ctx.fill();

    if (snowCaps) {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.32)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  public renderWorldBehindCharacters(
    ctx: CanvasRenderingContext2D,
    mapId: MapId,
    platforms: ArenaPlatform[] = [],
    obstacles: ArenaObstacle[] = []
  ): void {
    if (mapId === 'bamboo_forest') {
      this.drawBambooGrove(ctx);
    } else if (mapId === 'mountain_training') {
      this.drawToriiGate(ctx, WORLD_WIDTH * 0.5, GROUND_Y, '#991b1b');
      this.drawPineSilhouettes(ctx, '#0f292e');
    } else if (mapId === 'snowy_mountain') {
      this.drawPineSilhouettes(ctx, '#1b364d', true);
    } else if (mapId === 'japanese_village') {
      this.drawVillageRoofs(ctx, '#1c1917', '#fbbf24');
    } else if (mapId === 'dark_forest') {
      this.drawGnarledTrees(ctx, '#140f24');
    } else if (mapId === 'abandoned_temple') {
      this.drawPagodaRuins(ctx);
    } else if (mapId === 'spider_mountain') {
      this.drawGnarledTrees(ctx, '#0e1326');
      this.drawSpiderWebs(ctx);
    } else if (mapId === 'entertainment_district') {
      this.drawVillageRoofs(ctx, '#3b071c', '#f43f5e');
    } else if (mapId === 'swordsmith_village') {
      this.drawForgeChimneys(ctx);
    } else if (mapId === 'hashira_grounds') {
      this.drawDojoCourtyard(ctx);
    } else if (mapId === 'infinity_castle') {
      this.drawInfinitySuspendedPlatform(ctx);
    }

    // Atmospheric ground mist
    const fogColor =
      mapId === 'infinity_castle'
        ? 'rgba(244, 63, 94, 0.14)'
        : mapId === 'swordsmith_village'
          ? 'rgba(251, 146, 60, 0.12)'
          : 'rgba(148, 163, 184, 0.15)';
    const fogGrad = ctx.createLinearGradient(0, GROUND_Y - 135, 0, GROUND_Y + 12);
    fogGrad.addColorStop(0, 'rgba(0,0,0,0)');
    fogGrad.addColorStop(1, fogColor);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, GROUND_Y - 135, WORLD_WIDTH, 147);

    // Interactive Elevated Platforms
    this.renderPlatforms(ctx, platforms);

    // Interactive / Destructible Obstacles
    this.renderObstacles(ctx, obstacles);

    // Arena Boundary Lanterns
    this.drawStoneLantern(ctx, ARENA_LEFT - 18, GROUND_Y, mapId === 'infinity_castle' ? '#f43f5e' : '#fde047');
    this.drawStoneLantern(ctx, ARENA_RIGHT + 18, GROUND_Y, mapId === 'infinity_castle' ? '#f43f5e' : '#fde047');

    // Ground floor
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, WORLD_HEIGHT);
    if (mapId === 'snowy_mountain') {
      groundGrad.addColorStop(0, '#cbd5e1');
      groundGrad.addColorStop(0.18, '#64748b');
      groundGrad.addColorStop(1, '#0f172a');
    } else if (mapId === 'infinity_castle') {
      groundGrad.addColorStop(0, '#451a12');
      groundGrad.addColorStop(0.16, '#270e09');
      groundGrad.addColorStop(1, '#090305');
    } else if (mapId === 'hashira_grounds') {
      groundGrad.addColorStop(0, '#3f2e22');
      groundGrad.addColorStop(0.16, '#241a12');
      groundGrad.addColorStop(1, '#0b0806');
    } else {
      groundGrad.addColorStop(0, '#13242b');
      groundGrad.addColorStop(0.16, '#0b151a');
      groundGrad.addColorStop(1, '#04080d');
    }

    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);

    ctx.strokeStyle =
      mapId === 'infinity_castle'
        ? 'rgba(251, 191, 36, 0.65)'
        : mapId === 'snowy_mountain'
          ? 'rgba(248, 250, 252, 0.7)'
          : 'rgba(125, 211, 252, 0.35)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(WORLD_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle =
      mapId === 'infinity_castle'
        ? 'rgba(217, 119, 6, 0.25)'
        : 'rgba(30, 41, 59, 0.48)';
    for (let x = ARENA_LEFT; x < ARENA_RIGHT; x += 84) {
      ctx.fillRect(x, GROUND_Y + 3, 68, 7);
    }
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D, platforms: ArenaPlatform[]): void {
    for (const p of platforms) {
      ctx.save();
      if (p.kind === 'stone') {
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#94a3b8';
      } else if (p.kind === 'tatami' || p.kind === 'stair') {
        ctx.fillStyle = '#451a03';
        ctx.strokeStyle = '#f59e0b';
      } else {
        ctx.fillStyle = '#3f2718';
        ctx.strokeStyle = '#b45309';
      }

      ctx.lineWidth = 2;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // Support beams / tatami border slats
      if (p.kind === 'bridge' || p.kind === 'wooden') {
        ctx.fillStyle = '#29180d';
        ctx.fillRect(p.x + 14, p.y + p.h, 10, Math.max(0, GROUND_Y - (p.y + p.h)));
        ctx.fillRect(p.x + p.w - 24, p.y + p.h, 10, Math.max(0, GROUND_Y - (p.y + p.h)));
      } else if (p.kind === 'tatami') {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(p.x + 8, p.y + 4, p.w - 16, 4);
      } else if (p.kind === 'stair') {
        ctx.fillStyle = '#d97706';
        for (let sx = p.x + 12; sx < p.x + p.w - 20; sx += 26) {
          ctx.fillRect(sx, p.y - 4, 16, 4);
        }
      }
      ctx.restore();
    }
  }

  private renderObstacles(ctx: CanvasRenderingContext2D, obstacles: ArenaObstacle[]): void {
    for (const o of obstacles) {
      if (o.hp <= 0) continue;
      ctx.save();
      if (o.kind === 'rock') {
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + 8, o.y + 10);
        ctx.lineTo(o.x + o.w * 0.55, o.y);
        ctx.lineTo(o.x + o.w - 4, o.y + 14);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (o.kind === 'crate' || o.kind === 'fence') {
        ctx.fillStyle = o.kind === 'crate' ? '#78350f' : '#92400e';
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 2;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.moveTo(o.x + o.w, o.y);
        ctx.lineTo(o.x, o.y + o.h);
        ctx.stroke();
      } else if (o.kind === 'shoji_wall') {
        ctx.fillStyle = '#29150b';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
        ctx.fillRect(o.x + 6, o.y + 8, o.w - 12, o.h - 16);
      } else {
        // Pillar or Tree Trunk
        ctx.fillStyle = o.kind === 'pillar' ? '#334155' : '#29180d';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeRect(o.x, o.y, o.w, o.h);
      }

      // Crack indicator if destructible and damaged
      if (o.destructible && o.hp < o.maxHp) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(o.x + o.w * 0.5, o.y + 4);
        ctx.lineTo(o.x + o.w * 0.35, o.y + o.h * 0.5);
        ctx.lineTo(o.x + o.w * 0.65, o.y + o.h - 6);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  public renderWorldForeground(ctx: CanvasRenderingContext2D, mapId: MapId): void {
    for (const p of this.ambient) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (mapId === 'snowy_mountain') {
        ctx.fillStyle = 'rgba(241, 245, 249, 0.72)';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (mapId === 'hashira_grounds') {
        ctx.fillStyle = 'rgba(249, 168, 212, 0.75)';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.75, p.size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (mapId === 'entertainment_district' || mapId === 'swordsmith_village' || mapId === 'infinity_castle') {
        ctx.fillStyle = mapId === 'infinity_castle' ? 'rgba(251, 191, 36, 0.65)' : 'rgba(251, 146, 60, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.36, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(110, 175, 165, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawBambooGrove(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < 32; i++) {
      const x = (i / 31) * WORLD_WIDTH;
      const sway = Math.sin(this.time * 1.2 + i * 0.7) * 7;
      ctx.strokeStyle = i % 2 === 0 ? '#0d2229' : '#133138';
      ctx.lineWidth = i % 2 === 0 ? 9 : 13;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 4);
      ctx.quadraticCurveTo(x + sway * 0.4, GROUND_Y * 0.5, x + sway, -30);
      ctx.stroke();
    }
  }

  private drawToriiGate(ctx: CanvasRenderingContext2D, x: number, groundY: number, color: string): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x - 85, groundY - 210, 18, 210);
    ctx.fillRect(x + 67, groundY - 210, 18, 210);
    ctx.fillRect(x - 115, groundY - 220, 230, 18);
    ctx.fillRect(x - 95, groundY - 178, 190, 12);
    ctx.restore();
  }

  private drawPineSilhouettes(ctx: CanvasRenderingContext2D, color: string, snow = false): void {
    for (let x = 80; x < WORLD_WIDTH - 60; x += 155) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y - 220);
      ctx.lineTo(x - 52, GROUND_Y);
      ctx.lineTo(x + 52, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      if (snow) {
        ctx.fillStyle = 'rgba(241, 245, 249, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y - 220);
        ctx.lineTo(x - 24, GROUND_Y - 140);
        ctx.lineTo(x + 24, GROUND_Y - 140);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private drawVillageRoofs(ctx: CanvasRenderingContext2D, roofColor: string, lanternGlow: string): void {
    for (let x = 140; x < WORLD_WIDTH - 120; x += 260) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 90, GROUND_Y - 160, 180, 160);
      ctx.fillStyle = roofColor;
      ctx.beginPath();
      ctx.moveTo(x - 115, GROUND_Y - 155);
      ctx.lineTo(x, GROUND_Y - 210);
      ctx.lineTo(x + 115, GROUND_Y - 155);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = lanternGlow;
      ctx.globalAlpha = 0.75 + 0.2 * Math.sin(this.time * 5 + x);
      ctx.fillRect(x - 45, GROUND_Y - 125, 26, 36);
      ctx.fillRect(x + 18, GROUND_Y - 125, 26, 36);
      ctx.globalAlpha = 1;
    }
  }

  private drawGnarledTrees(ctx: CanvasRenderingContext2D, color: string): void {
    for (let x = 120; x < WORLD_WIDTH - 100; x += 210) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.quadraticCurveTo(x - 28, GROUND_Y - 140, x + 20, GROUND_Y - 310);
      ctx.stroke();
    }
  }

  private drawSpiderWebs(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.24)';
    ctx.lineWidth = 1.3;
    for (let x = 220; x < WORLD_WIDTH - 150; x += 360) {
      for (let r = 30; r <= 120; r += 30) {
        ctx.beginPath();
        ctx.arc(x, GROUND_Y - 240, r, 0, Math.PI);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawPagodaRuins(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(WORLD_WIDTH * 0.5 - 240, GROUND_Y - 180, 26, 180);
    ctx.fillRect(WORLD_WIDTH * 0.5 + 214, GROUND_Y - 180, 26, 180);
    ctx.beginPath();
    ctx.moveTo(WORLD_WIDTH * 0.5 - 290, GROUND_Y - 180);
    ctx.lineTo(WORLD_WIDTH * 0.5, GROUND_Y - 255);
    ctx.lineTo(WORLD_WIDTH * 0.5 + 290, GROUND_Y - 180);
    ctx.closePath();
    ctx.fill();
  }

  private drawForgeChimneys(ctx: CanvasRenderingContext2D): void {
    for (let x = 200; x < WORLD_WIDTH - 160; x += 340) {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x - 75, GROUND_Y - 170, 150, 170);
      ctx.fillRect(x + 25, GROUND_Y - 250, 28, 90);
      ctx.fillStyle = 'rgba(251, 146, 60, 0.78)';
      ctx.fillRect(x - 32, GROUND_Y - 82, 54, 48);
    }
  }

  private drawDojoCourtyard(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1e1b18';
    ctx.fillRect(WORLD_WIDTH * 0.5 - 310, GROUND_Y - 190, 620, 190);
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(WORLD_WIDTH * 0.5 - 360, GROUND_Y - 190);
    ctx.lineTo(WORLD_WIDTH * 0.5, GROUND_Y - 280);
    ctx.lineTo(WORLD_WIDTH * 0.5 + 360, GROUND_Y - 190);
    ctx.closePath();
    ctx.fill();
  }

  private drawInfinitySuspendedPlatform(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 4;
    for (let x = 160; x < WORLD_WIDTH - 120; x += 280) {
      const shift = Math.sin(this.time * 0.8 + x) * 16;
      ctx.fillStyle = '#240b10';
      ctx.fillRect(x - 16, GROUND_Y - 290 + shift, 32, 290 - shift);
      ctx.strokeRect(x - 16, GROUND_Y - 290 + shift, 32, 290 - shift);
    }
    // Hanging warm castle paper lanterns
    for (let x = 240; x < WORLD_WIDTH - 200; x += 320) {
      const sway = Math.sin(this.time * 1.4 + x) * 8;
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + sway, 140);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(x + sway, 152, 12, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawStoneLantern(ctx: CanvasRenderingContext2D, x: number, groundY: number, glowColor: string): void {
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 16, groundY - 12, 32, 12);
    ctx.fillRect(x - 7, groundY - 62, 14, 50);
    ctx.fillRect(x - 12, groundY - 86, 24, 24);
    ctx.beginPath();
    ctx.moveTo(x - 22, groundY - 86);
    ctx.lineTo(x, groundY - 102);
    ctx.lineTo(x + 22, groundY - 86);
    ctx.closePath();
    ctx.fill();

    const flicker = 0.78 + 0.22 * Math.sin(this.time * 9 + x);
    ctx.fillStyle = glowColor;
    ctx.globalAlpha = 0.9 * flicker;
    ctx.fillRect(x - 5, groundY - 80, 10, 12);
    ctx.restore();
  }
}
