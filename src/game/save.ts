import { getCharacterById } from './characters';
import { AudioSettings, BreathingStyleId, SaveData } from './types';

const SAVE_KEY = 'dh_breath_of_the_abyss_save_v2';

export const DEFAULT_AUDIO: AudioSettings = {
  muted: false,
  masterVolume: 0.8,
  musicVolume: 0.55,
  sfxVolume: 0.85,
  subtitlesEnabled: false,
};

export const DEFAULT_SAVE: SaveData = {
  coins: 80,
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
};

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_SAVE,
        unlockedCharacters: [...DEFAULT_SAVE.unlockedCharacters],
        levelBestRanks: {},
        seenCutscenes: [],
        audio: { ...DEFAULT_AUDIO },
      };
    }
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const unlocked = Array.isArray(parsed.unlockedCharacters) && parsed.unlockedCharacters.length > 0
      ? Array.from(new Set([...DEFAULT_SAVE.unlockedCharacters, ...parsed.unlockedCharacters]))
      : [...DEFAULT_SAVE.unlockedCharacters];

    const selectedChar = unlocked.includes(parsed.selectedCharacterId ?? '')
      ? (parsed.selectedCharacterId as string)
      : 'tanjiro';

    const charDef = getCharacterById(selectedChar);
    const breathing = parsed.selectedBreathing ?? charDef.defaultBreathing;

    return {
      coins: typeof parsed.coins === 'number' && parsed.coins >= 0 ? Math.floor(parsed.coins) : DEFAULT_SAVE.coins,
      unlockedCharacters: unlocked,
      selectedCharacterId: selectedChar,
      selectedBreathing: breathing,
      hasChosenStarter: Boolean(parsed.hasChosenStarter),
      tutorialCompleted: Boolean(parsed.tutorialCompleted),
      highestUnlockedLevel:
        typeof parsed.highestUnlockedLevel === 'number'
          ? Math.max(1, Math.min(50, Math.floor(parsed.highestUnlockedLevel)))
          : 1,
      levelBestRanks: parsed.levelBestRanks && typeof parsed.levelBestRanks === 'object' ? parsed.levelBestRanks : {},
      seenCutscenes: Array.isArray(parsed.seenCutscenes) ? parsed.seenCutscenes : [],
      skipSeenCutscenes: Boolean(parsed.skipSeenCutscenes),
      audio: {
        muted: Boolean(parsed.audio?.muted),
        masterVolume: typeof parsed.audio?.masterVolume === 'number' ? parsed.audio.masterVolume : DEFAULT_AUDIO.masterVolume,
        musicVolume: typeof parsed.audio?.musicVolume === 'number' ? parsed.audio.musicVolume : DEFAULT_AUDIO.musicVolume,
        sfxVolume: typeof parsed.audio?.sfxVolume === 'number' ? parsed.audio.sfxVolume : DEFAULT_AUDIO.sfxVolume,
        subtitlesEnabled: Boolean(parsed.audio?.subtitlesEnabled),
      },
      totalDemonsDefeated:
        typeof parsed.totalDemonsDefeated === 'number' ? Math.max(0, parsed.totalDemonsDefeated) : 0,
    };
  } catch {
    return {
      ...DEFAULT_SAVE,
      unlockedCharacters: [...DEFAULT_SAVE.unlockedCharacters],
      levelBestRanks: {},
      seenCutscenes: [],
      audio: { ...DEFAULT_AUDIO },
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

export function purchaseCharacter(save: SaveData, charId: string): { ok: boolean; save: SaveData; message: string } {
  if (save.unlockedCharacters.includes(charId)) {
    return { ok: false, save, message: 'Character already unlocked.' };
  }
  const charDef = getCharacterById(charId);
  if (save.coins < charDef.price) {
    return { ok: false, save, message: `Need ${charDef.price - save.coins} more Slayer Coins.` };
  }
  const updated: SaveData = {
    ...save,
    coins: save.coins - charDef.price,
    unlockedCharacters: [...save.unlockedCharacters, charId],
    selectedCharacterId: charId,
    selectedBreathing: charDef.defaultBreathing,
  };
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
  const charDef = getCharacterById(charId);
  const updated: SaveData = {
    ...save,
    selectedCharacterId: charId,
    selectedBreathing: breathing ?? charDef.defaultBreathing,
    hasChosenStarter: markChosen ? true : save.hasChosenStarter,
  };
  writeSaveData(updated);
  return updated;
}

export function markCutsceneSeen(save: SaveData, cutsceneId: string): SaveData {
  if (save.seenCutscenes.includes(cutsceneId)) return save;
  const updated: SaveData = {
    ...save,
    seenCutscenes: [...save.seenCutscenes, cutsceneId],
  };
  writeSaveData(updated);
  return updated;
}

export function updateAudioSettings(save: SaveData, audio: AudioSettings): SaveData {
  const updated: SaveData = { ...save, audio };
  writeSaveData(updated);
  return updated;
}

export function recordTutorialCompleted(save: SaveData, bonusCoins = 80): SaveData {
  const already = save.tutorialCompleted;
  const updated: SaveData = {
    ...save,
    tutorialCompleted: true,
    coins: save.coins + (already ? 15 : bonusCoins),
    highestUnlockedLevel: Math.max(1, save.highestUnlockedLevel),
  };
  writeSaveData(updated);
  return updated;
}

export function recordLevelVictory(
  save: SaveData,
  levelId: number,
  rank: 'S' | 'A' | 'B',
  coinsEarned: number,
  demonsDefeated: number
): SaveData {
  const rankWeight = { B: 1, A: 2, S: 3 };
  const prevRank = save.levelBestRanks[levelId];
  const bestRank =
    !prevRank || rankWeight[rank] > rankWeight[prevRank] ? rank : prevRank;

  const updated: SaveData = {
    ...save,
    coins: save.coins + coinsEarned,
    highestUnlockedLevel: Math.min(50, Math.max(save.highestUnlockedLevel, levelId + 1)),
    levelBestRanks: {
      ...save.levelBestRanks,
      [levelId]: bestRank,
    },
    totalDemonsDefeated: save.totalDemonsDefeated + demonsDefeated,
  };
  writeSaveData(updated);
  return updated;
}
