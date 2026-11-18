/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { CampaignModal } from './components/CampaignModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { CharacterUpgradeModal } from './components/CharacterUpgradeModal';
import { ControlCustomizerModal } from './components/ControlCustomizerModal';
import { CutsceneOverlay } from './components/CutsceneOverlay';
import { DemonEncyclopediaModal } from './components/DemonEncyclopediaModal';
import { DemonSkinsModal } from './components/DemonSkinsModal';
import { GameHud } from './components/GameHud';
import { GameOverlays } from './components/GameOverlays';
import { MobileControls } from './components/MobileControls';
import { RosterShopModal } from './components/RosterShopModal';
import { SettingsModal } from './components/SettingsModal';
import { SlayerHubModal } from './components/SlayerHubModal';
import { SoundEngine } from './game/audio';
import { AWAKENING_SPECS, ULTIMATE_SPECS } from './game/breathing';
import {
  buildCutsceneForPlayer,
  CUTSCENES,
  getCampaignForCharacter,
  getCharacterCampaignInfo,
} from './game/campaign';
import { getCharacterSkins, getDemonSkins } from './game/characters';
import { HEAVY_ATTACK_COOLDOWN } from './game/constants';
import { GameEngine } from './game/engine';
import {
  applyRunStatisticsAndMissions,
  awardExplorationCoins,
  claimAchievement,
  claimDailyMission,
  equipUltimate,
  getCharacterProfile,
  getTotalXpForProfile,
  getXpForNextLevel,
  loadSaveData,
  markCutsceneSeen,
  purchaseCharacter,
  purchaseCharacterSkin,
  purchaseDemonSkin,
  purchaseUltimate,
  recordFreeBattleReward,
  recordLevelVictory,
  recordSurvivalProgress,
  recordTrainingOrSecretClear,
  recordTutorialCompleted,
  resetCampaignForNewGame,
  selectCharacterAndBreathing,
  selectCharacterSkin,
  selectDemonSkin,
  setDifficultyMode,
  updateAudioSettings,
  updateControlsLayout,
  updateGameplaySettings,
  upgradeCharacterStat,
  upgradeSwordStat,
  writeSaveData,
} from './game/save';
import {
  AudioSettings,
  BreathingStyleId,
  CharacterUpgrades,
  CutsceneDef,
  DemonArchetype,
  DifficultyMode,
  GameplaySettings,
  HudSnapshot,
  MapId,
  SaveData,
  SwordUpgrades,
  TouchControlsLayout,
  UltimateId,
} from './game/types';

declare global {
  interface Window {
    AndroidNavigation?: {
      exitGame?: () => void;
      ensureFullscreen?: () => void;
    };
  }
}

type ModalScreen =
  | 'charSelect'
  | 'upgrades'
  | 'campaign'
  | 'shop'
  | 'demonSkins'
  | 'encyclopedia'
  | 'hub'
  | 'settings'
  | 'controls';

const INITIAL_HUD: HudSnapshot = {
  phase: 'TITLE_MENU',
  mode: 'STORY',
  levelId: 1,
  levelTitle: 'First Night Beneath Bamboo',
  mapId: 'bamboo_forest',
  difficultyMode: 'standard',
  playerName: 'Tanjiro Kamado',
  playerHp: 138,
  playerMaxHp: 138,
  playerEnergy: 50,
  playerMaxEnergy: 100,
  breathingStyle: 'water',
  breathingStyleName: 'Water Breathing',
  totalFormsForStyle: 11,
  heavyCooldown: 0,
  maxHeavyCooldown: HEAVY_ATTACK_COOLDOWN,
  formCooldowns: new Array(11).fill(0),
  counterReady: false,
  actionWarning: null,
  awakeningMeter: 0,
  awakeningActive: false,
  awakeningTimer: 0,
  awakeningTier: null,
  awakeningCooldown: 0,
  equippedUltimate: 'eternal_sun',
  ultimateCooldown: 0,
  maxUltimateCooldown: 12,
  transparentWorldActive: false,
  transparentWorldTimer: 0,
  transparentWorldCooldown: 0,
  transparentWorldAvailable: false,
  enemyName: 'Feral Night Demon',
  enemySubtitle: 'Lesser Demon',
  enemyHp: 135,
  enemyMaxHp: 135,
  enemyState: 'IDLE',
  enemyWaveIndex: 1,
  enemyWaveTotal: 1,
  bossPhase: 1,
  isBossBattle: false,
  enemyTelegraph: null,
  partnerEnemyName: null,
  partnerEnemyHp: 0,
  partnerEnemyMaxHp: 0,
  allies: [],
  zoneIndex: 1,
  zoneTotal: 4,
  zoneName: 'Bamboo Edge',
  advancePrompt: null,
  playerWorldX: 680,
  worldWidth: 9600,
  survivalWave: 1,
  survivalMaxWaves: 20,
  survivalEnemiesLeft: 1,
  survivalCountdown: 0,
  survivalCoinsEarned: 0,
  tutorialStep: 1,
  tutorialTitle: 'Arrival at Mt. Sagiri',
  tutorialInstruction: 'Move forward or tap Slash/Continue to begin your trial.',
  tutorialMentorLine: '',
  rockHp: 180,
  rockMaxHp: 180,
  coins: 80,
  coinsEarnedThisRun: 0,
  playerLevel: 1,
  playerXp: 0,
  playerXpToNext: 16,
  totalPlayerXp: 0,
  lastRank: null,
  scoreBreakdown: null,
  comboCount: 0,
  muted: false,
  matchTime: 0,
  ragdollHitsLanded: 0,
};

interface ActiveCutsceneState {
  cutscene: CutsceneDef;
  onDone: () => void;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [save, setSave] = useState<SaveData>(() => loadSaveData());
  const saveRef = useRef<SaveData>(save);
  saveRef.current = save;

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    ...INITIAL_HUD,
    difficultyMode: save.selectedDifficulty,
    coins: save.coins,
    playerLevel: save.playerLevel,
    playerXp: save.playerXp,
    playerXpToNext: getXpForNextLevel(save.playerLevel),
    totalPlayerXp: getTotalXpForProfile(save.playerLevel, save.playerXp),
  }));
  const [engineReady, setEngineReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  const [modalStack, setModalStack] = useState<ModalScreen[]>([]);
  const [pendingAfterCharSelect, setPendingAfterCharSelect] = useState<
    ((charId: string, breathing: BreathingStyleId) => void) | null
  >(null);
  const [activeCutscene, setActiveCutscene] = useState<ActiveCutsceneState | null>(null);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);

  const activeModal = modalStack[modalStack.length - 1] ?? null;

  const fallbackSoundRef = useRef<SoundEngine | null>(null);
  if (!fallbackSoundRef.current) {
    fallbackSoundRef.current = new SoundEngine();
  }

  const pushModal = (screen: ModalScreen) => {
    setExitPromptOpen(false);
    setModalStack((prev) => {
      if (prev[prev.length - 1] === screen) return prev;
      return [...prev, screen];
    });
  };

  const popModal = () => {
    setModalStack((prev) => {
      if (prev.length === 0) return prev;
      const closing = prev[prev.length - 1];
      if (closing === 'charSelect') {
        setPendingAfterCharSelect(null);
        if (engineRef.current?.phase === 'TITLE_MENU') {
          engineRef.current.setMenuMusicTheme('menu', saveRef.current.selectedCharacterId);
        }
      }
      return prev.slice(0, -1);
    });
  };

  const clearModals = () => {
    setModalStack([]);
    setPendingAfterCharSelect(null);
  };

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 1150);
    const hideTimer = setTimeout(() => setShowSplash(false), 1600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    const unlockOnce = () => {
      engineRef.current?.sound.unlock();
    };
    window.addEventListener('pointerdown', unlockOnce, { passive: true });
    window.addEventListener('keydown', unlockOnce, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const syncProgressionToEngine = (engine: GameEngine, prevSave: SaveData, updated: SaveData) => {
      const prevUnlocks = new Set(getCharacterProfile(prevSave, prevSave.selectedCharacterId).unlockedAwakenings);
      const nextProf = getCharacterProfile(updated, updated.selectedCharacterId);
      const newlyUnlockedNames = nextProf.unlockedAwakenings
        .filter((id) => !prevUnlocks.has(id))
        .map((id) => AWAKENING_SPECS[id].name);
      engine.setCoinsBalance(updated.coins);
      engine.setDifficultyMode(updated.selectedDifficulty);
      engine.setSwordUpgrades(nextProf.swordUpgrades);
      engine.setPlayerProgression(updated.playerLevel, updated.playerXp, newlyUnlockedNames);
    };

    const engine = new GameEngine(canvas, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onTutorialComplete: () => {
        const prev = saveRef.current;
        const updated = recordTutorialCompleted(prev, 80);
        setSave(updated);
        syncProgressionToEngine(engine, prev, updated);
      },
      onExploreCachePickup: (_cacheId, coins) => {
        const prev = saveRef.current;
        const withCoins = awardExplorationCoins(prev, coins);
        const updated = applyRunStatisticsAndMissions(withCoins, { chestsFound: 1 });
        setSave(updated);
        syncProgressionToEngine(engine, prev, updated);
      },
      onSurvivalComplete: (wave, won, coinsEarned, demonsDefeated) => {
        const prev = saveRef.current;
        const withSurv = recordSurvivalProgress(prev, wave, won, coinsEarned, demonsDefeated);
        const updated = applyRunStatisticsAndMissions(withSurv, { demonsDefeated });
        setSave(updated);
        syncProgressionToEngine(engine, prev, updated);
      },
      onLevelComplete: (levelId, rank, coinsEarned, kills, xpEarned, _breakdown, extra) => {
        const prev = saveRef.current;
        let baseSave: SaveData;
        if (extra.trainingId) {
          baseSave = recordTrainingOrSecretClear(prev, {
            trainingId: extra.trainingId,
            coinsEarned,
            xpEarned,
          });
        } else if (extra.secretBossId) {
          baseSave = recordTrainingOrSecretClear(prev, {
            secretBossId: extra.secretBossId,
            coinsEarned,
            xpEarned,
          });
        } else if (levelId > 0) {
          baseSave = recordLevelVictory(prev, levelId, rank, coinsEarned, kills, xpEarned);
        } else {
          baseSave = recordFreeBattleReward(prev, coinsEarned, kills).save;
        }

        const updated = applyRunStatisticsAndMissions(baseSave, {
          demonsDefeated: extra.demonsDefeated,
          bossesDefeated: extra.bossesDefeated,
          levelsCleared: levelId > 0 ? 1 : 0,
          perfectDodges: extra.perfectDodges,
          noDamageWins: extra.noDamage ? 1 : 0,
          breathingFinishers: extra.breathingFinishers,
          chestsFound: extra.chestsFound,
          sssRanks: rank === 'SSS' ? 1 : 0,
          trainingCompleted: extra.trainingId ? 1 : 0,
          secretBossesCleared: extra.secretBossId ? 1 : 0,
          totalDamageDealt: extra.totalDamageDealt,
          killedArchetypes: extra.killedArchetypes,
        });

        setSave(updated);
        syncProgressionToEngine(engine, prev, updated);

        if (levelId > 0) {
          const campaign = getCampaignForCharacter(updated.selectedCharacterId);
          const lvlDef = campaign.find((l) => l.id === levelId);
          const postId = lvlDef?.postCutsceneId ?? (levelId === 50 ? 'cs_ending' : undefined);
          if (postId && CUTSCENES[postId]) {
            const skip = updated.skipSeenCutscenes && updated.seenCutscenes.includes(postId);
            if (!skip) {
              setActiveCutscene({
                cutscene: buildCutsceneForPlayer(
                  postId,
                  updated.selectedCharacterId,
                  updated.selectedBreathing
                ),
                onDone: () => {
                  setSave((p) => markCutsceneSeen(p, postId));
                  setActiveCutscene(null);
                },
              });
            }
          }
        }
      },
    });
    const initProf = getCharacterProfile(saveRef.current, saveRef.current.selectedCharacterId);
    engine.setCoinsBalance(saveRef.current.coins);
    engine.setDifficultyMode(saveRef.current.selectedDifficulty);
    engine.setSwordUpgrades(initProf.swordUpgrades);
    engine.setPlayerProgression(saveRef.current.playerLevel, saveRef.current.playerXp);
    engine.setEquippedDemonSkins(saveRef.current.equippedDemonSkins);
    engine.applyAudioSettings(saveRef.current.audio);
    engine.applyGameplaySettings(saveRef.current.gameplay);
    engineRef.current = engine;
    setEngineReady(true);
    engine.startLoop();

    const handleResize = () => {
      engine.resize();
      window.AndroidNavigation?.ensureFullscreen?.();
    };
    const handleBlur = () => engine.clearHeldInputs();
    const handleVisibility = () => {
      if (document.hidden) {
        engine.clearHeldInputs();
      }
      engine.sound.handleAppVisibilityChange(document.hidden);
    };
    const handlePageHide = () => {
      engine.clearHeldInputs();
      engine.sound.handleAppVisibilityChange(true);
    };
    const handleFocus = () => {
      engine.sound.handleAppVisibilityChange(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const code = e.code;

      if (code === 'Escape' || code === 'KeyP') {
        if (navRef.current.modalStack.length > 0 || navRef.current.activeCutscene || navRef.current.exitPromptOpen) {
          if (code === 'Escape') {
            e.preventDefault();
            navRef.current.handleBack();
          }
          return;
        }
        if (engine.phase === 'PLAYING' || engine.phase === 'PAUSED') {
          e.preventDefault();
          engine.togglePause();
        }
        return;
      }

      if (engine.phase !== 'PLAYING' || navRef.current.modalStack.length > 0) return;

      if (code === 'KeyA' || code === 'ArrowLeft') {
        engine.setHeldInput('left', true);
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        engine.setHeldInput('right', true);
      } else if (code === 'KeyL' || code === 'KeyC' || code === 'ArrowDown' || code === 'KeyS') {
        engine.setHeldInput('block', true);
      } else if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
        e.preventDefault();
        engine.triggerAction('jump');
      } else if (code === 'KeyJ' || code === 'KeyZ') {
        engine.triggerAction('light');
      } else if (code === 'KeyK' || code === 'KeyX') {
        engine.triggerAction('heavy');
      } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
        engine.triggerAction('dodge');
      } else if (code === 'KeyQ') {
        engine.triggerAwakening();
      } else if (code === 'KeyT') {
        engine.triggerTransparentWorld();
      } else if (code === 'KeyU') {
        engine.triggerUltimate();
      } else if (code === 'Digit1' || code === 'KeyE') {
        engine.triggerBreathingForm(1);
      } else if (code === 'Digit2') {
        engine.triggerBreathingForm(2);
      } else if (code === 'Digit3') {
        engine.triggerBreathingForm(3);
      } else if (code === 'Digit4') {
        engine.triggerBreathingForm(4);
      } else if (code === 'Digit5') {
        engine.triggerBreathingForm(5);
      } else if (code === 'Digit6') {
        engine.triggerBreathingForm(6);
      } else if (code === 'Digit7') {
        engine.triggerBreathingForm(7);
      } else if (code === 'Digit8') {
        engine.triggerBreathingForm(8);
      } else if (code === 'Digit9') {
        engine.triggerBreathingForm(9);
      } else if (code === 'Digit0') {
        engine.triggerBreathingForm(10);
      } else if (code === 'KeyF') {
        engine.interactNearbyInvestigation();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft') {
        engine.setHeldInput('left', false);
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        engine.setHeldInput('right', false);
      } else if (code === 'KeyL' || code === 'KeyC' || code === 'ArrowDown' || code === 'KeyS') {
        engine.setHeldInput('block', false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engine.stopLoop();
      engineRef.current = null;
    };
  }, []);

  const handleBackNavigation = () => {
    if (exitPromptOpen) {
      setExitPromptOpen(false);
      return;
    }
    if (activeCutscene) {
      activeCutscene.onDone();
      return;
    }
    if (modalStack.length > 0) {
      popModal();
      return;
    }
    const phase = engineRef.current?.phase;
    if (phase === 'PLAYING' || phase === 'PAUSED') {
      engineRef.current?.togglePause();
      return;
    }
    if (phase === 'VICTORY' || phase === 'DEFEAT') {
      engineRef.current?.returnToTitle();
      return;
    }
    setExitPromptOpen(true);
  };

  const navRef = useRef({
    modalStack,
    activeCutscene,
    exitPromptOpen,
    hudPhase: hud.phase,
    handleBack: handleBackNavigation,
  });
  navRef.current = {
    modalStack,
    activeCutscene,
    exitPromptOpen,
    hudPhase: hud.phase,
    handleBack: handleBackNavigation,
  };

  const historyGuardRef = useRef(false);
  useEffect(() => {
    const isNested =
      modalStack.length > 0 ||
      Boolean(activeCutscene) ||
      hud.phase !== 'TITLE_MENU' ||
      exitPromptOpen;

    if (isNested && !historyGuardRef.current) {
      try {
        window.history.pushState({ slayerNavGuard: true }, '');
        historyGuardRef.current = true;
      } catch {
        // Ignore restricted history APIs
      }
    } else if (!isNested && historyGuardRef.current) {
      historyGuardRef.current = false;
    }
  }, [modalStack.length, activeCutscene, hud.phase, exitPromptOpen]);

  useEffect(() => {
    const onBackEvent = (e?: Event) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      navRef.current.handleBack();
    };

    const onPopState = () => {
      const n = navRef.current;
      const isNested =
        n.modalStack.length > 0 ||
        Boolean(n.activeCutscene) ||
        n.hudPhase !== 'TITLE_MENU' ||
        n.exitPromptOpen;
      if (isNested) {
        try {
          window.history.pushState({ slayerNavGuard: true }, '');
          historyGuardRef.current = true;
        } catch {
          // Ignore
        }
        n.handleBack();
      } else {
        historyGuardRef.current = false;
      }
    };

    window.addEventListener('androidHardwareBack', onBackEvent);
    document.addEventListener('backbutton', onBackEvent);
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('androidHardwareBack', onBackEvent);
      document.removeEventListener('backbutton', onBackEvent);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  const maybePlayCutscene = (cutsceneId: string | undefined, after: () => void) => {
    const base = cutsceneId ? CUTSCENES[cutsceneId] : undefined;
    const latest = saveRef.current;
    if (!base || (latest.skipSeenCutscenes && latest.seenCutscenes.includes(base.id))) {
      after();
      return;
    }
    const personalized = buildCutsceneForPlayer(
      base.id,
      latest.selectedCharacterId,
      latest.selectedBreathing
    );
    setActiveCutscene({
      cutscene: personalized,
      onDone: () => {
        setSave((prev) => markCutsceneSeen(prev, base.id));
        setActiveCutscene(null);
        after();
      },
    });
  };

  const launchTutorialWith = (charId: string, breathing: BreathingStyleId) => {
    clearModals();
    const campaignInfo = getCharacterCampaignInfo(charId);
    const prof = getCharacterProfile(saveRef.current, charId);
    engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
    engineRef.current?.setDifficultyMode(saveRef.current.selectedDifficulty);
    maybePlayCutscene(campaignInfo.prologueCutsceneId || 'cs_opening', () => {
      engineRef.current?.startTutorial(
        charId,
        breathing,
        prof.upgrades,
        prof.selectedSkinId,
        prof.unlockedAwakenings,
        prof.equippedUltimate
      );
    });
  };

  const launchStoryLevelWith = (levelId: number, charId: string, breathing: BreathingStyleId) => {
    clearModals();
    const campaign = getCampaignForCharacter(charId);
    const campaignInfo = getCharacterCampaignInfo(charId);
    const levelDef = campaign.find((l) => l.id === levelId) ?? campaign[0];
    const prof = getCharacterProfile(saveRef.current, charId);
    engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
    engineRef.current?.setDifficultyMode(saveRef.current.selectedDifficulty);
    const preCutsceneId =
      levelDef.cutsceneId ?? (levelId === 1 ? campaignInfo.prologueCutsceneId : undefined);
    maybePlayCutscene(preCutsceneId, () => {
      engineRef.current?.startStoryLevel(
        levelId,
        charId,
        breathing,
        levelDef,
        prof.upgrades,
        prof.selectedSkinId,
        prof.unlockedAwakenings,
        prof.equippedUltimate,
        saveRef.current.equippedDemonSkins
      );
    });
  };

  const handleStartTutorial = () => {
    if (!save.hasChosenStarter) {
      setPendingAfterCharSelect(() => (charId: string, breathing: BreathingStyleId) => {
        launchTutorialWith(charId, breathing);
      });
      engineRef.current?.setMenuMusicTheme('char_select', save.selectedCharacterId);
      pushModal('charSelect');
      return;
    }
    launchTutorialWith(save.selectedCharacterId, save.selectedBreathing);
  };

  const handleStartStoryLevel = (levelId: number) => {
    if (!save.hasChosenStarter) {
      setPendingAfterCharSelect(() => (charId: string, breathing: BreathingStyleId) => {
        launchStoryLevelWith(levelId, charId, breathing);
      });
      engineRef.current?.setMenuMusicTheme('char_select', save.selectedCharacterId);
      pushModal('charSelect');
      return;
    }
    launchStoryLevelWith(levelId, save.selectedCharacterId, save.selectedBreathing);
  };

  const handleStartSurvival = () => {
    clearModals();
    const charId = saveRef.current.selectedCharacterId;
    const prof = getCharacterProfile(saveRef.current, charId);
    engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
    engineRef.current?.setDifficultyMode(saveRef.current.selectedDifficulty);
    engineRef.current?.startSurvivalMode(
      'infinity_castle',
      charId,
      saveRef.current.selectedBreathing,
      prof.upgrades,
      prof.selectedSkinId,
      prof.unlockedAwakenings,
      prof.equippedUltimate,
      saveRef.current.equippedDemonSkins
    );
  };

  const handleContinueGame = () => {
    if (!save.tutorialCompleted) {
      handleStartTutorial();
    } else {
      handleStartStoryLevel(save.highestUnlockedLevel);
    }
  };

  const handleStartPractice = (
    mapId: MapId,
    demon: DemonArchetype,
    breathing: BreathingStyleId
  ) => {
    clearModals();
    const prof = getCharacterProfile(saveRef.current, saveRef.current.selectedCharacterId);
    engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
    engineRef.current?.setDifficultyMode(saveRef.current.selectedDifficulty);
    engineRef.current?.startPracticeMatch(
      mapId,
      demon,
      saveRef.current.selectedCharacterId,
      breathing,
      prof.upgrades,
      prof.selectedSkinId,
      prof.unlockedAwakenings,
      prof.equippedUltimate,
      saveRef.current.equippedDemonSkins
    );
  };

  const handleStartTraining = (trainingId: string) => {
    clearModals();
    const charId = saveRef.current.selectedCharacterId;
    const prof = getCharacterProfile(saveRef.current, charId);
    engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
    engineRef.current?.setDifficultyMode(saveRef.current.selectedDifficulty);
    engineRef.current?.startTrainingChallenge(
      trainingId,
      charId,
      saveRef.current.selectedBreathing,
      prof.upgrades,
      prof.selectedSkinId,
      prof.unlockedAwakenings,
      prof.equippedUltimate,
      saveRef.current.equippedDemonSkins
    );
  };

  const handleStartSecretBoss = (secretBossId: string) => {
    clearModals();
    const charId = saveRef.current.selectedCharacterId;
    const prof = getCharacterProfile(saveRef.current, charId);
    engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
    engineRef.current?.setDifficultyMode(saveRef.current.selectedDifficulty);
    engineRef.current?.startSecretBoss(
      secretBossId,
      charId,
      saveRef.current.selectedBreathing,
      prof.upgrades,
      prof.selectedSkinId,
      prof.unlockedAwakenings,
      prof.equippedUltimate,
      saveRef.current.equippedDemonSkins
    );
  };

  const handleNewGame = () => {
    const resetSave = resetCampaignForNewGame(saveRef.current);
    setSave(resetSave);
    saveRef.current = resetSave;
    const prof = getCharacterProfile(resetSave, resetSave.selectedCharacterId);
    engineRef.current?.setCoinsBalance(resetSave.coins);
    engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
    engineRef.current?.setPlayerProgression(resetSave.playerLevel, resetSave.playerXp);
    launchTutorialWith(resetSave.selectedCharacterId, resetSave.selectedBreathing);
  };

  const handleToggleMusicQuick = () => {
    engineRef.current?.sound.unlock();
    const cur = saveRef.current.audio;
    const nextAudio: AudioSettings = {
      ...cur,
      muted: false,
      musicEnabled: !(cur.musicEnabled && !cur.muted),
    };
    const updated = updateAudioSettings(saveRef.current, nextAudio);
    setSave(updated);
    engineRef.current?.applyAudioSettings(nextAudio);
  };

  const handleSelectCharacter = (charId: string, breathing?: BreathingStyleId) => {
    const updated = selectCharacterAndBreathing(save, charId, breathing, true);
    setSave(updated);
    const prof = getCharacterProfile(updated, updated.selectedCharacterId);
    engineRef.current?.setCoinsBalance(updated.coins);
    engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
    engineRef.current?.setPlayerProgression(updated.playerLevel, updated.playerXp);
  };

  const handleConfirmCharSelect = (charId: string, breathing: BreathingStyleId) => {
    const updated = selectCharacterAndBreathing(save, charId, breathing, true);
    setSave(updated);
    const prof = getCharacterProfile(updated, updated.selectedCharacterId);
    engineRef.current?.setCoinsBalance(updated.coins);
    engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
    engineRef.current?.setPlayerProgression(updated.playerLevel, updated.playerXp);
    setModalStack((prev) => prev.filter((m) => m !== 'charSelect'));
    if (pendingAfterCharSelect) {
      const next = pendingAfterCharSelect;
      setPendingAfterCharSelect(null);
      next(charId, breathing);
    } else if (engineRef.current?.phase === 'TITLE_MENU') {
      engineRef.current.setMenuMusicTheme('menu', charId);
    }
  };

  const handleBuyCharacter = (charId: string) => {
    const res = purchaseCharacter(save, charId);
    if (res.ok) {
      setSave(res.save);
      const prof = getCharacterProfile(res.save, res.save.selectedCharacterId);
      engineRef.current?.setCoinsBalance(res.save.coins);
      engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
      engineRef.current?.setPlayerProgression(res.save.playerLevel, res.save.playerXp);
    }
    return { ok: res.ok, message: res.message };
  };

  const handleUpgradeStat = (charId: string, stat: keyof CharacterUpgrades) => {
    const res = upgradeCharacterStat(save, charId, stat);
    if (res.ok) {
      setSave(res.save);
      engineRef.current?.setCoinsBalance(res.save.coins);
      engineRef.current?.sound.unlock();
      engineRef.current?.sound.playUpgradeChime();
    }
    return { ok: res.ok, message: res.message };
  };

  const handleUpgradeSwordStat = (charId: string, stat: keyof SwordUpgrades) => {
    const res = upgradeSwordStat(save, charId, stat);
    if (res.ok) {
      setSave(res.save);
      const prof = getCharacterProfile(res.save, charId);
      engineRef.current?.setCoinsBalance(res.save.coins);
      engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
      engineRef.current?.sound.unlock();
      engineRef.current?.sound.playUpgradeChime();
    }
    return { ok: res.ok, message: res.message };
  };

  const handleSetDifficulty = (mode: DifficultyMode) => {
    const updated = setDifficultyMode(save, mode);
    setSave(updated);
    engineRef.current?.setDifficultyMode(mode);
  };

  const handleClaimMission = (missionId: string) => {
    const res = claimDailyMission(save, missionId);
    if (res.ok) {
      setSave(res.save);
      engineRef.current?.setCoinsBalance(res.save.coins);
      engineRef.current?.setPlayerProgression(res.save.playerLevel, res.save.playerXp);
      engineRef.current?.sound.unlock();
      engineRef.current?.sound.playUpgradeChime();
    }
    return { ok: res.ok, message: res.message };
  };

  const handleClaimAchievement = (achId: string) => {
    const res = claimAchievement(save, achId);
    if (res.ok) {
      setSave(res.save);
      engineRef.current?.setCoinsBalance(res.save.coins);
      engineRef.current?.setPlayerProgression(res.save.playerLevel, res.save.playerXp);
      engineRef.current?.sound.unlock();
      engineRef.current?.sound.playUpgradeChime();
    }
    return { ok: res.ok, message: res.message };
  };

  const handleSelectSkin = (charId: string, skinId: string) => {
    const updated = selectCharacterSkin(save, charId, skinId);
    setSave(updated);
  };

  const handleBuySkin = (charId: string, skinId: string) => {
    const skin = getCharacterSkins(charId).find((s) => s.id === skinId);
    if (!skin) return { ok: false, message: 'Skin not found.' };
    const res = purchaseCharacterSkin(save, charId, skin.id, skin.name, skin.price);
    if (res.ok) {
      setSave(res.save);
      engineRef.current?.setCoinsBalance(res.save.coins);
      engineRef.current?.sound.unlock();
      engineRef.current?.sound.playUpgradeChime();
    }
    return { ok: res.ok, message: res.message };
  };

  const handleBuyUltimate = (charId: string, ultId: UltimateId) => {
    const ult = ULTIMATE_SPECS[ultId];
    const res = purchaseUltimate(save, charId, ultId, ult.name, ult.price);
    if (res.ok) {
      setSave(res.save);
      engineRef.current?.setCoinsBalance(res.save.coins);
      engineRef.current?.sound.unlock();
      engineRef.current?.sound.playUpgradeChime();
    }
    return { ok: res.ok, message: res.message };
  };

  const handleEquipUltimate = (charId: string, ultId: UltimateId) => {
    const updated = equipUltimate(save, charId, ultId);
    setSave(updated);
  };

  const handleBuyDemonSkin = (archetype: DemonArchetype, skinId: string) => {
    const skin = getDemonSkins(archetype).find((s) => s.id === skinId);
    if (!skin) return { ok: false, message: 'Demon skin not found.' };
    const res = purchaseDemonSkin(save, archetype, skin.id, skin.name, skin.price);
    if (res.ok) {
      setSave(res.save);
      engineRef.current?.setCoinsBalance(res.save.coins);
      engineRef.current?.setEquippedDemonSkins(res.save.equippedDemonSkins);
      engineRef.current?.sound.unlock();
      engineRef.current?.sound.playUpgradeChime();
    }
    return { ok: res.ok, message: res.message };
  };

  const handleSelectDemonSkin = (archetype: DemonArchetype, skinId: string) => {
    const updated = selectDemonSkin(save, archetype, skinId);
    setSave(updated);
    engineRef.current?.setEquippedDemonSkins(updated.equippedDemonSkins);
  };

  const handleUpdateAudio = (audio: AudioSettings) => {
    const updated = updateAudioSettings(save, audio);
    setSave(updated);
    engineRef.current?.applyAudioSettings(audio);
  };

  const handleUpdateGameplay = (gameplay: GameplaySettings) => {
    const updated = updateGameplaySettings(save, gameplay);
    setSave(updated);
    engineRef.current?.applyGameplaySettings(gameplay);
  };

  const handleSaveControlsLayout = (layout: TouchControlsLayout) => {
    const updated = updateControlsLayout(save, layout);
    setSave(updated);
    popModal();
  };

  const handleToggleMuteHud = () => {
    if (!engineRef.current) return;
    const muted = engineRef.current.toggleMute();
    const updated = updateAudioSettings(save, { ...save.audio, muted });
    setSave(updated);
  };

  const handleToggleSkipSeenCutscenes = (skipSeenCutscenes: boolean) => {
    const updated: SaveData = { ...save, skipSeenCutscenes };
    writeSaveData(updated);
    setSave(updated);
  };

  const activePlayerProfile = getCharacterProfile(save, save.selectedCharacterId);

  return (
    <main
      className="relative h-dvh w-screen overflow-hidden bg-[#050811] touch-none select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Isolated 60 FPS Canvas Container */}
      <div className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />
      </div>

      {/* Perimeter Combat HUD */}
      {hud.phase !== 'TITLE_MENU' && !activeCutscene && (
        <GameHud
          hud={hud}
          hudPreset={save.gameplay.hudPreset}
          onTogglePause={() => engineRef.current?.togglePause()}
          onToggleMute={handleToggleMuteHud}
          onTriggerForm={(idx) => engineRef.current?.triggerBreathingForm(idx)}
          onTriggerAwakening={() => engineRef.current?.triggerAwakening()}
          onTriggerTransparentWorld={() => engineRef.current?.triggerTransparentWorld()}
          onTriggerUltimate={() => engineRef.current?.triggerUltimate()}
          onAdvanceTutorial={() => engineRef.current?.advanceTutorialStep()}
          onSkipTutorial={() => engineRef.current?.skipTutorial()}
          onInteractInvestigation={() => engineRef.current?.interactNearbyInvestigation()}
          onDismissInvestigationDialogue={() => engineRef.current?.dismissInvestigationDialogue()}
        />
      )}

      {/* Android Multi-Touch Controls */}
      {hud.phase === 'PLAYING' && engineReady && !activeCutscene && !activeModal && (
        <MobileControls
          engine={engineRef.current}
          hud={hud}
          controlsLayout={save.controlsLayout}
          controlScale={save.gameplay.controlScale}
        />
      )}

      {/* Title / Pause / Victory / Defeat Overlays */}
      {!activeCutscene && (
        <GameOverlays
          hud={hud}
          save={save}
          onNewGame={handleNewGame}
          onContinueGame={handleContinueGame}
          onStartSurvival={handleStartSurvival}
          onOpenCampaign={() => pushModal('campaign')}
          onOpenCharSelect={() => {
            setPendingAfterCharSelect(null);
            engineRef.current?.setMenuMusicTheme('char_select', save.selectedCharacterId);
            pushModal('charSelect');
          }}
          onOpenShop={() => pushModal('shop')}
          onOpenUpgrades={() => pushModal('upgrades')}
          onOpenDemonSkins={() => pushModal('demonSkins')}
          onOpenHub={() => pushModal('hub')}
          onStartTutorial={handleStartTutorial}
          onOpenEncyclopedia={() => pushModal('encyclopedia')}
          onOpenSettings={() => pushModal('settings')}
          onExitGame={() => setExitPromptOpen(true)}
          onToggleMusic={handleToggleMusicQuick}
          onQuickPlayStory={() => handleStartStoryLevel(save.highestUnlockedLevel)}
          onResume={() => engineRef.current?.togglePause()}
          onRestart={() => {
            const prof = getCharacterProfile(save, save.selectedCharacterId);
            engineRef.current?.setSwordUpgrades(prof.swordUpgrades);
            engineRef.current?.setDifficultyMode(save.selectedDifficulty);
            engineRef.current?.restartCurrentBattle(
              prof.upgrades,
              prof.selectedSkinId,
              prof.unlockedAwakenings,
              prof.equippedUltimate
            );
          }}
          onNextLevel={() => handleStartStoryLevel(Math.min(50, hud.levelId + 1))}
          onReturnTitle={() => {
            clearModals();
            engineRef.current?.returnToTitle();
          }}
        />
      )}

      {/* Single-Active Modal Stack */}
      {activeModal === 'charSelect' && (
        <CharacterSelectModal
          save={save}
          subtitle={
            pendingAfterCharSelect
              ? 'Choose your starting Slayer before entering battle.'
              : 'Select your active Slayer, Breathing Style, and independent campaign save.'
          }
          confirmLabel={pendingAfterCharSelect ? 'Confirm Slayer & Enter Battle' : undefined}
          onClose={popModal}
          onOpenUpgrades={pendingAfterCharSelect ? undefined : () => pushModal('upgrades')}
          onConfirmSelect={handleConfirmCharSelect}
        />
      )}

      {activeModal === 'upgrades' && (
        <CharacterUpgradeModal
          save={save}
          onClose={popModal}
          onUpgradeStat={handleUpgradeStat}
          onUpgradeSwordStat={handleUpgradeSwordStat}
          onSelectSkin={handleSelectSkin}
          onBuySkin={handleBuySkin}
          onBuyUltimate={handleBuyUltimate}
          onEquipUltimate={handleEquipUltimate}
        />
      )}

      {activeModal === 'demonSkins' && (
        <DemonSkinsModal
          save={save}
          onClose={popModal}
          onBuyDemonSkin={handleBuyDemonSkin}
          onSelectDemonSkin={handleSelectDemonSkin}
        />
      )}

      {activeModal === 'campaign' && (
        <CampaignModal
          save={save}
          onClose={popModal}
          onStartLevel={handleStartStoryLevel}
          onStartTutorial={handleStartTutorial}
          onStartPractice={handleStartPractice}
        />
      )}

      {activeModal === 'shop' && (
        <RosterShopModal
          save={save}
          onClose={popModal}
          onSelectCharacter={handleSelectCharacter}
          onBuyCharacter={handleBuyCharacter}
          onUpgradeStat={handleUpgradeStat}
          onSelectSkin={handleSelectSkin}
          onBuySkin={handleBuySkin}
        />
      )}

      {activeModal === 'encyclopedia' && (
        <DemonEncyclopediaModal
          demonKillCounts={save.demonKillCounts}
          onClose={popModal}
          onChallengeDemon={(mapId, demon) =>
            handleStartPractice(mapId, demon, save.selectedBreathing)
          }
        />
      )}

      {activeModal === 'hub' && (
        <SlayerHubModal
          save={save}
          onClose={popModal}
          onClaimMission={handleClaimMission}
          onClaimAchievement={handleClaimAchievement}
          onSetDifficulty={handleSetDifficulty}
          onStartTraining={handleStartTraining}
          onStartSecretBoss={handleStartSecretBoss}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          save={save}
          returnLabel={hud.phase === 'PAUSED' ? 'Pause Menu' : 'Main Menu'}
          onClose={popModal}
          onOpenCustomizeControls={() => pushModal('controls')}
          onReplayTutorial={() => {
            clearModals();
            handleStartTutorial();
          }}
          onUpdateAudio={handleUpdateAudio}
          onUpdateGameplay={handleUpdateGameplay}
          onToggleSkipSeenCutscenes={handleToggleSkipSeenCutscenes}
        />
      )}

      {activeModal === 'controls' && (
        <ControlCustomizerModal
          initialLayout={save.controlsLayout}
          onBack={popModal}
          onSave={handleSaveControlsLayout}
        />
      )}

      {/* Live 60 FPS Animated Story Cutscene Overlay */}
      {activeCutscene && (
        <CutsceneOverlay
          cutscene={activeCutscene.cutscene}
          sound={engineRef.current?.sound ?? fallbackSoundRef.current}
          subtitlesEnabled={save.audio.subtitlesEnabled}
          gameplay={save.gameplay}
          playerSkinId={activePlayerProfile.selectedSkinId}
          equippedDemonSkins={save.equippedDemonSkins}
          onComplete={activeCutscene.onDone}
          onSkip={activeCutscene.onDone}
        />
      )}

      {/* Official Startup Splash / Loading Screen */}
      {showSplash && (
        <div
          onClick={() => {
            engineRef.current?.sound.unlock();
            setSplashFading(true);
            setTimeout(() => setShowSplash(false), 260);
          }}
          className={`fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-[#03060f] transition-opacity duration-500 ${
            splashFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <img
            src="./assets/images/game-logo.png"
            alt="Demon Slayers: Breath of the Abyss"
            className="animate-logo-glow h-40 w-40 rounded-3xl object-contain sm:h-52 sm:w-52"
          />
          <h1 className="font-display mt-4 text-2xl font-extrabold tracking-widest text-white sm:text-3xl">
            DEMON SLAYERS
          </h1>
          <p className="font-display mt-1 text-xs font-semibold tracking-[0.28em] text-sky-300 uppercase">
            Breath of the Abyss
          </p>
          <p className="mt-4 text-xs font-medium tracking-wider text-slate-400">
            Entering Final Selection… Tap anywhere
          </p>
        </div>
      )}

      {/* Hardware Back Accidental-Exit Protection Dialog on Root Main Menu */}
      {exitPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5 text-center shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white">Exit Demon Slayers?</h3>
            <p className="mt-1.5 text-xs text-slate-300">
              All campaign progress, unlocked Slayers, settings, and custom touch controls are saved.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setExitPromptOpen(false)}
                className="min-h-[44px] flex-1 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
              >
                Stay in Game
              </button>
              <button
                type="button"
                onClick={() => {
                  setExitPromptOpen(false);
                  window.AndroidNavigation?.exitGame?.();
                }}
                className="min-h-[44px] flex-1 rounded-lg border border-rose-500/50 bg-rose-950/60 px-4 py-2 text-xs font-bold text-rose-200 hover:bg-rose-900/70"
              >
                Exit Game
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
