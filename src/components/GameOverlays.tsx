import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpCircle,
  BookOpen,
  Coins,
  Flame,
  Home,
  LogOut,
  Map,
  Music,
  Palette,
  Play,
  PlusCircle,
  RotateCcw,
  Settings,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
  VolumeX,
} from 'lucide-react';
import { BREATHING_STYLES } from '../game/breathing';
import { getCharacterCampaignInfo } from '../game/campaign';
import { getCharacterById, SLAYER_CHARACTERS } from '../game/characters';
import { DIFFICULTY_SCALING } from '../game/constants';
import { ACHIEVEMENTS, MAX_TOTAL_XP } from '../game/save';
import { CombatRank, HudSnapshot, SaveData } from '../game/types';

interface GameOverlaysProps {
  hud: HudSnapshot;
  save: SaveData;
  onNewGame: () => void;
  onContinueGame: () => void;
  onStartSurvival: () => void;
  onOpenCampaign: () => void;
  onOpenCharSelect: () => void;
  onOpenShop: () => void;
  onOpenUpgrades: () => void;
  onOpenDemonSkins: () => void;
  onOpenHub: () => void;
  onStartTutorial: () => void;
  onOpenEncyclopedia: () => void;
  onOpenSettings: () => void;
  onExitGame: () => void;
  onToggleMusic: () => void;
  onQuickPlayStory: () => void;
  onResume: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onReturnTitle: () => void;
}

function MenuAmbientCanvas({ performanceMode }: { performanceMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const count = performanceMode ? 18 : 42;

    const resize = () => {
      canvas.width = canvas.clientWidth || window.innerWidth;
      canvas.height = canvas.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const specks = Array.from({ length: count }, (_, idx) => {
      const kind = idx % 3 === 0 ? 'petal' : idx % 3 === 1 ? 'ember' : 'abyss';
      return {
        kind,
        x: Math.random() * (canvas.width || 1280),
        y: Math.random() * (canvas.height || 720),
        vx: kind === 'petal' ? 18 + Math.random() * 24 : (Math.random() - 0.5) * 18,
        vy: kind === 'petal' ? 16 + Math.random() * 22 : -(18 + Math.random() * 32),
        size: kind === 'petal' ? 3.2 + Math.random() * 2.8 : 1.6 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
      };
    });

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Subtle drifting moonlit mist band
      const mistY = h * 0.62 + Math.sin(now * 0.0005) * 14;
      const mistGrad = ctx.createLinearGradient(0, mistY - 90, 0, h);
      mistGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      mistGrad.addColorStop(0.55, 'rgba(30, 58, 138, 0.14)');
      mistGrad.addColorStop(1, 'rgba(3, 6, 15, 0.45)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, mistY - 90, w, h - (mistY - 90));

      for (const s of specks) {
        s.phase += dt * 2.1;
        s.x += s.vx * dt + Math.sin(s.phase) * 9 * dt;
        s.y += s.vy * dt;

        if (s.y > h + 16) {
          s.y = -12;
          s.x = Math.random() * w;
        } else if (s.y < -16) {
          s.y = h + 12;
          s.x = Math.random() * w;
        }
        if (s.x > w + 16) s.x = -12;
        if (s.x < -16) s.x = w + 12;

        ctx.save();
        ctx.translate(s.x, s.y);
        if (s.kind === 'petal') {
          ctx.rotate(s.phase * 0.9);
          ctx.fillStyle = 'rgba(244, 114, 182, 0.72)';
          ctx.beginPath();
          ctx.ellipse(0, 0, s.size * 1.4, s.size * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.kind === 'ember') {
          ctx.fillStyle = s.x < w * 0.5 ? 'rgba(56, 189, 248, 0.78)' : 'rgba(251, 146, 60, 0.8)';
          ctx.beginPath();
          ctx.arc(0, 0, s.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(192, 132, 252, 0.65)';
          ctx.beginPath();
          ctx.arc(0, 0, s.size * 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [performanceMode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

export function GameOverlays({
  hud,
  save,
  onNewGame,
  onContinueGame,
  onStartSurvival,
  onOpenCampaign,
  onOpenCharSelect,
  onOpenShop,
  onOpenUpgrades,
  onOpenDemonSkins,
  onOpenHub,
  onStartTutorial,
  onOpenEncyclopedia,
  onOpenSettings,
  onExitGame,
  onToggleMusic,
  onQuickPlayStory,
  onResume,
  onRestart,
  onNextLevel,
  onReturnTitle,
}: GameOverlaysProps) {
  const [confirmNewGame, setConfirmNewGame] = useState(false);

  if (hud.phase === 'PLAYING' || hud.phase === 'FINISHING') return null;

  const activeChar = getCharacterById(save.selectedCharacterId);
  const activeStyle = BREATHING_STYLES[save.selectedBreathing];
  const campaignInfo = getCharacterCampaignInfo(activeChar.id);
  const hasExistingProgress =
    save.tutorialCompleted || save.highestUnlockedLevel > 1 || save.totalDemonsDefeated > 0;
  const claimableHubCount =
    save.dailyMissions.filter((m) => !m.claimed && m.progress >= m.target).length +
    ACHIEVEMENTS.filter(
      (a) =>
        !save.claimedAchievements.includes(a.id) &&
        (save.playerStats?.[a.metric] ?? 0) >= a.target
    ).length;

  if (hud.phase === 'TITLE_MENU') {
    const musicActive = save.audio.musicEnabled && !save.audio.muted;
    return (
      <div className="safe-area-hud absolute inset-0 z-30 flex flex-col items-center overflow-y-auto bg-[#03060f] px-4 py-3 text-center sm:py-4">
        {/* Official Animated Key Art Backdrop */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src="./assets/images/menu-bg.png"
            alt=""
            className="animate-abyss-pan h-full w-full object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#03060f] via-[#040814]/72 to-[#03060f]/65" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(2,5,14,0.78)_100%)]" />
        </div>

        {/* Animated Sakura, Mist, Flame/Water Sparks & Abyss Glow */}
        <MenuAmbientCanvas performanceMode={save.gameplay.performanceMode} />

        {/* Quick Music ON/OFF Button Top-Right */}
        <div className="relative z-10 flex w-full max-w-4xl items-center justify-between gap-2">
          <span className="font-mono-num rounded-md border border-slate-700/75 bg-slate-950/75 px-2.5 py-1 text-[11px] font-bold text-sky-200 backdrop-blur-sm">
            Slayer Lv.{save.playerLevel} · Story Lv.{save.highestUnlockedLevel}/50
          </span>
          <button
            type="button"
            onClick={onToggleMusic}
            className={`flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold backdrop-blur-sm transition-colors ${
              musicActive
                ? 'border-sky-400/60 bg-slate-950/80 text-sky-200 hover:bg-slate-900'
                : 'border-rose-500/60 bg-rose-950/75 text-rose-200 hover:bg-rose-900/80'
            }`}
          >
            {musicActive ? <Music className="h-3.5 w-3.5 text-sky-300" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>Music: {musicActive ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="relative z-10 mx-auto my-auto flex w-full max-w-3xl flex-col items-center py-1">
          {/* Official Game Emblem Logo */}
          <div className="mb-1.5 flex items-center justify-center">
            <img
              src="./assets/images/game-logo.png"
              alt="Demon Slayers: Breath of the Abyss"
              className="animate-logo-glow h-24 w-24 rounded-2xl object-contain sm:h-32 sm:w-32"
            />
          </div>

          <h1 className="font-display max-w-3xl text-xl font-extrabold tracking-wider text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)] sm:text-3xl">
            DEMON SLAYERS
          </h1>
          <p className="font-display text-[11px] font-semibold tracking-[0.26em] text-sky-300 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] sm:text-xs">
            Breath of the Abyss
          </p>

          {/* Active Slayer, Individual Campaign & Coins Readout */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-lg border border-slate-700/65 bg-slate-950/70 px-3.5 py-1.5 text-xs text-slate-200 backdrop-blur-sm">
            <span className="font-semibold text-white">{activeChar.name}</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span style={{ color: activeStyle.primaryColor }}>{activeStyle.name}</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-sky-200">{campaignInfo.campaignTitle}</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="font-mono-num flex items-center gap-1 font-bold text-amber-300">
              <Coins className="h-3.5 w-3.5" />
              {save.coins} Coins
            </span>
          </div>

          {/* 6 Primary Anime Action Buttons */}
          <div className="mt-3.5 grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                if (hasExistingProgress) {
                  setConfirmNewGame(true);
                } else {
                  onNewGame();
                }
              }}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-rose-400/70 bg-gradient-to-r from-rose-700/90 to-red-700/90 px-3.5 py-2.5 text-xs font-extrabold tracking-wide text-white shadow-lg transition-all hover:from-rose-600 hover:to-red-600 active:scale-98 sm:text-sm"
            >
              <PlusCircle className="h-4 w-4 text-amber-200" />
              <span>NEW GAME</span>
            </button>

            <button
              type="button"
              onClick={onContinueGame}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-400 px-3.5 py-2.5 text-xs font-extrabold tracking-wide text-slate-950 shadow-lg transition-all hover:from-sky-400 hover:to-cyan-300 active:scale-98 sm:text-sm"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>
                {save.tutorialCompleted
                  ? `CONTINUE (Lv.${save.highestUnlockedLevel})`
                  : 'CONTINUE'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCharSelect}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-emerald-400/55 bg-slate-950/85 px-3.5 py-2.5 text-xs font-bold tracking-wide text-emerald-100 shadow-lg backdrop-blur-sm transition-colors hover:border-emerald-300 hover:bg-slate-900 sm:text-sm"
            >
              <Users className="h-4 w-4 text-emerald-300" />
              <span>CHARACTER SELECT</span>
            </button>

            <button
              type="button"
              onClick={onOpenCampaign}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-sky-400/55 bg-slate-950/85 px-3.5 py-2.5 text-xs font-bold tracking-wide text-sky-100 shadow-lg backdrop-blur-sm transition-colors hover:border-sky-300 hover:bg-slate-900 sm:text-sm"
            >
              <Map className="h-4 w-4 text-sky-300" />
              <span>STORY MODE</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-600/80 bg-slate-950/85 px-3.5 py-2.5 text-xs font-bold tracking-wide text-slate-100 shadow-lg backdrop-blur-sm transition-colors hover:border-slate-400 hover:bg-slate-900 sm:text-sm"
            >
              <Settings className="h-4 w-4 text-slate-300" />
              <span>SETTINGS</span>
            </button>

            <button
              type="button"
              onClick={onExitGame}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-700/85 bg-slate-950/85 px-3.5 py-2.5 text-xs font-bold tracking-wide text-slate-300 shadow-lg backdrop-blur-sm transition-colors hover:border-rose-400/60 hover:text-rose-200 sm:text-sm"
            >
              <LogOut className="h-4 w-4 text-rose-300" />
              <span>EXIT GAME</span>
            </button>
          </div>

          {/* Corps Missions, Trials & Difficulty Hub Banner */}
          <button
            type="button"
            onClick={onOpenHub}
            className="mt-2.5 flex min-h-[44px] w-full max-w-2xl items-center justify-between gap-2 rounded-lg border border-cyan-400/55 bg-slate-950/85 px-3.5 py-2 text-xs font-bold text-cyan-100 shadow-lg backdrop-blur-sm transition-colors hover:border-cyan-300 hover:bg-slate-900"
          >
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-300" />
              <span>Missions, Trials &amp; Difficulty</span>
            </span>
            <span className="tabular-nums flex items-center gap-2 text-[11px]">
              <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-amber-200">
                {DIFFICULTY_SCALING[save.selectedDifficulty].label}
              </span>
              {claimableHubCount > 0 && (
                <span className="rounded bg-amber-400 px-2 py-0.5 font-black text-slate-950">
                  {claimableHubCount} Claimable
                </span>
              )}
            </span>
          </button>

          {/* Secondary Modes & Arsenal Strip */}
          <div className="mt-2 grid w-full max-w-2xl grid-cols-3 gap-1.5 sm:grid-cols-6">
            <button
              type="button"
              onClick={onOpenUpgrades}
              className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-amber-500/45 bg-slate-950/80 px-2 py-1.5 text-[11px] font-semibold text-amber-200 hover:border-amber-400 hover:bg-slate-900"
            >
              <ArrowUpCircle className="h-3.5 w-3.5 text-amber-300" />
              <span>Upgrades</span>
            </button>

            <button
              type="button"
              onClick={onOpenShop}
              className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-amber-500/45 bg-slate-950/80 px-2 py-1.5 text-[11px] font-semibold text-amber-200 hover:border-amber-400 hover:bg-slate-900"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-300" />
              <span>Roster ({save.unlockedCharacters.length}/{SLAYER_CHARACTERS.length})</span>
            </button>

            <button
              type="button"
              onClick={onOpenDemonSkins}
              className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-rose-500/45 bg-slate-950/80 px-2 py-1.5 text-[11px] font-semibold text-rose-200 hover:border-rose-400 hover:bg-slate-900"
            >
              <Palette className="h-3.5 w-3.5 text-rose-300" />
              <span>Demon Skins</span>
            </button>

            <button
              type="button"
              onClick={onStartSurvival}
              className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-fuchsia-400/50 bg-fuchsia-950/65 px-2 py-1.5 text-[11px] font-semibold text-fuchsia-100 hover:border-fuchsia-300 hover:bg-fuchsia-900/75"
            >
              <Flame className="h-3.5 w-3.5 text-fuchsia-300" />
              <span>Survival W{save.survivalStats.highestWave}</span>
            </button>

            <button
              type="button"
              onClick={onOpenEncyclopedia}
              className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-rose-500/40 bg-slate-950/80 px-2 py-1.5 text-[11px] font-semibold text-rose-200 hover:border-rose-400 hover:bg-slate-900"
            >
              <BookOpen className="h-3.5 w-3.5 text-rose-400" />
              <span>60 Demons</span>
            </button>

            <button
              type="button"
              onClick={onStartTutorial}
              className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-slate-700/85 bg-slate-950/80 px-2 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-sky-400 hover:bg-slate-900"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              <span>Trial</span>
            </button>
          </div>
        </div>

        {/* New Game Confirmation Modal */}
        {confirmNewGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 p-4">
            <div className="w-full max-w-md rounded-xl border border-rose-500/55 bg-slate-900 p-5 text-center shadow-2xl">
              <h3 className="font-display text-lg font-bold text-white">
                Begin a New Slayer Journey?
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Starting a New Game resets {activeChar.name.split(' ')[0]}’s current Story level,
                Slayer Level, and coins to Level 1 while preserving your unlocked Slayers and settings.
              </p>
              <div className="mt-5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmNewGame(false)}
                  className="min-h-[44px] flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmNewGame(false);
                    onNewGame();
                  }}
                  className="min-h-[44px] flex-1 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
                >
                  Reset & Start New
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (hud.phase === 'PAUSED') {
    return (
      <div className="safe-area-modal absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-slate-950/75 px-4 py-4">
        <div className="my-auto w-full max-w-sm rounded-xl border border-slate-700/90 bg-slate-900/95 p-5 text-center shadow-2xl sm:p-6">
          <img
            src="./assets/images/game-logo.png"
            alt="Demon Slayers"
            className="mx-auto mb-2 h-16 w-16 rounded-xl object-contain drop-shadow-[0_0_14px_rgba(56,189,248,0.35)]"
          />
          <h2 className="font-display text-2xl font-bold text-white">Battle Paused</h2>
          <p className="mt-1 text-xs text-slate-400">{hud.levelTitle}</p>

          {hud.mode === 'STORY' && (
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/75 px-3 py-2 text-left text-[11px] text-slate-300">
              <div className="tabular-nums flex items-center justify-between font-semibold text-sky-300">
                <span>
                  Chapter {hud.chapterNumber ?? Math.max(1, Math.ceil((hud.levelId || 1) / 10))} · Lv.{hud.levelId}
                </span>
                <span>
                  Zone {hud.zoneIndex}/{hud.zoneTotal}
                </span>
              </div>
              <div className="mt-0.5 text-slate-400">{hud.zoneName}</div>
              {hud.objectiveText && (
                <div className="mt-1 font-medium text-slate-200">Objective: {hud.objectiveText}</div>
              )}
              {hud.navTargetName && (
                <div className="tabular-nums mt-1 text-amber-200">
                  Navigation: {hud.navTargetName}
                  {typeof hud.navDistanceM === 'number' && hud.navDistanceM > 0
                    ? ` (${hud.navDistanceM}m ${hud.navDirection === 'west' ? 'West' : 'East'})`
                    : ''}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-sky-400"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Resume</span>
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restart</span>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Settings className="h-4 w-4" />
              <span>Audio & Settings</span>
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
            >
              <Home className="h-4 w-4" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isVictory = hud.phase === 'VICTORY';
  const hasNextStory = isVictory && hud.mode === 'STORY' && hud.levelId < 50;
  const rankBadgeStyle = (rank: CombatRank): string => {
    switch (rank) {
      case 'SSS':
        return 'border-amber-300 bg-gradient-to-br from-amber-300 via-rose-400 to-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.55)]';
      case 'SS':
        return 'border-amber-400 bg-amber-400/20 text-amber-300';
      case 'S':
        return 'border-sky-400 bg-sky-500/20 text-sky-300';
      case 'A':
        return 'border-emerald-400 bg-emerald-500/20 text-emerald-300';
      default:
        return 'border-slate-500 bg-slate-800 text-slate-200';
    }
  };
  const xpPct = Math.min(100, Math.round((hud.totalPlayerXp / MAX_TOTAL_XP) * 100));
  const breakdown = hud.scoreBreakdown;

  return (
    <div className="safe-area-modal absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-slate-950/80 px-4 py-4">
      <div className="my-auto w-full max-w-lg rounded-xl border border-slate-700/90 bg-slate-900/95 p-5 text-center shadow-2xl sm:p-6">
        <div className="flex items-center justify-center gap-4">
          <div>
            <h2
              className={`font-display text-3xl font-extrabold tracking-widest sm:text-4xl ${
                isVictory ? 'text-cyan-300' : 'text-rose-400'
              }`}
            >
              {isVictory ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              {hud.mode === 'TUTORIAL' && isVictory
                ? 'You split the Giant Boulder! Story Level 1 is now unlocked.'
                : hud.mode === 'SURVIVAL'
                  ? isVictory
                    ? 'All 20 Survival Waves conquered! Muzan’s Abyssal gauntlet falls!'
                    : `Survival ended at Wave ${hud.survivalWave ?? 1} / 20.`
                  : isVictory
                    ? `${hud.levelTitle} cleared!`
                    : `${hud.playerName} fell in battle.`}
            </p>
          </div>
          {isVictory && hud.lastRank && (
            <div
              className={`tabular-nums font-display flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border-2 text-2xl font-black tracking-tight ${rankBadgeStyle(
                hud.lastRank
              )}`}
            >
              <span className="text-[9px] font-bold tracking-widest uppercase opacity-80">Rank</span>
              <span>{hud.lastRank}</span>
            </div>
          )}
        </div>

        {/* Live Slayer XP Progression Bar */}
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-left">
          <div className="tabular-nums flex items-center justify-between text-xs font-bold">
            <span className="text-sky-300">Slayer Lv.{hud.playerLevel} / 50</span>
            <span className="text-slate-300">
              {hud.totalPlayerXp} / {MAX_TOTAL_XP} XP
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* Detailed Score Breakdown */}
        {isVictory && breakdown ? (
          <div className="mt-3.5 rounded-lg border border-slate-800 bg-slate-950/65 p-3 text-xs">
            <div className="tabular-nums grid grid-cols-2 gap-x-4 gap-y-1 text-left text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Base Reward</span>
                <span className="font-semibold text-amber-200">+{breakdown.baseCoins}c / +{breakdown.baseXp} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rank Bonus</span>
                <span className="font-semibold text-amber-300">+{breakdown.rankBonusCoins}c</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Perfect Dodges</span>
                <span className="font-semibold text-sky-300">+{breakdown.dodgeBonusCoins}c</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">No Damage</span>
                <span className="font-semibold text-emerald-300">+{breakdown.noDamageBonusCoins}c</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Breathing Finisher</span>
                <span className="font-semibold text-cyan-300">+{breakdown.finisherBonusCoins}c</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bonus Objective</span>
                <span className="font-semibold text-emerald-300">
                  +{breakdown.objectiveBonusCoins}c / +{breakdown.objectiveBonusXp} XP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chests &amp; Caches</span>
                <span className="font-semibold text-amber-200">+{breakdown.chestCoins}c</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time / Max Hits</span>
                <span className="font-semibold text-slate-100">
                  {hud.matchTime.toFixed(1)}s · {hud.comboCount}x
                </span>
              </div>
            </div>
            <div className="tabular-nums mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-xs font-extrabold">
              <span className="text-slate-200">Total Earned</span>
              <span className="text-amber-300">
                +{breakdown.totalCoins} Coins · +{breakdown.totalXp} XP
              </span>
            </div>
          </div>
        ) : (
          <div className="tabular-nums mt-4 flex flex-wrap items-center justify-center gap-4 border-y border-slate-800 py-3 text-xs text-slate-300">
            {hud.lastRank && (
              <div>
                <span className="text-slate-500">Rank </span>
                <span className="font-bold text-amber-300">{hud.lastRank}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Coins </span>
              <span className="font-bold text-amber-300">+{hud.coinsEarnedThisRun}</span>
            </div>
            <div>
              <span className="text-slate-500">Time </span>
              <span className="font-semibold text-slate-100">{hud.matchTime.toFixed(1)}s</span>
            </div>
            <div>
              <span className="text-slate-500">Hits </span>
              <span className="font-semibold text-slate-100">{hud.comboCount}</span>
            </div>
            <div>
              <span className="text-slate-500">Knockdowns </span>
              <span className="font-semibold text-sky-300">{hud.ragdollHitsLanded}</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          {hasNextStory ? (
            <button
              type="button"
              onClick={onNextLevel}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400"
            >
              <span>Level {hud.levelId + 1}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : hud.mode === 'TUTORIAL' && isVictory ? (
            <button
              type="button"
              onClick={onQuickPlayStory}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400"
            >
              <span>Begin Level 1</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onRestart}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{isVictory ? 'Replay' : 'Retry'}</span>
          </button>

          <button
            type="button"
            onClick={onReturnTitle}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            <Home className="h-4 w-4" />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
