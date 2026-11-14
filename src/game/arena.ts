import { ARENA_LEFT, getMapWidth, GROUND_Y, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import {
  ArenaDecorItem,
  ArenaObstacle,
  ArenaPlatform,
  ArenaWaterZone,
  MapId,
  MapZone,
} from './types';

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

export interface ArenaLayout {
  worldWidth: number;
  zones: MapZone[];
  platforms: ArenaPlatform[];
  obstacles: ArenaObstacle[];
  waterZones: ArenaWaterZone[];
  decors: ArenaDecorItem[];
}

export function getMapZones(mapId: MapId, worldWidth: number): MapZone[] {
  const q = Math.round(worldWidth / 4);
  const defs: Record<MapId, Array<{ name: string; biomeHint: MapZone['biomeHint'] }>> = {
    bamboo_forest: [
      { name: 'Moonlit Bamboo Trail', biomeHint: 'forest' },
      { name: 'Silver Stream & Timber Bridge', biomeHint: 'bridge' },
      { name: 'Mossy Torii Clearing', biomeHint: 'temple' },
      { name: 'Deep Bamboo Abyssal Glade', biomeHint: 'battlefield' },
    ],
    mountain_training: [
      { name: 'Mt. Sagiri Cedar Approach', biomeHint: 'mountain' },
      { name: 'Waterfall Gorge Crossing', biomeHint: 'river' },
      { name: 'Echoing Stone Cavern', biomeHint: 'cave' },
      { name: 'Training Boulder Summit', biomeHint: 'battlefield' },
    ],
    snowy_mountain: [
      { name: 'Frozen Kamado Outskirts', biomeHint: 'mountain' },
      { name: 'Icicle Cavern Pass', biomeHint: 'cave' },
      { name: 'Snow-Bound Ravine Bridge', biomeHint: 'bridge' },
      { name: 'Blizzard Ridge Peak', biomeHint: 'battlefield' },
    ],
    japanese_village: [
      { name: 'Evening Town Outskirts', biomeHint: 'forest' },
      { name: 'Lantern Market Street', biomeHint: 'village' },
      { name: 'Canal Bridge & Waterfall', biomeHint: 'bridge' },
      { name: 'Shattered Village Square', biomeHint: 'battlefield' },
    ],
    dark_forest: [
      { name: 'Wisteria Gate Border', biomeHint: 'forest' },
      { name: 'Foggy Swamp Hollow', biomeHint: 'river' },
      { name: 'Abandoned Forest Shrine', biomeHint: 'temple' },
      { name: 'Blood-Stained Clearing', biomeHint: 'battlefield' },
    ],
    abandoned_temple: [
      { name: 'Overgrown Stone Steps', biomeHint: 'mountain' },
      { name: 'Crumbling Outer Pagoda', biomeHint: 'temple' },
      { name: 'Tsuzumi Shifting Corridor', biomeHint: 'cave' },
      { name: 'Ancient Demon Sanctum', biomeHint: 'battlefield' },
    ],
    spider_mountain: [
      { name: 'Mt. Natagumo Foothills', biomeHint: 'forest' },
      { name: 'Gorge Rope Bridge & Falls', biomeHint: 'bridge' },
      { name: 'Web-Bound Pine Ravine', biomeHint: 'cave' },
      { name: 'Crimson Thread Arena', biomeHint: 'battlefield' },
    ],
    entertainment_district: [
      { name: 'Yoshiwara Outer Gate', biomeHint: 'village' },
      { name: 'Lantern Balcony District', biomeHint: 'village' },
      { name: 'Canal Bridge & Blazing Roofs', biomeHint: 'bridge' },
      { name: 'Ruin of the Neon Street', biomeHint: 'battlefield' },
    ],
    swordsmith_village: [
      { name: 'Hidden Forest Hot Spring', biomeHint: 'river' },
      { name: 'Master Smithy Quarter', biomeHint: 'village' },
      { name: 'Forge Waterfall Crossing', biomeHint: 'bridge' },
      { name: 'Blazing Hearth Battlefield', biomeHint: 'battlefield' },
    ],
    hashira_grounds: [
      { name: 'Corps Outer Courtyard', biomeHint: 'village' },
      { name: 'Pillar Sparring Grounds', biomeHint: 'temple' },
      { name: 'Wisteria Waterfall Garden', biomeHint: 'bridge' },
      { name: 'Ubuyashiki Summit Altar', biomeHint: 'battlefield' },
    ],
    infinity_castle: [
      { name: 'Changing Shoji Foyer', biomeHint: 'castle_hall' },
      { name: 'Moving Tatami Chasm', biomeHint: 'castle_chasm' },
      { name: 'Vertical Suspended Stairways', biomeHint: 'castle_stairs' },
      { name: 'Demon King Throne Sanctum', biomeHint: 'castle_throne' },
    ],
  };

  const list = defs[mapId] ?? defs.bamboo_forest;
  return list.map((item, idx) => ({
    id: `${mapId}_z${idx + 1}`,
    name: item.name,
    startX: idx * q,
    endX: idx === 3 ? worldWidth : (idx + 1) * q,
    biomeHint: item.biomeHint,
  }));
}

export function createArenaLayout(mapId: MapId, compact = false): ArenaLayout {
  const worldWidth = getMapWidth(mapId, compact);
  const zones = compact
    ? [
        {
          id: `${mapId}_compact`,
          name: 'Training Clearing',
          startX: 0,
          endX: WORLD_WIDTH,
          biomeHint: 'mountain' as const,
        },
      ]
    : getMapZones(mapId, worldWidth);

  const platforms: ArenaPlatform[] = [];
  const obstacles: ArenaObstacle[] = [];
  const waterZones: ArenaWaterZone[] = [];
  const decors: ArenaDecorItem[] = [];

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

  if (compact) {
    // Compact layout preserves original tutorial boulder & cutscene coordinates
    const cx = WORLD_WIDTH * 0.5;
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
    } else if (mapId === 'infinity_castle') {
      platforms.push(
        mkPlat('ic_tatami_l', cx - 450, GROUND_Y - 130, 220, 20, 'tatami', 0, 28, 1.35, 0),
        mkPlat('ic_stair_c', cx - 125, GROUND_Y - 210, 250, 18, 'stair', 55, 18, 0.95, 1.4),
        mkPlat('ic_tatami_r', cx + 230, GROUND_Y - 130, 220, 20, 'tatami', 0, 28, 1.35, Math.PI)
      );
      obstacles.push(
        mkObs('ic_shoji_l', cx - 335, 36, 74, 'shoji_wall', true, 50),
        mkObs('ic_shoji_r', cx + 305, 36, 74, 'shoji_wall', true, 50)
      );
    } else {
      platforms.push(
        mkPlat('c_p1', cx - 380, GROUND_Y - 135, 210, 16, 'wooden'),
        mkPlat('c_p2', cx + 170, GROUND_Y - 135, 210, 16, 'wooden')
      );
      obstacles.push(
        mkObs('c_o1', cx - 440, 48, 52, 'crate', true, 45),
        mkObs('c_o2', cx + 390, 48, 52, 'fence', true, 45)
      );
    }
    return { worldWidth, zones, platforms, obstacles, waterZones, decors };
  }

  // EXPANSIVE MULTI-ZONE WORLD LAYOUT (9,600px to 12,000px)
  const zLen = worldWidth / 4;
  const z2 = zLen;
  const z3 = zLen * 2;
  const z4 = zLen * 3;

  if (mapId === 'infinity_castle') {
    // 4 Multi-Section Infinity Castle Wings: Shoji Halls, Moving Tatami Chasm, Vertical Suspended Stairway, Grand Throne
    for (let i = 0; i < 6; i++) {
      const hx = 420 + i * 380;
      decors.push({ id: `ic_p_${i}`, x: hx, y: GROUND_Y - 340, w: 38, h: 340, kind: 'castle_pillar' });
      if (i % 2 === 1) {
        obstacles.push(mkObs(`ic_shoji_z1_${i}`, hx + 140, 38, 76, 'shoji_wall', true, 50));
      }
      platforms.push(mkPlat(`ic_balc_${i}`, hx + 60, GROUND_Y - 135 - (i % 2) * 50, 210, 18, 'tatami'));
    }

    // Zone 2: Moving Tatami Floors over Abyssal Chasm
    for (let i = 0; i < 6; i++) {
      const tx = z2 + 180 + i * 440;
      platforms.push(
        mkPlat(
          `ic_move_t_${i}`,
          tx,
          GROUND_Y - 125 - (i % 3) * 45,
          240,
          20,
          'tatami',
          i % 2 === 0 ? 45 : 0,
          34,
          1.15 + (i % 3) * 0.25,
          i * 1.1
        )
      );
      decors.push({ id: `ic_portal_${i}`, x: tx + 80, y: GROUND_Y - 290, w: 90, h: 140, kind: 'shoji_portal' });
    }

    // Zone 3: Vertical Spaces & Suspended Diagonal Stairways
    for (let i = 0; i < 7; i++) {
      const sx = z3 + 120 + i * 390;
      platforms.push(
        mkPlat(`ic_stair_low_${i}`, sx, GROUND_Y - 115, 220, 18, 'stair', 0, 18, 0.9, i),
        mkPlat(`ic_stair_high_${i}`, sx + 120, GROUND_Y - 235, 220, 18, 'stair', 35, 16, 1.05, i + 1.5)
      );
      if (i % 2 === 0) {
        obstacles.push(mkObs(`ic_pillar_z3_${i}`, sx + 260, 40, 70, 'shoji_wall', true, 60));
      }
    }

    // Zone 4: Grand Upper Moon / Muzan Sanctum Arena
    const bossCenter = z4 + zLen * 0.55;
    platforms.push(
      mkPlat('ic_boss_l', bossCenter - 520, GROUND_Y - 135, 230, 20, 'tatami', 0, 26, 1.25, 0),
      mkPlat('ic_boss_c', bossCenter - 130, GROUND_Y - 220, 260, 18, 'stair', 48, 16, 0.9, 1.2),
      mkPlat('ic_boss_r', bossCenter + 290, GROUND_Y - 135, 230, 20, 'tatami', 0, 26, 1.25, Math.PI)
    );
    obstacles.push(
      mkObs('ic_boss_s1', bossCenter - 360, 38, 76, 'shoji_wall', true, 55),
      mkObs('ic_boss_s2', bossCenter + 320, 38, 76, 'shoji_wall', true, 55)
    );
    for (let b = -2; b <= 2; b++) {
      decors.push({
        id: `ic_sanctum_p_${b}`,
        x: bossCenter + b * 290,
        y: GROUND_Y - 380,
        w: 44,
        h: 380,
        kind: 'castle_pillar',
      });
    }
    return { worldWidth, zones, platforms, obstacles, waterZones, decors };
  }

  // Natural & Village Maps: Connected Biomes across 4 expansive zones
  // Zone 1 (0 .. z2): Approach Trail / Outskirts with trees, lanterns, crates/fences, low platforms
  for (let x = 320; x < z2 - 220; x += 380) {
    decors.push({
      id: `z1_l_${x}`,
      x,
      y: GROUND_Y,
      w: 32,
      h: 96,
      kind: 'lantern',
    });
    if (mapId === 'japanese_village' || mapId === 'entertainment_district' || mapId === 'swordsmith_village') {
      decors.push({ id: `z1_h_${x}`, x: x + 95, y: GROUND_Y - 185, w: 200, h: 185, kind: 'house' });
    } else if (mapId === 'bamboo_forest') {
      decors.push({ id: `z1_b_${x}`, x: x + 120, y: GROUND_Y - 320, w: 90, h: 320, kind: 'bamboo_cluster' });
    } else {
      decors.push({ id: `z1_p_${x}`, x: x + 110, y: GROUND_Y - 230, w: 110, h: 230, kind: 'pine_tree' });
    }
    if (x % 760 === 320) {
      platforms.push(mkPlat(`z1_pl_${x}`, x + 60, GROUND_Y - 125, 200, 16, 'wooden'));
      obstacles.push(
        mkObs(
          `z1_ob_${x}`,
          x + 240,
          48,
          52,
          mapId === 'mountain_training' || mapId === 'snowy_mountain' ? 'rock' : 'fence',
          true,
          45
        )
      );
    }
  }

  // Zone 2 (z2 .. z3): River & Wooden Bridge + Waterfall Gorge
  const riverX = z2 + zLen * 0.28;
  const riverW = 540;
  waterZones.push({ id: 'z2_river', x: riverX, w: riverW, kind: 'river' });
  decors.push({ id: 'z2_waterfall', x: riverX + 80, y: GROUND_Y - 340, w: 150, h: 340, kind: 'waterfall' });
  // Walkable elevated bridge over river + stepping ledges
  platforms.push(
    mkPlat('z2_bridge_deck', riverX - 30, GROUND_Y - 32, riverW + 60, 22, 'bridge'),
    mkPlat('z2_bridge_roof', riverX + 120, GROUND_Y - 165, 280, 16, 'wooden')
  );
  decors.push({ id: 'z2_torii', x: riverX - 180, y: GROUND_Y, w: 210, h: 220, kind: 'torii' });
  obstacles.push(
    mkObs('z2_crate1', z2 + 180, 52, 50, 'crate', true, 45),
    mkObs('z2_rock2', riverX + riverW + 170, 58, 52, 'rock', true, 65)
  );
  for (let x = z2 + 120; x < z3 - 150; x += 430) {
    if (x > riverX - 40 && x < riverX + riverW + 40) continue;
    decors.push({
      id: `z2_dec_${x}`,
      x,
      y: GROUND_Y - 185,
      w: 190,
      h: 185,
      kind: mapId === 'swordsmith_village' ? 'forge_furnace' : mapId === 'entertainment_district' || mapId === 'japanese_village' ? 'house' : 'wisteria_tree',
    });
  }

  // Zone 3 (z3 .. z4): Mountain Cave / Destroyed Shrine & Battleground Ruin
  const caveX = z3 + 220;
  decors.push({ id: 'z3_cave', x: caveX, y: GROUND_Y - 240, w: 340, h: 240, kind: 'cave_mouth' });
  decors.push({ id: 'z3_shrine', x: z3 + zLen * 0.52, y: GROUND_Y - 230, w: 260, h: 230, kind: 'shrine' });
  decors.push({ id: 'z3_ruin', x: z3 + zLen * 0.78, y: GROUND_Y - 160, w: 220, h: 160, kind: 'ruined_wall' });
  platforms.push(
    mkPlat('z3_ledge_1', z3 + 240, GROUND_Y - 135, 220, 18, 'stone'),
    mkPlat('z3_ledge_2', z3 + 680, GROUND_Y - 185, 230, 16, 'wooden'),
    mkPlat('z3_ledge_3', z3 + 1180, GROUND_Y - 130, 240, 18, 'stone'),
    mkPlat('z3_ledge_4', z3 + 1680, GROUND_Y - 145, 220, 16, 'bridge')
  );
  obstacles.push(
    mkObs('z3_ob_1', z3 + 480, 48, 62, 'pillar', true, 65),
    mkObs('z3_ob_2', z3 + 980, 52, 54, 'rock', false, 999),
    mkObs('z3_ob_3', z3 + 1480, 46, 58, 'tree_trunk', true, 55),
    mkObs('z3_ob_4', z3 + 1950, 50, 52, 'crate', true, 45)
  );

  // Zone 4 (z4 .. worldWidth): Grand Boss Battlefield Clearing with balanced combat platforms
  const bossCenter = z4 + zLen * 0.52;
  waterZones.push({ id: 'z4_pool', x: z4 + 80, w: 260, kind: 'waterfall_pool' });
  decors.push(
    { id: 'z4_waterfall', x: z4 + 130, y: GROUND_Y - 300, w: 120, h: 300, kind: 'waterfall' },
    { id: 'z4_torii_boss', x: bossCenter, y: GROUND_Y, w: 240, h: 230, kind: 'torii' },
    { id: 'z4_lantern_l', x: bossCenter - 490, y: GROUND_Y, w: 32, h: 98, kind: 'lantern' },
    { id: 'z4_lantern_r', x: bossCenter + 490, y: GROUND_Y, w: 32, h: 98, kind: 'lantern' }
  );
  platforms.push(
    mkPlat('z4_bridge', z4 + 60, GROUND_Y - 30, 300, 18, 'bridge'),
    mkPlat('z4_boss_l', bossCenter - 430, GROUND_Y - 135, 220, 18, mapId === 'snowy_mountain' ? 'stone' : 'wooden'),
    mkPlat('z4_boss_m', bossCenter - 115, GROUND_Y - 210, 230, 16, 'bridge'),
    mkPlat('z4_boss_r', bossCenter + 210, GROUND_Y - 135, 220, 18, mapId === 'snowy_mountain' ? 'stone' : 'wooden')
  );
  obstacles.push(
    mkObs('z4_ob_l', bossCenter - 520, 56, 52, 'rock', true, 65),
    mkObs('z4_ob_r', bossCenter + 470, 48, 56, 'fence', true, 50)
  );

  return { worldWidth, zones, platforms, obstacles, waterZones, decors };
}

export class ArenaRenderer {
  private ambient: AmbientParticle[] = [];
  private infinityRooms: FloatingRoom[] = [];
  private time = 0;
  private nakimeShiftPulse = 0;

  constructor() {
    for (let i = 0; i < 42; i++) {
      this.ambient.push({
        x: (Math.random() - 0.5) * 2200,
        y: Math.random() * GROUND_Y,
        vx: -28 - Math.random() * 34,
        vy: 22 + Math.random() * 34,
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

  public update(dt: number, mapId: MapId, platforms?: ArenaPlatform[], _worldWidth = WORLD_WIDTH): void {
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
        p.x += Math.sin(this.time * 1.8 + p.phase) * 24 * dt;
        p.y -= (28 + p.size * 3) * dt;
        if (p.y < -20) {
          p.y = GROUND_Y + 10;
          p.x = (Math.random() - 0.5) * 2000;
        }
      } else {
        p.x += (p.vx + Math.sin(this.time * 1.5 + p.phase) * 20) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > GROUND_Y + 10) {
          p.y = -20;
          p.x = (Math.random() - 0.5) * 2200;
        }
        if (p.x < -1150) p.x += 2300;
        if (p.x > 1150) p.x -= 2300;
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

    const moonX = viewW * 0.72 - (cameraX % 1800) * 0.04;
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

    for (let idx = 0; idx < this.infinityRooms.length; idx++) {
      const room = this.infinityRooms[idx];
      const rx = ((((room.x - cameraX * 0.35) % (viewW + 260)) + (viewW + 260)) % (viewW + 260)) - 130;
      const ry = room.y + Math.sin(this.time * room.speedY + room.phase) * 34;
      const rot = Math.sin(this.time * 0.6 + room.phase) * room.rotAmp;

      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(rot);

      ctx.fillStyle = '#240b12';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.42)';
      ctx.lineWidth = 2;
      ctx.fillRect(-room.w * 0.5, -room.h * 0.5, room.w, room.h);
      ctx.strokeRect(-room.w * 0.5, -room.h * 0.5, room.w, room.h);

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
    obstacles: ArenaObstacle[] = [],
    cameraX = WORLD_WIDTH * 0.5,
    worldWidth = WORLD_WIDTH,
    waterZones: ArenaWaterZone[] = [],
    decors: ArenaDecorItem[] = []
  ): void {
    const viewLeft = Math.max(0, cameraX - 1150);
    const viewRight = Math.min(worldWidth, cameraX + 1150);

    // Repeating parallax biome architecture culled to active camera window
    if (mapId === 'bamboo_forest') {
      this.drawBambooGrove(ctx, viewLeft, viewRight);
    } else if (mapId === 'mountain_training') {
      this.drawPineSilhouettes(ctx, '#0f292e', false, viewLeft, viewRight);
    } else if (mapId === 'snowy_mountain') {
      this.drawPineSilhouettes(ctx, '#1b364d', true, viewLeft, viewRight);
    } else if (mapId === 'japanese_village') {
      this.drawVillageRoofs(ctx, '#1c1917', '#fbbf24', viewLeft, viewRight);
    } else if (mapId === 'dark_forest') {
      this.drawGnarledTrees(ctx, '#140f24', viewLeft, viewRight);
    } else if (mapId === 'abandoned_temple') {
      this.drawPagodaRuins(ctx, viewLeft, viewRight);
    } else if (mapId === 'spider_mountain') {
      this.drawGnarledTrees(ctx, '#0e1326', viewLeft, viewRight);
      this.drawSpiderWebs(ctx, viewLeft, viewRight);
    } else if (mapId === 'entertainment_district') {
      this.drawVillageRoofs(ctx, '#3b071c', '#f43f5e', viewLeft, viewRight);
    } else if (mapId === 'swordsmith_village') {
      this.drawForgeChimneys(ctx, viewLeft, viewRight);
    } else if (mapId === 'hashira_grounds') {
      this.drawDojoCourtyard(ctx, viewLeft, viewRight);
    } else if (mapId === 'infinity_castle') {
      this.drawInfinitySuspendedPlatform(ctx, viewLeft, viewRight);
    }

    // Specific Placed Environmental Details (Caves, Waterfalls, Shrines, Houses, Torii, Lanterns)
    this.renderDecors(ctx, decors, mapId, viewLeft, viewRight);

    // Atmospheric ground mist across camera view
    const fogColor =
      mapId === 'infinity_castle'
        ? 'rgba(244, 63, 94, 0.14)'
        : mapId === 'swordsmith_village'
          ? 'rgba(251, 146, 60, 0.12)'
          : 'rgba(148, 163, 184, 0.16)';
    const fogGrad = ctx.createLinearGradient(0, GROUND_Y - 140, 0, GROUND_Y + 12);
    fogGrad.addColorStop(0, 'rgba(0,0,0,0)');
    fogGrad.addColorStop(1, fogColor);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(viewLeft - 60, GROUND_Y - 140, viewRight - viewLeft + 120, 152);

    // Grass tufts swaying along ground (culled)
    if (mapId !== 'infinity_castle' && mapId !== 'entertainment_district') {
      this.renderGrassTufts(ctx, mapId, viewLeft, viewRight);
    }

    // Interactive Elevated Platforms (Bridges, Stones, Tatami, Stairs)
    this.renderPlatforms(ctx, platforms, viewLeft, viewRight);

    // Interactive / Destructible Obstacles
    this.renderObstacles(ctx, obstacles, viewLeft, viewRight);

    // Arena Boundary Lanterns
    this.drawStoneLantern(ctx, ARENA_LEFT - 18, GROUND_Y, mapId === 'infinity_castle' ? '#f43f5e' : '#fde047');
    this.drawStoneLantern(ctx, worldWidth - ARENA_LEFT + 18, GROUND_Y, mapId === 'infinity_castle' ? '#f43f5e' : '#fde047');

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
    ctx.fillRect(viewLeft - 120, GROUND_Y, viewRight - viewLeft + 240, WORLD_HEIGHT - GROUND_Y);

    // Shimmering River & Waterfall Pool Zones inlaid into the ground plane
    this.renderWaterZones(ctx, waterZones, viewLeft, viewRight);

    ctx.strokeStyle =
      mapId === 'infinity_castle'
        ? 'rgba(251, 191, 36, 0.65)'
        : mapId === 'snowy_mountain'
          ? 'rgba(248, 250, 252, 0.7)'
          : 'rgba(125, 211, 252, 0.35)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(viewLeft - 120, GROUND_Y);
    ctx.lineTo(viewRight + 120, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle =
      mapId === 'infinity_castle'
        ? 'rgba(217, 119, 6, 0.25)'
        : 'rgba(30, 41, 59, 0.48)';
    const stepStart = Math.max(ARENA_LEFT, Math.floor(viewLeft / 84) * 84);
    for (let x = stepStart; x < Math.min(worldWidth - ARENA_LEFT, viewRight); x += 84) {
      ctx.fillRect(x, GROUND_Y + 3, 68, 7);
    }
  }

  private renderDecors(
    ctx: CanvasRenderingContext2D,
    decors: ArenaDecorItem[],
    mapId: MapId,
    viewLeft: number,
    viewRight: number
  ): void {
    const glow = mapId === 'infinity_castle' || mapId === 'entertainment_district' ? '#fb7185' : '#fde047';
    for (const d of decors) {
      if (d.x + d.w < viewLeft - 120 || d.x - d.w > viewRight + 120) continue;

      if (d.kind === 'lantern') {
        this.drawStoneLantern(ctx, d.x, d.y, glow);
      } else if (d.kind === 'torii') {
        this.drawToriiGate(ctx, d.x, d.y, mapId === 'dark_forest' ? '#581c87' : '#991b1b');
      } else if (d.kind === 'waterfall') {
        ctx.save();
        const wfGrad = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.h);
        wfGrad.addColorStop(0, 'rgba(125, 211, 252, 0.68)');
        wfGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.5)');
        wfGrad.addColorStop(1, 'rgba(224, 242, 254, 0.85)');
        ctx.fillStyle = wfGrad;
        ctx.fillRect(d.x, d.y, d.w, d.h);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 2.2;
        for (let s = 1; s <= 4; s++) {
          const sx = d.x + (s / 5) * d.w;
          const offset = ((this.time * 180 + s * 60) % d.h);
          ctx.beginPath();
          ctx.moveTo(sx, d.y + offset);
          ctx.lineTo(sx, Math.min(d.y + d.h, d.y + offset + 38));
          ctx.stroke();
        }
        // Mist foam at waterfall base
        ctx.fillStyle = 'rgba(224, 242, 254, 0.42)';
        const foamR = 16 + Math.sin(this.time * 5) * 4;
        ctx.beginPath();
        ctx.ellipse(d.x + d.w * 0.5, GROUND_Y, d.w * 0.72, foamR, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (d.kind === 'cave_mouth') {
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(d.x, GROUND_Y);
        ctx.lineTo(d.x + 35, d.y + 30);
        ctx.lineTo(d.x + d.w * 0.5, d.y);
        ctx.lineTo(d.x + d.w - 30, d.y + 26);
        ctx.lineTo(d.x + d.w, GROUND_Y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.ellipse(d.x + d.w * 0.5, GROUND_Y, d.w * 0.34, d.h * 0.72, 0, Math.PI, 0);
        ctx.fill();
        ctx.restore();
      } else if (d.kind === 'shrine') {
        ctx.save();
        ctx.fillStyle = '#1e1b18';
        ctx.fillRect(d.x, d.y + 65, d.w, d.h - 65);
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.moveTo(d.x - 28, d.y + 68);
        ctx.lineTo(d.x + d.w * 0.5, d.y);
        ctx.lineTo(d.x + d.w + 28, d.y + 68);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(253, 224, 71, 0.65)';
        ctx.fillRect(d.x + d.w * 0.5 - 24, d.y + 110, 48, 60);
        ctx.restore();
      } else if (d.kind === 'ruined_wall') {
        ctx.save();
        ctx.fillStyle = '#27272a';
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x, GROUND_Y);
        ctx.lineTo(d.x, d.y + 25);
        ctx.lineTo(d.x + d.w * 0.45, d.y);
        ctx.lineTo(d.x + d.w * 0.72, d.y + 55);
        ctx.lineTo(d.x + d.w, d.y + 18);
        ctx.lineTo(d.x + d.w, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (d.kind === 'wisteria_tree') {
        ctx.save();
        ctx.strokeStyle = '#1f162e';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(d.x + 60, GROUND_Y);
        ctx.quadraticCurveTo(d.x + 48, d.y + 85, d.x + 78, d.y + 20);
        ctx.stroke();
        for (let c = 0; c < 6; c++) {
          const cx = d.x + 25 + c * 22;
          const sway = Math.sin(this.time * 2.2 + c) * 4;
          ctx.fillStyle = c % 2 === 0 ? 'rgba(192, 132, 252, 0.55)' : 'rgba(216, 180, 254, 0.48)';
          ctx.beginPath();
          ctx.ellipse(cx + sway, d.y + 38 + (c % 2) * 14, 10, 28, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (d.kind === 'castle_pillar') {
        ctx.save();
        ctx.fillStyle = '#240b10';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeRect(d.x, d.y, d.w, d.h);
        ctx.restore();
      } else if (d.kind === 'shoji_portal') {
        ctx.save();
        ctx.fillStyle = 'rgba(251, 146, 60, 0.16)';
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 2;
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeRect(d.x, d.y, d.w, d.h);
        ctx.restore();
      }
    }
  }

  private renderWaterZones(
    ctx: CanvasRenderingContext2D,
    waterZones: ArenaWaterZone[],
    viewLeft: number,
    viewRight: number
  ): void {
    for (const wz of waterZones) {
      if (wz.x + wz.w < viewLeft - 60 || wz.x > viewRight + 60) continue;
      ctx.save();
      const grad = ctx.createLinearGradient(0, GROUND_Y, 0, WORLD_HEIGHT);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.3, '#0369a1');
      grad.addColorStop(1, '#082f49');
      ctx.fillStyle = grad;
      ctx.fillRect(wz.x, GROUND_Y - 2, wz.w, WORLD_HEIGHT - GROUND_Y + 2);

      // Animated shimmering river ripples
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.lineWidth = 2;
      for (let rx = wz.x + 14; rx < wz.x + wz.w - 30; rx += 54) {
        const wave = Math.sin(this.time * 4 + rx * 0.05) * 4;
        ctx.beginPath();
        ctx.moveTo(rx, GROUND_Y + 8 + wave);
        ctx.lineTo(rx + 28, GROUND_Y + 8 - wave * 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private renderGrassTufts(
    ctx: CanvasRenderingContext2D,
    mapId: MapId,
    viewLeft: number,
    viewRight: number
  ): void {
    ctx.save();
    ctx.strokeStyle = mapId === 'snowy_mountain' ? 'rgba(226, 232, 240, 0.5)' : 'rgba(52, 211, 153, 0.36)';
    ctx.lineWidth = 1.8;
    const start = Math.floor(viewLeft / 58) * 58;
    for (let x = start; x < viewRight; x += 58) {
      const sway = Math.sin(this.time * 2.5 + x * 0.04) * 5;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x - 4 + sway, GROUND_Y - 12);
      ctx.moveTo(x + 4, GROUND_Y);
      ctx.lineTo(x + 7 + sway, GROUND_Y - 15);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderPlatforms(
    ctx: CanvasRenderingContext2D,
    platforms: ArenaPlatform[],
    viewLeft: number,
    viewRight: number
  ): void {
    for (const p of platforms) {
      if (p.x + p.w < viewLeft - 60 || p.x > viewRight + 60) continue;
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

      if (p.kind === 'bridge') {
        // Wooden bridge rails
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 24);
        ctx.lineTo(p.x + p.w, p.y - 24);
        ctx.stroke();
        for (let px = p.x + 18; px < p.x + p.w - 10; px += 52) {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(px, p.y - 26, 6, 26);
        }
      } else if (p.kind === 'wooden') {
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

  private renderObstacles(
    ctx: CanvasRenderingContext2D,
    obstacles: ArenaObstacle[],
    viewLeft: number,
    viewRight: number
  ): void {
    for (const o of obstacles) {
      if (o.hp <= 0) continue;
      if (o.x + o.w < viewLeft - 60 || o.x > viewRight + 60) continue;
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
        ctx.fillStyle = o.kind === 'pillar' ? '#334155' : '#29180d';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeRect(o.x, o.y, o.w, o.h);
      }

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

  public renderWorldForeground(
    ctx: CanvasRenderingContext2D,
    mapId: MapId,
    cameraX = WORLD_WIDTH * 0.5,
    _worldWidth = WORLD_WIDTH
  ): void {
    for (const p of this.ambient) {
      const worldPx = cameraX + p.x;
      ctx.save();
      ctx.translate(worldPx, p.y);
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
      } else if (
        mapId === 'entertainment_district' ||
        mapId === 'swordsmith_village' ||
        mapId === 'infinity_castle'
      ) {
        ctx.fillStyle =
          mapId === 'infinity_castle' ? 'rgba(251, 191, 36, 0.65)' : 'rgba(251, 146, 60, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.36, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(110, 175, 165, 0.55)';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawBambooGrove(ctx: CanvasRenderingContext2D, viewLeft: number, viewRight: number): void {
    const start = Math.floor(viewLeft / 62) * 62;
    for (let x = start; x <= viewRight; x += 62) {
      const sway = Math.sin(this.time * 1.2 + x * 0.02) * 7;
      ctx.strokeStyle = Math.floor(x / 62) % 2 === 0 ? '#0d2229' : '#133138';
      ctx.lineWidth = Math.floor(x / 62) % 2 === 0 ? 9 : 13;
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

  private drawPineSilhouettes(
    ctx: CanvasRenderingContext2D,
    color: string,
    snow: boolean,
    viewLeft: number,
    viewRight: number
  ): void {
    const start = Math.max(80, Math.floor(viewLeft / 155) * 155);
    for (let x = start; x < viewRight; x += 155) {
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

  private drawVillageRoofs(
    ctx: CanvasRenderingContext2D,
    roofColor: string,
    lanternGlow: string,
    viewLeft: number,
    viewRight: number
  ): void {
    const start = Math.max(140, Math.floor(viewLeft / 260) * 260);
    for (let x = start; x < viewRight; x += 260) {
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

  private drawGnarledTrees(
    ctx: CanvasRenderingContext2D,
    color: string,
    viewLeft: number,
    viewRight: number
  ): void {
    const start = Math.max(120, Math.floor(viewLeft / 210) * 210);
    for (let x = start; x < viewRight; x += 210) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.quadraticCurveTo(x - 28, GROUND_Y - 140, x + 20, GROUND_Y - 310);
      ctx.stroke();
    }
  }

  private drawSpiderWebs(ctx: CanvasRenderingContext2D, viewLeft: number, viewRight: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.24)';
    ctx.lineWidth = 1.3;
    const start = Math.max(220, Math.floor(viewLeft / 360) * 360);
    for (let x = start; x < viewRight; x += 360) {
      for (let r = 30; r <= 120; r += 30) {
        ctx.beginPath();
        ctx.arc(x, GROUND_Y - 240, r, 0, Math.PI);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawPagodaRuins(ctx: CanvasRenderingContext2D, viewLeft: number, viewRight: number): void {
    const start = Math.max(400, Math.floor(viewLeft / 900) * 900);
    for (let x = start; x < viewRight; x += 900) {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(x - 240, GROUND_Y - 180, 26, 180);
      ctx.fillRect(x + 214, GROUND_Y - 180, 26, 180);
      ctx.beginPath();
      ctx.moveTo(x - 290, GROUND_Y - 180);
      ctx.lineTo(x, GROUND_Y - 255);
      ctx.lineTo(x + 290, GROUND_Y - 180);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawForgeChimneys(ctx: CanvasRenderingContext2D, viewLeft: number, viewRight: number): void {
    const start = Math.max(200, Math.floor(viewLeft / 340) * 340);
    for (let x = start; x < viewRight; x += 340) {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x - 75, GROUND_Y - 170, 150, 170);
      ctx.fillRect(x + 25, GROUND_Y - 250, 28, 90);
      ctx.fillStyle = 'rgba(251, 146, 60, 0.78)';
      ctx.fillRect(x - 32, GROUND_Y - 82, 54, 48);
    }
  }

  private drawDojoCourtyard(ctx: CanvasRenderingContext2D, viewLeft: number, viewRight: number): void {
    const start = Math.max(460, Math.floor(viewLeft / 1000) * 1000);
    for (let x = start; x < viewRight; x += 1000) {
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(x - 310, GROUND_Y - 190, 620, 190);
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.moveTo(x - 360, GROUND_Y - 190);
      ctx.lineTo(x, GROUND_Y - 280);
      ctx.lineTo(x + 360, GROUND_Y - 190);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawInfinitySuspendedPlatform(
    ctx: CanvasRenderingContext2D,
    viewLeft: number,
    viewRight: number
  ): void {
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 4;
    const start = Math.max(160, Math.floor(viewLeft / 280) * 280);
    for (let x = start; x < viewRight; x += 280) {
      const shift = Math.sin(this.time * 0.8 + x) * 16;
      ctx.fillStyle = '#240b10';
      ctx.fillRect(x - 16, GROUND_Y - 290 + shift, 32, 290 - shift);
      ctx.strokeRect(x - 16, GROUND_Y - 290 + shift, 32, 290 - shift);
    }
    const lanStart = Math.max(240, Math.floor(viewLeft / 320) * 320);
    for (let x = lanStart; x < viewRight; x += 320) {
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

  private drawStoneLantern(
    ctx: CanvasRenderingContext2D,
    x: number,
    groundY: number,
    glowColor: string
  ): void {
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
