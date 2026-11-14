import {
  ArrowRight,
  BookOpen,
  Coins,
  Home,
  Map,
  Play,
  RotateCcw,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react';
import { BREATHING_STYLES } from '../game/breathing';
import { getCharacterCampaignInfo } from '../game/campaign';
import { getCharacterById, SLAYER_CHARACTERS } from '../game/characters';
import { HudSnapshot, SaveData } from '../game/types';

interface GameOverlaysProps {
  hud: HudSnapshot;
  save: SaveData;
  onContinueGame: () => void;
  onOpenCampaign: () => void;
  onOpenCharSelect: () => void;
  onOpenShop: () => void;
  onStartTutorial: () => void;
  onOpenEncyclopedia: () => void;
  onOpenSettings: () => void;
  onQuickPlayStory: () => void;
  onResume: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onReturnTitle: () => void;
}

export function GameOverlays({
  hud,
  save,
  onContinueGame,
  onOpenCampaign,
  onOpenCharSelect,
  onOpenShop,
  onStartTutorial,
  onOpenEncyclopedia,
  onOpenSettings,
  onQuickPlayStory,
  onResume,
  onRestart,
  onNextLevel,
  onReturnTitle,
}: GameOverlaysProps) {
  if (hud.phase === 'PLAYING') return null;

  const activeChar = getCharacterById(save.selectedCharacterId);
  const activeStyle = BREATHING_STYLES[save.selectedBreathing];
  const campaignInfo = getCharacterCampaignInfo(activeChar.id);

  if (hud.phase === 'TITLE_MENU') {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-t from-[#03060f]/95 via-[#050a18]/72 to-[#040813]/88 px-4 py-6 text-center">
        {/* Bespoke Crossed Nichirin & Crimson Moon Crest */}
        <div className="mb-3 flex items-center justify-center">
          <svg
            width="86"
            height="86"
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="drop-shadow-[0_8px_28px_rgba(56,189,248,0.38)]"
          >
            <circle cx="48" cy="48" r="40" stroke="#38BDF8" strokeOpacity="0.32" strokeWidth="1.5" />
            <circle cx="48" cy="48" r="32" stroke="#F43F5E" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="6 4" />
            <path
              d="M16 62C26 50 37 50 48 58C59 66 71 62 80 48"
              stroke={activeStyle.primaryColor}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M22 24L74 72M74 24L22 72"
              stroke="#E2E8F0"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <circle cx="48" cy="48" r="6" fill="#0F172A" stroke="#FBBF24" strokeWidth="2.2" />
          </svg>
        </div>

        <h1 className="font-display max-w-3xl text-3xl font-extrabold tracking-wider text-white text-balance sm:text-5xl">
          DEMON SLAYERS
        </h1>
        <p className="font-display mt-1 text-sm font-semibold tracking-[0.26em] text-sky-300 uppercase sm:text-base">
          Breath of the Abyss
        </p>

        {/* Active Slayer, Individual Campaign & Progression Readout */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-300">
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
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="font-mono-num text-emerald-300">
            Lv.{save.highestUnlockedLevel}/50
          </span>
        </div>

        {/* Primary CTA Cluster */}
        <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={onContinueGame}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg transition-colors hover:bg-sky-400 active:scale-98"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>
              {save.tutorialCompleted
                ? `Continue Campaign (Lv.${save.highestUnlockedLevel})`
                : 'Continue Game · Start Trial'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCampaign}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-sky-500/50 bg-slate-900/90 px-5 py-3.5 text-sm font-bold text-sky-200 transition-colors hover:border-sky-400 hover:bg-slate-800"
          >
            <Map className="h-4 w-4 text-sky-300" />
            <span>Story Campaign (50 Levels)</span>
          </button>

          <button
            type="button"
            onClick={onOpenCharSelect}
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-sky-400 hover:bg-slate-800"
          >
            <Users className="h-4 w-4 text-emerald-300" />
            <span>Character Selection</span>
          </button>

          <button
            type="button"
            onClick={onOpenShop}
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-amber-500/45 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-amber-200 transition-colors hover:border-amber-400 hover:bg-slate-800"
          >
            <ShoppingBag className="h-4 w-4 text-amber-300" />
            <span>
              Roster, Upgrades & Shop ({save.unlockedCharacters.length}/{SLAYER_CHARACTERS.length})
            </span>
          </button>
        </div>

        {/* Secondary Navigation Row (No separate Cutscene menu button; cutscenes trigger in campaigns) */}
        <div className="mt-2.5 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={onStartTutorial}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-700/90 bg-slate-950/85 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:border-sky-400 hover:bg-slate-900"
          >
            <Sparkles className="h-4 w-4 text-sky-300" />
            <span>Boulder Trial</span>
          </button>

          <button
            type="button"
            onClick={onOpenEncyclopedia}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 bg-slate-950/85 px-3 py-2.5 text-xs font-semibold text-rose-200 transition-colors hover:border-rose-400 hover:bg-slate-900"
          >
            <BookOpen className="h-4 w-4 text-rose-400" />
            <span>Encyclopedia (60)</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-700/90 bg-slate-950/85 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-900"
          >
            <Settings className="h-4 w-4 text-slate-300" />
            <span>Settings</span>
          </button>
        </div>

        <p className="mt-5 text-[11px] text-slate-400">
          A/D Move · Space Jump · J Slash Combo · K Heavy (2s CD) · L Block · Shift Dodge · 1-5 Breathing Forms
        </p>
      </div>
    );
  }

  if (hud.phase === 'PAUSED') {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 px-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-700/90 bg-slate-900/95 p-6 text-center shadow-2xl">
          <h2 className="font-display text-2xl font-bold text-white">Battle Paused</h2>
          <p className="mt-1 text-xs text-slate-400">{hud.levelTitle}</p>
          <div className="mt-6 flex flex-col gap-2.5">
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

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700/90 bg-slate-900/95 p-6 text-center shadow-2xl sm:p-8">
        <h2
          className={`font-display text-3xl font-extrabold tracking-widest sm:text-4xl ${
            isVictory ? 'text-cyan-300' : 'text-rose-400'
          }`}
        >
          {isVictory ? 'VICTORY' : 'DEFEAT'}
        </h2>

        <p className="mt-2 text-sm text-slate-300">
          {hud.mode === 'TUTORIAL' && isVictory
            ? 'You split the Giant Boulder! Story Level 1 is now unlocked.'
            : isVictory
              ? `${hud.levelTitle} cleared!`
              : `${hud.playerName} fell in battle.`}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 border-y border-slate-800 py-3 text-xs text-slate-300">
          {hud.lastRank && (
            <div>
              <span className="text-slate-500">Rank </span>
              <span className="font-mono-num font-bold text-amber-300">{hud.lastRank}</span>
            </div>
          )}
          <div>
            <span className="text-slate-500">Coins </span>
            <span className="font-mono-num font-bold text-amber-300">
              +{hud.coinsEarnedThisRun}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Time </span>
            <span className="font-mono-num font-semibold text-slate-100">
              {hud.matchTime.toFixed(1)}s
            </span>
          </div>
          <div>
            <span className="text-slate-500">Hits </span>
            <span className="font-mono-num font-semibold text-slate-100">
              {hud.comboCount}
            </span>
          </div>
        </div>

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
