import { AWAKENING_SPECS, getUnlockedAwakeningsForLevel } from './breathing';
import { getCharacterById } from './characters';
import { cloneDefaultControlsLayout, sanitizeControlsLayout } from './controlsLayout';
import {
  AchievementDef,
  AudioSettings,
  AwakeningTierId,
  BreathingStyleId,
  CharacterProfile,
  CharacterUpgrades,
  CombatRank,
  DailyMissionState,
  DifficultyMode,
  GameplaySettings,
  LevelMilestoneDef,
  PlayerStatistics,
  SaveData,
  SecretBossDef,
  SurvivalStats,
  SwordUpgrades,
  TouchControlsLayout,
  TrainingChallengeDef,
  UltimateId,
} from './types';

const SAVE_KEY = 'dh_breath_of_the_abyss_save_v2';

export const DEFAULT_AUDIO: AudioSettings = {
  muted: false,
  musicEnabled: true,
  sfxEnabled: true,
  masterVolume: 0.85,
  musicVolume: 0.68,
  sfxVolume: 0.85,
  subtitlesEnabled: false,
};

export const DEFAULT_GAMEPLAY: GameplaySettings = {
  bloodEffectsEnabled: false, // Default OFF per safety requirement
  combatVisualEffects: true,
  cinematicEffects: true,
  dialogueEnabled: true,
  cameraEffects: true,
  performanceMode: false,
};

function sanitizeGameplaySettings(raw?: Partial<GameplaySettings>): GameplaySettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_GAMEPLAY };
  return {
    bloodEffectsEnabled: Boolean(raw.bloodEffectsEnabled),
    combatVisualEffects: raw.combatVisualEffects !== undefined ? Boolean(raw.combatVisualEffects) : DEFAULT_GAMEPLAY.combatVisualEffects,
    cinematicEffects: raw.cinematicEffects !== undefined ? Boolean(raw.cinematicEffects) : DEFAULT_GAMEPLAY.cinematicEffects,
    dialogueEnabled: raw.dialogueEnabled !== undefined ? Boolean(raw.dialogueEnabled) : DEFAULT_GAMEPLAY.dialogueEnabled,
    cameraEffects: raw.cameraEffects !== undefined ? Boolean(raw.cameraEffects) : DEFAULT_GAMEPLAY.cameraEffects,
    performanceMode: Boolean(raw.performanceMode),
  };
}

export const MAX_PLAYER_LEVEL = 50;
export const MAX_TOTAL_XP = 1500;

// 49 level-up steps (Lv.1->2 .. Lv.49->50) summing strictly to 1500 XP
export const LEVEL_XP_STEPS: readonly number[] = [
  16, 16, 17, 17, 18, 19, 19, 20,
  21, 21, 22, 22, 23, 24, 24, 25,
  26, 26, 27, 27, 28, 29, 29, 30,
  31, 31, 32, 32, 33, 34, 34, 35,
  36, 36, 37, 37, 38, 39, 39, 40,
  41, 41, 42, 42, 43, 44, 44, 46,
  47,
];

export const LEVEL_MILESTONES: LevelMilestoneDef[] = [
  { level: 5, title: 'Total Concentration Reflex', description: 'Sharper blade timing against sudden lunges.', effectSummary: '+0.08s Parry / Counter Window' },
  { level: 10, title: 'Demon Slayer Mark Resonance', description: 'Awakens Slayer Mark resonance and surges form potency.', effectSummary: '+8% Breathing Form Damage' },
  { level: 15, title: 'Constant Breathing Circulation', description: 'Maintain Total Concentration without conscious strain.', effectSummary: '+1.2 Energy Regen/s' },
  { level: 20, title: 'Crimson Red Blade Mastery', description: 'Ignites nichirin steel, strengthening guard & burn.', effectSummary: '+6% Damage Mitigation & Burn' },
  { level: 25, title: 'Unbroken Corps Spirit', description: 'Enter every duel with charged lung capacity.', effectSummary: '+20 Starting Breathing Energy' },
  { level: 30, title: 'Transparent World Perception', description: 'Strike demon weak points exposed during boss battles.', effectSummary: '+10% Boss Crit & Transparent World Mastery' },
  { level: 35, title: 'Selfless State Footwork', description: 'Vanish from demon bloodlust sensors mid-evasion.', effectSummary: '+0.06s Dodge i-Frames' },
  { level: 40, title: 'Hashira Flow Recovery', description: 'Rapidly reset sword stance between heavy techniques.', effectSummary: '-15% Heavy, Form & Ultimate Cooldowns' },
  { level: 45, title: 'Pillar Body Conditioning', description: 'Hashira-grade endurance for prolonged boss phases.', effectSummary: '+65 Max HP & +6% Attack Power' },
  { level: 50, title: 'Transcendent Sun Peak', description: 'Pinnacle Slayer mastery. Unlocks Abyssal Boss Difficulty.', effectSummary: '+10% All Combat Stats & Abyssal Mode' },
];

export function getMilestoneBonuses(level: number): {
  counterWindowBonus: number;
  formDamageBonus: number;
  energyRegenBonus: number;
  defenseBonus: number;
  startingEnergyBonus: number;
  bossDamageBonus: number;
  dodgeIFrameBonus: number;
  cooldownReduction: number;
  maxHpBonus: number;
  attackPowerBonus: number;
} {
  const lv = Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor(level)));
  const lv50Bonus = lv >= 50 ? 0.1 : 0;
  return {
    counterWindowBonus: lv >= 5 ? 0.08 : 0,
    formDamageBonus: (lv >= 10 ? 0.08 : 0) + lv50Bonus,
    energyRegenBonus: lv >= 15 ? 1.2 + (lv >= 50 ? 0.8 : 0) : 0,
    defenseBonus: (lv >= 20 ? 0.06 : 0) + (lv >= 50 ? 0.04 : 0),
    startingEnergyBonus: lv >= 25 ? 20 : 0,
    bossDamageBonus: lv >= 30 ? 0.1 : 0,
    dodgeIFrameBonus: lv >= 35 ? 0.06 : 0,
    cooldownReduction: lv >= 40 ? 0.15 : 0,
    maxHpBonus: (lv >= 45 ? 65 : 0) + (lv >= 50 ? 35 : 0),
    attackPowerBonus: (lv >= 45 ? 0.06 : 0) + lv50Bonus,
  };
}

export const RANK_WEIGHT: Record<CombatRank, number> = {
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
  SS: 6,
  SSS: 7,
};

export function calculateCombatRank(params: {
  hpPct: number;
  perfectDodges: number;
  damageTaken: number;
  maxCombo: number;
  matchTime: number;
  breathingKills: number;
}): CombatRank {
  let score = 0;
  if (params.hpPct >= 0.95) score += 40;
  else if (params.hpPct >= 0.78) score += 32;
  else if (params.hpPct >= 0.55) score += 23;
  else if (params.hpPct >= 0.3) score += 14;
  else score += 6;

  if (params.damageTaken === 0) score += 26;
  else if (params.damageTaken <= 25) score += 16;
  else if (params.damageTaken <= 70) score += 8;

  score += Math.min(20, params.perfectDodges * 6);
  score += Math.min(14, Math.floor(params.maxCombo / 2) * 2);
  if (params.breathingKills > 0) score += 8;
  if (params.matchTime <= 45) score += 10;
  else if (params.matchTime <= 75) score += 5;

  if (score >= 92) return 'SSS';
  if (score >= 78) return 'SS';
  if (score >= 64) return 'S';
  if (score >= 48) return 'A';
  if (score >= 34) return 'B';
  if (score >= 20) return 'C';
  return 'D';
}

export function getXpForNextLevel(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  if (lv >= MAX_PLAYER_LEVEL) return 0;
  return LEVEL_XP_STEPS[lv - 1] ?? 47;
}

export function getTotalXpForProfile(level: number, xp: number): number {
  const lv = Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor(level)));
  let total = 0;
  for (let i = 0; i < lv - 1; i++) {
    total += LEVEL_XP_STEPS[i] ?? 0;
  }
  if (lv < MAX_PLAYER_LEVEL) {
    total += Math.max(0, Math.min(getXpForNextLevel(lv) - 1, Math.floor(xp)));
  }
  return Math.min(MAX_TOTAL_XP, total);
}

export function applyXpToProfile(
  profile: CharacterProfile,
  xpGain: number
): {
  profile: CharacterProfile;
  leveledUp: boolean;
  newLevel: number;
  newlyUnlockedAwakenings: AwakeningTierId[];
  unlockedMilestones: LevelMilestoneDef[];
} {
  const safeGain = Math.max(0, Math.floor(xpGain));
  let level = Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor(profile.playerLevel || 1)));
  let xp = level >= MAX_PLAYER_LEVEL ? 0 : Math.max(0, Math.floor(profile.playerXp || 0)) + safeGain;
  const startLevel = level;

  while (level < MAX_PLAYER_LEVEL) {
    const needed = getXpForNextLevel(level);
    if (needed <= 0 || xp < needed) break;
    xp -= needed;
    level += 1;
  }

  if (level >= MAX_PLAYER_LEVEL) {
    level = MAX_PLAYER_LEVEL;
    xp = 0;
  }

  const levelUnlocks = getUnlockedAwakeningsForLevel(level);
  const prevUnlocked = new Set<AwakeningTierId>(['mark', ...profile.unlockedAwakenings]);
  const newlyUnlockedAwakenings = levelUnlocks.filter((id) => !prevUnlocked.has(id));
  const mergedAwakenings = Array.from(new Set<AwakeningTierId>(['mark', ...profile.unlockedAwakenings, ...levelUnlocks]));
  const unlockedMilestones = LEVEL_MILESTONES.filter((m) => m.level > startLevel && m.level <= level);

  return {
    profile: {
      ...profile,
      playerLevel: level,
      playerXp: xp,
      unlockedAwakenings: mergedAwakenings,
    },
    leveledUp: level > startLevel,
    newLevel: level,
    newlyUnlockedAwakenings,
    unlockedMilestones,
  };
}

export const DEFAULT_PLAYER_STATS: PlayerStatistics = {
  demonsDefeated: 0,
  bossesDefeated: 0,
  levelsCleared: 0,
  perfectDodges: 0,
  noDamageWins: 0,
  breathingFinishers: 0,
  chestsFound: 0,
  sssRanks: 0,
  trainingCompleted: 0,
  secretBossesCleared: 0,
  totalDamageDealt: 0,
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'ach_slayer_10', title: 'Demon Hunter Initiate', description: 'Defeat 10 demons across any mode.', target: 10, rewardCoins: 90, rewardXp: 35, metric: 'demonsDefeated' },
  { id: 'ach_slayer_50', title: 'Corps Vanguard', description: 'Defeat 50 demons across any mode.', target: 50, rewardCoins: 240, rewardXp: 70, metric: 'demonsDefeated' },
  { id: 'ach_boss_5', title: 'Twelve Kizuki Bane', description: 'Defeat 5 major Demon Bosses.', target: 5, rewardCoins: 180, rewardXp: 55, metric: 'bossesDefeated' },
  { id: 'ach_dodge_15', title: 'Ghost Step Mastery', description: 'Execute 15 Perfect Dodges.', target: 15, rewardCoins: 150, rewardXp: 45, metric: 'perfectDodges' },
  { id: 'ach_nodmg_3', title: 'Untouchable Hashira', description: 'Win 3 battles without taking any damage.', target: 3, rewardCoins: 220, rewardXp: 65, metric: 'noDamageWins' },
  { id: 'ach_finisher_10', title: 'Final Form Executioner', description: 'Finish 10 encounters with a Breathing Form or Ultimate.', target: 10, rewardCoins: 160, rewardXp: 50, metric: 'breathingFinishers' },
  { id: 'ach_chests_8', title: 'Dungeon Treasure Seeker', description: 'Discover 8 secret chests or exploration caches.', target: 8, rewardCoins: 140, rewardXp: 40, metric: 'chestsFound' },
  { id: 'ach_sss_3', title: 'Pinnacle SSS Rank', description: 'Earn SSS Combat Rank in 3 battles.', target: 3, rewardCoins: 260, rewardXp: 80, metric: 'sssRanks' },
  { id: 'ach_training_all', title: 'Master of Trials', description: 'Complete 4 Hashira Training Challenges.', target: 4, rewardCoins: 200, rewardXp: 60, metric: 'trainingCompleted' },
  { id: 'ach_secret_boss', title: 'Shadow Horizon', description: 'Defeat a Hidden Secret Boss.', target: 1, rewardCoins: 350, rewardXp: 100, metric: 'secretBossesCleared' },
];

export const TRAINING_CHALLENGES: TrainingChallengeDef[] = [
  {
    id: 'train_dodge',
    title: 'Phantom Evasion Trial',
    subtitle: 'Perfect Dodge Conditioning',
    description: 'Survive and defeat an aggressive Fast Claw Demon using rapid dashes and aerial evasions.',
    mapId: 'mountain_training',
    enemyArchetype: 'fast',
    enemyName: 'Crimson Fang Runner (Trial)',
    rewardCoins: 75,
    rewardXp: 40,
    ruleTag: 'perfect_dodge_trial',
  },
  {
    id: 'train_parry',
    title: 'Iron Guard & Counter Drill',
    subtitle: 'Heavy Guard Conditioning',
    description: 'Break through an Armored Tank Demon with parries, counters, and heavy overhead cleaves.',
    mapId: 'hashira_grounds',
    enemyArchetype: 'strong',
    enemyName: 'Iron Carapace Hulk (Trial)',
    rewardCoins: 90,
    rewardXp: 45,
    ruleTag: 'parry_mastery',
  },
  {
    id: 'train_forms',
    title: 'Total Concentration Chain',
    subtitle: 'Breathing Style Flow',
    description: 'Overwhelm a regenerating swamp fiend using chained Breathing Forms before it heals.',
    mapId: 'poisonous_forest',
    enemyArchetype: 'regenerating',
    enemyName: 'Blight HydraFiend (Trial)',
    rewardCoins: 105,
    rewardXp: 55,
    ruleTag: 'form_chain',
  },
  {
    id: 'train_upper_phase',
    title: 'Upper Rank Combat Simulation',
    subtitle: 'Multi-Phase Adaptation Drill',
    description: 'Confront Akaza’s martial arts phantom to rehearse 75% / 50% / 25% phase shifts.',
    mapId: 'infinity_castle',
    enemyArchetype: 'boss_akaza',
    enemyName: 'Akaza · Compass Phantom',
    rewardCoins: 150,
    rewardXp: 70,
    ruleTag: 'boss_phase_drill',
  },
];

export const SECRET_BOSSES: SecretBossDef[] = [
  {
    id: 'secret_hantengu_merged',
    title: 'Hidden Vault: Merged Hantengu',
    subtitle: 'Underground Abyssal Sanctum',
    description: 'A forbidden underground sanctuary hiding the fused hatred manifestation of Upper Moon Four.',
    mapId: 'underground_tunnel',
    unlockRequirementLabel: 'Clear Level 18 or reach Slayer Lv.15',
    minLevel: 18,
    minPlayerLevel: 15,
    enemy: {
      archetype: 'hantengu_merged',
      name: 'Hantengu · Merged Hatred',
      subtitle: 'Secret Upper Four Sanctuary',
      hpScale: 1.25,
      damageScale: 1.2,
      isBoss: true,
    },
    rewardCoins: 320,
    rewardXp: 110,
  },
  {
    id: 'secret_kokushibo_moon',
    title: 'Eclipse Chamber: Kokushibo Awakened',
    subtitle: 'Six-Eyed Moon Calamity',
    description: 'Face Upper Moon One unleashing relentless crescent moon storms inside the Haunted Temple.',
    mapId: 'haunted_temple',
    unlockRequirementLabel: 'Clear Level 35 or reach Slayer Lv.30',
    minLevel: 35,
    minPlayerLevel: 30,
    enemy: {
      archetype: 'kokushibo_demon',
      name: 'Kokushibo · Eclipse Blade',
      subtitle: 'Secret Upper One Duel',
      hpScale: 1.32,
      damageScale: 1.25,
      isBoss: true,
    },
    rewardCoins: 460,
    rewardXp: 145,
  },
  {
    id: 'secret_demon_king_tanjiro',
    title: 'Crimson Horizon: Demon King Heir',
    subtitle: 'Final Fortress What-If Anomaly',
    description: 'An apex secret encounter against the Demon King inheritor inside Muzan’s burning stronghold.',
    mapId: 'final_fortress',
    unlockRequirementLabel: 'Clear Level 50 or reach Slayer Lv.45',
    minLevel: 50,
    minPlayerLevel: 45,
    enemy: {
      archetype: 'demon_king_tanjiro',
      name: 'Demon King Tanjiro · Abyssal Heir',
      subtitle: 'Supreme Secret Boss',
      hpScale: 1.45,
      damageScale: 1.32,
      isBoss: true,
    },
    rewardCoins: 680,
    rewardXp: 180,
  },
];

export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateDailyMissions(dateKey = getTodayDateKey()): DailyMissionState[] {
  const pool: Omit<DailyMissionState, 'progress' | 'claimed'>[] = [
    { id: 'dm_slay_5', title: 'Night Patrol', description: 'Defeat 5 demons in any mode.', target: 5, rewardCoins: 75, rewardXp: 35, metric: 'demons_defeated' },
    { id: 'dm_clear_2', title: 'Frontline Advance', description: 'Clear 2 Story or Free Battles.', target: 2, rewardCoins: 85, rewardXp: 40, metric: 'levels_cleared' },
    { id: 'dm_dodge_4', title: 'Flowing Footwork', description: 'Perform 4 Perfect Dodges.', target: 4, rewardCoins: 70, rewardXp: 35, metric: 'perfect_dodges' },
    { id: 'dm_finish_2', title: 'Breath Finisher', description: 'Win 2 fights with Breathing or Ultimate.', target: 2, rewardCoins: 90, rewardXp: 45, metric: 'breathing_finishers' },
    { id: 'dm_chest_2', title: 'Hidden Supplies', description: 'Open 2 Secret Chests or Caches.', target: 2, rewardCoins: 80, rewardXp: 35, metric: 'chests_found' },
    { id: 'dm_boss_1', title: 'Kizuki Hunt', description: 'Defeat 1 Demon Boss.', target: 1, rewardCoins: 110, rewardXp: 55, metric: 'bosses_defeated' },
  ];
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  const picks: DailyMissionState[] = [];
  const used = new Set<number>();
  for (let k = 0; k < 3; k++) {
    let idx = (hash + k * 7) % pool.length;
    while (used.has(idx)) idx = (idx + 1) % pool.length;
    used.add(idx);
    picks.push({ ...pool[idx], progress: 0, claimed: false });
  }
  return picks;
}

export function createDefaultCharacterProfile(charId: string): CharacterProfile {
  const charDef = getCharacterById(charId);
  return {
    characterId: charDef.id,
    coins: 80,
    playerLevel: 1,
    playerXp: 0,
    highestUnlockedLevel: 1,
    levelBestRanks: {},
    seenCutscenes: [],
    tutorialCompleted: false,
    selectedBreathing: charDef.defaultBreathing,
    selectedSkinId: 'classic',
    unlockedSkins: ['classic'],
    unlockedAwakenings: ['mark'],
    unlockedUltimates: ['eternal_sun'],
    equippedUltimate: 'eternal_sun',
    upgrades: { vitality: 0, blade: 0, defense: 0, breathing: 0 },
    swordUpgrades: { edge: 0, alloy: 0, tsuba: 0, scabbard: 0 },
    totalDemonsDefeated: 0,
    storyChoices: {},
    completedTrainingIds: [],
    clearedSecretBossIds: [],
  };
}

function sanitizeProfile(charId: string, raw?: Partial<CharacterProfile>): CharacterProfile {
  const base = createDefaultCharacterProfile(charId);
  if (!raw || typeof raw !== 'object') return base;
  const charDef = getCharacterById(charId);
  const breathing =
    raw.selectedBreathing && charDef.allowedBreathings.includes(raw.selectedBreathing)
      ? raw.selectedBreathing
      : raw.selectedBreathing ?? base.selectedBreathing;

  const selectedSkinId = typeof raw.selectedSkinId === 'string' ? raw.selectedSkinId : 'classic';
  const unlockedSkins = Array.isArray(raw.unlockedSkins)
    ? Array.from(new Set(['classic', selectedSkinId, ...raw.unlockedSkins]))
    : Array.from(new Set(['classic', selectedSkinId]));

  const highestUnlockedLevel =
    typeof raw.highestUnlockedLevel === 'number'
      ? Math.max(1, Math.min(50, Math.floor(raw.highestUnlockedLevel)))
      : 1;
  const totalDemonsDefeated =
    typeof raw.totalDemonsDefeated === 'number' ? Math.max(0, raw.totalDemonsDefeated) : 0;

  const playerLevel =
    typeof raw.playerLevel === 'number' && Number.isFinite(raw.playerLevel) && raw.playerLevel >= 1
      ? Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor(raw.playerLevel)))
      : Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor((highestUnlockedLevel - 1) / 3) + 1));
  const nextReq = getXpForNextLevel(playerLevel);
  const playerXp =
    playerLevel >= MAX_PLAYER_LEVEL
      ? 0
      : typeof raw.playerXp === 'number' && Number.isFinite(raw.playerXp) && raw.playerXp >= 0
        ? Math.min(Math.max(0, nextReq - 1), Math.floor(raw.playerXp))
        : 0;

  const levelUnlocks = getUnlockedAwakeningsForLevel(playerLevel);
  const unlockedAwakenings = Array.isArray(raw.unlockedAwakenings)
    ? (Array.from(new Set(['mark', ...raw.unlockedAwakenings, ...levelUnlocks])) as AwakeningTierId[])
    : (Array.from(new Set(['mark', ...levelUnlocks])) as AwakeningTierId[]);

  const unlockedUltimates = Array.isArray(raw.unlockedUltimates)
    ? (Array.from(new Set(['eternal_sun', ...raw.unlockedUltimates])) as UltimateId[])
    : (['eternal_sun'] as UltimateId[]);

  const equippedUltimate: UltimateId =
    raw.equippedUltimate && unlockedUltimates.includes(raw.equippedUltimate)
      ? raw.equippedUltimate
      : 'eternal_sun';

  return {
    characterId: charDef.id,
    coins: typeof raw.coins === 'number' && raw.coins >= 0 ? Math.floor(raw.coins) : base.coins,
    playerLevel,
    playerXp,
    highestUnlockedLevel,
    levelBestRanks:
      raw.levelBestRanks && typeof raw.levelBestRanks === 'object' ? { ...raw.levelBestRanks } : {},
    seenCutscenes: Array.isArray(raw.seenCutscenes) ? [...raw.seenCutscenes] : [],
    tutorialCompleted: Boolean(raw.tutorialCompleted),
    selectedBreathing: breathing,
    selectedSkinId,
    unlockedSkins,
    unlockedAwakenings,
    unlockedUltimates,
    equippedUltimate,
    upgrades: {
      vitality: Math.max(0, Math.min(5, Math.floor(raw.upgrades?.vitality ?? 0))),
      blade: Math.max(0, Math.min(5, Math.floor(raw.upgrades?.blade ?? 0))),
      defense: Math.max(0, Math.min(5, Math.floor(raw.upgrades?.defense ?? 0))),
      breathing: Math.max(0, Math.min(5, Math.floor(raw.upgrades?.breathing ?? 0))),
    },
    swordUpgrades: {
      edge: Math.max(0, Math.min(5, Math.floor(raw.swordUpgrades?.edge ?? 0))),
      alloy: Math.max(0, Math.min(5, Math.floor(raw.swordUpgrades?.alloy ?? 0))),
      tsuba: Math.max(0, Math.min(5, Math.floor(raw.swordUpgrades?.tsuba ?? 0))),
      scabbard: Math.max(0, Math.min(5, Math.floor(raw.swordUpgrades?.scabbard ?? 0))),
    },
    totalDemonsDefeated,
    storyChoices:
      raw.storyChoices && typeof raw.storyChoices === 'object' ? { ...raw.storyChoices } : {},
    completedTrainingIds: Array.isArray(raw.completedTrainingIds) ? [...raw.completedTrainingIds] : [],
    clearedSecretBossIds: Array.isArray(raw.clearedSecretBossIds) ? [...raw.clearedSecretBossIds] : [],
  };
}

function syncTopLevelWithActiveProfile(save: SaveData): SaveData {
  const active =
    save.characterProfiles[save.selectedCharacterId] ??
    createDefaultCharacterProfile(save.selectedCharacterId);
  return {
    ...save,
    coins: active.coins,
    playerLevel: active.playerLevel,
    playerXp: active.playerXp,
    selectedBreathing: active.selectedBreathing,
    tutorialCompleted: active.tutorialCompleted,
    highestUnlockedLevel: active.highestUnlockedLevel,
    levelBestRanks: active.levelBestRanks,
    seenCutscenes: active.seenCutscenes,
    totalDemonsDefeated: active.totalDemonsDefeated,
    characterProfiles: {
      ...save.characterProfiles,
      [save.selectedCharacterId]: active,
    },
  };
}

const INITIAL_TANJIRO_PROFILE = createDefaultCharacterProfile('tanjiro');

const DEFAULT_SURVIVAL_STATS: SurvivalStats = {
  highestWave: 0,
  totalWins: 0,
  bestCoinsRun: 0,
  runsCompleted: 0,
};

export const DEFAULT_SAVE: SaveData = {
  coins: INITIAL_TANJIRO_PROFILE.coins,
  playerLevel: INITIAL_TANJIRO_PROFILE.playerLevel,
  playerXp: INITIAL_TANJIRO_PROFILE.playerXp,
  unlockedCharacters: ['tanjiro', 'zenitsu', 'inosuke', 'kanao', 'genya'],
  selectedCharacterId: 'tanjiro',
  selectedBreathing: 'water',
  hasChosenStarter: false,
  tutorialCompleted: false,
  highestUnlockedLevel: 1,
  levelBestRanks: {},
  seenCutscenes: [],
  skipSeenCutscenes: false,
  audio: { ...DEFAULT_AUDIO },
  gameplay: { ...DEFAULT_GAMEPLAY },
  controlsLayout: cloneDefaultControlsLayout(),
  totalDemonsDefeated: 0,
  characterProfiles: {
    tanjiro: INITIAL_TANJIRO_PROFILE,
  },
  unlockedDemonSkins: {},
  equippedDemonSkins: {},
  survivalStats: { ...DEFAULT_SURVIVAL_STATS },
  selectedDifficulty: 'standard',
  dailyMissionDate: getTodayDateKey(),
  dailyMissions: generateDailyMissions(),
  claimedAchievements: [],
  demonKillCounts: {},
  playerStats: { ...DEFAULT_PLAYER_STATS },
};

export function getCharacterProfile(save: SaveData, charId?: string): CharacterProfile {
  const id = charId ?? save.selectedCharacterId;
  return save.characterProfiles?.[id] ?? createDefaultCharacterProfile(id);
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const freshProfile = createDefaultCharacterProfile('tanjiro');
      return {
        ...DEFAULT_SAVE,
        unlockedCharacters: [...DEFAULT_SAVE.unlockedCharacters],
        levelBestRanks: {},
        seenCutscenes: [],
        audio: { ...DEFAULT_AUDIO },
        gameplay: { ...DEFAULT_GAMEPLAY },
        controlsLayout: cloneDefaultControlsLayout(),
        characterProfiles: { tanjiro: freshProfile },
        dailyMissionDate: getTodayDateKey(),
        dailyMissions: generateDailyMissions(),
        playerStats: { ...DEFAULT_PLAYER_STATS },
      };
    }

    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const unlocked =
      Array.isArray(parsed.unlockedCharacters) && parsed.unlockedCharacters.length > 0
        ? Array.from(new Set([...DEFAULT_SAVE.unlockedCharacters, ...parsed.unlockedCharacters]))
        : [...DEFAULT_SAVE.unlockedCharacters];

    const selectedChar = unlocked.includes(parsed.selectedCharacterId ?? '')
      ? (parsed.selectedCharacterId as string)
      : 'tanjiro';

    const rawProfiles = parsed.characterProfiles && typeof parsed.characterProfiles === 'object'
      ? parsed.characterProfiles
      : null;

    const characterProfiles: Record<string, CharacterProfile> = {};
    if (rawProfiles) {
      for (const [cid, prof] of Object.entries(rawProfiles)) {
        characterProfiles[cid] = sanitizeProfile(cid, prof);
      }
    }

    if (!characterProfiles[selectedChar]) {
      const charDef = getCharacterById(selectedChar);
      characterProfiles[selectedChar] = sanitizeProfile(selectedChar, {
        characterId: selectedChar,
        coins: typeof parsed.coins === 'number' ? parsed.coins : 80,
        highestUnlockedLevel: typeof parsed.highestUnlockedLevel === 'number' ? parsed.highestUnlockedLevel : 1,
        levelBestRanks: parsed.levelBestRanks ?? {},
        seenCutscenes: Array.isArray(parsed.seenCutscenes) ? parsed.seenCutscenes : [],
        tutorialCompleted: Boolean(parsed.tutorialCompleted),
        selectedBreathing: parsed.selectedBreathing ?? charDef.defaultBreathing,
        totalDemonsDefeated: typeof parsed.totalDemonsDefeated === 'number' ? parsed.totalDemonsDefeated : 0,
      });
    }

    const todayKey = getTodayDateKey();
    const isSameDay = parsed.dailyMissionDate === todayKey && Array.isArray(parsed.dailyMissions) && parsed.dailyMissions.length === 3;
    const dailyMissions = isSameDay ? (parsed.dailyMissions as DailyMissionState[]) : generateDailyMissions(todayKey);

    const rawStats: Partial<PlayerStatistics> =
      parsed.playerStats && typeof parsed.playerStats === 'object' ? parsed.playerStats : {};
    const playerStats: PlayerStatistics = {
      demonsDefeated: Math.max(0, Math.floor(rawStats.demonsDefeated ?? characterProfiles[selectedChar].totalDemonsDefeated ?? 0)),
      bossesDefeated: Math.max(0, Math.floor(rawStats.bossesDefeated ?? 0)),
      levelsCleared: Math.max(0, Math.floor(rawStats.levelsCleared ?? Object.keys(characterProfiles[selectedChar].levelBestRanks).length)),
      perfectDodges: Math.max(0, Math.floor(rawStats.perfectDodges ?? 0)),
      noDamageWins: Math.max(0, Math.floor(rawStats.noDamageWins ?? 0)),
      breathingFinishers: Math.max(0, Math.floor(rawStats.breathingFinishers ?? 0)),
      chestsFound: Math.max(0, Math.floor(rawStats.chestsFound ?? 0)),
      sssRanks: Math.max(0, Math.floor(rawStats.sssRanks ?? 0)),
      trainingCompleted: Math.max(0, Math.floor(rawStats.trainingCompleted ?? 0)),
      secretBossesCleared: Math.max(0, Math.floor(rawStats.secretBossesCleared ?? 0)),
      totalDamageDealt: Math.max(0, Math.floor(rawStats.totalDamageDealt ?? 0)),
    };

    const validDiff: DifficultyMode[] = ['standard', 'hard', 'nightmare', 'abyssal'];
    const selectedDifficulty: DifficultyMode =
      parsed.selectedDifficulty && validDiff.includes(parsed.selectedDifficulty)
        ? parsed.selectedDifficulty
        : 'standard';

    const baseSave: SaveData = {
      coins: characterProfiles[selectedChar].coins,
      playerLevel: characterProfiles[selectedChar].playerLevel,
      playerXp: characterProfiles[selectedChar].playerXp,
      unlockedCharacters: unlocked,
      selectedCharacterId: selectedChar,
      selectedBreathing: characterProfiles[selectedChar].selectedBreathing,
      hasChosenStarter: Boolean(parsed.hasChosenStarter),
      tutorialCompleted: characterProfiles[selectedChar].tutorialCompleted,
      highestUnlockedLevel: characterProfiles[selectedChar].highestUnlockedLevel,
      levelBestRanks: characterProfiles[selectedChar].levelBestRanks,
      seenCutscenes: characterProfiles[selectedChar].seenCutscenes,
      skipSeenCutscenes: Boolean(parsed.skipSeenCutscenes),
      audio: {
        muted: Boolean(parsed.audio?.muted),
        musicEnabled: parsed.audio?.musicEnabled !== undefined ? Boolean(parsed.audio.musicEnabled) : true,
        sfxEnabled: parsed.audio?.sfxEnabled !== undefined ? Boolean(parsed.audio.sfxEnabled) : true,
        masterVolume:
          typeof parsed.audio?.masterVolume === 'number' ? parsed.audio.masterVolume : DEFAULT_AUDIO.masterVolume,
        musicVolume:
          typeof parsed.audio?.musicVolume === 'number' ? parsed.audio.musicVolume : DEFAULT_AUDIO.musicVolume,
        sfxVolume:
          typeof parsed.audio?.sfxVolume === 'number' ? parsed.audio.sfxVolume : DEFAULT_AUDIO.sfxVolume,
        subtitlesEnabled: Boolean(parsed.audio?.subtitlesEnabled),
      },
      gameplay: sanitizeGameplaySettings(parsed.gameplay),
      controlsLayout: sanitizeControlsLayout(parsed.controlsLayout),
      totalDemonsDefeated: characterProfiles[selectedChar].totalDemonsDefeated,
      characterProfiles,
      unlockedDemonSkins:
        parsed.unlockedDemonSkins && typeof parsed.unlockedDemonSkins === 'object'
          ? { ...parsed.unlockedDemonSkins }
          : {},
      equippedDemonSkins:
        parsed.equippedDemonSkins && typeof parsed.equippedDemonSkins === 'object'
          ? { ...parsed.equippedDemonSkins }
          : {},
      survivalStats: {
        highestWave: Math.max(0, Math.min(20, Math.floor(parsed.survivalStats?.highestWave ?? 0))),
        totalWins: Math.max(0, Math.floor(parsed.survivalStats?.totalWins ?? 0)),
        bestCoinsRun: Math.max(0, Math.floor(parsed.survivalStats?.bestCoinsRun ?? 0)),
        runsCompleted: Math.max(0, Math.floor(parsed.survivalStats?.runsCompleted ?? 0)),
      },
      selectedDifficulty,
      dailyMissionDate: todayKey,
      dailyMissions,
      claimedAchievements: Array.isArray(parsed.claimedAchievements) ? [...parsed.claimedAchievements] : [],
      demonKillCounts:
        parsed.demonKillCounts && typeof parsed.demonKillCounts === 'object'
          ? { ...parsed.demonKillCounts }
          : {},
      playerStats,
    };

    return syncTopLevelWithActiveProfile(baseSave);
  } catch {
    return {
      ...DEFAULT_SAVE,
      unlockedCharacters: [...DEFAULT_SAVE.unlockedCharacters],
      levelBestRanks: {},
      seenCutscenes: [],
      audio: { ...DEFAULT_AUDIO },
      gameplay: { ...DEFAULT_GAMEPLAY },
      controlsLayout: cloneDefaultControlsLayout(),
      characterProfiles: { tanjiro: createDefaultCharacterProfile('tanjiro') },
      unlockedDemonSkins: {},
      equippedDemonSkins: {},
      survivalStats: { ...DEFAULT_SURVIVAL_STATS },
      dailyMissionDate: getTodayDateKey(),
      dailyMissions: generateDailyMissions(),
      claimedAchievements: [],
      demonKillCounts: {},
      playerStats: { ...DEFAULT_PLAYER_STATS },
    };
  }
}

export function writeSaveData(save: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Ignore storage quota issues gracefully
  }
}

function updateProfileForChar(
  save: SaveData,
  charId: string,
  updater: (p: CharacterProfile) => CharacterProfile
): SaveData {
  const current = getCharacterProfile(save, charId);
  const nextProfile = updater(current);
  const updated = syncTopLevelWithActiveProfile({
    ...save,
    characterProfiles: {
      ...save.characterProfiles,
      [charId]: nextProfile,
    },
  });
  writeSaveData(updated);
  return updated;
}

function updateActiveProfile(save: SaveData, updater: (p: CharacterProfile) => CharacterProfile): SaveData {
  return updateProfileForChar(save, save.selectedCharacterId, updater);
}

export function purchaseCharacter(save: SaveData, charId: string): { ok: boolean; save: SaveData; message: string } {
  if (save.unlockedCharacters.includes(charId)) {
    return { ok: false, save, message: 'Character already unlocked.' };
  }
  const activeProfile = getCharacterProfile(save);
  const charDef = getCharacterById(charId);
  if (activeProfile.coins < charDef.price) {
    return { ok: false, save, message: `Need ${charDef.price - activeProfile.coins} more Slayer Coins.` };
  }

  // Deduct coins from the current character's profile, preserve their progress untouched,
  // unlock the new character, and initialize the newly unlocked character at Level 1!
  const updatedCurrentProfile: CharacterProfile = {
    ...activeProfile,
    coins: activeProfile.coins - charDef.price,
  };
  const newCharProfile =
    save.characterProfiles[charId] ?? createDefaultCharacterProfile(charId);

  const updated = syncTopLevelWithActiveProfile({
    ...save,
    unlockedCharacters: [...save.unlockedCharacters, charId],
    selectedCharacterId: charId,
    characterProfiles: {
      ...save.characterProfiles,
      [save.selectedCharacterId]: updatedCurrentProfile,
      [charId]: newCharProfile,
    },
  });
  writeSaveData(updated);
  return { ok: true, save: updated, message: `Unlocked ${charDef.name}!` };
}

export function selectCharacterAndBreathing(
  save: SaveData,
  charId: string,
  breathing?: BreathingStyleId,
  markChosen = true
): SaveData {
  if (!save.unlockedCharacters.includes(charId)) return save;

  // Ensure outgoing character's current profile stays saved cleanly
  const prevProfile = getCharacterProfile(save, save.selectedCharacterId);
  const existingTarget = save.characterProfiles[charId] ?? createDefaultCharacterProfile(charId);

  const targetProfile: CharacterProfile = {
    ...existingTarget,
    selectedBreathing: breathing ?? existingTarget.selectedBreathing,
  };

  const updated = syncTopLevelWithActiveProfile({
    ...save,
    selectedCharacterId: charId,
    hasChosenStarter: markChosen ? true : save.hasChosenStarter,
    characterProfiles: {
      ...save.characterProfiles,
      [save.selectedCharacterId]: prevProfile,
      [charId]: targetProfile,
    },
  });
  writeSaveData(updated);
  return updated;
}

export const UPGRADE_STAT_META: Array<{
  key: keyof CharacterUpgrades;
  label: string;
  shortLabel: string;
  bonusPerLevelLabel: string;
  description: string;
}> = [
  {
    key: 'vitality',
    label: 'Max Health',
    shortLabel: 'Vitality',
    bonusPerLevelLabel: '+22 Max HP',
    description: 'Increases maximum Slayer health pool in Story and Free Battle.',
  },
  {
    key: 'blade',
    label: 'Attack Power',
    shortLabel: 'Blade',
    bonusPerLevelLabel: '+9% Damage',
    description: 'Boosts katana slashes, heavy cleaves, and Breathing Form damage.',
  },
  {
    key: 'defense',
    label: 'Defense Ward',
    shortLabel: 'Defense',
    bonusPerLevelLabel: '+7% Mitigation',
    description: 'Reduces incoming demon melee and Blood Demon Art damage.',
  },
  {
    key: 'breathing',
    label: 'Breathing Recovery',
    shortLabel: 'Breathing',
    bonusPerLevelLabel: '+1.4/s Energy & +4% Spd',
    description: 'Accelerates Total Concentration Breathing energy recovery and footwork.',
  },
];

export function getUpgradeCost(currentLevel: number): number {
  return 65 + currentLevel * 55;
}

export const SWORD_UPGRADE_META: Array<{
  key: keyof SwordUpgrades;
  label: string;
  shortLabel: string;
  bonusPerLevelLabel: string;
  description: string;
}> = [
  {
    key: 'edge',
    label: 'Honed Nichirin Edge',
    shortLabel: 'Edge',
    bonusPerLevelLabel: '+7% Slash Power',
    description: 'Sharpens katana light/heavy slashes and execution strike output.',
  },
  {
    key: 'alloy',
    label: 'Scarlet Crimson Ore',
    shortLabel: 'Alloy',
    bonusPerLevelLabel: '+10% Form Damage',
    description: 'Amplifies Breathing Form damage and demon guard breaking.',
  },
  {
    key: 'tsuba',
    label: 'Forged Tsuba Balance',
    shortLabel: 'Tsuba',
    bonusPerLevelLabel: '+5% Guard & +0.06s Counter',
    description: 'Widens sword parry counter windows and hardens blocking.',
  },
  {
    key: 'scabbard',
    label: 'Quick-Draw Scabbard',
    shortLabel: 'Scabbard',
    bonusPerLevelLabel: '-6% Skill Cooldowns',
    description: 'Reduces recovery cooldowns across Heavy, Breathing Forms, and Ultimates.',
  },
];

export function getSwordUpgradeCost(currentLevel: number): number {
  return 75 + currentLevel * 65;
}

export function upgradeSwordStat(
  save: SaveData,
  charId: string,
  stat: keyof SwordUpgrades
): { ok: boolean; save: SaveData; message: string } {
  const target = getCharacterProfile(save, charId);
  const curr = target.swordUpgrades?.[stat] ?? 0;
  if (curr >= 5) {
    return { ok: false, save, message: 'Sword Forging already at Masterwork Tier V.' };
  }
  const cost = getSwordUpgradeCost(curr);
  if (target.coins < cost) {
    return { ok: false, save, message: `Need ${cost - target.coins} more Coins.` };
  }
  const statLabel = SWORD_UPGRADE_META.find((m) => m.key === stat)?.label ?? stat.toUpperCase();
  const updated = updateProfileForChar(save, charId, (p) => ({
    ...p,
    coins: p.coins - cost,
    swordUpgrades: {
      ...(p.swordUpgrades ?? { edge: 0, alloy: 0, tsuba: 0, scabbard: 0 }),
      [stat]: curr + 1,
    },
  }));
  return { ok: true, save: updated, message: `Forged ${statLabel} to Tier ${curr + 1}!` };
}

export function upgradeCharacterStat(
  save: SaveData,
  charId: string,
  stat: keyof CharacterUpgrades
): { ok: boolean; save: SaveData; message: string } {
  const target = getCharacterProfile(save, charId);
  const curr = target.upgrades[stat] ?? 0;
  if (curr >= 5) {
    return { ok: false, save, message: 'Upgrade already at maximum Tier V.' };
  }
  const cost = getUpgradeCost(curr);
  if (target.coins < cost) {
    return { ok: false, save, message: `Need ${cost - target.coins} more Coins.` };
  }
  const statLabel = UPGRADE_STAT_META.find((m) => m.key === stat)?.label ?? stat.toUpperCase();
  const updated = updateProfileForChar(save, charId, (p) => ({
    ...p,
    coins: p.coins - cost,
    upgrades: {
      ...p.upgrades,
      [stat]: curr + 1,
    },
  }));
  return { ok: true, save: updated, message: `Upgraded ${statLabel} to Lv.${curr + 1}!` };
}

export function selectCharacterSkin(save: SaveData, charId: string, skinId: string): SaveData {
  const target = getCharacterProfile(save, charId);
  if (skinId !== 'classic' && !target.unlockedSkins.includes(skinId)) {
    return save;
  }
  return updateProfileForChar(save, charId, (p) => ({
    ...p,
    selectedSkinId: skinId,
  }));
}

export function purchaseCharacterSkin(
  save: SaveData,
  charId: string,
  skinId: string,
  skinName: string,
  price: number
): { ok: boolean; save: SaveData; message: string } {
  const target = getCharacterProfile(save, charId);
  if (target.unlockedSkins.includes(skinId) || price <= 0) {
    const equipped = selectCharacterSkin(save, charId, skinId);
    return { ok: false, save: equipped, message: `${skinName} already unlocked.` };
  }
  if (target.coins < price) {
    return { ok: false, save, message: `Need ${price - target.coins} more Coins for ${skinName}.` };
  }
  const updated = updateProfileForChar(save, charId, (p) => ({
    ...p,
    coins: p.coins - price,
    unlockedSkins: Array.from(new Set([...p.unlockedSkins, skinId])),
    selectedSkinId: skinId,
  }));
  return { ok: true, save: updated, message: `Unlocked and equipped ${skinName}!` };
}

export function grantCharacterXp(
  save: SaveData,
  xpGain: number,
  charId?: string
): {
  save: SaveData;
  leveledUp: boolean;
  newLevel: number;
  newlyUnlockedAwakenings: AwakeningTierId[];
  unlockedNames: string[];
} {
  const targetId = charId ?? save.selectedCharacterId;
  const current = getCharacterProfile(save, targetId);
  const res = applyXpToProfile(current, xpGain);
  const updated = syncTopLevelWithActiveProfile({
    ...save,
    characterProfiles: {
      ...save.characterProfiles,
      [targetId]: res.profile,
    },
  });
  writeSaveData(updated);
  return {
    save: updated,
    leveledUp: res.leveledUp,
    newLevel: res.newLevel,
    newlyUnlockedAwakenings: res.newlyUnlockedAwakenings,
    unlockedNames: res.newlyUnlockedAwakenings.map((id) => AWAKENING_SPECS[id].name),
  };
}

export function purchaseUltimate(
  save: SaveData,
  charId: string,
  ultimateId: UltimateId,
  label: string,
  price: number
): { ok: boolean; save: SaveData; message: string } {
  const target = getCharacterProfile(save, charId);
  if (target.unlockedUltimates.includes(ultimateId)) {
    const equipped = equipUltimate(save, charId, ultimateId);
    return { ok: false, save: equipped, message: `${label} already unlocked.` };
  }
  if (target.coins < price) {
    return { ok: false, save, message: `Need ${price - target.coins} more Coins.` };
  }
  const updated = updateProfileForChar(save, charId, (p) => ({
    ...p,
    coins: p.coins - price,
    unlockedUltimates: Array.from(new Set([...p.unlockedUltimates, ultimateId])),
    equippedUltimate: ultimateId,
  }));
  return { ok: true, save: updated, message: `Unlocked & equipped ${label}!` };
}

export function equipUltimate(save: SaveData, charId: string, ultimateId: UltimateId): SaveData {
  const target = getCharacterProfile(save, charId);
  if (!target.unlockedUltimates.includes(ultimateId)) return save;
  return updateProfileForChar(save, charId, (p) => ({
    ...p,
    equippedUltimate: ultimateId,
  }));
}

export function selectDemonSkin(save: SaveData, demonArchetype: string, skinId: string): SaveData {
  const unlocked = save.unlockedDemonSkins?.[demonArchetype] ?? ['original'];
  if (skinId !== 'original' && !unlocked.includes(skinId)) return save;
  const updated: SaveData = {
    ...save,
    equippedDemonSkins: {
      ...save.equippedDemonSkins,
      [demonArchetype]: skinId,
    },
  };
  writeSaveData(updated);
  return updated;
}

export function purchaseDemonSkin(
  save: SaveData,
  demonArchetype: string,
  skinId: string,
  skinName: string,
  price: number
): { ok: boolean; save: SaveData; message: string } {
  const prevUnlocked = save.unlockedDemonSkins?.[demonArchetype] ?? ['original'];
  if (prevUnlocked.includes(skinId) || price <= 0) {
    return { ok: false, save: selectDemonSkin(save, demonArchetype, skinId), message: `${skinName} already unlocked.` };
  }
  const active = getCharacterProfile(save);
  if (active.coins < price) {
    return { ok: false, save, message: `Need ${price - active.coins} more Coins.` };
  }
  const updated = updateProfileForChar(save, save.selectedCharacterId, (p) => ({
    ...p,
    coins: p.coins - price,
  }));
  const withDemonSkin: SaveData = {
    ...updated,
    unlockedDemonSkins: {
      ...updated.unlockedDemonSkins,
      [demonArchetype]: Array.from(new Set(['original', ...prevUnlocked, skinId])),
    },
    equippedDemonSkins: {
      ...updated.equippedDemonSkins,
      [demonArchetype]: skinId,
    },
  };
  writeSaveData(withDemonSkin);
  return { ok: true, save: withDemonSkin, message: `Unlocked & equipped ${skinName}!` };
}

export function awardExplorationCoins(save: SaveData, coins: number): SaveData {
  if (coins <= 0) return save;
  return updateActiveProfile(save, (p) => {
    const withCoins: CharacterProfile = {
      ...p,
      coins: p.coins + Math.floor(coins),
    };
    return applyXpToProfile(withCoins, 18).profile;
  });
}

export function recordSurvivalProgress(
  save: SaveData,
  waveReached: number,
  wonRun: boolean,
  coinsEarned: number,
  demonsDefeated: number
): SaveData {
  const xpGain = Math.max(30, waveReached * 40 + demonsDefeated * 20);
  const withProfile = updateActiveProfile(save, (p) => {
    const base: CharacterProfile = {
      ...p,
      coins: p.coins + Math.max(0, Math.floor(coinsEarned)),
      totalDemonsDefeated: p.totalDemonsDefeated + Math.max(0, demonsDefeated),
    };
    return applyXpToProfile(base, xpGain).profile;
  });
  const updated: SaveData = {
    ...withProfile,
    survivalStats: {
      highestWave: Math.max(withProfile.survivalStats?.highestWave ?? 0, Math.min(20, waveReached)),
      totalWins: (withProfile.survivalStats?.totalWins ?? 0) + (wonRun ? 1 : 0),
      bestCoinsRun: Math.max(withProfile.survivalStats?.bestCoinsRun ?? 0, coinsEarned),
      runsCompleted: (withProfile.survivalStats?.runsCompleted ?? 0) + 1,
    },
  };
  writeSaveData(updated);
  return updated;
}

export function recordFreeBattleReward(
  save: SaveData,
  coinsEarned: number,
  demonsDefeated: number
): { save: SaveData; leveledUp: boolean; newLevel: number; unlockedNames: string[] } {
  let leveledUp = false;
  let newLevel = getCharacterProfile(save).playerLevel;
  let unlockedNames: string[] = [];
  const xpGain = Math.max(45, 55 + demonsDefeated * 20);
  const updated = updateActiveProfile(save, (p) => {
    const withReward: CharacterProfile = {
      ...p,
      coins: p.coins + Math.max(0, Math.floor(coinsEarned)),
      totalDemonsDefeated: p.totalDemonsDefeated + Math.max(0, demonsDefeated),
    };
    const res = applyXpToProfile(withReward, xpGain);
    leveledUp = res.leveledUp;
    newLevel = res.newLevel;
    unlockedNames = res.newlyUnlockedAwakenings.map((id) => AWAKENING_SPECS[id].name);
    return res.profile;
  });
  return { save: updated, leveledUp, newLevel, unlockedNames };
}

export function recordStoryDecision(save: SaveData, key: string, choice: string): SaveData {
  return updateActiveProfile(save, (p) => ({
    ...p,
    storyChoices: {
      ...p.storyChoices,
      [key]: choice,
    },
  }));
}

export function markCutsceneSeen(save: SaveData, cutsceneId: string): SaveData {
  const active = getCharacterProfile(save);
  if (active.seenCutscenes.includes(cutsceneId)) return save;
  return updateActiveProfile(save, (p) => ({
    ...p,
    seenCutscenes: [...p.seenCutscenes, cutsceneId],
  }));
}

export function updateAudioSettings(save: SaveData, audio: AudioSettings): SaveData {
  const updated: SaveData = { ...save, audio };
  writeSaveData(updated);
  return updated;
}

export function updateGameplaySettings(save: SaveData, gameplay: GameplaySettings): SaveData {
  const updated: SaveData = { ...save, gameplay };
  writeSaveData(updated);
  return updated;
}

export function updateControlsLayout(save: SaveData, layout: TouchControlsLayout): SaveData {
  const sanitized = sanitizeControlsLayout(layout);
  const updated: SaveData = { ...save, controlsLayout: sanitized };
  writeSaveData(updated);
  return updated;
}

export function resetControlsLayout(save: SaveData): SaveData {
  const updated: SaveData = { ...save, controlsLayout: cloneDefaultControlsLayout() };
  writeSaveData(updated);
  return updated;
}

export function recordTutorialCompleted(save: SaveData, bonusCoins = 50): SaveData {
  return updateActiveProfile(save, (p) => {
    const withReward: CharacterProfile = {
      ...p,
      tutorialCompleted: true,
      coins: p.coins + (p.tutorialCompleted ? 15 : bonusCoins),
      highestUnlockedLevel: Math.max(1, p.highestUnlockedLevel),
    };
    return applyXpToProfile(withReward, p.tutorialCompleted ? 15 : 30).profile;
  });
}

export function setDifficultyMode(save: SaveData, difficulty: DifficultyMode): SaveData {
  const updated: SaveData = { ...save, selectedDifficulty: difficulty };
  writeSaveData(updated);
  return updated;
}

export function applyRunStatisticsAndMissions(
  save: SaveData,
  delta: {
    demonsDefeated?: number;
    bossesDefeated?: number;
    levelsCleared?: number;
    perfectDodges?: number;
    noDamageWins?: number;
    breathingFinishers?: number;
    chestsFound?: number;
    sssRanks?: number;
    trainingCompleted?: number;
    secretBossesCleared?: number;
    totalDamageDealt?: number;
    killedArchetypes?: string[];
  }
): SaveData {
  const today = getTodayDateKey();
  const currentMissions =
    save.dailyMissionDate === today && save.dailyMissions.length === 3
      ? save.dailyMissions
      : generateDailyMissions(today);

  const metricAdd: Record<DailyMissionState['metric'], number> = {
    demons_defeated: delta.demonsDefeated ?? 0,
    levels_cleared: delta.levelsCleared ?? 0,
    perfect_dodges: delta.perfectDodges ?? 0,
    breathing_finishers: delta.breathingFinishers ?? 0,
    chests_found: delta.chestsFound ?? 0,
    bosses_defeated: delta.bossesDefeated ?? 0,
  };

  const nextMissions = currentMissions.map((m) => ({
    ...m,
    progress: Math.min(m.target, m.progress + (metricAdd[m.metric] ?? 0)),
  }));

  const prevStats = save.playerStats ?? DEFAULT_PLAYER_STATS;
  const nextStats: PlayerStatistics = {
    demonsDefeated: prevStats.demonsDefeated + (delta.demonsDefeated ?? 0),
    bossesDefeated: prevStats.bossesDefeated + (delta.bossesDefeated ?? 0),
    levelsCleared: prevStats.levelsCleared + (delta.levelsCleared ?? 0),
    perfectDodges: prevStats.perfectDodges + (delta.perfectDodges ?? 0),
    noDamageWins: prevStats.noDamageWins + (delta.noDamageWins ?? 0),
    breathingFinishers: prevStats.breathingFinishers + (delta.breathingFinishers ?? 0),
    chestsFound: prevStats.chestsFound + (delta.chestsFound ?? 0),
    sssRanks: prevStats.sssRanks + (delta.sssRanks ?? 0),
    trainingCompleted: prevStats.trainingCompleted + (delta.trainingCompleted ?? 0),
    secretBossesCleared: prevStats.secretBossesCleared + (delta.secretBossesCleared ?? 0),
    totalDamageDealt: prevStats.totalDamageDealt + (delta.totalDamageDealt ?? 0),
  };

  const nextKills = { ...(save.demonKillCounts ?? {}) };
  for (const arch of delta.killedArchetypes ?? []) {
    if (!arch) continue;
    nextKills[arch] = (nextKills[arch] ?? 0) + 1;
  }

  const updated: SaveData = {
    ...save,
    dailyMissionDate: today,
    dailyMissions: nextMissions,
    playerStats: nextStats,
    demonKillCounts: nextKills,
  };
  writeSaveData(updated);
  return updated;
}

export function claimDailyMission(save: SaveData, missionId: string): { ok: boolean; save: SaveData; message: string } {
  const mission = save.dailyMissions.find((m) => m.id === missionId);
  if (!mission) return { ok: false, save, message: 'Mission not found.' };
  if (mission.claimed) return { ok: false, save, message: 'Mission reward already claimed.' };
  if (mission.progress < mission.target) return { ok: false, save, message: 'Mission not completed yet.' };

  const withReward = updateActiveProfile(save, (p) => {
    const nextCoins = p.coins + mission.rewardCoins;
    return applyXpToProfile({ ...p, coins: nextCoins }, mission.rewardXp).profile;
  });
  const updated: SaveData = {
    ...withReward,
    dailyMissions: withReward.dailyMissions.map((m) => (m.id === missionId ? { ...m, claimed: true } : m)),
  };
  writeSaveData(updated);
  return { ok: true, save: updated, message: `Claimed +${mission.rewardCoins} Coins & +${mission.rewardXp} XP!` };
}

export function claimAchievement(save: SaveData, achId: string): { ok: boolean; save: SaveData; message: string } {
  if (save.claimedAchievements.includes(achId)) {
    return { ok: false, save, message: 'Achievement already claimed.' };
  }
  const def = ACHIEVEMENTS.find((a) => a.id === achId);
  if (!def) return { ok: false, save, message: 'Achievement not found.' };
  const val = save.playerStats?.[def.metric] ?? 0;
  if (val < def.target) return { ok: false, save, message: 'Requirement not met yet.' };

  const withReward = updateActiveProfile(save, (p) =>
    applyXpToProfile({ ...p, coins: p.coins + def.rewardCoins }, def.rewardXp).profile
  );
  const updated: SaveData = {
    ...withReward,
    claimedAchievements: [...withReward.claimedAchievements, achId],
  };
  writeSaveData(updated);
  return { ok: true, save: updated, message: `Achievement Unlocked: +${def.rewardCoins} Coins & +${def.rewardXp} XP!` };
}

export function recordTrainingOrSecretClear(
  save: SaveData,
  params: { trainingId?: string; secretBossId?: string; coinsEarned: number; xpEarned: number }
): SaveData {
  return updateActiveProfile(save, (p) => {
    const completedTrainingIds = params.trainingId
      ? Array.from(new Set([...(p.completedTrainingIds ?? []), params.trainingId]))
      : p.completedTrainingIds ?? [];
    const clearedSecretBossIds = params.secretBossId
      ? Array.from(new Set([...(p.clearedSecretBossIds ?? []), params.secretBossId]))
      : p.clearedSecretBossIds ?? [];
    return applyXpToProfile(
      {
        ...p,
        coins: p.coins + Math.max(0, Math.floor(params.coinsEarned)),
        completedTrainingIds,
        clearedSecretBossIds,
      },
      params.xpEarned
    ).profile;
  });
}

export function recordLevelVictory(
  save: SaveData,
  levelId: number,
  rank: CombatRank,
  coinsEarned: number,
  demonsDefeated: number,
  xpEarned = 30
): SaveData {
  const xpGain = Math.max(15, Math.floor(xpEarned));
  return updateActiveProfile(save, (p) => {
    const prevRank = p.levelBestRanks[levelId];
    const bestRank = !prevRank || RANK_WEIGHT[rank] > RANK_WEIGHT[prevRank] ? rank : prevRank;
    const withReward: CharacterProfile = {
      ...p,
      coins: p.coins + Math.max(0, Math.floor(coinsEarned)),
      highestUnlockedLevel: levelId > 0 ? Math.min(50, Math.max(p.highestUnlockedLevel, levelId + 1)) : p.highestUnlockedLevel,
      levelBestRanks:
        levelId > 0
          ? {
              ...p.levelBestRanks,
              [levelId]: bestRank,
            }
          : p.levelBestRanks,
      totalDemonsDefeated: p.totalDemonsDefeated + demonsDefeated,
    };
    return applyXpToProfile(withReward, xpGain).profile;
  });
}

export function resetCampaignForNewGame(save: SaveData): SaveData {
  const active = getCharacterProfile(save);
  const freshProfile: CharacterProfile = {
    ...active,
    coins: 80,
    playerLevel: 1,
    playerXp: 0,
    highestUnlockedLevel: 1,
    levelBestRanks: {},
    seenCutscenes: [],
    tutorialCompleted: false,
    unlockedAwakenings: ['mark'],
    upgrades: { vitality: 0, blade: 0, defense: 0, breathing: 0 },
    swordUpgrades: { edge: 0, alloy: 0, tsuba: 0, scabbard: 0 },
    storyChoices: {},
  };
  const updated = syncTopLevelWithActiveProfile({
    ...save,
    characterProfiles: {
      ...save.characterProfiles,
      [save.selectedCharacterId]: freshProfile,
    },
  });
  writeSaveData(updated);
  return updated;
}
