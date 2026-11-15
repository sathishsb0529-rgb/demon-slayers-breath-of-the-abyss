import { EnemyAI, HashiraAllyAI } from './ai';
import {
  evaluateFighterPose,
  getWeaponSegmentWorld,
  renderFighter,
  renderTrainingRock,
} from './animation';
import { ArenaRenderer, createArenaLayout, getMapZones } from './arena';
import { SoundEngine } from './audio';
import {
  AWAKENING_SPECS,
  BREATHING_STYLES,
  buildBreathingAttackSpec,
  buildUltimateAttackSpec,
  getHighestAwakeningTier,
  ULTIMATE_SPECS,
} from './breathing';
import {
  getLevelById,
  MAP_DISPLAY_NAMES,
  TUTORIAL_STEPS,
} from './campaign';
import { getCharacterById, getCharacterSkins, getDemonSkins, SLAYER_CHARACTERS } from './characters';
import {
  getActiveAttackHitbox,
  getFighterHurtbox,
  rectsOverlap,
  resolveAttackHit,
  resolveObstacleHit,
  resolveSwordClash,
} from './combat';
import {
  ARENA_LEFT,
  BASE_ATTACK_SPECS,
  DODGE_COOLDOWN,
  DODGE_DURATION,
  DODGE_SPEED,
  getFormEnergyCost,
  GRAVITY,
  GROUND_Y,
  HEAVY_ATTACK_COOLDOWN,
  PLAYER_JUMP_VELOCITY,
  PLAYER_RUN_SPEED,
  PLAYER_WALK_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants';
import { DEMON_TEMPLATES } from './demons';
import { ParticleSystem } from './particles';
import {
  activateRagdoll,
  createEmptyRagdoll,
  ragdollToJointPose,
  stepRagdoll,
} from './physics';
import {
  ArenaDecorItem,
  ArenaExploreCache,
  ArenaObstacle,
  ArenaPlatform,
  ArenaWaterZone,
  AttackSpec,
  AudioSettings,
  AwakeningTierId,
  BdaProjectile,
  BreathingStyleId,
  CharacterUpgrades,
  DemonArchetype,
  Fighter,
  FighterActionState,
  FighterVisualProfile,
  GameMode,
  GamePhase,
  GameplaySettings,
  HudSnapshot,
  InputState,
  MapId,
  MapZone,
  StoryEnemySpawn,
  StoryLevelDef,
  UltimateId,
} from './types';

const SLAYER_HAORI_PATTERNS: Record<string, FighterVisualProfile['haoriPattern']> = {
  tanjiro: 'checkered',
  zenitsu: 'triangles',
  giyu: 'half_half',
  rengoku: 'flame',
  shinobu: 'butterfly',
  kanao: 'butterfly',
  obanai: 'stripes',
  muichiro: 'mist_clouds',
};

function createSlayerFighter(
  id: string,
  role: Fighter['role'],
  charId: string,
  breathingStyle: BreathingStyleId,
  startX: number,
  upgrades?: CharacterUpgrades,
  skinId?: string,
  unlockedAwakenings: AwakeningTierId[] = [],
  equippedUltimate: UltimateId = 'eternal_sun'
): Fighter {
  const def = getCharacterById(charId);
  const vitLv = upgrades?.vitality ?? 0;
  const bladeLv = upgrades?.blade ?? 0;
  const defLv = upgrades?.defense ?? 0;
  const breathLv = upgrades?.breathing ?? 0;

  const skin = skinId
    ? getCharacterSkins(charId).find((s) => s.id === skinId)
    : undefined;

  const maxHp = def.maxHp + vitLv * 22;
  const damageMult = def.damageMult * (1 + bladeLv * 0.09);
  const speedMult = def.speedMult * (1 + breathLv * 0.04);
  const energyRegen = def.energyRegen + breathLv * 1.4;
  const defenseReduction = Math.min(0.58, (def.id === 'genya' ? 0.12 : 0) + defLv * 0.07);
  const formCount = BREATHING_STYLES[breathingStyle].forms.length;

  return {
    id,
    name: def.name,
    subtitle: def.title,
    role,
    characterId: def.id,
    visual: {
      skinColor: def.skinColor,
      hairColor: def.hairColor,
      uniformColor: skin?.uniformColor ?? def.uniformColor,
      haoriPrimary: skin?.haoriPrimary ?? def.haoriPrimary,
      haoriAccent: skin?.haoriAccent ?? def.haoriAccent,
      scarfColor: skin?.scarfColor ?? def.scarfColor,
      eyeColor: def.eyeColor,
      bladeColor: skin?.bladeColor ?? def.bladeColor,
      weapon: def.weapon,
      scale: def.id === 'gyomei' ? 1.15 : def.id === 'nezuko_ally' ? 0.94 : 1.0,
      bodyBuild:
        def.id === 'gyomei'
          ? 'hulk'
          : def.id === 'shinobu' || def.id === 'kanao' || def.id === 'nezuko_ally'
            ? 'slim'
            : 'standard',
      hasHorns: def.id === 'nezuko_ally',
      hornColor: '#f43f5e',
      hasMarkings: skin?.hasMarkings,
      markingColor: skin?.markingColor,
      haoriPattern: SLAYER_HAORI_PATTERNS[def.id],
      renderStyle: skin?.renderStyle ?? 'anime',
      skinId: skin?.id ?? 'classic',
    },
    breathingStyle,
    damageMult,
    speedMult,
    attackSpeedMult: def.attackSpeedMult,
    energyRegen,
    defenseReduction,
    x: startX,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    coyoteTimer: 0.1,
    jumpBufferTimer: 0,
    hp: maxHp,
    maxHp,
    displayHp: maxHp,
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
    formCooldowns: new Array(formCount).fill(0),
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
      x: startX - idx * 8,
      y: GROUND_Y - 82 + idx * 3,
    })),
    ragdoll: createEmptyRagdoll(),
    recoveryStartPose: null,
    recoveryDuration: 0.42,
    width: 42,
    height: 98,
    hitCount: 0,
    damageTaken: 0,
    awakeningMeter: 0,
    awakeningActive: false,
    awakeningTimer: 0,
    awakeningCooldown: 0,
    awakeningTier: getHighestAwakeningTier(unlockedAwakenings),
    unlockedAwakenings: [...unlockedAwakenings],
    equippedUltimate,
    ultimateCooldown: 0,
    redBladeBurnTimer: 0,
    consecutiveHitsTaken: 0,
    consecutiveHitTimer: 0,
  };
}

function createDemonFighter(
  spawn: StoryEnemySpawn,
  waveIdx: number,
  startX: number,
  equippedDemonSkins?: Record<string, string>
): Fighter {
  const tpl = DEMON_TEMPLATES[spawn.archetype];
  const hp = Math.round(tpl.baseHp * (spawn.hpScale ?? 1));
  const demonSkinId = equippedDemonSkins?.[spawn.archetype];
  const demonSkin = demonSkinId ? getDemonSkins(spawn.archetype).find((s) => s.id === demonSkinId) : undefined;
  const visual = { ...tpl.visual };
  if (demonSkin) {
    visual.renderStyle = demonSkin.renderStyle;
    visual.skinId = demonSkin.id;
    if (demonSkin.skinColor) visual.skinColor = demonSkin.skinColor;
    if (demonSkin.uniformColor) visual.uniformColor = demonSkin.uniformColor;
    if (demonSkin.haoriPrimary) visual.haoriPrimary = demonSkin.haoriPrimary;
    if (demonSkin.haoriAccent) visual.haoriAccent = demonSkin.haoriAccent;
    if (demonSkin.eyeColor) visual.eyeColor = demonSkin.eyeColor;
    if (demonSkin.bladeColor) visual.bladeColor = demonSkin.bladeColor;
    if (demonSkin.markingColor) {
      visual.markingColor = demonSkin.markingColor;
      visual.hornColor = demonSkin.markingColor;
    }
  }

  return {
    id: `demon_${waveIdx}_${spawn.archetype}`,
    name: spawn.name,
    subtitle: spawn.subtitle,
    role: 'demon',
    demonArchetype: spawn.archetype,
    visual,
    breathingStyle: 'water',
    damageMult: tpl.damageMult * (spawn.damageScale ?? 1),
    speedMult: tpl.speedMult,
    attackSpeedMult: spawn.archetype === 'fast' || spawn.archetype === 'akaza_awakened' ? 1.15 : 1.0,
    energyRegen: 0,
    x: startX,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    facing: -1,
    grounded: true,
    coyoteTimer: 0.1,
    jumpBufferTimer: 0,
    hp,
    maxHp: hp,
    displayHp: hp,
    energy: 0,
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
      x: startX + idx * 8,
      y: GROUND_Y - 82 + idx * 3,
    })),
    ragdoll: createEmptyRagdoll(),
    recoveryStartPose: null,
    recoveryDuration: 0.46,
    width: 48,
    height: 110,
    hitCount: 0,
    damageTaken: 0,
    awakeningMeter: 0,
    awakeningActive: false,
    awakeningTimer: 0,
    awakeningCooldown: 0,
    awakeningTier: null,
    unlockedAwakenings: [],
    equippedUltimate: 'eternal_sun',
    ultimateCooldown: 0,
    redBladeBurnTimer: 0,
    consecutiveHitsTaken: 0,
    consecutiveHitTimer: 0,
  };
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onTutorialComplete?: () => void;
  onLevelComplete?: (levelId: number, rank: 'S' | 'A' | 'B', coinsEarned: number, kills: number) => void;
  onExploreCachePickup?: (cacheId: string, coins: number) => void;
  onSurvivalComplete?: (wave: number, won: boolean, coinsEarned: number, demonsDefeated: number) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  public sound = new SoundEngine();
  private arena = new ArenaRenderer();
  private particles = new ParticleSystem();
  private enemyAI = new EnemyAI();
  private partnerAI = new EnemyAI();
  private cloneAI = new EnemyAI();
  private allyAIs: HashiraAllyAI[] = [];

  public phase: GamePhase = 'TITLE_MENU';
  public mode: GameMode = 'STORY';
  public mapId: MapId = 'bamboo_forest';
  public currentLevel: StoryLevelDef = getLevelById(1);
  private waveIndex = 0;

  private worldWidth = WORLD_WIDTH;
  private zones: MapZone[] = [];
  private waterZones: ArenaWaterZone[] = [];
  private decors: ArenaDecorItem[] = [];
  private exploreCaches: ArenaExploreCache[] = [];
  private collectedCacheIdsThisRun = new Set<string>();
  private currentZoneIndex = 1;
  private enemyEngaged = true;
  private activeCampaignCharId = 'tanjiro';
  private equippedDemonSkins: Record<string, string> = {};

  // Survival 20-Wave Mode
  private survivalWave = 1;
  private survivalMaxWaves = 20;
  private survivalCountdown = 0;
  private survivalNextWavePending = false;
  private survivalDefeatedCount = 0;

  // Hybrid Finishing Cinematic Mode
  private finishingTimer = 0;
  private finishingDuration = 1.85;
  private finishingTitle = '';
  private finishingPendingCoins = 0;
  private finishingPendingRank: 'S' | 'A' | 'B' = 'S';

  // Live Boss / Upper Moon Speech Bubble & Sun 13th Form Combo
  private activeSpeechBubble: {
    speaker: string;
    text: string;
    isDemon: boolean;
    timer: number;
    target: 'player' | 'enemy';
  } | null = null;
  private lastEnemySpeechHpPct = 1.0;
  private domaFrostStallTimer = 0;
  private sunComboTicksRemaining = 0;
  private sunComboTickTimer = 0;
  private sunComboIdx = 0;

  public player: Fighter = createSlayerFighter('player', 'player', 'tanjiro', 'water', WORLD_WIDTH * 0.5 - 190);
  public enemy: Fighter = createDemonFighter(
    { archetype: 'basic', name: 'Feral Night Demon', subtitle: 'Lesser Demon' },
    0,
    WORLD_WIDTH * 0.5 + 190
  );
  public partnerEnemy: Fighter | null = null;
  public cloneEnemy: Fighter | null = null;
  public allies: Fighter[] = [];
  private platforms: ArenaPlatform[] = [];
  private obstacles: ArenaObstacle[] = [];
  private projectiles: BdaProjectile[] = [];
  private nextProjectileId = 1;

  // Tutorial state
  private tutorialStep = 1;
  private tutMovedLeft = false;
  private tutMovedRight = false;
  private tutJumps = 0;
  private tutSlashes = 0;
  private tutBlocks = 0;
  private tutDodges = 0;
  private tutMentorAttackTimer = 1.2;
  private rockX = WORLD_WIDTH * 0.5 + 220;
  private rockHp = 180;
  private rockMaxHp = 180;
  private rockLastSwingId = -1;

  private input: InputState = {
    left: false,
    right: false,
    block: false,
    jumpPressed: false,
    lightPressed: false,
    heavyPressed: false,
    dodgePressed: false,
    awakeningPressed: false,
    ultimatePressed: false,
    formPressed: 0,
  };

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private cameraX = WORLD_WIDTH * 0.5;
  private cameraZoom = 1.0;
  private matchTime = 0;
  private hudEmitAccum = 0;
  private runHoldTime = 0;
  private footstepAccum = 0;
  private waterSplashTimer = 0;
  private ragdollHitsLanded = 0;
  private actionWarning: string | null = null;
  private actionWarningTimer = 0;
  private coinsBalance = 0;
  private coinsEarnedThisRun = 0;
  private lastRank: 'S' | 'A' | 'B' | null = null;
  private killsThisRun = 0;
  private isCurrentBossBattle = false;

  private viewW = 1280;
  private viewH = 720;
  private dpr = 1;
  private gameplaySettings: GameplaySettings = {
    bloodEffectsEnabled: false,
    combatVisualEffects: true,
    cinematicEffects: true,
    dialogueEnabled: true,
    cameraEffects: true,
    performanceMode: false,
  };

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.callbacks = callbacks;
    const layout = createArenaLayout(this.mapId, true);
    this.worldWidth = layout.worldWidth;
    this.platforms = layout.platforms;
    this.obstacles = layout.obstacles;
    this.waterZones = layout.waterZones;
    this.decors = layout.decors;
    this.exploreCaches = layout.exploreCaches;
    this.zones = layout.zones;
    this.resize();
  }

  public setCoinsBalance(coins: number): void {
    this.coinsBalance = coins;
    this.emitHudSnapshot();
  }

  public setEquippedDemonSkins(skins: Record<string, string>): void {
    this.equippedDemonSkins = { ...skins };
  }

  public applyAudioSettings(audio: AudioSettings): void {
    this.sound.applySettings(audio);
    this.emitHudSnapshot();
  }

  public applyGameplaySettings(gameplay: GameplaySettings): void {
    this.gameplaySettings = { ...gameplay };
    this.particles.setVisualSettings({
      bloodEffectsEnabled: gameplay.bloodEffectsEnabled,
      combatVisualEffects: gameplay.combatVisualEffects,
      performanceMode: gameplay.performanceMode,
    });
    if (!gameplay.cameraEffects) {
      this.shakeIntensity = 0;
    }
    if (!gameplay.cinematicEffects) {
      this.hitstopTimer = 0;
    }
    this.resize();
  }

  public resize(): void {
    const parent = this.canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;
    const maxDpr = this.gameplaySettings.performanceMode ? 1.25 : 2;
    this.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    this.viewW = Math.max(320, w);
    this.viewH = Math.max(240, h);
    this.canvas.width = Math.round(this.viewW * this.dpr);
    this.canvas.height = Math.round(this.viewH * this.dpr);
  }

  public startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
    this.emitHudSnapshot();
  }

  public stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.sound.stopMusic();
  }

  public startTutorial(
    charId: string,
    breathingStyle: BreathingStyleId,
    upgrades?: CharacterUpgrades,
    skinId?: string,
    unlockedAwakenings?: AwakeningTierId[],
    equippedUltimate?: UltimateId
  ): void {
    this.sound.unlock();
    this.mode = 'TUTORIAL';
    this.mapId = 'mountain_training';
    this.activeCampaignCharId = charId;
    this.isCurrentBossBattle = false;
    this.sound.setMusicContext('gameplay', this.mapId, false, undefined, charId);

    const layout = createArenaLayout(this.mapId, true);
    this.worldWidth = layout.worldWidth;
    this.platforms = layout.platforms;
    this.obstacles = [];
    this.waterZones = [];
    this.decors = layout.decors;
    this.exploreCaches = [];
    this.zones = [];
    this.currentZoneIndex = 1;
    this.enemyEngaged = true;

    this.player = createSlayerFighter(
      'player',
      'player',
      charId,
      breathingStyle,
      WORLD_WIDTH * 0.5 - 230,
      upgrades,
      skinId,
      unlockedAwakenings,
      equippedUltimate
    );
    this.enemy = createSlayerFighter('mentor', 'demon', 'giyu', 'water', WORLD_WIDTH * 0.5 + 110);
    this.enemy.name = 'Mentor Urokodaki';
    this.enemy.subtitle = 'Water Cultivator';
    this.enemy.hp = 9999;
    this.enemy.maxHp = 9999;
    this.enemy.displayHp = 9999;
    this.enemy.facing = -1;
    this.enemy.visual.haoriPrimary = '#0284c7';
    this.enemy.visual.haoriAccent = '#e2e8f0';
    this.enemy.visual.hairColor = '#cbd5e1';

    this.partnerEnemy = null;
    this.cloneEnemy = null;
    this.allies = [];
    this.allyAIs = [];
    this.projectiles = [];
    this.particles.clear();
    this.tutorialStep = 1;
    this.tutMovedLeft = false;
    this.tutMovedRight = false;
    this.tutJumps = 0;
    this.tutSlashes = 0;
    this.tutBlocks = 0;
    this.tutDodges = 0;
    this.tutMentorAttackTimer = 1.4;
    this.rockHp = 180;
    this.rockMaxHp = 180;
    this.rockLastSwingId = -1;

    this.resetMatchCounters();
    this.cameraX = WORLD_WIDTH * 0.5;
    this.phase = 'PLAYING';
    this.emitHudSnapshot();
  }

  private getWaveSpawnX(waveIdx: number, totalWaves: number): number {
    if (totalWaves <= 1) {
      return Math.min(this.worldWidth - 1800, 2650);
    }
    const fractions = totalWaves === 2 ? [0.22, 0.72] : totalWaves === 3 ? [0.2, 0.5, 0.8] : [0.18, 0.4, 0.64, 0.84];
    const frac = fractions[Math.min(fractions.length - 1, waveIdx)];
    return Math.round(this.worldWidth * frac);
  }

  private spawnWaveFighters(spawn: StoryEnemySpawn, waveIdx: number, spawnX: number): void {
    this.enemy = createDemonFighter(spawn, waveIdx, spawnX, this.equippedDemonSkins);
    this.lastEnemySpeechHpPct = 1.0;
    if (spawn.partnerArchetype) {
      const pTpl = DEMON_TEMPLATES[spawn.partnerArchetype];
      this.partnerEnemy = createDemonFighter(
        {
          archetype: spawn.partnerArchetype,
          name: spawn.partnerName ?? pTpl.displayName,
          subtitle: spawn.partnerSubtitle ?? pTpl.rankLabel,
          hpScale: spawn.partnerHpScale ?? 0.85,
          isBoss: spawn.isBoss,
        },
        waveIdx + 50,
        Math.min(this.worldWidth - 140, spawnX + 145),
        this.equippedDemonSkins
      );
      this.partnerAI.reset();
    } else {
      this.partnerEnemy = null;
    }
  }

  private getSurvivalWaveSpawn(wave: number): StoryEnemySpawn {
    const scale = 0.82 + (wave - 1) * 0.065;
    const dmgScale = 0.85 + (wave - 1) * 0.032;
    const roster: Array<{ arch: DemonArchetype; name: string; sub: string; boss?: boolean; partner?: DemonArchetype }> = [
      { arch: 'basic', name: 'Night Stalker', sub: 'Wave 1 · Lesser Demon' },
      { arch: 'fast', name: 'Fang Runner', sub: 'Wave 2 · Feral Demon' },
      { arch: 'boss_hand', name: 'Hand Demon', sub: 'Wave 3 · Wisteria Prisoner' },
      { arch: 'spider_brother_main', name: 'Spider Brother', sub: 'Wave 4 · Venom Swarm' },
      { arch: 'kyogai', name: 'Kyogai', sub: 'Wave 5 · Tsuzumi Master', boss: true },
      { arch: 'susamaru', name: 'Susamaru', sub: 'Wave 6 · Temari Fiend', partner: 'yahaba' },
      { arch: 'boss_rui', name: 'Rui', sub: 'Wave 7 · Lower Rank Five', boss: true },
      { arch: 'kamanue', name: 'Kamanue', sub: 'Wave 8 · Lower Rank Six' },
      { arch: 'boss_enmu', name: 'Enmu', sub: 'Wave 9 · Lower Rank One', boss: true },
      { arch: 'boss_daki', name: 'Daki', sub: 'Wave 10 · Upper Rank Six', boss: true },
      { arch: 'gyutaro', name: 'Gyutaro', sub: 'Wave 11 · Blood Sickle Fury', boss: true },
      { arch: 'kaigaku', name: 'Kaigaku', sub: 'Wave 12 · Thunder Upper Six', boss: true },
      { arch: 'gyokko', name: 'Gyokko', sub: 'Wave 13 · Upper Rank Five', boss: true },
      { arch: 'karaku', name: 'Hantengu Clones', sub: 'Wave 14 · Wind & Lightning', partner: 'sekido' },
      { arch: 'zohakuten', name: 'Zohakuten', sub: 'Wave 15 · Upper Rank Four', boss: true },
      { arch: 'boss_akaza', name: 'Akaza', sub: 'Wave 16 · Upper Rank Three', boss: true },
      { arch: 'boss_nakime', name: 'Nakime', sub: 'Wave 17 · Biwa Spatial Upper Four', boss: true },
      { arch: 'boss_doma', name: 'Doma', sub: 'Wave 18 · Upper Rank Two', boss: true },
      { arch: 'kokushibo_demon', name: 'Kokushibo', sub: 'Wave 19 · Upper Rank One', boss: true },
      { arch: 'muzan_final', name: 'Muzan Kibutsuji', sub: 'Wave 20 · Demon King Abyss', boss: true },
    ];
    const entry = roster[Math.min(roster.length - 1, Math.max(0, wave - 1))];
    return {
      archetype: entry.arch,
      name: entry.name,
      subtitle: entry.sub,
      hpScale: wave === 20 ? 1.55 : scale,
      damageScale: dmgScale,
      isBoss: Boolean(entry.boss),
      partnerArchetype: entry.partner,
    };
  }

  public startSurvivalMode(
    mapId: MapId,
    charId: string,
    breathingStyle: BreathingStyleId,
    upgrades?: CharacterUpgrades,
    skinId?: string,
    unlockedAwakenings?: AwakeningTierId[],
    equippedUltimate?: UltimateId,
    equippedDemonSkins?: Record<string, string>
  ): void {
    this.sound.unlock();
    if (equippedDemonSkins) this.equippedDemonSkins = { ...equippedDemonSkins };
    this.mode = 'SURVIVAL';
    this.mapId = mapId;
    this.activeCampaignCharId = charId;
    this.survivalWave = 1;
    this.survivalMaxWaves = 20;
    this.survivalCountdown = 0;
    this.survivalNextWavePending = false;
    this.survivalDefeatedCount = 0;

    const layout = createArenaLayout(this.mapId, false);
    this.worldWidth = layout.worldWidth;
    this.platforms = layout.platforms;
    this.obstacles = layout.obstacles;
    this.waterZones = layout.waterZones;
    this.decors = layout.decors;
    this.exploreCaches = layout.exploreCaches;
    this.zones = layout.zones.length > 0 ? layout.zones : getMapZones(this.mapId, this.worldWidth);

    const playerStartX = Math.round(this.worldWidth * 0.45);
    const enemyStartX = playerStartX + 460;

    this.player = createSlayerFighter(
      'player',
      'player',
      charId,
      breathingStyle,
      playerStartX,
      upgrades,
      skinId,
      unlockedAwakenings,
      equippedUltimate
    );
    const firstSpawn = this.getSurvivalWaveSpawn(1);
    this.isCurrentBossBattle = Boolean(firstSpawn.isBoss);
    this.sound.setMusicContext('survival', this.mapId, false, firstSpawn.archetype, charId);

    this.spawnWaveFighters(firstSpawn, 0, enemyStartX);
    this.cloneEnemy = null;
    this.allies = [];
    this.allyAIs = [];
    this.projectiles = [];
    this.particles.clear();
    this.enemyAI.reset();
    this.cloneAI.reset();
    this.resetMatchCounters();
    this.enemyEngaged = true;
    this.cameraX = (playerStartX + enemyStartX) * 0.5;
    this.phase = 'PLAYING';
    this.updateZoneTracker();
    this.particles.spawnFloatingText(playerStartX + 180, this.player.y - 140, 'SURVIVAL WAVE 1 / 20', '#fbbf24', 1.3);
    this.emitHudSnapshot();
  }

  public startStoryLevel(
    levelId: number,
    charId: string,
    breathingStyle: BreathingStyleId,
    levelOverride?: StoryLevelDef,
    upgrades?: CharacterUpgrades,
    skinId?: string,
    unlockedAwakenings?: AwakeningTierId[],
    equippedUltimate?: UltimateId,
    equippedDemonSkins?: Record<string, string>
  ): void {
    this.sound.unlock();
    if (equippedDemonSkins) this.equippedDemonSkins = { ...equippedDemonSkins };
    const level = levelOverride ?? getLevelById(levelId);
    this.mode = 'STORY';
    this.currentLevel = level;
    this.mapId = level.mapId;
    this.activeCampaignCharId = charId;
    this.waveIndex = 0;

    const layout = createArenaLayout(this.mapId, false);
    this.worldWidth = layout.worldWidth;
    this.platforms = layout.platforms;
    this.obstacles = layout.obstacles;
    this.waterZones = layout.waterZones;
    this.decors = layout.decors;
    this.exploreCaches = layout.exploreCaches;
    this.zones = layout.zones.length > 0 ? layout.zones : getMapZones(this.mapId, this.worldWidth);

    const firstSpawn = level.enemies[0];
    this.isCurrentBossBattle = level.isBossLevel || Boolean(firstSpawn?.isBoss);
    this.sound.setMusicContext(
      'gameplay',
      this.mapId,
      this.isCurrentBossBattle,
      firstSpawn?.archetype,
      charId
    );

    const playerStartX = 680;
    const wave0X = this.getWaveSpawnX(0, level.enemies.length);

    this.player = createSlayerFighter(
      'player',
      'player',
      charId,
      breathingStyle,
      playerStartX,
      upgrades,
      skinId,
      unlockedAwakenings,
      equippedUltimate
    );
    this.spawnWaveFighters(firstSpawn, 0, wave0X);
    this.cloneEnemy = null;
    this.enemyEngaged = Math.abs(wave0X - playerStartX) < 960;

    if (this.isCurrentBossBattle && this.enemyEngaged) {
      this.sound.playBossEntrance();
      this.triggerDemonSpeech(this.enemy, 'engage');
    }

    // Canon Squad & Hashira AI Allies
    this.allies = [];
    this.allyAIs = [];
    const requestedAllies = level.allyIds ?? level.allyHashiraIds ?? [];
    if (requestedAllies.length > 0) {
      const candidateIds = requestedAllies.filter((id) => id !== charId);
      const fallback = SLAYER_CHARACTERS.filter((c) => c.isHashira && c.id !== charId).map((c) => c.id);
      const chosen = candidateIds.length > 0 ? candidateIds.slice(0, 3) : fallback.slice(0, 2);

      chosen.forEach((allyId, idx) => {
        const allyDef = getCharacterById(allyId);
        const allyFighter = createSlayerFighter(
          `ally_${allyId}_${idx}`,
          'ally',
          allyId,
          allyDef.defaultBreathing,
          Math.max(ARENA_LEFT + 70, playerStartX - 85 - idx * 65)
        );
        this.allies.push(allyFighter);
        this.allyAIs.push(new HashiraAllyAI());
      });
    }

    this.projectiles = [];
    this.particles.clear();
    this.enemyAI.reset();
    this.cloneAI.reset();
    this.resetMatchCounters();
    this.cameraX = Math.max(460, playerStartX + 180);
    this.phase = 'PLAYING';
    this.updateZoneTracker();
    this.emitHudSnapshot();
  }

  public startPracticeMatch(
    mapId: MapId,
    demonArchetype: DemonArchetype,
    charId: string,
    breathingStyle: BreathingStyleId,
    upgrades?: CharacterUpgrades,
    skinId?: string,
    unlockedAwakenings?: AwakeningTierId[],
    equippedUltimate?: UltimateId,
    equippedDemonSkins?: Record<string, string>
  ): void {
    this.sound.unlock();
    if (equippedDemonSkins) this.equippedDemonSkins = { ...equippedDemonSkins };
    this.mode = 'PRACTICE';
    this.mapId = mapId;
    this.activeCampaignCharId = charId;
    this.waveIndex = 0;

    const layout = createArenaLayout(this.mapId, false);
    this.worldWidth = layout.worldWidth;
    this.platforms = layout.platforms;
    this.obstacles = layout.obstacles;
    this.waterZones = layout.waterZones;
    this.decors = layout.decors;
    this.exploreCaches = layout.exploreCaches;
    this.zones = layout.zones.length > 0 ? layout.zones : getMapZones(this.mapId, this.worldWidth);

    const tpl = DEMON_TEMPLATES[demonArchetype];
    this.isCurrentBossBattle =
      demonArchetype.startsWith('boss_') ||
      demonArchetype.endsWith('_final') ||
      demonArchetype === 'demon_king_tanjiro' ||
      demonArchetype === 'kokushibo_demon';
    this.sound.setMusicContext('gameplay', this.mapId, this.isCurrentBossBattle, demonArchetype, charId);

    const playerStartX = 1280;
    const enemyStartX = 1860;
    this.player = createSlayerFighter(
      'player',
      'player',
      charId,
      breathingStyle,
      playerStartX,
      upgrades,
      skinId,
      unlockedAwakenings,
      equippedUltimate
    );
    this.spawnWaveFighters(
      {
        archetype: demonArchetype,
        name: tpl.displayName,
        subtitle: `${tpl.rankLabel} · ${MAP_DISPLAY_NAMES[mapId]}`,
        hpScale: demonArchetype === 'boss_muzan' || demonArchetype === 'muzan_final' ? 0.82 : 1.0,
      },
      0,
      enemyStartX
    );
    this.cloneEnemy = null;
    this.allies = [];
    this.allyAIs = [];
    this.projectiles = [];
    this.particles.clear();
    this.enemyAI.reset();
    this.cloneAI.reset();
    this.resetMatchCounters();
    this.enemyEngaged = true;
    this.triggerDemonSpeech(this.enemy, 'engage');
    this.cameraX = (playerStartX + enemyStartX) * 0.5;
    this.phase = 'PLAYING';
    this.updateZoneTracker();
    this.emitHudSnapshot();
  }

  public restartCurrentBattle(
    upgrades?: CharacterUpgrades,
    skinId?: string,
    unlockedAwakenings?: AwakeningTierId[],
    equippedUltimate?: UltimateId
  ): void {
    const charId = this.player.characterId ?? this.activeCampaignCharId;
    const style = this.player.breathingStyle;
    const awks = unlockedAwakenings ?? this.player.unlockedAwakenings;
    const ult = equippedUltimate ?? this.player.equippedUltimate;
    if (this.mode === 'TUTORIAL') {
      this.startTutorial(charId, style, upgrades, skinId, awks, ult);
    } else if (this.mode === 'STORY') {
      this.startStoryLevel(this.currentLevel.id, charId, style, this.currentLevel, upgrades, skinId, awks, ult);
    } else if (this.mode === 'SURVIVAL') {
      this.startSurvivalMode(this.mapId, charId, style, upgrades, skinId, awks, ult);
    } else {
      this.startPracticeMatch(this.mapId, this.enemy.demonArchetype ?? 'basic', charId, style, upgrades, skinId, awks, ult);
    }
  }

  private resetMatchCounters(): void {
    this.hitstopTimer = 0;
    this.shakeIntensity = 0;
    this.matchTime = 0;
    this.ragdollHitsLanded = 0;
    this.runHoldTime = 0;
    this.footstepAccum = 0;
    this.actionWarning = null;
    this.actionWarningTimer = 0;
    this.coinsEarnedThisRun = 0;
    this.lastRank = null;
    this.killsThisRun = 0;
    this.cameraZoom = 1.0;
    this.finishingTimer = 0;
    this.activeSpeechBubble = null;
    this.lastEnemySpeechHpPct = 1.0;
    this.domaFrostStallTimer = 0;
    this.sunComboTicksRemaining = 0;
    this.collectedCacheIdsThisRun.clear();
    this.clearAllInputs();
  }

  public togglePause(): void {
    if (this.phase === 'PLAYING') {
      this.phase = 'PAUSED';
      this.clearHeldInputs();
      this.emitHudSnapshot();
    } else if (this.phase === 'PAUSED') {
      this.phase = 'PLAYING';
      this.lastTimestamp = performance.now();
      this.emitHudSnapshot();
    }
  }

  public returnToTitle(): void {
    this.particles.clear();
    this.projectiles = [];
    this.cloneEnemy = null;
    this.partnerEnemy = null;
    this.clearAllInputs();
    this.phase = 'TITLE_MENU';
    const compact = createArenaLayout('bamboo_forest', true);
    this.worldWidth = compact.worldWidth;
    this.platforms = compact.platforms;
    this.obstacles = compact.obstacles;
    this.waterZones = [];
    this.decors = compact.decors;
    this.sound.setMusicContext('menu', 'menu', false, undefined, this.activeCampaignCharId);
    this.emitHudSnapshot();
  }

  public setMenuMusicTheme(theme: 'menu' | 'char_select', charId?: string): void {
    this.sound.setMusicContext(theme, theme, false, undefined, charId ?? this.activeCampaignCharId);
  }

  public toggleMute(): boolean {
    const muted = this.sound.toggleMute();
    this.emitHudSnapshot();
    return muted;
  }

  public setHeldInput(key: 'left' | 'right' | 'block', active: boolean): void {
    this.sound.unlock();
    this.input[key] = active;
  }

  public triggerAction(action: 'jump' | 'light' | 'heavy' | 'dodge'): void {
    this.sound.unlock();
    if (this.phase !== 'PLAYING') return;
    if (action === 'jump') {
      this.input.jumpPressed = true;
      this.player.jumpBufferTimer = 0.14;
    } else if (action === 'light') {
      this.input.lightPressed = true;
    } else if (action === 'heavy') {
      this.input.heavyPressed = true;
    } else if (action === 'dodge') {
      this.input.dodgePressed = true;
    }
  }

  public triggerBreathingForm(formIndex: number): void {
    this.sound.unlock();
    if (this.phase !== 'PLAYING') return;
    this.input.formPressed = formIndex;
  }

  public triggerAwakening(): void {
    this.sound.unlock();
    if (this.phase !== 'PLAYING') return;
    this.input.awakeningPressed = true;
  }

  public triggerUltimate(): void {
    this.sound.unlock();
    if (this.phase !== 'PLAYING') return;
    this.input.ultimatePressed = true;
  }

  public clearHeldInputs(): void {
    this.input.left = false;
    this.input.right = false;
    this.input.block = false;
  }

  private clearAllInputs(): void {
    this.clearHeldInputs();
    this.input.jumpPressed = false;
    this.input.lightPressed = false;
    this.input.heavyPressed = false;
    this.input.dodgePressed = false;
    this.input.awakeningPressed = false;
    this.input.ultimatePressed = false;
    this.input.formPressed = 0;
  }

  private beginStateTransition(f: Fighter, nextState: FighterActionState, duration = 0.08): void {
    if (f.state !== nextState && f.lastPose) {
      f.blendFromPose = f.lastPose;
      f.blendTimer = 0;
      f.blendDuration = duration;
    }
    f.state = nextState;
  }

  private spawnShotgunPellets(p: Fighter): void {
    this.sound.playShotgunBlast();
    for (let i = -1; i <= 1; i++) {
      this.projectiles.push({
        id: this.nextProjectileId++,
        ownerId: p.id,
        ownerRole: p.role,
        x: p.x + p.facing * 42,
        y: p.y - 62 + i * 8,
        vx: p.facing * 720,
        vy: i * 55,
        radius: 5.5,
        damage: Math.round(9 * p.damageMult),
        color: '#fde047',
        glowColor: '#f97316',
        life: 0.65,
        maxLife: 0.65,
        kind: 'pellet',
        triggeredRagdoll: i === 0,
      });
    }
  }

  private updateZoneTracker(): void {
    if (this.zones.length === 0) {
      this.currentZoneIndex = 1;
      return;
    }
    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i];
      if (this.player.x >= z.startX && this.player.x <= z.endX) {
        this.currentZoneIndex = i + 1;
        break;
      }
    }
  }

  private triggerDemonSpeech(f: Fighter, occasion: 'engage' | 'phase2' | 'ultimate'): void {
    if (!this.gameplaySettings.dialogueEnabled) return;
    const arch = f.demonArchetype ?? '';
    const lines: Record<string, { engage: string; phase2: string; ultimate: string }> = {
      rui: {
        engage: 'Will you become part of my family… or be torn apart?',
        phase2: 'Blood Demon Art: Cutting Thread Rotation!',
        ultimate: 'My Crimson Threads never snap!',
      },
      enmu: {
        engage: 'Sleep sweetly inside an endless nightmare…',
        phase2: 'Become one with the Mugen Train!',
        ultimate: 'Whispers of Forced Unconscious Sleep!',
      },
      boss_daki: {
        engage: 'An ugly Slayer dares trespass in Yoshiwara?',
        phase2: 'Eight-Layered Obi Slash!',
        ultimate: 'You will never sever my sash!',
      },
      boss_gyutaro: {
        engage: 'I envy that pretty face… let me slice it clean off!',
        phase2: 'Rotating Circular Slashes: Flying Blood Sickles!',
        ultimate: 'Die screaming in venom!',
      },
      zohakuten: {
        engage: 'Only pure villainy strikes the weak—kneel!',
        phase2: 'Infinite Wood Dragons: Soundwave Roar!',
        ultimate: 'Compress and shatter!',
      },
      boss_akaza: {
        engage: 'Become a demon, Kyojuro! Let us fight forever!',
        phase2: 'Technique Development: Compass Needle — Annihilation!',
        ultimate: 'Destructive Death: Blue Silver Chaotic Afterglow!',
      },
      akaza_awakened: {
        engage: 'My battle spirit has evolved past my head!',
        phase2: 'Chaotic Afterglow — Unbroken!',
        ultimate: 'One hundred blows at once!',
      },
      boss_doma: {
        engage: 'Let me save your sorrowful soul inside my frost…',
        phase2: 'Scattering Lotuses · Rime — Water Lily Bodhisattva!',
        ultimate: 'Breathe the crystalline mist and freeze!',
      },
      doma_final: {
        engage: 'How radiant! Taste my frozen paradise!',
        phase2: 'Crystalline Divine Child!',
        ultimate: 'Wintry Icicles — Fall like petals!',
      },
      kokushibo_demon: {
        engage: 'Show me how far you have honed the First Breath.',
        phase2: 'Moon Breathing: Calamitous Tenman Crescent Moon!',
        ultimate: 'Sixteenth Form: Moonbow — Half Moon!',
      },
      nakime: {
        engage: 'The Infinity Castle shifts at a single pluck.',
        phase2: 'Spatial Inversion!',
        ultimate: 'You are trapped inside my biwa!',
      },
      boss_muzan: {
        engage: 'You are all merely breathing dust beneath the Demon King.',
        phase2: 'Black Blood Brambles — Shockwave Whip!',
        ultimate: 'Perish under a thousand whips!',
      },
      muzan_final: {
        engage: 'Even weakened by Tamayo’s poison, none survive me!',
        phase2: 'Flesh Whip Cyclone — Shockwave Scream!',
        ultimate: 'I am an eternal calamity!',
      },
    };
    const pack = lines[arch];
    if (!pack) return;
    this.activeSpeechBubble = {
      speaker: f.name.split('·')[0].trim(),
      text: pack[occasion],
      isDemon: true,
      timer: 2.8,
      target: 'enemy',
    };
  }

  private update(dt: number): void {
    this.arena.update(dt, this.mapId, this.platforms, this.worldWidth);

    if (this.phase === 'TITLE_MENU') {
      this.player.animTime += dt;
      this.enemy.animTime += dt;
      this.updateScarf(this.player, dt);
      this.updateScarf(this.enemy, dt);
      this.cameraX = this.worldWidth * 0.5 + Math.sin(performance.now() * 0.0003) * 65;
      return;
    }

    if (this.phase === 'PAUSED') return;

    if (this.phase === 'FINISHING') {
      this.finishingTimer += dt;
      const slowDt = dt * 0.28;
      this.updateFighter(this.player, slowDt);
      this.updateFighter(this.enemy, slowDt);
      this.particles.update(slowDt);
      this.cameraZoom += (1.34 - this.cameraZoom) * Math.min(1, dt * 6);
      const midX = (this.player.x + this.enemy.x) * 0.5;
      this.cameraX += (midX - this.cameraX) * Math.min(1, dt * 7);
      if (this.finishingTimer >= this.finishingDuration) {
        this.finalizeMatchVictory();
      }
      this.hudEmitAccum += dt;
      if (this.hudEmitAccum >= 0.05) {
        this.hudEmitAccum = 0;
        this.emitHudSnapshot();
      }
      return;
    }

    if (this.activeSpeechBubble) {
      this.activeSpeechBubble.timer -= dt;
      if (this.activeSpeechBubble.timer <= 0) this.activeSpeechBubble = null;
    }

    this.waterSplashTimer = Math.max(0, this.waterSplashTimer - dt);
    this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 52);
    if (this.actionWarningTimer > 0) {
      this.actionWarningTimer -= dt;
      if (this.actionWarningTimer <= 0) this.actionWarning = null;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.particles.update(dt * 0.25);
      return;
    }

    if (this.phase === 'PLAYING') {
      this.matchTime += dt;
      this.updatePlayerController(dt);
      this.updateZoneTracker();

      if (this.mode === 'TUTORIAL') {
        this.updateTutorialLogic(dt);
      } else if (this.mode === 'SURVIVAL' && this.survivalNextWavePending) {
        this.survivalCountdown = Math.max(0, this.survivalCountdown - dt);
        if (this.survivalCountdown <= 0) {
          this.advanceToNextSurvivalWave();
        }
      } else {
        // Engage zone demon once player approaches within sight/combat distance
        const distToEnemy = Math.abs(this.player.x - this.enemy.x);
        if (!this.enemyEngaged && (distToEnemy <= 920 || this.enemy.hp < this.enemy.maxHp)) {
          this.enemyEngaged = true;
          if (this.isCurrentBossBattle) {
            this.sound.playBossEntrance();
            this.triggerDemonSpeech(this.enemy, 'engage');
          } else {
            this.sound.playDemonRoar();
          }
          this.particles.spawnFloatingText(
            this.enemy.x,
            this.enemy.y - 135,
            `${this.enemy.name.split('·')[0].trim()} ENGAGED!`,
            '#fb7185',
            1.2
          );
        }

        // Boss Phase II dialogue speech trigger
        const eHpPct = this.enemy.maxHp > 0 ? this.enemy.hp / this.enemy.maxHp : 0;
        if (this.lastEnemySpeechHpPct > 0.5 && eHpPct <= 0.5 && eHpPct > 0) {
          this.lastEnemySpeechHpPct = eHpPct;
          this.triggerDemonSpeech(this.enemy, 'phase2');
        }

        // Doma Freezing Floor hazard when fighting Doma idle on ground
        const isDomaBattle =
          this.enemy.hp > 0 &&
          (this.enemy.demonArchetype === 'boss_doma' || this.enemy.demonArchetype === 'doma_final');
        if (isDomaBattle && this.enemyEngaged && this.player.grounded && Math.abs(this.player.vx) < 25) {
          this.domaFrostStallTimer += dt;
          if (this.domaFrostStallTimer >= 2.2) {
            this.domaFrostStallTimer = 0;
            this.player.chillTimer = Math.max(this.player.chillTimer, 1.8);
            this.particles.spawnFloatingText(this.player.x, this.player.y - 110, 'FROZEN GROUND!', '#bae6fd', 0.85);
          }
        } else {
          this.domaFrostStallTimer = Math.max(0, this.domaFrostStallTimer - dt * 2);
        }

        const targets = [this.player, ...this.allies];
        const bdaSpawn = this.enemyAI.update(
          this.enemy,
          targets,
          dt,
          this.sound,
          this.particles,
          this.cloneEnemy === null,
          this.enemyEngaged,
          this.obstacles,
          this.platforms
        );
        this.handleBdaSpawn(this.enemy, bdaSpawn);

        if (this.partnerEnemy) {
          const pBda = this.partnerAI.update(
            this.partnerEnemy,
            targets,
            dt,
            this.sound,
            this.particles,
            false,
            this.enemyEngaged,
            this.obstacles,
            this.platforms
          );
          this.handleBdaSpawn(this.partnerEnemy, pBda);
        }

        if (this.cloneEnemy) {
          if (this.cloneEnemy.hp <= 0 && this.cloneEnemy.state === 'DEFEATED') {
            this.cloneEnemy = null;
          } else {
            const cloneBda = this.cloneAI.update(
              this.cloneEnemy,
              targets,
              dt,
              this.sound,
              this.particles,
              false,
              true,
              this.obstacles,
              this.platforms
            );
            this.handleBdaSpawn(this.cloneEnemy, cloneBda);
          }
        }

        const activeEnemies = [
          this.enemy,
          ...(this.partnerEnemy ? [this.partnerEnemy] : []),
          ...(this.cloneEnemy ? [this.cloneEnemy] : []),
        ];
        this.allies.forEach((ally, idx) => {
          this.allyAIs[idx]?.update(
            ally,
            activeEnemies,
            this.player,
            idx,
            dt,
            this.sound,
            this.particles,
            this.enemyEngaged
          );
        });
      }
    }

    this.updateFighter(this.player, dt);
    this.updateFighter(this.enemy, dt);
    if (this.partnerEnemy) this.updateFighter(this.partnerEnemy, dt);
    if (this.cloneEnemy) this.updateFighter(this.cloneEnemy, dt);
    for (const ally of this.allies) {
      this.updateFighter(ally, dt);
    }

    if (this.phase === 'PLAYING') {
      this.preventBodyOverlap();
      this.resolveAllCombat();
      this.updateProjectiles(dt);
      if (this.mode !== 'TUTORIAL' && !this.survivalNextWavePending) {
        this.checkWaveOrMatchOutcome();
      }
    }

    this.particles.update(dt);
    this.updateCamera(dt);

    this.input.jumpPressed = false;
    this.input.lightPressed = false;
    this.input.heavyPressed = false;
    this.input.dodgePressed = false;
    this.input.awakeningPressed = false;
    this.input.ultimatePressed = false;
    this.input.formPressed = 0;

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.05) {
      this.hudEmitAccum = 0;
      this.emitHudSnapshot();
    }
  }

  private handleBdaSpawn(source: Fighter, bdaSpawn: ReturnType<EnemyAI['update']>): void {
    if (!bdaSpawn) return;
    const rightBound = this.worldWidth - ARENA_LEFT;
    if (bdaSpawn.triggerRoomShift) {
      this.arena.triggerNakimeShift();
      this.shakeIntensity = Math.max(this.shakeIntensity, 7);
    }
    if (typeof bdaSpawn.teleportToX === 'number') {
      source.x = Math.max(ARENA_LEFT + 60, Math.min(rightBound - 60, bdaSpawn.teleportToX));
      this.particles.spawnDust(source.x, source.y, 8, 0);
    }
    if (bdaSpawn.projectiles && bdaSpawn.projectiles.length > 0) {
      for (const pSpec of bdaSpawn.projectiles) {
        this.projectiles.push({ id: this.nextProjectileId++, ...pSpec });
      }
    } else if (bdaSpawn.projectile) {
      this.projectiles.push({ id: this.nextProjectileId++, ...bdaSpawn.projectile });
    }
    if (bdaSpawn.spawnCloneArchetype && !this.cloneEnemy) {
      const cloneTpl = DEMON_TEMPLATES[bdaSpawn.spawnCloneArchetype];
      this.cloneEnemy = createDemonFighter(
        {
          archetype: bdaSpawn.spawnCloneArchetype,
          name: cloneTpl.displayName,
          subtitle: cloneTpl.rankLabel,
          hpScale: 0.65,
        },
        99,
        Math.max(ARENA_LEFT + 80, Math.min(rightBound - 80, source.x - source.facing * 120))
      );
      this.cloneAI.reset();
    }
  }

  private getComboSpec(step: number): AttackSpec {
    switch (step) {
      case 0:
        return BASE_ATTACK_SPECS.LIGHT_1;
      case 1:
        return BASE_ATTACK_SPECS.LIGHT_2;
      case 2:
        return BASE_ATTACK_SPECS.LIGHT_3;
      case 3:
        return BASE_ATTACK_SPECS.LIGHT_4;
      default:
        return BASE_ATTACK_SPECS.DOUBLE_SLASH;
    }
  }

  private updatePlayerController(dt: number): void {
    const p = this.player;

    p.energy = Math.min(p.maxEnergy, p.energy + p.energyRegen * dt);

    // Check Exploration Cache pickups along the map
    for (const c of this.exploreCaches) {
      if (c.collected) continue;
      if (Math.abs(p.x - c.x) <= 52 && Math.abs(p.y - c.y) <= 78) {
        c.collected = true;
        if (!this.collectedCacheIdsThisRun.has(c.id)) {
          this.collectedCacheIdsThisRun.add(c.id);
          this.coinsEarnedThisRun += c.coins;
          this.callbacks.onExploreCachePickup?.(c.id, c.coins);
        }
        if (c.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + c.hp);
        }
        if (c.energy > 0) {
          p.energy = Math.min(p.maxEnergy, p.energy + c.energy);
        }
        if (c.kind === 'wisteria_cache') {
          p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.12));
        } else if (c.kind === 'spirit_shrine') {
          p.awakeningMeter = Math.min(100, p.awakeningMeter + 22);
        }
        this.sound.playExplorePickup();
        this.particles.spawnFloatingText(
          c.x,
          c.y - 68,
          `+${c.coins} COINS!`,
          c.kind === 'wisteria_cache' ? '#c084fc' : c.kind === 'spirit_shrine' ? '#38bdf8' : '#fbbf24',
          1.15
        );
      }
    }

    // Handle Sun Breathing 13th Form continuous multi-slash loop
    if (this.sunComboTicksRemaining > 0) {
      this.sunComboTickTimer -= dt;
      if (this.sunComboTickTimer <= 0) {
        this.sunComboTickTimer = 0.24;
        this.sunComboTicksRemaining -= 1;
        this.sunComboIdx += 1;
        const cycleStyle: BreathingStyleId[] = ['sun', 'flame', 'water', 'thunder', 'wind'];
        const visualStyle = cycleStyle[this.sunComboIdx % cycleStyle.length];
        p.attackSwingId += 1;
        p.hitTargetsThisSwing.clear();
        p.secondHitFired = false;
        p.vx = p.facing * 260;
        this.sound.playBreathingStyle(visualStyle, (this.sunComboIdx % 5) + 1);
        this.particles.spawnBreathingEffect(
          visualStyle,
          (this.sunComboIdx % 5) + 1,
          'dragon_finisher',
          p.x,
          p.y,
          p.facing,
          175
        );
      }
    }

    if (p.hp <= 0 || p.state === 'RAGDOLL' || p.state === 'GETTING_UP' || p.state === 'DEFEATED') {
      return;
    }

    if (p.state === 'LIGHT_ATTACK' && this.input.lightPressed && p.comboStep < 4) {
      p.queuedNextCombo = true;
    }

    const canAct =
      p.state === 'IDLE' ||
      p.state === 'WALK' ||
      p.state === 'RUN' ||
      p.state === 'JUMP' ||
      p.state === 'FALL' ||
      p.state === 'BLOCK';

    // Awakening activation
    if (this.input.awakeningPressed && (canAct || p.state === 'LIGHT_ATTACK')) {
      if (p.awakeningActive) {
        this.showWarning('Awakening already active!');
      } else if (p.awakeningCooldown > 0.1) {
        this.showWarning(`Awakening recharging (${p.awakeningCooldown.toFixed(1)}s)`);
      } else if (p.awakeningMeter < 100) {
        this.showWarning(`Awakening at ${Math.round(p.awakeningMeter)}% (need 100%)`);
      } else {
        const tier = p.awakeningTier ?? 'mark';
        const spec = AWAKENING_SPECS[tier];
        p.awakeningTier = tier;
        p.awakeningActive = true;
        p.awakeningTimer = spec.duration;
        p.awakeningMeter = 0;
        p.invulnTimer = Math.max(p.invulnTimer, 0.55);
        this.sound.playAwakening();
        this.particles.spawnAwakeningBurst(p.x, p.y, spec.badgeColor);
        this.particles.spawnFloatingText(p.x, p.y - 135, `${spec.name.toUpperCase()}!`, spec.badgeColor, 1.3);
        this.shakeIntensity = Math.max(this.shakeIntensity, 9);
      }
    }

    // Special Ultimate Attack activation
    if (this.input.ultimatePressed && (canAct || p.state === 'LIGHT_ATTACK' || p.state === 'RUNNING_ATTACK')) {
      const ultId = p.equippedUltimate ?? 'eternal_sun';
      const ultDef = ULTIMATE_SPECS[ultId];
      if (p.ultimateCooldown > 0.1) {
        this.showWarning(`Ultimate ready in ${p.ultimateCooldown.toFixed(1)}s`);
      } else if (p.energy < ultDef.energyCost) {
        this.showWarning(`Need ${ultDef.energyCost}% Energy for Ultimate`);
      } else {
        const spec = buildUltimateAttackSpec(ultId, p.breathingStyle, p.damageMult);
        p.energy -= ultDef.energyCost;
        p.ultimateCooldown = ultDef.cooldown;
        p.currentAttack = spec;
        this.beginStateTransition(p, 'BREATHING_FORM', 0.05);
        p.stateTimer = 0;
        p.attackSwingId += 1;
        p.hitTargetsThisSwing.clear();
        p.secondHitFired = false;
        p.invulnTimer = 0.72;
        p.vx = p.facing * spec.forwardImpulse;
        if (spec.verticalImpulse) {
          p.vy = spec.verticalImpulse;
          p.grounded = false;
        }
        this.sound.playUltimate(ultId);
        this.particles.spawnUltimateBurst(p.x, p.y, ultDef.color, ultDef.secondaryColor);
        this.particles.spawnFloatingText(p.x, p.y - 135, ultDef.name.toUpperCase(), ultDef.color, 1.35);
        this.shakeIntensity = Math.max(this.shakeIntensity, 14);
        if (this.gameplaySettings.dialogueEnabled) {
          this.activeSpeechBubble = {
            speaker: p.name.split(' ')[0],
            text: `${ultDef.name}!`,
            isDemon: false,
            timer: 2.0,
            target: 'player',
          };
        }
        return;
      }
    }

    if (this.input.formPressed > 0 && (canAct || p.state === 'LIGHT_ATTACK' || p.state === 'RUNNING_ATTACK')) {
      const styleDef = BREATHING_STYLES[p.breathingStyle];
      const idx = Math.max(1, Math.min(styleDef.forms.length, this.input.formPressed));
      const formDef = styleDef.forms[idx - 1];
      if (formDef.isUnknown) {
        this.showWarning(`${formDef.name}: Canon form unknown (sealed)`);
        return;
      }
      const cost = getFormEnergyCost(idx, styleDef.forms.length);
      const cd = p.formCooldowns[idx - 1] ?? 0;

      if (cd > 0.05) {
        this.showWarning(`Form ${idx} cooling down (${cd.toFixed(1)}s)`);
      } else if (p.energy < cost) {
        this.showWarning(`Need ${cost}% Breathing Energy`);
      } else {
        const spec = buildBreathingAttackSpec(p.breathingStyle, idx, p.damageMult);
        p.energy -= cost;
        p.formCooldowns[idx - 1] = formDef.cooldown;
        p.currentAttack = spec;
        this.beginStateTransition(p, 'BREATHING_FORM', 0.06);
        p.stateTimer = 0;
        p.attackSwingId += 1;
        p.hitTargetsThisSwing.clear();
        p.secondHitFired = false;
        p.invulnTimer = 0.24;
        p.vx = p.facing * spec.forwardImpulse;
        if (spec.verticalImpulse) {
          p.vy = spec.verticalImpulse;
          p.grounded = false;
        }
        if (formDef.isSun13thCombo) {
          this.sunComboTicksRemaining = 4;
          this.sunComboTickTimer = 0.22;
          this.sunComboIdx = 0;
        }
        this.sound.playBreathingStyle(p.breathingStyle, idx);
        this.particles.spawnBreathingEffect(
          p.breathingStyle,
          idx,
          spec.motionPattern ?? 'forward_surge',
          p.x,
          p.y,
          p.facing,
          spec.range
        );
        this.particles.spawnFloatingText(
          p.x,
          p.y - 115,
          formDef.name.split(':')[1]?.trim() ?? formDef.name,
          styleDef.primaryColor,
          0.95
        );
        this.shakeIntensity = Math.max(this.shakeIntensity, 5 + Math.min(idx, 5) * 1.4);
        return;
      }
    }

    if (this.input.dodgePressed && p.dodgeCooldown <= 0 && canAct) {
      const moveDir =
        this.input.left && !this.input.right ? -1 : this.input.right && !this.input.left ? 1 : p.facing;
      p.facing = moveDir;
      this.beginStateTransition(p, 'DODGE', 0.05);
      p.stateTimer = 0;
      p.vx = moveDir * DODGE_SPEED * p.speedMult;
      p.dodgeCooldown = DODGE_COOLDOWN;
      p.invulnTimer = DODGE_DURATION;
      p.currentAttack = null;
      this.sound.playDodge();
      if (p.grounded && this.isInWaterZone(p.x)) {
        this.particles.spawnWaterSplash(p.x, p.y, 7);
      } else {
        this.particles.spawnDust(p.x, p.y, 6, -moveDir);
      }
      if (this.mode === 'TUTORIAL' && this.tutorialStep === 7) {
        this.tutDodges += 1;
      }
      return;
    }

    if (!canAct) return;

    if (this.input.block && p.grounded) {
      if (p.state !== 'BLOCK') {
        this.beginStateTransition(p, 'BLOCK', 0.05);
        p.stateTimer = 0;
      }
      p.vx *= 0.72;
      p.facing = this.enemy.x >= p.x ? 1 : -1;
      return;
    }

    if ((this.input.lightPressed || this.input.heavyPressed) && p.counterWindowTimer > 0 && p.grounded) {
      p.counterWindowTimer = 0;
      p.currentAttack = BASE_ATTACK_SPECS.COUNTER;
      this.beginStateTransition(p, 'COUNTER_ATTACK', 0.04);
      p.stateTimer = 0;
      p.attackSwingId += 1;
      p.hitTargetsThisSwing.clear();
      p.secondHitFired = false;
      p.vx = p.facing * BASE_ATTACK_SPECS.COUNTER.forwardImpulse;
      this.sound.playSwordSlash(true, 4);
      this.spawnFighterMeleeArc(p, BASE_ATTACK_SPECS.COUNTER);
      this.particles.spawnFloatingText(p.x, p.y - 110, 'COUNTER!', '#fde047', 1.1);
      return;
    }

    if (this.input.heavyPressed && p.grounded) {
      if (p.heavyCooldown > 0.05) {
        this.showWarning(`Heavy Attack ready in ${p.heavyCooldown.toFixed(1)}s`);
      } else {
        p.heavyCooldown = p.maxHeavyCooldown;
        p.currentAttack = BASE_ATTACK_SPECS.HEAVY;
        this.beginStateTransition(p, 'HEAVY_ATTACK', 0.06);
        p.stateTimer = 0;
        p.attackSwingId += 1;
        p.hitTargetsThisSwing.clear();
        p.secondHitFired = false;
        p.vx = p.facing * BASE_ATTACK_SPECS.HEAVY.forwardImpulse;
        this.sound.playSwordSlash(true, 2);
        this.spawnFighterMeleeArc(p, BASE_ATTACK_SPECS.HEAVY);
        if (p.visual.weapon === 'shotgun_katana') {
          this.spawnShotgunPellets(p);
        }
        return;
      }
    }

    if (this.input.lightPressed) {
      if (!p.grounded) {
        p.currentAttack = BASE_ATTACK_SPECS.JUMP;
        this.beginStateTransition(p, 'JUMP_ATTACK', 0.05);
        p.stateTimer = 0;
        p.attackSwingId += 1;
        p.hitTargetsThisSwing.clear();
        p.secondHitFired = false;
        this.sound.playSwordSlash(false, 1);
        this.spawnFighterMeleeArc(p, BASE_ATTACK_SPECS.JUMP);
      } else if (p.state === 'RUN' && Math.abs(p.vx) > PLAYER_WALK_SPEED * p.speedMult + 15) {
        p.currentAttack = BASE_ATTACK_SPECS.RUNNING_SLASH;
        this.beginStateTransition(p, 'RUNNING_ATTACK', 0.05);
        p.stateTimer = 0;
        p.attackSwingId += 1;
        p.hitTargetsThisSwing.clear();
        p.secondHitFired = false;
        p.vx = p.facing * BASE_ATTACK_SPECS.RUNNING_SLASH.forwardImpulse;
        p.comboStep = 1;
        p.comboResetTimer = 0.85;
        this.sound.playSwordSlash(true, 0);
        this.spawnFighterMeleeArc(p, BASE_ATTACK_SPECS.RUNNING_SLASH);
      } else {
        const comboIdx = p.comboStep;
        const comboSpec = this.getComboSpec(comboIdx);
        p.currentAttack = comboSpec;
        this.beginStateTransition(p, 'LIGHT_ATTACK', 0.05);
        p.stateTimer = 0;
        p.attackSwingId += 1;
        p.hitTargetsThisSwing.clear();
        p.secondHitFired = false;
        p.vx = p.facing * comboSpec.forwardImpulse;
        p.comboStep = (p.comboStep + 1) % 5;
        p.comboResetTimer = 0.85;
        this.sound.playSwordSlash(comboSpec.kind === 'DOUBLE_SLASH', comboIdx);
        this.spawnFighterMeleeArc(p, comboSpec);
      }
      return;
    }

    // Horizontal Footwork (slightly faster traversal sprint when exploring between zones)
    const moveDir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    if (moveDir !== 0) {
      p.facing = moveDir as 1 | -1;
      this.runHoldTime += dt;
      const chillMult = p.chillTimer > 0 ? 0.68 : 1.0;
      const exploreBoost = !this.enemyEngaged && this.runHoldTime > 0.35 ? 1.18 : 1.0;
      const targetSpeed =
        (this.runHoldTime > 0.2 ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED) *
        p.speedMult *
        chillMult *
        exploreBoost;
      p.vx = moveDir * targetSpeed;

      if (this.mode === 'TUTORIAL' && this.tutorialStep === 3) {
        if (moveDir < 0) this.tutMovedLeft = true;
        if (moveDir > 0) this.tutMovedRight = true;
      }
    } else {
      this.runHoldTime = 0;
      p.vx *= p.grounded ? 0.65 : 0.94;
      if (Math.abs(p.vx) < 8) p.vx = 0;
    }

    if (p.jumpBufferTimer > 0 && (p.grounded || p.coyoteTimer > 0)) {
      p.vy = PLAYER_JUMP_VELOCITY;
      p.grounded = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      this.beginStateTransition(p, 'JUMP', 0.06);
      this.sound.playJump();
      if (this.isInWaterZone(p.x)) {
        this.particles.spawnWaterSplash(p.x, p.y, 6);
      } else {
        this.particles.spawnDust(p.x, p.y, 5, 0);
      }
      if (this.mode === 'TUTORIAL' && this.tutorialStep === 4) {
        this.tutJumps += 1;
      }
    }

    if (p.grounded) {
      if (Math.abs(p.vx) > PLAYER_WALK_SPEED * p.speedMult + 20) {
        this.beginStateTransition(p, 'RUN', 0.08);
        this.footstepAccum += dt;
        if (this.footstepAccum >= 0.24) {
          this.footstepAccum = 0;
          this.sound.playFootstep();
          if (this.isInWaterZone(p.x) && this.waterSplashTimer <= 0) {
            this.waterSplashTimer = 0.16;
            this.particles.spawnWaterSplash(p.x, p.y, 4);
          }
        }
      } else if (Math.abs(p.vx) > 20) {
        this.beginStateTransition(p, 'WALK', 0.08);
        this.footstepAccum += dt;
        if (this.footstepAccum >= 0.36) {
          this.footstepAccum = 0;
          this.sound.playFootstep();
          if (this.isInWaterZone(p.x) && this.waterSplashTimer <= 0) {
            this.waterSplashTimer = 0.22;
            this.particles.spawnWaterSplash(p.x, p.y, 3);
          }
        }
      } else {
        this.beginStateTransition(p, 'IDLE', 0.09);
      }
    } else {
      this.beginStateTransition(p, p.vy < 0 ? 'JUMP' : 'FALL', 0.08);
    }
  }

  private isInWaterZone(x: number): boolean {
    for (const wz of this.waterZones) {
      if (x >= wz.x && x <= wz.x + wz.w) return true;
    }
    return false;
  }

  private spawnFighterMeleeArc(f: Fighter, spec: AttackSpec): void {
    const isSlayer = f.role === 'player' || f.role === 'ally';
    const color = isSlayer
      ? BREATHING_STYLES[f.breathingStyle].primaryColor
      : f.demonArchetype
        ? DEMON_TEMPLATES[f.demonArchetype].bdaColor
        : '#fb7185';
    const heavy = spec.triggersRagdoll || spec.kind === 'HEAVY' || spec.kind === 'COUNTER';
    const tech = spec.technique;
    let startA = -1.25;
    let endA = 0.72;
    if (tech === 'diagonal_upward' || tech === 'counter_slash') {
      startA = 0.95;
      endA = -1.35;
    } else if (tech === 'horizontal_slash' || tech === 'running_slash') {
      startA = -0.58;
      endA = 0.35;
    } else if (tech === 'heavy_overhead' || tech === 'vertical_downward') {
      startA = -1.85;
      endA = 0.85;
    }
    this.particles.spawnMeleeArc(
      f.x + f.facing * 12,
      f.y - 54 * f.visual.scale,
      f.facing,
      startA,
      endA,
      Math.max(48, spec.range * 0.72),
      color,
      heavy
    );
  }

  private showWarning(msg: string): void {
    this.actionWarning = msg;
    this.actionWarningTimer = 1.4;
  }

  private updateTutorialLogic(dt: number): void {
    const p = this.player;
    const mentor = this.enemy;
    mentor.facing = p.x >= mentor.x ? 1 : -1;
    mentor.hp = mentor.maxHp;

    if (this.tutorialStep === 1 && this.matchTime > 1.8) {
      this.tutorialStep = 2;
      this.emitHudSnapshot();
    } else if (this.tutorialStep === 2 && Math.abs(p.x - mentor.x) < 160) {
      this.tutorialStep = 3;
      this.emitHudSnapshot();
    } else if (this.tutorialStep === 3 && this.tutMovedLeft && this.tutMovedRight) {
      this.tutorialStep = 4;
      this.emitHudSnapshot();
    } else if (this.tutorialStep === 4 && this.tutJumps >= 2) {
      this.tutorialStep = 5;
      this.emitHudSnapshot();
    } else if (this.tutorialStep === 5 && this.tutSlashes >= 3) {
      this.tutorialStep = 6;
      this.tutMentorAttackTimer = 0.8;
      this.emitHudSnapshot();
    } else if (this.tutorialStep === 6) {
      if (mentor.state === 'IDLE' || mentor.state === 'WALK') {
        const dist = Math.abs(p.x - mentor.x);
        if (dist > 105) {
          mentor.vx = mentor.facing * 170;
          mentor.state = 'WALK';
        } else {
          mentor.vx = 0;
          this.tutMentorAttackTimer -= dt;
          if (this.tutMentorAttackTimer <= 0) {
            mentor.currentAttack = {
              kind: 'LIGHT_1',
              technique: 'horizontal_slash',
              damage: 6,
              startup: 0.36,
              active: 0.14,
              recovery: 0.3,
              knockbackX: 160,
              knockbackY: -60,
              triggersRagdoll: false,
              hitstop: 0.03,
              range: 112,
              reachY: 90,
              forwardImpulse: 120,
            };
            mentor.state = 'ATTACK_WINDUP';
            mentor.stateTimer = 0;
            mentor.attackSwingId += 1;
            mentor.hitTargetsThisSwing.clear();
            this.tutMentorAttackTimer = 1.5;
            this.sound.playDemonTelegraph();
          }
        }
      }
      if (this.tutBlocks >= 2) {
        this.tutorialStep = 7;
        mentor.vx = 0;
        mentor.state = 'IDLE';
        this.emitHudSnapshot();
      }
    } else if (this.tutorialStep === 7 && this.tutDodges >= 2) {
      this.tutorialStep = 8;
      this.emitHudSnapshot();
    } else if (this.tutorialStep === 8 && p.energy >= 40) {
      this.tutorialStep = 9;
      this.emitHudSnapshot();
    } else if (this.tutorialStep === 9 && p.state === 'BREATHING_FORM') {
      this.tutorialStep = 10;
      this.emitHudSnapshot();
    } else if (this.tutorialStep === 10) {
      const hitbox = getActiveAttackHitbox(p);
      if (hitbox && this.rockHp > 0 && this.rockLastSwingId !== p.attackSwingId) {
        const rockBox = {
          x: this.rockX - 62,
          y: GROUND_Y - 108,
          w: 124,
          h: 108,
        };
        if (rectsOverlap(hitbox, rockBox)) {
          this.rockLastSwingId = p.attackSwingId;
          const isStrong =
            p.state === 'HEAVY_ATTACK' ||
            p.state === 'BREATHING_FORM' ||
            p.state === 'COUNTER_ATTACK';

          if (!isStrong) {
            this.rockHp = Math.max(1, this.rockHp - 5);
            this.particles.spawnParrySparks(this.rockX - 30, GROUND_Y - 60, false);
            this.particles.spawnFloatingText(
              this.rockX,
              GROUND_Y - 125,
              'USE HEAVY OR BREATHING!',
              '#fde047',
              0.95
            );
            this.sound.playParry();
          } else {
            const dmg = p.state === 'BREATHING_FORM' ? 85 : 55;
            this.rockHp = Math.max(0, this.rockHp - dmg);
            this.hitstopTimer = 0.065;
            this.shakeIntensity = 12;
            const split = this.rockHp <= 0;
            this.particles.spawnRockShards(this.rockX, GROUND_Y, split);
            this.sound.playRockCrack(split);
            this.particles.spawnFloatingText(
              this.rockX,
              GROUND_Y - 130,
              split ? 'BOULDER SPLIT!' : `CRACK -${dmg}`,
              split ? '#38bdf8' : '#fbbf24',
              split ? 1.35 : 1.05
            );

            if (split) {
              this.phase = 'VICTORY';
              this.coinsEarnedThisRun = 80;
              this.lastRank = 'S';
              this.sound.playVictory();
              this.callbacks.onTutorialComplete?.();
              this.emitHudSnapshot();
            }
          }
        }
      }
    }
  }

  private updateFighter(f: Fighter, dt: number): void {
    const rightBound = this.worldWidth - ARENA_LEFT;
    const isAttacking =
      f.state === 'LIGHT_ATTACK' ||
      f.state === 'HEAVY_ATTACK' ||
      f.state === 'JUMP_ATTACK' ||
      f.state === 'RUNNING_ATTACK' ||
      f.state === 'COUNTER_ATTACK' ||
      f.state === 'BREATHING_FORM';

    const stateDt = isAttacking ? dt * (f.attackSpeedMult || 1) : dt;

    f.animTime += dt;
    f.stateTimer += stateDt;
    f.blendTimer += dt;
    f.heavyCooldown = Math.max(0, f.heavyCooldown - dt);
    f.dodgeCooldown = Math.max(0, f.dodgeCooldown - dt);
    f.invulnTimer = Math.max(0, f.invulnTimer - dt);
    f.counterWindowTimer = Math.max(0, f.counterWindowTimer - dt);
    f.hitFlashTimer = Math.max(0, f.hitFlashTimer - dt);
    f.parryFlashTimer = Math.max(0, f.parryFlashTimer - dt);
    f.jumpBufferTimer = Math.max(0, f.jumpBufferTimer - dt);
    f.displayHp += (f.hp - f.displayHp) * Math.min(1, dt * 8);

    f.formCooldowns = f.formCooldowns.map((cd) => Math.max(0, cd - dt));

    f.awakeningCooldown = Math.max(0, f.awakeningCooldown - dt);
    f.ultimateCooldown = Math.max(0, f.ultimateCooldown - dt);
    f.redBladeBurnTimer = Math.max(0, f.redBladeBurnTimer - dt);
    if (f.consecutiveHitTimer > 0) {
      f.consecutiveHitTimer = Math.max(0, f.consecutiveHitTimer - dt);
      if (f.consecutiveHitTimer <= 0) f.consecutiveHitsTaken = 0;
    }

    if (f.awakeningActive) {
      f.awakeningTimer -= dt;
      if (f.awakeningTimer <= 0) {
        f.awakeningActive = false;
        f.awakeningTimer = 0;
        f.awakeningCooldown = 6;
      } else if (f.awakeningTier === 'transcendent' && f.hp > 0) {
        f.hp = Math.min(f.maxHp, f.hp + 2.5 * dt);
        f.energy = Math.min(f.maxEnergy, f.energy + 6 * dt);
      }
    } else if (f.role === 'player') {
      f.awakeningMeter = Math.min(100, f.awakeningMeter + dt * 2.2);
    }

    if (f.poisonTimer > 0 && f.hp > 0) {
      f.poisonTimer -= dt;
      f.hp = Math.max(1, f.hp - f.poisonDps * dt);
    }

    if (f.redBladeBurnTimer > 0 && f.hp > 0) {
      f.hp = Math.max(1, f.hp - 4.2 * dt);
    }

    if (f.chillTimer > 0) {
      f.chillTimer = Math.max(0, f.chillTimer - dt);
    }

    if (f.role === 'ally') {
      f.energy = Math.min(f.maxEnergy, f.energy + f.energyRegen * dt);
    }

    if (f.comboResetTimer > 0) {
      f.comboResetTimer -= dt;
      if (f.comboResetTimer <= 0) f.comboStep = 0;
    }

    if (f.state === 'RAGDOLL' || f.state === 'DEFEATED') {
      const res = stepRagdoll(f, dt, ARENA_LEFT, rightBound, this.platforms);
      if (res.impactedGround) {
        this.sound.playRagdollThump();
        if (f.y >= GROUND_Y - 4 && this.isInWaterZone(f.x)) {
          this.particles.spawnWaterSplash(f.x, GROUND_Y, 8);
        } else {
          this.particles.spawnDust(f.x, f.y, 6, 0);
        }
      }
      if (res.readyToRecover && f.hp > 0) {
        f.recoveryStartPose = ragdollToJointPose(f);
        f.ragdoll.active = false;
        f.state = 'GETTING_UP';
        f.stateTimer = 0;
        f.invulnTimer = 0.45;
        f.facing =
          f.role === 'demon'
            ? this.player.x >= f.x
              ? 1
              : -1
            : this.enemy.x >= f.x
              ? 1
              : -1;
      }
      this.updateScarf(f, dt);
      return;
    }

    if (f.state === 'GETTING_UP') {
      f.vx = 0;
      if (f.stateTimer >= f.recoveryDuration) {
        f.recoveryStartPose = null;
        this.beginStateTransition(f, 'IDLE', 0.08);
        f.stateTimer = 0;
      }
      this.updateScarf(f, dt);
      return;
    }

    if (f.state === 'DODGE') {
      if (f.stateTimer >= DODGE_DURATION) {
        f.vx *= 0.4;
        this.beginStateTransition(f, f.grounded ? 'IDLE' : 'FALL', 0.07);
        f.stateTimer = 0;
      }
    } else if (f.state === 'HURT') {
      f.vx *= Math.pow(0.88, dt * 60);
      if (f.stateTimer >= 0.22) {
        this.beginStateTransition(f, f.grounded ? 'IDLE' : 'FALL', 0.07);
        f.stateTimer = 0;
      }
    } else if (f.state === 'ATTACK_WINDUP' || f.state === 'BDA_CAST') {
      const spec = f.currentAttack;
      f.vx *= 0.8;
      if (spec && f.stateTimer >= spec.startup) {
        this.beginStateTransition(f, spec.triggersRagdoll ? 'HEAVY_ATTACK' : 'LIGHT_ATTACK', 0.05);
        f.vx = f.facing * spec.forwardImpulse;
        this.sound.playSwordSlash(spec.triggersRagdoll, f.comboStep);
        this.spawnFighterMeleeArc(f, spec);
      }
    } else if (isAttacking) {
      const spec = f.currentAttack;
      const pose = evaluateFighterPose(f);
      const seg = getWeaponSegmentWorld(pose, f.visual.weapon, f.visual.scale);

      if (spec && f.stateTimer >= spec.startup && f.stateTimer <= spec.startup + spec.active) {
        const isBreathing = f.state === 'BREATHING_FORM';
        const styleDef = isBreathing ? BREATHING_STYLES[f.breathingStyle] : null;
        this.particles.addTrailPoint({
          x: seg.end.x,
          y: seg.end.y,
          vx: isBreathing ? f.facing * 28 : 0,
          vy: isBreathing ? -10 : 0,
          life: isBreathing ? 0.24 : 0.14,
          maxLife: isBreathing ? 0.24 : 0.14,
          width: isBreathing ? 22 : f.state === 'HEAVY_ATTACK' ? 14 : 9,
          color: styleDef ? styleDef.primaryColor : f.role === 'demon' ? '#fb7185' : '#e0f2fe',
          secondaryColor: styleDef?.secondaryColor,
          style: f.breathingStyle,
        });
      }

      if (f.grounded && f.state !== 'BREATHING_FORM' && f.state !== 'RUNNING_ATTACK') {
        f.vx *= Math.pow(0.84, dt * 60);
      } else if (
        (f.state === 'BREATHING_FORM' || f.state === 'RUNNING_ATTACK') &&
        spec &&
        f.stateTimer > spec.startup + spec.active
      ) {
        f.vx *= Math.pow(0.76, dt * 60);
      }

      const totalDur = spec ? spec.startup + spec.active + spec.recovery : 0.35;
      if (f.stateTimer >= totalDur) {
        if (f.queuedNextCombo && f.role === 'player' && f.grounded) {
          f.queuedNextCombo = false;
          const comboIdx = f.comboStep;
          const nextSpec = this.getComboSpec(comboIdx);
          f.currentAttack = nextSpec;
          this.beginStateTransition(f, 'LIGHT_ATTACK', 0.04);
          f.stateTimer = 0;
          f.attackSwingId += 1;
          f.hitTargetsThisSwing.clear();
          f.secondHitFired = false;
          f.vx = f.facing * nextSpec.forwardImpulse;
          pComboAdvance(f);
          this.sound.playSwordSlash(nextSpec.kind === 'DOUBLE_SLASH', comboIdx);
          this.spawnFighterMeleeArc(f, nextSpec);
        } else {
          f.queuedNextCombo = false;
          f.currentAttack = null;
          this.beginStateTransition(f, f.grounded ? 'IDLE' : 'FALL', 0.08);
          f.stateTimer = 0;
        }
      }
    }

    if (!f.grounded) {
      f.vy += GRAVITY * dt;
      f.coyoteTimer = Math.max(0, f.coyoteTimer - dt);
    } else {
      f.coyoteTimer = 0.1;
    }

    const prevX = f.x;
    const prevY = f.y;
    f.x += f.vx * dt;
    f.y += f.vy * dt;

    // Obstacle horizontal & top collision
    const halfW = f.width * 0.45;
    for (const obs of this.obstacles) {
      if (!obs.solid || obs.hp <= 0) continue;
      if (f.x + halfW > obs.x && f.x - halfW < obs.x + obs.w) {
        if (prevY <= obs.y + 8 && f.y >= obs.y && f.vy >= 0) {
          f.y = obs.y;
          f.vy = 0;
          f.grounded = true;
          if (f.state === 'JUMP' || f.state === 'FALL') {
            this.beginStateTransition(f, 'IDLE', 0.06);
          }
        } else if (f.y > obs.y + 8) {
          if (prevX <= obs.x - halfW + 4) {
            f.x = obs.x - halfW;
          } else if (prevX >= obs.x + obs.w + halfW - 4) {
            f.x = obs.x + obs.w + halfW;
          } else {
            f.x = prevX;
          }
          f.vx = 0;
        }
      }
    }

    // Elevated ArenaPlatform landing collision
    let landedOnSurface = false;
    if (f.vy >= 0) {
      for (const plat of this.platforms) {
        if (f.x + 12 >= plat.x && f.x - 12 <= plat.x + plat.w) {
          if (prevY <= plat.y + 12 && f.y >= plat.y - 2) {
            if (!f.grounded && f.vy > 240) {
              this.particles.spawnDust(f.x, plat.y, 4, 0);
            }
            f.y = plat.y;
            f.vy = 0;
            f.grounded = true;
            landedOnSurface = true;
            if (f.state === 'JUMP' || f.state === 'FALL') {
              this.beginStateTransition(f, 'IDLE', 0.06);
            }
            break;
          }
        }
      }
    }

    if (f.y >= GROUND_Y) {
      if (!f.grounded && f.vy > 260) {
        if (this.isInWaterZone(f.x)) {
          this.particles.spawnWaterSplash(f.x, GROUND_Y, 8);
        } else {
          this.particles.spawnDust(f.x, GROUND_Y, 5, 0);
        }
      }
      f.y = GROUND_Y;
      f.vy = 0;
      f.grounded = true;
      if (f.state === 'JUMP' || f.state === 'FALL') {
        this.beginStateTransition(f, 'IDLE', 0.06);
      }
    } else if (!landedOnSurface) {
      f.grounded = false;
    }

    const margin = f.width * 0.55;
    if (f.x < ARENA_LEFT + margin) {
      f.x = ARENA_LEFT + margin;
      if (f.vx < 0) f.vx = 0;
    } else if (f.x > rightBound - margin) {
      f.x = rightBound - margin;
      if (f.vx > 0) f.vx = 0;
    }

    this.updateScarf(f, dt);
  }

  private updateScarf(f: Fighter, dt: number): void {
    const pose = evaluateFighterPose(f);
    const anchorX = pose.chest.x - f.facing * 4;
    const anchorY = pose.chest.y - 6;
    f.scarfPoints[0].x = anchorX;
    f.scarfPoints[0].y = anchorY;

    const windX = -f.facing * 35 - f.vx * 0.16;
    for (let i = 1; i < f.scarfPoints.length; i++) {
      const prev = f.scarfPoints[i - 1];
      const curr = f.scarfPoints[i];
      curr.x += (windX + Math.sin(f.animTime * 7 + i) * 18) * dt;
      curr.y += (32 + Math.cos(f.animTime * 6 + i) * 14) * dt;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const d = Math.hypot(dx, dy) || 0.001;
      if (d > 9) {
        curr.x = prev.x + (dx / d) * 9;
        curr.y = prev.y + (dy / d) * 9;
      }
    }
  }

  private preventBodyOverlap(): void {
    const rightBound = this.worldWidth - ARENA_LEFT;
    const activeTargets = [this.enemy, ...(this.partnerEnemy ? [this.partnerEnemy] : [])];
    for (const b of activeTargets) {
      const a = this.player;
      if (
        a.state === 'DODGE' ||
        a.state === 'BREATHING_FORM' ||
        a.state === 'RUNNING_ATTACK' ||
        a.state === 'RAGDOLL' ||
        b.state === 'RAGDOLL' ||
        b.state === 'DEFEATED'
      ) {
        continue;
      }
      const minDist = 42;
      const dx = b.x - a.x;
      const absDx = Math.abs(dx);
      if (absDx < minDist && Math.abs(b.y - a.y) < 70) {
        const push = (minDist - absDx) * 0.5;
        const dir = dx >= 0 ? 1 : -1;
        a.x = Math.max(ARENA_LEFT + 25, a.x - dir * push);
        b.x = Math.min(rightBound - 25, b.x + dir * push);
      }
    }
  }

  private resolveAllCombat(): void {
    const enemies = [
      this.enemy,
      ...(this.partnerEnemy ? [this.partnerEnemy] : []),
      ...(this.cloneEnemy ? [this.cloneEnemy] : []),
    ];

    for (const foe of enemies) {
      if (foe.hp <= 0) continue;
      const clash = resolveSwordClash(this.player, foe, this.particles, this.sound);
      if (clash) {
        if (this.gameplaySettings.cinematicEffects) {
          this.hitstopTimer = Math.max(this.hitstopTimer, clash.hitstop);
        }
        if (this.gameplaySettings.cameraEffects) {
          this.shakeIntensity = Math.max(this.shakeIntensity, clash.shake);
        }
      }
    }

    for (const obs of this.obstacles) {
      resolveObstacleHit(this.player, obs, this.particles, this.sound);
      resolveObstacleHit(this.enemy, obs, this.particles, this.sound);
    }

    for (const foe of enemies) {
      if (foe.hp <= 0) continue;
      const pHit = resolveAttackHit(this.player, foe, this.particles, this.sound);
      if (pHit.landed) {
        if (this.gameplaySettings.cinematicEffects) {
          this.hitstopTimer = Math.max(this.hitstopTimer, pHit.hitstop);
        }
        if (this.gameplaySettings.cameraEffects) {
          this.shakeIntensity = Math.max(this.shakeIntensity, pHit.shake);
        }
        if (pHit.ragdollTriggered) this.ragdollHitsLanded += 1;
        if (this.mode === 'TUTORIAL' && this.tutorialStep === 5) {
          this.tutSlashes += 1;
        }
      }
    }

    // Allies vs all active enemies
    for (const ally of this.allies) {
      if (ally.hp <= 0) continue;
      for (const foe of enemies) {
        if (foe.hp <= 0) continue;
        const aHit = resolveAttackHit(ally, foe, this.particles, this.sound);
        if (aHit.landed && this.gameplaySettings.cameraEffects) {
          this.shakeIntensity = Math.max(this.shakeIntensity, aHit.shake * 0.45);
        }
      }
    }

    // Active enemies vs Player & Allies
    for (const foe of enemies) {
      if (foe.hp <= 0) continue;
      const dHit = resolveAttackHit(foe, this.player, this.particles, this.sound);
      if (dHit.landed || dHit.blocked) {
        if (this.gameplaySettings.cinematicEffects) {
          this.hitstopTimer = Math.max(this.hitstopTimer, dHit.hitstop);
        }
        if (this.gameplaySettings.cameraEffects) {
          this.shakeIntensity = Math.max(this.shakeIntensity, dHit.shake);
        }
        if (dHit.blocked && this.mode === 'TUTORIAL' && this.tutorialStep === 6) {
          this.tutBlocks += 1;
        }
      }
      for (const ally of this.allies) {
        if (ally.hp > 0) {
          resolveAttackHit(foe, ally, this.particles, this.sound);
        }
      }
    }
  }

  private updateProjectiles(dt: number): void {
    const rightBound = this.worldWidth - ARENA_LEFT;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      if (proj.gravityScale && proj.gravityScale > 0) {
        proj.vy += GRAVITY * proj.gravityScale * dt;
      }
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      if (proj.y > GROUND_Y - proj.radius && proj.vy > 0 && (proj.bouncesLeft ?? 0) > 0) {
        proj.y = GROUND_Y - proj.radius;
        proj.vy = -Math.abs(proj.vy) * 0.85;
        proj.bouncesLeft = (proj.bouncesLeft ?? 1) - 1;
        this.particles.spawnDust(proj.x, GROUND_Y, 4, 0);
      }

      if (proj.life <= 0 || proj.x < ARENA_LEFT - 120 || proj.x > rightBound + 120) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const projBox = {
        x: proj.x - proj.radius,
        y: proj.y - proj.radius,
        w: proj.radius * 2,
        h: proj.radius * 2,
      };

      const isPlayerProj = proj.ownerRole === 'player' || proj.ownerRole === 'ally';
      const targets = isPlayerProj
        ? [
            this.enemy,
            ...(this.partnerEnemy ? [this.partnerEnemy] : []),
            ...(this.cloneEnemy ? [this.cloneEnemy] : []),
          ]
        : [this.player, ...this.allies];

      for (const t of targets) {
        if (t.hp <= 0) continue;
        if (rectsOverlap(projBox, getFighterHurtbox(t))) {
          if (t.state === 'DODGE' || (t.invulnTimer > 0 && !isPlayerProj)) {
            continue;
          }
          const blocked = !isPlayerProj && t.state === 'BLOCK';
          const defReduction = Math.min(
            0.58,
            t.role === 'demon' && t.demonArchetype
              ? DEMON_TEMPLATES[t.demonArchetype].defense
              : t.defenseReduction ?? (t.characterId === 'genya' ? 0.12 : 0)
          );
          const dmg = blocked
            ? Math.max(2, Math.round(proj.damage * 0.2))
            : Math.max(1, Math.round(proj.damage * (1 - defReduction)));
          t.hp = Math.max(0, t.hp - dmg);
          t.damageTaken += dmg;
          t.hitFlashTimer = 0.14;
          if (blocked) {
            this.particles.spawnParrySparks(proj.x, proj.y, false);
            this.sound.playParry();
          } else {
            this.particles.spawnHitBurst(
              proj.x,
              proj.y,
              proj.vx >= 0 ? 1 : -1,
              proj.triggeredRagdoll,
              t.role === 'demon'
            );
            this.sound.playHit(proj.triggeredRagdoll);
            this.particles.spawnFloatingText(t.x, t.y - t.height - 12, `-${dmg}`, '#fde047', 0.95);
            if (proj.kind === 'blood_sickle' || (proj.poisonDps && proj.poisonDps > 0)) {
              t.poisonTimer = 3.2;
              t.poisonDps = proj.poisonDps ?? 3.5;
            }
            if (proj.chillDuration && proj.chillDuration > 0) {
              t.chillTimer = Math.max(t.chillTimer, proj.chillDuration);
            }
            if (proj.triggeredRagdoll) {
              activateRagdoll(t, evaluateFighterPose(t), Math.sign(proj.vx || 1) * 440, -280, t.hp <= 0);
            }
          }
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  private advanceToNextSurvivalWave(): void {
    this.survivalNextWavePending = false;
    this.survivalWave += 1;
    const nextSpawn = this.getSurvivalWaveSpawn(this.survivalWave);
    const spawnX = Math.min(
      this.worldWidth - 360,
      Math.max(ARENA_LEFT + 360, this.player.x + (this.player.facing >= 0 ? 480 : -480))
    );
    this.spawnWaveFighters(nextSpawn, this.survivalWave, spawnX);
    this.isCurrentBossBattle = Boolean(nextSpawn.isBoss);
    this.cloneEnemy = null;
    this.enemyAI.reset();
    this.projectiles = [];
    this.enemyEngaged = true;
    if (this.survivalWave === 20) {
      this.sound.setMusicContext('survival_boss', this.mapId, true, nextSpawn.archetype, this.activeCampaignCharId);
      this.sound.playBossEntrance();
      this.triggerDemonSpeech(this.enemy, 'engage');
    } else if (nextSpawn.isBoss) {
      this.sound.setMusicContext('survival_boss', this.mapId, true, nextSpawn.archetype, this.activeCampaignCharId);
      this.sound.playBossEntrance();
    } else {
      this.sound.setMusicContext('survival', this.mapId, false, nextSpawn.archetype, this.activeCampaignCharId);
      this.sound.playDemonRoar();
    }
    this.particles.spawnFloatingText(
      this.player.x + 60,
      this.player.y - 140,
      `WAVE ${this.survivalWave} / 20 · ${nextSpawn.name.toUpperCase()}`,
      '#fbbf24',
      1.3
    );
    this.emitHudSnapshot();
  }

  private finalizeMatchVictory(): void {
    this.phase = 'VICTORY';
    const hpPct = this.player.hp / this.player.maxHp;
    const rank: 'S' | 'A' | 'B' = hpPct >= 0.72 ? 'S' : hpPct >= 0.4 ? 'A' : 'B';
    const coinsEarned = this.finishingPendingCoins;
    this.coinsEarnedThisRun = coinsEarned;
    this.lastRank = rank;
    this.clearHeldInputs();
    this.sound.playVictory();
    if (this.mode === 'STORY') {
      this.callbacks.onLevelComplete?.(this.currentLevel.id, rank, coinsEarned, this.killsThisRun);
    } else if (this.mode === 'SURVIVAL') {
      this.callbacks.onSurvivalComplete?.(this.survivalWave, true, coinsEarned, this.survivalDefeatedCount);
    } else {
      this.callbacks.onLevelComplete?.(0, rank, coinsEarned, this.killsThisRun);
    }
    this.emitHudSnapshot();
  }

  private checkWaveOrMatchOutcome(): void {
    if (this.partnerEnemy && this.partnerEnemy.hp <= 0 && !this.partnerEnemy.ragdoll.active) {
      activateRagdoll(this.partnerEnemy, evaluateFighterPose(this.partnerEnemy), this.player.facing * 240, -240, true);
    }
    if (this.enemy.hp <= 0 && !this.enemy.ragdoll.active && this.partnerEnemy && this.partnerEnemy.hp > 0) {
      activateRagdoll(this.enemy, evaluateFighterPose(this.enemy), this.player.facing * 240, -240, true);
    }

    const waveCleared = this.enemy.hp <= 0 && (!this.partnerEnemy || this.partnerEnemy.hp <= 0);

    if (waveCleared) {
      const defeatedNow = this.partnerEnemy ? 2 : 1;
      this.killsThisRun += defeatedNow;

      if (this.mode === 'SURVIVAL') {
        this.survivalDefeatedCount += defeatedNow;
        if (this.survivalWave < this.survivalMaxWaves) {
          const waveBonus = 15 + this.survivalWave * 4 + (this.survivalWave % 5 === 0 ? 35 : 0);
          this.coinsEarnedThisRun += waveBonus;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.round(this.player.maxHp * 0.28));
          this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 45);
          this.survivalNextWavePending = true;
          this.survivalCountdown = 2.2;
          if (!this.enemy.ragdoll.active) {
            activateRagdoll(this.enemy, evaluateFighterPose(this.enemy), this.player.facing * 290, -260, true);
          }
          this.particles.spawnFloatingText(
            this.player.x,
            this.player.y - 140,
            `WAVE ${this.survivalWave} CLEARED! +${waveBonus} COINS`,
            '#34d399',
            1.25
          );
          this.emitHudSnapshot();
          return;
        }
      }

      if (this.mode === 'STORY' && this.waveIndex + 1 < this.currentLevel.enemies.length) {
        this.waveIndex += 1;
        const nextSpawn = this.currentLevel.enemies[this.waveIndex];
        const zoneSpawnX = Math.max(
          Math.min(this.worldWidth - 360, this.player.x + 620),
          this.getWaveSpawnX(this.waveIndex, this.currentLevel.enemies.length)
        );
        this.spawnWaveFighters(nextSpawn, this.waveIndex, zoneSpawnX);
        this.isCurrentBossBattle = this.isCurrentBossBattle || Boolean(nextSpawn.isBoss);
        this.cloneEnemy = null;
        this.enemyAI.reset();
        this.projectiles = [];
        this.enemyEngaged = Math.abs(zoneSpawnX - this.player.x) < 900;
        if (nextSpawn.isBoss) {
          this.sound.setMusicContext(
            'gameplay',
            this.mapId,
            true,
            nextSpawn.archetype,
            this.activeCampaignCharId
          );
          if (this.enemyEngaged) {
            this.sound.playBossEntrance();
            this.triggerDemonSpeech(this.enemy, 'engage');
          }
        } else if (this.enemyEngaged) {
          this.sound.playDemonRoar();
        }
        this.particles.spawnFloatingText(
          this.player.x + 80,
          this.player.y - 130,
          this.enemyEngaged ? `${nextSpawn.name} Appears!` : `Zone Cleared! Advance East →`,
          '#38bdf8',
          1.15
        );
        this.emitHudSnapshot();
        return;
      }

      // Enter Hybrid Cinematic Finishing Strike before Victory Screen
      this.enemy.currentAttack = null;
      this.partnerEnemy = null;
      this.cloneEnemy = null;
      if (!this.enemy.ragdoll.active) {
        activateRagdoll(this.enemy, evaluateFighterPose(this.enemy), this.player.facing * 320, -290, true);
      } else {
        this.enemy.ragdoll.keepDown = true;
        this.enemy.state = 'DEFEATED';
      }

      const hpPct = this.player.hp / this.player.maxHp;
      const rank: 'S' | 'A' | 'B' = hpPct >= 0.72 ? 'S' : hpPct >= 0.4 ? 'A' : 'B';
      const rankBonus = rank === 'S' ? 25 : rank === 'A' ? 12 : 0;
      const baseReward =
        this.mode === 'STORY'
          ? this.currentLevel.rewardCoins
          : this.mode === 'SURVIVAL'
            ? this.coinsEarnedThisRun + 140
            : 35;
      this.finishingPendingCoins =
        this.mode === 'SURVIVAL' ? baseReward : baseReward + rankBonus + this.killsThisRun * 10;
      this.finishingPendingRank = rank;

      this.finishingTimer = 0;
      this.finishingTitle = `FINAL EXECUTION · ${this.enemy.name.split('·')[0].trim().toUpperCase()}`;
      this.phase = 'FINISHING';
      this.clearHeldInputs();
      this.sound.playFinisherImpact();
      this.particles.spawnFinisherAsh(this.enemy.x, this.enemy.y - 45);
      this.shakeIntensity = Math.max(this.shakeIntensity, 16);
      this.emitHudSnapshot();
    } else if (this.player.hp <= 0) {
      this.phase = 'DEFEAT';
      this.player.currentAttack = null;
      if (!this.player.ragdoll.active) {
        activateRagdoll(this.player, evaluateFighterPose(this.player), this.enemy.facing * 260, -240, true);
      } else {
        this.player.ragdoll.keepDown = true;
        this.player.state = 'DEFEATED';
      }
      this.clearHeldInputs();
      this.sound.playDefeat();
      if (this.mode === 'SURVIVAL') {
        this.callbacks.onSurvivalComplete?.(
          this.survivalWave,
          false,
          this.coinsEarnedThisRun,
          this.survivalDefeatedCount
        );
      }
      this.emitHudSnapshot();
    }
  }

  private updateCamera(dt: number): void {
    const aliveTarget =
      this.enemy.hp > 0
        ? this.enemy
        : this.partnerEnemy && this.partnerEnemy.hp > 0
          ? this.partnerEnemy
          : this.enemy;

    let targetX = this.player.x + this.player.facing * 140;
    let targetZoom = 1.0;

    if (this.mode === 'TUTORIAL') {
      targetX = (this.player.x + aliveTarget.x) * 0.5;
      targetZoom = 1.02;
    } else if (this.enemyEngaged && aliveTarget.hp > 0) {
      const dist = Math.abs(this.player.x - aliveTarget.x);
      targetX = (this.player.x * 0.55 + aliveTarget.x * 0.45);
      if (this.player.state === 'BREATHING_FORM' || aliveTarget.state === 'BDA_CAST') {
        targetZoom = 1.12;
      } else if (dist < 230) {
        targetZoom = 1.08 + (this.enemy.bossPhase >= 2 ? 0.04 : 0);
      } else if (dist > 550) {
        targetZoom = 0.94;
      } else {
        targetZoom = 1.02;
      }
    } else {
      // Wide cinematic pan when traversing huge multi-zone maps
      targetZoom = Math.abs(this.player.vx) > 220 ? 0.93 : 0.98;
    }

    if (!this.gameplaySettings.cameraEffects) {
      targetZoom = 1.0;
    }

    const baseScale = Math.max(0.54, Math.min(1.18, this.viewH / WORLD_HEIGHT)) * targetZoom;
    const halfViewWorld = Math.max(360, (this.viewW * 0.5) / baseScale);
    const clampedTarget = Math.max(
      halfViewWorld,
      Math.min(Math.max(halfViewWorld, this.worldWidth - halfViewWorld), targetX)
    );
    this.cameraX += (clampedTarget - this.cameraX) * Math.min(1, dt * 6.5);
    this.cameraZoom += (targetZoom - this.cameraZoom) * Math.min(1, dt * 3.8);
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    this.arena.renderBackground(ctx, this.mapId, this.cameraX, this.viewW, this.viewH);

    const baseScale = Math.max(0.54, Math.min(1.18, this.viewH / WORLD_HEIGHT));
    const scale = baseScale * this.cameraZoom;
    const allowShake = this.gameplaySettings.cameraEffects && this.shakeIntensity > 0;
    const shakeX = allowShake ? (Math.random() - 0.5) * 2 * this.shakeIntensity : 0;
    const shakeY = allowShake ? (Math.random() - 0.5) * 2 * this.shakeIntensity : 0;
    const groundAnchorOffsetY = this.viewH * 0.83 - GROUND_Y * scale;

    ctx.save();
    ctx.translate(this.viewW * 0.5 + shakeX, groundAnchorOffsetY + shakeY);
    ctx.scale(scale, scale);
    ctx.translate(-this.cameraX, 0);

    const isDomaFrost =
      this.enemy.hp > 0 &&
      (this.enemy.demonArchetype === 'boss_doma' || this.enemy.demonArchetype === 'doma_final');
    const showWeakPoints =
      this.player.awakeningActive &&
      (this.player.awakeningTier === 'transparent_world' || this.player.awakeningTier === 'transcendent');

    this.arena.renderWorldBehindCharacters(
      ctx,
      this.mapId,
      this.platforms,
      this.obstacles,
      this.cameraX,
      this.worldWidth,
      this.waterZones,
      this.decors,
      this.exploreCaches,
      isDomaFrost
    );

    if (this.mode === 'TUTORIAL') {
      renderTrainingRock(ctx, this.rockX, GROUND_Y, this.rockHp, this.rockMaxHp);
    }

    for (const ally of this.allies) {
      renderFighter(ctx, ally, evaluateFighterPose(ally));
    }

    if (this.cloneEnemy) {
      renderFighter(ctx, this.cloneEnemy, evaluateFighterPose(this.cloneEnemy), { showWeakPointReticle: showWeakPoints });
    }

    if (this.partnerEnemy) {
      renderFighter(ctx, this.partnerEnemy, evaluateFighterPose(this.partnerEnemy), { showWeakPointReticle: showWeakPoints });
    }

    renderFighter(ctx, this.enemy, evaluateFighterPose(this.enemy), { showWeakPointReticle: showWeakPoints });
    renderFighter(ctx, this.player, evaluateFighterPose(this.player));

    this.particles.render(ctx, this.projectiles);
    this.arena.renderWorldForeground(ctx, this.mapId, this.cameraX, this.worldWidth);

    if (this.activeSpeechBubble && this.gameplaySettings.dialogueEnabled) {
      const anchor = this.activeSpeechBubble.target === 'player' ? this.player : this.enemy;
      this.drawSpeechBubble(
        ctx,
        anchor.x,
        anchor.y - 135 * anchor.visual.scale,
        this.activeSpeechBubble.speaker,
        this.activeSpeechBubble.text,
        this.activeSpeechBubble.isDemon
      );
    }

    ctx.restore();

    if (this.phase === 'FINISHING') {
      const progress = Math.min(1, this.finishingTimer / this.finishingDuration);
      ctx.fillStyle = `rgba(2, 6, 18, ${0.42 * (1 - progress * 0.4)})`;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
      const barH = Math.round(this.viewH * 0.11);
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, this.viewW, barH);
      ctx.fillRect(0, this.viewH - barH, this.viewW, barH);
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
    const trimmed = text.length > 44 ? `${text.slice(0, 42)}…` : text;
    const textW = ctx.measureText(trimmed).width;
    const boxW = Math.max(125, Math.min(295, textW + 28));
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
    ctx.font = '700 10px "Cinzel", sans-serif';
    ctx.fillStyle = isDemon ? '#fda4af' : '#7dd3fc';
    ctx.textAlign = 'left';
    ctx.fillText(speaker.toUpperCase(), bx + 11, by + 15);
    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(trimmed, bx + 11, by + 33);
    ctx.restore();
  }

  public emitHudSnapshot(): void {
    const stepDef = TUTORIAL_STEPS[Math.min(TUTORIAL_STEPS.length - 1, this.tutorialStep - 1)];
    const currentZone = this.zones[this.currentZoneIndex - 1];
    const advancePrompt =
      this.mode === 'STORY' && !this.enemyEngaged && this.enemy.hp > 0
        ? `Advance East (${Math.max(1, Math.round((this.enemy.x - this.player.x) / 40))}m) → ${this.enemy.name.split('·')[0].trim()}`
        : null;

    const styleDef = BREATHING_STYLES[this.player.breathingStyle];

    this.callbacks.onHudUpdate({
      phase: this.phase,
      mode: this.mode,
      levelId: this.currentLevel.id,
      levelTitle:
        this.mode === 'TUTORIAL'
          ? 'Mt. Sagiri Boulder Trial'
          : this.mode === 'SURVIVAL'
            ? `Survival Mode · Wave ${this.survivalWave}/20`
            : this.mode === 'PRACTICE'
              ? `Free Battle · ${MAP_DISPLAY_NAMES[this.mapId]}`
              : `Lv.${this.currentLevel.id} · ${this.currentLevel.title}`,
      mapId: this.mapId,
      playerName: this.player.name,
      playerHp: this.player.hp,
      playerMaxHp: this.player.maxHp,
      playerEnergy: this.player.energy,
      playerMaxEnergy: this.player.maxEnergy,
      breathingStyle: this.player.breathingStyle,
      breathingStyleName: styleDef.name,
      totalFormsForStyle: styleDef.forms.length,
      heavyCooldown: this.player.heavyCooldown,
      maxHeavyCooldown: this.player.maxHeavyCooldown,
      formCooldowns: [...this.player.formCooldowns],
      counterReady: this.player.counterWindowTimer > 0,
      actionWarning: this.actionWarning,

      awakeningMeter: this.player.awakeningMeter,
      awakeningActive: this.player.awakeningActive,
      awakeningTimer: this.player.awakeningTimer,
      awakeningTier: this.player.awakeningTier,
      awakeningCooldown: this.player.awakeningCooldown,
      equippedUltimate: this.player.equippedUltimate,
      ultimateCooldown: this.player.ultimateCooldown,
      maxUltimateCooldown: ULTIMATE_SPECS[this.player.equippedUltimate].cooldown,
      finishingTitle: this.phase === 'FINISHING' ? this.finishingTitle : undefined,

      survivalWave: this.mode === 'SURVIVAL' ? this.survivalWave : 0,
      survivalMaxWaves: this.survivalMaxWaves,
      survivalEnemiesLeft: (this.enemy.hp > 0 ? 1 : 0) + (this.partnerEnemy && this.partnerEnemy.hp > 0 ? 1 : 0),
      survivalCountdown: this.mode === 'SURVIVAL' && this.survivalNextWavePending ? this.survivalCountdown : 0,
      survivalCoinsEarned: this.mode === 'SURVIVAL' ? this.coinsEarnedThisRun : 0,

      enemyName: this.enemy.name,
      enemySubtitle: this.enemy.subtitle,
      enemyHp: this.enemy.hp,
      enemyMaxHp: this.enemy.maxHp,
      enemyState: this.enemy.state,
      enemyWaveIndex: this.mode === 'SURVIVAL' ? this.survivalWave : this.waveIndex + 1,
      enemyWaveTotal:
        this.mode === 'SURVIVAL'
          ? this.survivalMaxWaves
          : this.mode === 'STORY'
            ? this.currentLevel.enemies.length
            : 1,
      bossPhase: this.enemy.bossPhase,
      isBossBattle: this.isCurrentBossBattle,
      enemyTelegraph:
        this.mode === 'TUTORIAL'
          ? null
          : this.enemyAI.getTelegraph() ?? (this.partnerEnemy ? this.partnerAI.getTelegraph() : null),

      partnerEnemyName: this.partnerEnemy ? this.partnerEnemy.name : null,
      partnerEnemyHp: this.partnerEnemy ? this.partnerEnemy.hp : 0,
      partnerEnemyMaxHp: this.partnerEnemy ? this.partnerEnemy.maxHp : 0,

      allies: this.allies.map((a) => ({ name: a.name, hp: a.hp, maxHp: a.maxHp })),

      zoneIndex: this.currentZoneIndex,
      zoneTotal: Math.max(1, this.zones.length),
      zoneName: currentZone?.name ?? MAP_DISPLAY_NAMES[this.mapId],
      advancePrompt,
      playerWorldX: this.player.x,
      worldWidth: this.worldWidth,

      tutorialStep: this.tutorialStep,
      tutorialTitle: stepDef.title,
      tutorialInstruction: stepDef.instruction,
      tutorialMentorLine: stepDef.mentorLine,
      rockHp: this.rockHp,
      rockMaxHp: this.rockMaxHp,

      coins: this.coinsBalance,
      coinsEarnedThisRun: this.coinsEarnedThisRun,
      lastRank: this.lastRank,
      comboCount: this.player.hitCount,
      muted: this.sound.isMuted(),
      matchTime: this.matchTime,
      ragdollHitsLanded: this.ragdollHitsLanded,
    });
  }
}

function pComboAdvance(f: Fighter): void {
  f.comboStep = (f.comboStep + 1) % 5;
  f.comboResetTimer = 0.85;
}
