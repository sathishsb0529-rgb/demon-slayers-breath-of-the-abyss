import { AttackKind, AttackSpec, MapId } from './types';

export const WORLD_WIDTH = 1860;
export const WORLD_HEIGHT = 720;
export const GROUND_Y = 590;
export const ARENA_LEFT = 85;
export const ARENA_RIGHT = WORLD_WIDTH - 85;

export const MAP_WIDTHS: Record<MapId, number> = {
  bamboo_forest: 9600,
  mountain_training: 9600,
  snowy_mountain: 9800,
  japanese_village: 10000,
  dark_forest: 10000,
  abandoned_temple: 9800,
  spider_mountain: 10400,
  entertainment_district: 10400,
  swordsmith_village: 10000,
  hashira_grounds: 9600,
  infinity_castle: 12000,
};

export function getMapWidth(mapId: MapId, compact = false): number {
  return compact ? WORLD_WIDTH : (MAP_WIDTHS[mapId] ?? 9600);
}

export const GRAVITY = 2180;
export const RAGDOLL_GRAVITY = 1920;

export const PLAYER_WALK_SPEED = 248;
export const PLAYER_RUN_SPEED = 398;
export const PLAYER_JUMP_VELOCITY = -840;
export const DODGE_SPEED = 695;
export const DODGE_DURATION = 0.23;
export const DODGE_COOLDOWN = 0.48;

// Requested ~2.0 second Heavy Attack cooldown
export const HEAVY_ATTACK_COOLDOWN = 2.0;

export const FORM_ENERGY_COSTS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 10,
  2: 20,
  3: 30,
  4: 40,
  5: 50,
};

export const BASE_ATTACK_SPECS: Record<
  | 'LIGHT_1'
  | 'LIGHT_2'
  | 'LIGHT_3'
  | 'LIGHT_4'
  | 'DOUBLE_SLASH'
  | 'HEAVY'
  | 'RUNNING_SLASH'
  | 'JUMP'
  | 'COUNTER',
  AttackSpec
> = {
  // 1. Horizontal Sword Slash
  LIGHT_1: {
    kind: 'LIGHT_1',
    technique: 'horizontal_slash',
    damage: 12,
    startup: 0.09,
    active: 0.11,
    recovery: 0.14,
    knockbackX: 160,
    knockbackY: -80,
    triggersRagdoll: false,
    hitstop: 0.028,
    range: 110,
    reachY: 88,
    forwardImpulse: 125,
  },
  // 2. Vertical Downward Slash
  LIGHT_2: {
    kind: 'LIGHT_2',
    technique: 'vertical_downward',
    damage: 14,
    startup: 0.09,
    active: 0.11,
    recovery: 0.14,
    knockbackX: 185,
    knockbackY: -105,
    triggersRagdoll: false,
    hitstop: 0.032,
    range: 114,
    reachY: 96,
    forwardImpulse: 145,
  },
  // 3. Diagonal Upward Slash
  LIGHT_3: {
    kind: 'LIGHT_3',
    technique: 'diagonal_upward',
    damage: 16,
    startup: 0.095,
    active: 0.115,
    recovery: 0.16,
    knockbackX: 250,
    knockbackY: -210,
    triggersRagdoll: false,
    hitstop: 0.04,
    range: 118,
    reachY: 104,
    forwardImpulse: 170,
  },
  // 4. Reverse Diagonal Slash + 5. Quick Double Slash finisher
  LIGHT_4: {
    kind: 'LIGHT_4',
    technique: 'reverse_diagonal',
    damage: 18,
    startup: 0.085,
    active: 0.12,
    recovery: 0.16,
    knockbackX: 300,
    knockbackY: -170,
    triggersRagdoll: false,
    hitstop: 0.042,
    range: 120,
    reachY: 98,
    forwardImpulse: 190,
  },
  DOUBLE_SLASH: {
    kind: 'DOUBLE_SLASH',
    technique: 'quick_double',
    damage: 13,
    startup: 0.08,
    active: 0.22,
    recovery: 0.19,
    knockbackX: 390,
    knockbackY: -250,
    triggersRagdoll: false,
    hitstop: 0.05,
    range: 124,
    reachY: 100,
    forwardImpulse: 225,
    isDoubleHit: true,
  },
  // 6. Heavy Overhead Strike (2.0s cooldown)
  HEAVY: {
    kind: 'HEAVY',
    technique: 'heavy_overhead',
    damage: 32,
    startup: 0.24,
    active: 0.14,
    recovery: 0.26,
    knockbackX: 560,
    knockbackY: -380,
    triggersRagdoll: true,
    hitstop: 0.075,
    range: 136,
    reachY: 110,
    forwardImpulse: 255,
  },
  // 7. Running Sword Attack
  RUNNING_SLASH: {
    kind: 'RUNNING_SLASH',
    technique: 'running_slash',
    damage: 21,
    startup: 0.085,
    active: 0.14,
    recovery: 0.18,
    knockbackX: 410,
    knockbackY: -230,
    triggersRagdoll: false,
    hitstop: 0.048,
    range: 134,
    reachY: 94,
    forwardImpulse: 440,
  },
  // 8. Jumping Sword Attack
  JUMP: {
    kind: 'JUMP',
    technique: 'jumping_slash',
    damage: 19,
    startup: 0.075,
    active: 0.17,
    recovery: 0.15,
    knockbackX: 320,
    knockbackY: -210,
    triggersRagdoll: false,
    hitstop: 0.044,
    range: 122,
    reachY: 116,
    forwardImpulse: 95,
  },
  // 10. Counterattack
  COUNTER: {
    kind: 'COUNTER',
    technique: 'counter_slash',
    damage: 36,
    startup: 0.06,
    active: 0.14,
    recovery: 0.18,
    knockbackX: 590,
    knockbackY: -350,
    triggersRagdoll: true,
    hitstop: 0.08,
    range: 150,
    reachY: 108,
    forwardImpulse: 360,
  },
};

export const DEMON_ATTACK_SPECS: Record<
  Extract<
    AttackKind,
    | 'DEMON_CLAW'
    | 'DEMON_KICK'
    | 'DEMON_PUNCH_COMBO'
    | 'DEMON_HEAVY_SLAM'
    | 'DEMON_BDA_PROJECTILE'
    | 'DEMON_BDA_AREA'
    | 'DEMON_ULTIMATE'
    | 'MUZAN_TENTACLE_WHIP'
    | 'MUZAN_SHOCKWAVE'
  >,
  AttackSpec
> = {
  DEMON_CLAW: {
    kind: 'DEMON_CLAW',
    damage: 12,
    startup: 0.32,
    active: 0.13,
    recovery: 0.26,
    knockbackX: 250,
    knockbackY: -150,
    triggersRagdoll: false,
    hitstop: 0.036,
    range: 104,
    reachY: 90,
    forwardImpulse: 185,
  },
  DEMON_KICK: {
    kind: 'DEMON_KICK',
    damage: 16,
    startup: 0.26,
    active: 0.14,
    recovery: 0.24,
    knockbackX: 390,
    knockbackY: -220,
    triggersRagdoll: false,
    hitstop: 0.045,
    range: 114,
    reachY: 94,
    forwardImpulse: 270,
  },
  DEMON_PUNCH_COMBO: {
    kind: 'DEMON_PUNCH_COMBO',
    damage: 18,
    startup: 0.28,
    active: 0.18,
    recovery: 0.28,
    knockbackX: 330,
    knockbackY: -180,
    triggersRagdoll: false,
    hitstop: 0.045,
    range: 116,
    reachY: 95,
    forwardImpulse: 240,
  },
  DEMON_HEAVY_SLAM: {
    kind: 'DEMON_HEAVY_SLAM',
    damage: 26,
    startup: 0.5,
    active: 0.16,
    recovery: 0.4,
    knockbackX: 590,
    knockbackY: -400,
    triggersRagdoll: true,
    hitstop: 0.072,
    range: 136,
    reachY: 112,
    forwardImpulse: 295,
  },
  DEMON_BDA_PROJECTILE: {
    kind: 'DEMON_BDA_PROJECTILE',
    damage: 16,
    startup: 0.44,
    active: 0.12,
    recovery: 0.35,
    knockbackX: 280,
    knockbackY: -160,
    triggersRagdoll: false,
    hitstop: 0.04,
    range: 95,
    reachY: 85,
    forwardImpulse: -60,
  },
  DEMON_BDA_AREA: {
    kind: 'DEMON_BDA_AREA',
    damage: 24,
    startup: 0.56,
    active: 0.18,
    recovery: 0.42,
    knockbackX: 520,
    knockbackY: -360,
    triggersRagdoll: true,
    hitstop: 0.068,
    range: 185,
    reachY: 135,
    forwardImpulse: 120,
  },
  DEMON_ULTIMATE: {
    kind: 'DEMON_ULTIMATE',
    damage: 34,
    startup: 0.72,
    active: 0.22,
    recovery: 0.48,
    knockbackX: 690,
    knockbackY: -440,
    triggersRagdoll: true,
    hitstop: 0.088,
    range: 255,
    reachY: 160,
    forwardImpulse: 145,
  },
  MUZAN_TENTACLE_WHIP: {
    kind: 'MUZAN_TENTACLE_WHIP',
    damage: 22,
    startup: 0.34,
    active: 0.18,
    recovery: 0.26,
    knockbackX: 460,
    knockbackY: -260,
    triggersRagdoll: false,
    hitstop: 0.055,
    range: 225,
    reachY: 120,
    forwardImpulse: 170,
  },
  MUZAN_SHOCKWAVE: {
    kind: 'MUZAN_SHOCKWAVE',
    damage: 34,
    startup: 0.58,
    active: 0.2,
    recovery: 0.44,
    knockbackX: 720,
    knockbackY: -450,
    triggersRagdoll: true,
    hitstop: 0.085,
    range: 270,
    reachY: 165,
    forwardImpulse: 80,
  },
};
