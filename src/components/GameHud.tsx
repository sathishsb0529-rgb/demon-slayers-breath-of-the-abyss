import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Eye,
  Flame,
  KeyRound,
  Lock,
  Pause,
  Search,
  SkipForward,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AWAKENING_SPECS, BREATHING_STYLES, ULTIMATE_SPECS } from '../game/breathing';
import { MAP_DISPLAY_NAMES } from '../game/campaign';
import { getFormEnergyCost } from '../game/constants';
import { HudPreset, HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  hudPreset: HudPreset;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onTriggerForm: (formIndex: number) => void;
  onTriggerAwakening: () => void;
  onTriggerTransparentWorld: () => void;
  onTriggerUltimate: () => void;
  onAdvanceTutorial: () => void;
  onSkipTutorial: () => void;
  onInteractInvestigation: () => void;
  onDismissInvestigationDialogue: () => void;
}

export function GameHud({
  hud,
  hudPreset,
  onTogglePause,
  onToggleMute,
  onTriggerForm,
  onTriggerAwakening,
  onTriggerTransparentWorld,
  onTriggerUltimate,
  onAdvanceTutorial,
  onSkipTutorial,
  onInteractInvestigation,
  onDismissInvestigationDialogue,
}: GameHudProps) {
  const [formPage, setFormPage] = useState(0);
  const [navToastVisible, setNavToastVisible] = useState(false);
  const lastNavKeyRef = useRef<string>('');

  useEffect(() => {
    setFormPage(0);
  }, [hud.breathingStyle]);

  // Show top-center navigation notification for ~3.2s when zone or destination changes,
  // and immediately hide it during active combat so the battlefield stays unobstructed.
  useEffect(() => {
    if (hud.inCombat || !hud.navTargetName || hud.mode !== 'STORY') {
      setNavToastVisible(false);
      return;
    }
    const navKey = `${hud.levelId}_${hud.zoneIndex}_${hud.navTargetName}`;
    if (navKey !== lastNavKeyRef.current) {
      lastNavKeyRef.current = navKey;
      setNavToastVisible(true);
      const timer = window.setTimeout(() => setNavToastVisible(false), 3200);
      return () => window.clearTimeout(timer);
    }
  }, [hud.inCombat, hud.navTargetName, hud.levelId, hud.zoneIndex, hud.mode]);

  const playerPct = Math.max(0, Math.min(100, (hud.playerHp / Math.max(1, hud.playerMaxHp)) * 100));
  const enemyPct = Math.max(0, Math.min(100, (hud.enemyHp / Math.max(1, hud.enemyMaxHp)) * 100));
  const energyPct = Math.max(0, Math.min(100, (hud.playerEnergy / Math.max(1, hud.playerMaxEnergy)) * 100));
  const xpPct =
    hud.playerLevel >= 50
      ? 100
      : hud.playerXpToNext > 0
        ? Math.max(2, Math.min(100, (hud.playerXp / hud.playerXpToNext) * 100))
        : 100;

  const styleDef = BREATHING_STYLES[hud.breathingStyle];
  const totalPages = Math.max(1, Math.ceil(styleDef.forms.length / 4));
  const safePage = Math.min(formPage, totalPages - 1);
  const pageForms = styleDef.forms.slice(safePage * 4, safePage * 4 + 4);

  const awkReady = !hud.awakeningActive && hud.awakeningMeter >= 100 && hud.awakeningCooldown <= 0.1;
  const awkTierName = hud.awakeningTier ? AWAKENING_SPECS[hud.awakeningTier].name : 'Slayer Focus';
  const ultSpec = ULTIMATE_SPECS[hud.equippedUltimate];
  const ultReady = hud.ultimateCooldown <= 0.05 && hud.playerEnergy >= ultSpec.energyCost;

  const stwAvailable = Boolean(hud.transparentWorldAvailable);
  const stwActive = Boolean(hud.transparentWorldActive);
  const stwCd = hud.transparentWorldCooldown ?? 0;
  const stwReady = stwAvailable && !stwActive && stwCd <= 0.05;

  const isMinimal = hudPreset === 'minimal';
  const isDetailed = hudPreset === 'detailed';

  const chapterNum = hud.chapterNumber ?? Math.max(1, Math.ceil((hud.levelId || 1) / 10));
  const invTotal = hud.investigationTotal ?? 0;
  const invFound = hud.investigationFound ?? 0;

  return (
    <div className="safe-area-hud pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col">
      {/* Ultra-compact Top Strip — leaves >=85% unobstructed battlefield */}
      <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-2 sm:gap-4">
        {/* LEFT: Compact Player Status (Name, Lv, Coins, HP, Breathing Energy, thin XP) */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-md bg-slate-950/55 px-2 py-1 backdrop-blur-[2px]">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-baseline gap-1.5">
              <span className="font-display truncate text-[11px] font-bold tracking-wide text-slate-100 sm:text-xs">
                {hud.playerName}
              </span>
              <span className="font-mono-num tabular-nums shrink-0 text-[10px] font-bold text-sky-300">
                Lv.{hud.playerLevel}
              </span>
              <span className="font-mono-num tabular-nums flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-amber-300">
                <Coins className="h-2.5 w-2.5" />
                {hud.coins}
              </span>
            </div>
            <span className="font-mono-num tabular-nums shrink-0 text-[10px] font-semibold text-sky-200">
              {Math.ceil(hud.playerHp)}/{hud.playerMaxHp}
            </span>
          </div>

          {/* Compact Health Bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-sm border border-slate-700/80 bg-slate-950/90">
            <div
              className="h-full bg-gradient-to-r from-sky-600 via-cyan-400 to-teal-300 transition-[width] duration-150 ease-out"
              style={{ width: `${playerPct}%` }}
            />
          </div>

          {/* Slim Breathing Energy Bar + Thin XP Indicator */}
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-slate-950/90">
              <div
                className="h-full transition-[width] duration-75"
                style={{
                  width: `${energyPct}%`,
                  backgroundColor: styleDef.primaryColor,
                }}
              />
            </div>
            <div
              title={hud.playerLevel >= 50 ? 'MAX Lv.50' : `XP ${hud.playerXp}/${hud.playerXpToNext}`}
              className="h-1.5 w-12 shrink-0 overflow-hidden rounded-sm bg-slate-900/95 sm:w-16"
            >
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-[width] duration-200"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          {/* Temporary Active Buffs ONLY when active (never permanent clutter) */}
          {(hud.awakeningActive || stwActive || hud.counterReady) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] font-bold">
              {hud.awakeningActive && (
                <span className="font-mono-num tabular-nums text-amber-300">
                  {awkTierName} {hud.awakeningTimer.toFixed(0)}s
                </span>
              )}
              {stwActive && (
                <span className="font-mono-num tabular-nums text-cyan-300">
                  Transparent World {(hud.transparentWorldTimer ?? 0).toFixed(1)}s
                </span>
              )}
              {hud.counterReady && (
                <span className="text-amber-200">Counter Ready</span>
              )}
            </div>
          )}

          {/* Standard & Detailed: Compact Mission Objective Line */}
          {!isMinimal && hud.mode === 'STORY' && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-300">
              {invTotal > 0 ? (
                <span className={`flex items-center gap-1 font-semibold ${invFound >= invTotal ? 'text-emerald-300' : 'text-sky-200'}`}>
                  {invFound >= invTotal && <Check className="h-3 w-3" />}
                  Investigate Clues ({invFound}/{invTotal})
                </span>
              ) : hud.objectiveText ? (
                <span className="truncate font-medium text-slate-200">{hud.objectiveText}</span>
              ) : null}
              {hud.dungeonDoorLocked && (
                <span className={`flex items-center gap-0.5 font-semibold ${hud.hasDungeonKey ? 'text-emerald-300' : 'text-amber-300'}`}>
                  <KeyRound className="h-2.5 w-2.5" />
                  {hud.hasDungeonKey ? 'Key Held' : 'Find Key'}
                </span>
              )}
            </div>
          )}

          {/* Detailed Preset ONLY (Desktop): Quick-cast Form / Ability Icons */}
          {isDetailed && (
            <div className="pointer-events-auto mt-1 hidden flex-wrap items-center gap-1 sm:flex">
              {totalPages > 1 && (
                <div className="flex items-center rounded border border-slate-700 bg-slate-950/90 px-0.5">
                  <button
                    type="button"
                    aria-label="Previous breathing page"
                    onClick={() => setFormPage((p) => (p - 1 + totalPages) % totalPages)}
                    className="p-0.5 text-sky-300 hover:text-white"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <span className="font-mono-num tabular-nums px-1 text-[9px] font-bold text-slate-300">
                    {safePage + 1}/{totalPages}
                  </span>
                  <button
                    type="button"
                    aria-label="Next breathing page"
                    onClick={() => setFormPage((p) => (p + 1) % totalPages)}
                    className="p-0.5 text-sky-300 hover:text-white"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}

              {pageForms.map((form) => {
                const cost = getFormEnergyCost(form.index, styleDef.forms.length);
                const cd = hud.formCooldowns[form.index - 1] ?? 0;
                const ready = !form.isUnknown && hud.playerEnergy >= cost && cd <= 0.05;
                return (
                  <button
                    key={form.index}
                    type="button"
                    onClick={() => onTriggerForm(form.index)}
                    title={form.isUnknown ? `${form.name} (Unknown)` : `${form.name} (${cost}% Energy)`}
                    className={`font-mono-num tabular-nums flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                      form.isUnknown
                        ? 'border-slate-800 bg-slate-950/60 text-slate-600'
                        : ready
                          ? 'border-slate-600 bg-slate-900/90 text-slate-100 hover:border-sky-400'
                          : 'border-slate-800 bg-slate-950/80 text-slate-500'
                    }`}
                  >
                    <span>{form.index}</span>
                    {form.isUnknown ? (
                      <Lock className="h-2.5 w-2.5" />
                    ) : cd > 0.05 ? (
                      <span className="text-[9px]">{cd.toFixed(0)}s</span>
                    ) : null}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onTriggerAwakening}
                title={`[Q] ${awkTierName}`}
                className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                  hud.awakeningActive || awkReady
                    ? 'border-amber-400 bg-amber-950/85 text-amber-200'
                    : 'border-slate-800 bg-slate-950/80 text-slate-400'
                }`}
              >
                <Sparkles className="h-3 w-3 text-amber-300" />
                {hud.awakeningActive && <span className="font-mono-num tabular-nums">{hud.awakeningTimer.toFixed(0)}s</span>}
              </button>

              {stwAvailable && (
                <button
                  type="button"
                  onClick={onTriggerTransparentWorld}
                  title="[T] Transparent World"
                  className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                    stwActive || stwReady
                      ? 'border-cyan-400 bg-cyan-950/85 text-cyan-200'
                      : 'border-slate-800 bg-slate-950/80 text-slate-400'
                  }`}
                >
                  <Eye className="h-3 w-3 text-cyan-300" />
                  {stwCd > 0.05 && <span className="font-mono-num tabular-nums">{stwCd.toFixed(0)}s</span>}
                </button>
              )}

              <button
                type="button"
                onClick={onTriggerUltimate}
                title={`[U] ${ultSpec.name}`}
                className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                  ultReady
                    ? 'border-fuchsia-400 bg-fuchsia-950/85 text-fuchsia-100'
                    : 'border-slate-800 bg-slate-950/80 text-slate-500'
                }`}
              >
                <Flame className="h-3 w-3 text-fuchsia-300" />
                {hud.ultimateCooldown > 0.05 && (
                  <span className="font-mono-num tabular-nums">{hud.ultimateCooldown.toFixed(0)}s</span>
                )}
              </button>

              {hud.heavyCooldown > 0.05 && (
                <span className="font-mono-num tabular-nums flex items-center gap-0.5 rounded border border-slate-700 bg-slate-950/85 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                  <Swords className="h-3 w-3" />
                  {hud.heavyCooldown.toFixed(1)}s
                </span>
              )}
            </div>
          )}

          {/* Detailed Preset: Allies HP */}
          {isDetailed && hud.allies.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-slate-300">
              {hud.allies.map((a) => (
                <span key={a.name} className="font-mono-num tabular-nums">
                  {a.name.split(' ')[0]} {Math.max(0, Math.ceil(a.hp))}/{a.maxHp}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CENTER: Compact Chapter / Zone Indicator + Mute & Pause */}
        <div className="pointer-events-auto flex shrink-0 flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={hud.muted ? 'Unmute audio' : 'Mute audio'}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700/80 bg-slate-950/80 text-slate-200 hover:border-sky-400"
            >
              {hud.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={onTogglePause}
              aria-label="Pause battle"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700/80 bg-slate-950/80 text-slate-200 hover:border-sky-400"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded bg-slate-950/60 px-2 py-0.5 text-center text-[10px] font-semibold tracking-wide text-slate-200 backdrop-blur-[2px]">
            {hud.mode === 'SURVIVAL' ? (
              <span className="font-mono-num tabular-nums text-amber-300">
                Wave {hud.survivalWave ?? 1}/{hud.survivalMaxWaves ?? 20}
              </span>
            ) : hud.mode === 'TUTORIAL' ? (
              <span className="text-sky-300">Mt. Sagiri Trial</span>
            ) : (
              <span className="font-mono-num tabular-nums">
                Ch.{chapterNum} · Lv.{hud.levelId}
                {hud.zoneTotal > 1 ? ` · Z${hud.zoneIndex}/${hud.zoneTotal}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: Compact Enemy Status (Name, Rank, HP Bar, Boss Phase) */}
        <div className="flex min-w-0 flex-1 flex-col items-end gap-0.5 rounded-md bg-slate-950/55 px-2 py-1 backdrop-blur-[2px]">
          {hud.mode === 'TUTORIAL' && hud.tutorialStep === 10 ? (
            <>
              <div className="flex w-full items-baseline justify-between gap-1.5">
                <span className="font-mono-num tabular-nums shrink-0 text-[10px] font-semibold text-amber-300">
                  {Math.ceil(hud.rockHp)}/{hud.rockMaxHp}
                </span>
                <span className="font-display truncate text-right text-[11px] font-bold text-slate-100 sm:text-xs">
                  Giant Boulder
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-sm border border-slate-700/80 bg-slate-950/90">
                <div
                  className="ml-auto h-full bg-gradient-to-l from-amber-500 to-stone-400 transition-[width] duration-150"
                  style={{ width: `${Math.max(0, (hud.rockHp / Math.max(1, hud.rockMaxHp)) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex w-full items-baseline justify-between gap-1.5">
                <span className="font-mono-num tabular-nums shrink-0 text-[10px] font-semibold text-rose-300">
                  {Math.ceil(hud.enemyHp)}/{hud.enemyMaxHp}
                </span>
                <span className="font-display truncate text-right text-[11px] font-bold tracking-wide text-rose-100 sm:text-xs">
                  {hud.enemyName}
                </span>
              </div>
              <div
                className={`relative w-full overflow-hidden rounded-sm border bg-slate-950/90 ${
                  hud.isBossBattle ? 'h-3 border-rose-500/80' : 'h-2.5 border-slate-700/80'
                }`}
              >
                <div
                  className="ml-auto h-full bg-gradient-to-l from-rose-600 via-red-500 to-amber-500 transition-[width] duration-150 ease-out"
                  style={{ width: `${enemyPct}%` }}
                />
                {hud.isBossBattle && (
                  <>
                    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[25%] w-[1.5px] bg-slate-950/90" />
                    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[50%] w-[1.5px] bg-slate-950/90" />
                    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[75%] w-[1.5px] bg-slate-950/90" />
                  </>
                )}
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-300/90">
                <span className="truncate">{hud.enemySubtitle}</span>
                {hud.isBossBattle && (
                  <>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="font-mono-num tabular-nums shrink-0 font-bold text-rose-400">
                      P{hud.bossPhase}/4
                    </span>
                  </>
                )}
                {!hud.isBossBattle && hud.enemyWaveTotal > 1 && (
                  <>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="font-mono-num tabular-nums shrink-0">
                      {hud.enemyWaveIndex}/{hud.enemyWaveTotal}
                    </span>
                  </>
                )}
              </div>

              {hud.partnerEnemyName && (hud.partnerEnemyMaxHp ?? 0) > 0 && (
                <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-sm bg-slate-950/90">
                  <div
                    className="ml-auto h-full bg-gradient-to-l from-fuchsia-600 to-pink-400 transition-[width] duration-150"
                    style={{
                      width: `${Math.max(0, Math.min(100, ((hud.partnerEnemyHp ?? 0) / (hud.partnerEnemyMaxHp ?? 1)) * 100))}%`,
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Temporary Top-Center Fading Navigation Toast (Auto-hidden in combat, never covers player) */}
      {navToastVisible && !hud.inCombat && hud.navTargetName && (
        <div className="mx-auto mt-1.5 rounded bg-slate-950/75 px-3 py-1 text-[11px] font-semibold text-sky-200 backdrop-blur-sm transition-opacity duration-300">
          <span>{hud.navTargetName}</span>
          {typeof hud.navDistanceM === 'number' && hud.navDistanceM > 0 && (
            <span className="font-mono-num tabular-nums ml-1.5 text-slate-300">
              {hud.navDistanceM}m {hud.navDirection === 'west' ? '←' : '→'}
            </span>
          )}
        </div>
      )}

      {/* Subtle Screen-Edge Directional Chevron when exploring out of combat */}
      {!hud.inCombat && hud.mode === 'STORY' && hud.navDirection && !hud.activeInvestigationDialogue && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed top-1/2 -translate-y-1/2 rounded-md bg-slate-950/65 px-1.5 py-2 text-sky-300/90 ${
            hud.navDirection === 'east' ? 'right-2' : 'left-2'
          }`}
        >
          {hud.navDirection === 'east' ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </div>
      )}

      {/* Temporary Boss Encounter Announcement */}
      {hud.bossAnnouncement && (
        <div className="mx-auto mt-3 rounded-lg border border-rose-500/70 bg-slate-950/90 px-5 py-2 text-center shadow-2xl">
          <p className="text-[10px] font-bold tracking-[0.22em] text-rose-400 uppercase">
            {hud.bossAnnouncement.subtitle}
          </p>
          <p className="font-display text-base font-extrabold tracking-wider text-white sm:text-xl">
            {hud.bossAnnouncement.name}
          </p>
        </div>
      )}

      {/* Survival Mode Next Wave Countdown */}
      {hud.mode === 'SURVIVAL' && typeof hud.survivalCountdown === 'number' && hud.survivalCountdown > 0 && (
        <div className="mx-auto mt-2 rounded-lg border border-amber-400/70 bg-slate-950/90 px-4 py-1.5 text-center shadow-xl">
          <p className="font-display text-xs font-extrabold tracking-widest text-amber-300 sm:text-sm">
            WAVE {hud.survivalWave} CLEARED · NEXT IN {hud.survivalCountdown.toFixed(1)}s
          </p>
        </div>
      )}

      {/* Hybrid Finishing Execution Banner */}
      {hud.phase === 'FINISHING' && hud.finishingTitle && (
        <div className="mx-auto mt-6 rounded-lg border border-rose-400/80 bg-slate-950/90 px-5 py-2 text-center shadow-2xl">
          <p className="font-display text-sm font-extrabold tracking-widest text-rose-300 sm:text-lg">
            {hud.finishingTitle}
          </p>
        </div>
      )}

      {/* Compact Top-Left Wrapped Tutorial Box */}
      {hud.mode === 'TUTORIAL' && (
        <div className="pointer-events-auto mt-1.5 w-full max-w-xs self-start rounded-lg border border-sky-500/45 bg-slate-950/88 px-3 py-2 text-left shadow-xl backdrop-blur-sm">
          <span className="font-mono-num tabular-nums text-[10px] font-bold tracking-wider text-sky-300 uppercase">
            Trial {hud.tutorialStep}/10 · {hud.tutorialTitle}
          </span>
          {hud.tutorialMentorLine && (
            <p className="mt-0.5 text-[11px] leading-snug text-slate-200 break-words">
              “{hud.tutorialMentorLine}”
            </p>
          )}
          <p className="mt-0.5 text-[11px] font-semibold leading-snug text-amber-300 break-words">
            {hud.tutorialInstruction}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={onAdvanceTutorial}
              className="flex min-h-[34px] items-center gap-1 rounded-md bg-sky-500 px-3 py-1 text-[11px] font-bold text-slate-950 hover:bg-sky-400"
            >
              <span>{hud.tutorialStep >= 10 ? 'Finish Trial' : 'Next'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onSkipTutorial}
              className="flex min-h-[34px] items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
            >
              <SkipForward className="h-3 w-3" />
              <span>Skip</span>
            </button>
          </div>
        </div>
      )}

      {/* Enemy Telegraph Warning (only during active telegraph) */}
      {hud.enemyTelegraph && (
        <div className="mx-auto mt-1.5 rounded border border-rose-500/80 bg-rose-950/90 px-3 py-0.5 text-[11px] font-extrabold tracking-wide text-rose-200 shadow-lg">
          {hud.enemyTelegraph}
        </div>
      )}

      {/* Action / Cooldown / Energy Warning */}
      {hud.actionWarning && (
        <div className="mx-auto mt-1.5 rounded border border-amber-500/60 bg-slate-950/90 px-3 py-0.5 text-[11px] font-bold text-amber-300">
          {hud.actionWarning}
        </div>
      )}

      {/* Interactive Investigation Prompt (Bottom-Center, never covers player) */}
      {hud.nearbyInvestigation && !hud.activeInvestigationDialogue && !hud.inCombat && (
        <div className="pointer-events-auto fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
          <button
            type="button"
            onClick={onInteractInvestigation}
            className="flex min-h-[44px] items-center gap-2 rounded-lg border border-amber-400/80 bg-slate-950/92 px-4 py-2 text-xs font-bold text-amber-200 shadow-xl backdrop-blur-sm hover:bg-slate-900"
          >
            <Search className="h-4 w-4 text-amber-300" />
            <span>Inspect: {hud.nearbyInvestigation.title}</span>
            <span className="hidden rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 sm:inline">
              F
            </span>
          </button>
        </div>
      )}

      {/* Investigation Clue / Survivor / Horror Reveal Dialogue Box */}
      {hud.activeInvestigationDialogue && (
        <div className="pointer-events-auto fixed inset-x-4 bottom-4 z-30 mx-auto max-w-xl">
          <div
            className={`rounded-xl border p-3.5 shadow-2xl backdrop-blur-md ${
              hud.activeInvestigationDialogue.isHorrorReveal
                ? 'border-rose-500/80 bg-[#14060b]/95'
                : 'border-sky-500/60 bg-slate-950/92'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`font-display text-xs font-extrabold tracking-wider uppercase ${
                  hud.activeInvestigationDialogue.isHorrorReveal ? 'text-rose-400' : 'text-amber-300'
                }`}
              >
                {hud.activeInvestigationDialogue.speaker}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {MAP_DISPLAY_NAMES[hud.mapId]}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-100 sm:text-sm">
              “{hud.activeInvestigationDialogue.text}”
            </p>
            {hud.activeInvestigationDialogue.playerReply && (
              <p className="mt-1.5 text-xs font-semibold text-sky-300">
                {hud.playerName.split(' ')[0]}: “{hud.activeInvestigationDialogue.playerReply}”
              </p>
            )}
            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                onClick={onDismissInvestigationDialogue}
                className={`flex min-h-[38px] items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold ${
                  hud.activeInvestigationDialogue.isHorrorReveal
                    ? 'bg-rose-600 text-white hover:bg-rose-500'
                    : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                }`}
              >
                <span>{hud.activeInvestigationDialogue.isHorrorReveal ? 'Draw Nichirin Blade' : 'Continue'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
