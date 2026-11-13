/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { CampaignModal } from './components/CampaignModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { CutsceneOverlay } from './components/CutsceneOverlay';
import { DemonEncyclopediaModal } from './components/DemonEncyclopediaModal';
import { GameHud } from './components/GameHud';
import { GameOverlays } from './components/GameOverlays';
import { MobileControls } from './components/MobileControls';
import { RosterShopModal } from './components/RosterShopModal';
import { SettingsModal } from './components/SettingsModal';
import { StoryGalleryModal } from './components/StoryGalleryModal';
import { SoundEngine } from './game/audio';
import { buildCutsceneForPlayer, CUTSCENES, getLevelById } from './game/campaign';
import { HEAVY_ATTACK_COOLDOWN } from './game/constants';
import { GameEngine } from './game/engine';
import {
  loadSaveData,
  markCutsceneSeen,
  purchaseCharacter,
  recordLevelVictory,
  recordTutorialCompleted,
  selectCharacterAndBreathing,
  updateAudioSettings,
  writeSaveData,
} from './game/save';
import {
  AudioSettings,
  BreathingStyleId,
  CutsceneDef,
  DemonArchetype,
  HudSnapshot,
  MapId,
  SaveData,
} from './game/types';

const INITIAL_HUD: HudSnapshot = {
  phase: 'TITLE_MENU',
  mode: 'STORY',
  levelId: 1,
  levelTitle: 'First Night Beneath Bamboo',
  mapId: 'bamboo_forest',
  playerName: 'Tanjiro Kamado',
  playerHp: 138,
  playerMaxHp: 138,
  playerEnergy: 50,
  playerMaxEnergy: 100,
  breathingStyle: 'water',
  breathingStyleName: 'Water Breathing',
  heavyCooldown: 0,
  maxHeavyCooldown: HEAVY_ATTACK_COOLDOWN,
  formCooldowns: [0, 0, 0, 0, 0],
  counterReady: false,
  actionWarning: null,
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
  allies: [],
  tutorialStep: 1,
  tutorialTitle: 'Arrival at Mt. Sagiri',
  tutorialInstruction: 'Move forward or tap Slash/Continue to begin your trial.',
  tutorialMentorLine: '',
  rockHp: 180,
  rockMaxHp: 180,
  coins: 80,
  coinsEarnedThisRun: 0,
  lastRank: null,
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

  const [hud, setHud] = useState<HudSnapshot>({ ...INITIAL_HUD, coins: save.coins });
  const [engineReady, setEngineReady] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);
  const [showCharSelect, setShowCharSelect] = useState(false);
  const [pendingAfterCharSelect, setPendingAfterCharSelect] = useState<
    ((charId: string, breathing: BreathingStyleId) => void) | null
  >(null);
  const [showShop, setShowShop] = useState(false);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [showStoryGallery, setShowStoryGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeCutscene, setActiveCutscene] = useState<ActiveCutsceneState | null>(null);
  const fallbackSoundRef = useRef<SoundEngine | null>(null);
  if (!fallbackSoundRef.current) {
    fallbackSoundRef.current = new SoundEngine();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onTutorialComplete: () => {
        const updated = recordTutorialCompleted(saveRef.current, 80);
        setSave(updated);
        engine.setCoinsBalance(updated.coins);
      },
      onLevelComplete: (levelId, rank, coinsEarned, kills) => {
        let updated: SaveData;
        if (levelId > 0) {
          updated = recordLevelVictory(saveRef.current, levelId, rank, coinsEarned, kills);
        } else {
          updated = {
            ...saveRef.current,
            coins: saveRef.current.coins + coinsEarned,
            totalDemonsDefeated: saveRef.current.totalDemonsDefeated + kills,
          };
          writeSaveData(updated);
        }
        setSave(updated);
        engine.setCoinsBalance(updated.coins);

        if (levelId === 50 && CUTSCENES.cs_ending) {
          const skip = updated.skipSeenCutscenes && updated.seenCutscenes.includes('cs_ending');
          if (!skip) {
            setActiveCutscene({
              cutscene: buildCutsceneForPlayer(
                'cs_ending',
                updated.selectedCharacterId,
                updated.selectedBreathing
              ),
              onDone: () => {
                setSave((prev) => markCutsceneSeen(prev, 'cs_ending'));
                setActiveCutscene(null);
              },
            });
          }
        }
      },
    });
    engine.setCoinsBalance(saveRef.current.coins);
    engine.applyAudioSettings(saveRef.current.audio);
    engineRef.current = engine;
    setEngineReady(true);
    engine.startLoop();

    const handleResize = () => engine.resize();
    const handleBlur = () => engine.clearHeldInputs();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const code = e.code;

      if (code === 'Escape' || code === 'KeyP') {
        if (engine.phase === 'PLAYING' || engine.phase === 'PAUSED') {
          e.preventDefault();
          engine.togglePause();
        }
        return;
      }

      if (engine.phase !== 'PLAYING') return;

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
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engine.stopLoop();
      engineRef.current = null;
    };
  }, []);

  const closeAllModals = () => {
    setShowCampaign(false);
    setShowCharSelect(false);
    setShowShop(false);
    setShowEncyclopedia(false);
    setShowStoryGallery(false);
    setShowSettings(false);
  };

  // Android / Capacitor hardware back-button support
  useEffect(() => {
    const handleHardwareBack = (e?: Event) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      if (activeCutscene) {
        activeCutscene.onDone();
        return;
      }
      if (showSettings || showStoryGallery || showEncyclopedia || showShop || showCampaign || showCharSelect) {
        const wasCharSelect = showCharSelect;
        closeAllModals();
        setPendingAfterCharSelect(null);
        if (wasCharSelect && engineRef.current?.phase === 'TITLE_MENU') {
          engineRef.current.setMenuMusicTheme('menu');
        }
        return;
      }
      if (engineRef.current && (engineRef.current.phase === 'PLAYING' || engineRef.current.phase === 'PAUSED')) {
        engineRef.current.togglePause();
      }
    };

    document.addEventListener('backbutton', handleHardwareBack);
    const capApp = (window as unknown as {
      Capacitor?: { Plugins?: { App?: { addListener?: (ev: string, cb: () => void) => { remove: () => void } } } };
    }).Capacitor?.Plugins?.App;
    const capHandle = capApp?.addListener?.('backButton', () => handleHardwareBack());

    return () => {
      document.removeEventListener('backbutton', handleHardwareBack);
      capHandle?.remove();
    };
  }, [
    activeCutscene,
    showSettings,
    showStoryGallery,
    showEncyclopedia,
    showShop,
    showCampaign,
    showCharSelect,
  ]);

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
    closeAllModals();
    maybePlayCutscene('cs_opening', () => {
      engineRef.current?.startTutorial(charId, breathing);
    });
  };

  const launchStoryLevelWith = (levelId: number, charId: string, breathing: BreathingStyleId) => {
    closeAllModals();
    const levelDef = getLevelById(levelId);
    maybePlayCutscene(levelDef.cutsceneId, () => {
      engineRef.current?.startStoryLevel(levelId, charId, breathing);
    });
  };

  const handleStartTutorial = () => {
    if (!save.hasChosenStarter) {
      setPendingAfterCharSelect(() => (charId: string, breathing: BreathingStyleId) => {
        launchTutorialWith(charId, breathing);
      });
      engineRef.current?.setMenuMusicTheme('char_select');
      setShowCharSelect(true);
      return;
    }
    launchTutorialWith(save.selectedCharacterId, save.selectedBreathing);
  };

  const handleStartStoryLevel = (levelId: number) => {
    if (!save.hasChosenStarter) {
      setPendingAfterCharSelect(() => (charId: string, breathing: BreathingStyleId) => {
        launchStoryLevelWith(levelId, charId, breathing);
      });
      engineRef.current?.setMenuMusicTheme('char_select');
      setShowCharSelect(true);
      return;
    }
    launchStoryLevelWith(levelId, save.selectedCharacterId, save.selectedBreathing);
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
    closeAllModals();
    engineRef.current?.startPracticeMatch(
      mapId,
      demon,
      save.selectedCharacterId,
      breathing
    );
  };

  const handleSelectCharacter = (charId: string, breathing?: BreathingStyleId) => {
    const updated = selectCharacterAndBreathing(save, charId, breathing, true);
    setSave(updated);
  };

  const handleConfirmCharSelect = (charId: string, breathing: BreathingStyleId) => {
    const updated = selectCharacterAndBreathing(save, charId, breathing, true);
    setSave(updated);
    setShowCharSelect(false);
    if (pendingAfterCharSelect) {
      const next = pendingAfterCharSelect;
      setPendingAfterCharSelect(null);
      next(charId, breathing);
    } else if (engineRef.current?.phase === 'TITLE_MENU') {
      engineRef.current.setMenuMusicTheme('menu');
    }
  };

  const handleBuyCharacter = (charId: string) => {
    const res = purchaseCharacter(save, charId);
    if (res.ok) {
      setSave(res.save);
      engineRef.current?.setCoinsBalance(res.save.coins);
    }
    return { ok: res.ok, message: res.message };
  };

  const handleUpdateAudio = (audio: AudioSettings) => {
    const updated = updateAudioSettings(save, audio);
    setSave(updated);
    engineRef.current?.applyAudioSettings(audio);
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
          onTogglePause={() => engineRef.current?.togglePause()}
          onToggleMute={handleToggleMuteHud}
          onTriggerForm={(idx) => engineRef.current?.triggerBreathingForm(idx)}
        />
      )}

      {/* Android Multi-Touch Controls */}
      {hud.phase === 'PLAYING' && engineReady && !activeCutscene && (
        <MobileControls engine={engineRef.current} hud={hud} />
      )}

      {/* Title / Pause / Victory / Defeat Overlays */}
      {!activeCutscene && (
        <GameOverlays
          hud={hud}
          save={save}
          onContinueGame={handleContinueGame}
          onOpenCampaign={() => setShowCampaign(true)}
          onOpenCharSelect={() => {
            setPendingAfterCharSelect(null);
            engineRef.current?.setMenuMusicTheme('char_select');
            setShowCharSelect(true);
          }}
          onOpenShop={() => setShowShop(true)}
          onStartTutorial={handleStartTutorial}
          onOpenEncyclopedia={() => setShowEncyclopedia(true)}
          onOpenStoryGallery={() => setShowStoryGallery(true)}
          onOpenSettings={() => setShowSettings(true)}
          onQuickPlayStory={() => handleStartStoryLevel(save.highestUnlockedLevel)}
          onResume={() => engineRef.current?.togglePause()}
          onRestart={() => engineRef.current?.restartCurrentBattle()}
          onNextLevel={() => handleStartStoryLevel(Math.min(50, hud.levelId + 1))}
          onReturnTitle={() => engineRef.current?.returnToTitle()}
        />
      )}

      {/* CHOOSE YOUR SLAYER Modal */}
      {showCharSelect && (
        <CharacterSelectModal
          save={save}
          subtitle={
            pendingAfterCharSelect
              ? 'Choose your starting Slayer before entering battle.'
              : 'Select your active Slayer, Breathing Style, and story route.'
          }
          confirmLabel={pendingAfterCharSelect ? 'Confirm Slayer & Enter Battle' : undefined}
          onClose={() => {
            setShowCharSelect(false);
            setPendingAfterCharSelect(null);
            if (engineRef.current?.phase === 'TITLE_MENU') {
              engineRef.current.setMenuMusicTheme('menu');
            }
          }}
          onConfirmSelect={handleConfirmCharSelect}
        />
      )}

      {/* 50-Level Story & 11-Map Practice Modal */}
      {showCampaign && (
        <CampaignModal
          save={save}
          onClose={() => setShowCampaign(false)}
          onStartLevel={handleStartStoryLevel}
          onStartTutorial={handleStartTutorial}
          onStartPractice={handleStartPractice}
        />
      )}

      {/* 15-Slayer Roster & Coin Shop Modal */}
      {showShop && (
        <RosterShopModal
          save={save}
          onClose={() => setShowShop(false)}
          onSelectCharacter={handleSelectCharacter}
          onBuyCharacter={handleBuyCharacter}
        />
      )}

      {/* 60-Demon Encyclopedia Modal */}
      {showEncyclopedia && (
        <DemonEncyclopediaModal
          onClose={() => setShowEncyclopedia(false)}
          onChallengeDemon={(mapId, demon) =>
            handleStartPractice(mapId, demon, save.selectedBreathing)
          }
        />
      )}

      {/* Story Cutscene Gallery Modal */}
      {showStoryGallery && (
        <StoryGalleryModal
          save={save}
          onClose={() => setShowStoryGallery(false)}
          onPlayCutscene={(cutsceneId) => {
            setShowStoryGallery(false);
            const personalized = buildCutsceneForPlayer(
              cutsceneId,
              save.selectedCharacterId,
              save.selectedBreathing
            );
            setActiveCutscene({
              cutscene: personalized,
              onDone: () => {
                setSave((prev) => markCutsceneSeen(prev, cutsceneId));
                setActiveCutscene(null);
                if (engineRef.current?.phase === 'TITLE_MENU') {
                  engineRef.current.setMenuMusicTheme('menu');
                }
              },
            });
          }}
        />
      )}

      {/* Audio & Cutscene Settings Modal */}
      {showSettings && (
        <SettingsModal
          save={save}
          onClose={() => setShowSettings(false)}
          onUpdateAudio={handleUpdateAudio}
          onToggleSkipSeenCutscenes={handleToggleSkipSeenCutscenes}
          onReplayPrologue={() => {
            setShowSettings(false);
            const personalized = buildCutsceneForPlayer(
              'cs_opening',
              save.selectedCharacterId,
              save.selectedBreathing
            );
            setActiveCutscene({
              cutscene: personalized,
              onDone: () => {
                setActiveCutscene(null);
                if (engineRef.current?.phase === 'TITLE_MENU') {
                  engineRef.current.setMenuMusicTheme('menu');
                }
              },
            });
          }}
        />
      )}

      {/* Live 60 FPS Animated Story Cutscene Overlay */}
      {activeCutscene && (
        <CutsceneOverlay
          cutscene={activeCutscene.cutscene}
          sound={engineRef.current?.sound ?? fallbackSoundRef.current}
          subtitlesEnabled={save.audio.subtitlesEnabled}
          onComplete={activeCutscene.onDone}
          onSkip={activeCutscene.onDone}
        />
      )}
    </main>
  );
}
