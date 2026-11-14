import { getCharacterById } from './characters';
import {
  AudioSettings,
  BreathingStyleId,
  CharacterProfile,
  CharacterUpgrades,
  SaveData,
} from './types';

const SAVE_KEY = 'dh_breath_of_the_abyss_save_v2';

export const DEFAULT_AUDIO: AudioSettings = {
  muted: false,
  masterVolume: 0.85,
  musicVolume: 0.68,
  sfxVolume: 0.85,
  subtitlesEnabled: false,
};

export function createDefaultCharacterProfile(charId: string): CharacterProfile {
  const charDef = getCharacterById(charId);
  return {
    characterId: charDef.id,
    coins: 80,
    highestUnlockedLevel: 1,
    levelBestRanks: {},
    seenCutscenes: [],
    tutorialCompleted: false,
    selectedBreathing: charDef.defaultBreathing,
    selectedSkinId: 'classic',
    upgrades: { vitality: 0, blade: 0, breathing: 0 },
    totalDemonsDefeated: 0,
    storyChoices: {},
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

  return {
    characterId: charDef.id,
    coins: typeof raw.coins === 'number' && raw.coins >= 0 ? Math.floor(raw.coins) : base.coins,
    highestUnlockedLevel:
      typeof raw.highestUnlockedLevel === 'number'
        ? Math.max(1, Math.min(50, Math.floor(raw.highestUnlockedLevel)))
        : 1,
    levelBestRanks:
      raw.levelBestRanks && typeof raw.levelBestRanks === 'object' ? { ...raw.levelBestRanks } : {},
    seenCutscenes: Array.isArray(raw.seenCutscenes) ? [...raw.seenCutscenes] : [],
    tutorialCompleted: Boolean(raw.tutorialCompleted),
    selectedBreathing: breathing,
    selectedSkinId: typeof raw.selectedSkinId === 'string' ? raw.selectedSkinId : 'classic',
    upgrades: {
      vitality: Math.max(0, Math.min(5, Math.floor(raw.upgrades?.vitality ?? 0))),
      blade: Math.max(0, Math.min(5, Math.floor(raw.upgrades?.blade ?? 0))),
      breathing: Math.max(0, Math.min(5, Math.floor(raw.upgrades?.breathing ?? 0))),
    },
    totalDemonsDefeated:
      typeof raw.totalDemonsDefeated === 'number' ? Math.max(0, raw.totalDemonsDefeated) : 0,
    storyChoices:
      raw.storyChoices && typeof raw.storyChoices === 'object' ? { ...raw.storyChoices } : {},
  };
}

function syncTopLevelWithActiveProfile(save: SaveData): SaveData {
  const active =
    save.characterProfiles[save.selectedCharacterId] ??
    createDefaultCharacterProfile(save.selectedCharacterId);
  return {
    ...save,
    coins: active.coins,
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

export const DEFAULT_SAVE: SaveData = {
  coins: INITIAL_TANJIRO_PROFILE.coins,
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
  totalDemonsDefeated: 0,
  characterProfiles: {
    tanjiro: INITIAL_TANJIRO_PROFILE,
  },
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
        characterProfiles: { tanjiro: freshProfile },
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

    // Backwards-compatible migration from legacy v2 saves without characterProfiles:
    // Migrate existing progress exclusively into the active character without polluting other characters!
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

    const baseSave: SaveData = {
      coins: characterProfiles[selectedChar].coins,
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
        masterVolume:
          typeof parsed.audio?.masterVolume === 'number' ? parsed.audio.masterVolume : DEFAULT_AUDIO.masterVolume,
        musicVolume:
          typeof parsed.audio?.musicVolume === 'number' ? parsed.audio.musicVolume : DEFAULT_AUDIO.musicVolume,
        sfxVolume:
          typeof parsed.audio?.sfxVolume === 'number' ? parsed.audio.sfxVolume : DEFAULT_AUDIO.sfxVolume,
        subtitlesEnabled: Boolean(parsed.audio?.subtitlesEnabled),
      },
      totalDemonsDefeated: characterProfiles[selectedChar].totalDemonsDefeated,
      characterProfiles,
    };

    return syncTopLevelWithActiveProfile(baseSave);
  } catch {
    return {
      ...DEFAULT_SAVE,
      unlockedCharacters: [...DEFAULT_SAVE.unlockedCharacters],
      levelBestRanks: {},
      seenCutscenes: [],
      audio: { ...DEFAULT_AUDIO },
      characterProfiles: { tanjiro: createDefaultCharacterProfile('tanjiro') },
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

export function getUpgradeCost(currentLevel: number): number {
  return 65 + currentLevel * 55;
}

export function upgradeCharacterStat(
  save: SaveData,
  charId: string,
  stat: keyof CharacterUpgrades
): { ok: boolean; save: SaveData; message: string } {
  const target = getCharacterProfile(save, charId);
  const curr = target.upgrades[stat];
  if (curr >= 5) {
    return { ok: false, save, message: 'Upgrade already at maximum Tier V.' };
  }
  const cost = getUpgradeCost(curr);
  if (target.coins < cost) {
    return { ok: false, save, message: `Need ${cost - target.coins} more Coins.` };
  }
  const updated = updateProfileForChar(save, charId, (p) => ({
    ...p,
    coins: p.coins - cost,
    upgrades: {
      ...p.upgrades,
      [stat]: curr + 1,
    },
  }));
  return { ok: true, save: updated, message: `Upgraded ${stat.toUpperCase()} to Tier ${curr + 1}!` };
}

export function selectCharacterSkin(save: SaveData, charId: string, skinId: string): SaveData {
  return updateProfileForChar(save, charId, (p) => ({
    ...p,
    selectedSkinId: skinId,
  }));
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

export function recordTutorialCompleted(save: SaveData, bonusCoins = 80): SaveData {
  return updateActiveProfile(save, (p) => ({
    ...p,
    tutorialCompleted: true,
    coins: p.coins + (p.tutorialCompleted ? 15 : bonusCoins),
    highestUnlockedLevel: Math.max(1, p.highestUnlockedLevel),
  }));
}

export function recordLevelVictory(
  save: SaveData,
  levelId: number,
  rank: 'S' | 'A' | 'B',
  coinsEarned: number,
  demonsDefeated: number
): SaveData {
  const rankWeight = { B: 1, A: 2, S: 3 };
  return updateActiveProfile(save, (p) => {
    const prevRank = p.levelBestRanks[levelId];
    const bestRank = !prevRank || rankWeight[rank] > rankWeight[prevRank] ? rank : prevRank;
    return {
      ...p,
      coins: p.coins + coinsEarned,
      highestUnlockedLevel: Math.min(50, Math.max(p.highestUnlockedLevel, levelId + 1)),
      levelBestRanks: {
        ...p.levelBestRanks,
        [levelId]: bestRank,
      },
      totalDemonsDefeated: p.totalDemonsDefeated + demonsDefeated,
    };
  });
}
