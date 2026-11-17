import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Eye,
  Flame,
  KeyRound,
  Lock,
  Pause,
  SkipForward,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AWAKENING_SPECS, BREATHING_STYLES, ULTIMATE_SPECS } from '../game/breathing';
import { MAP_DISPLAY_NAMES } from '../game/campaign';
import { DIFFICULTY_SCALING, getFormEnergyCost } from '../game/constants';
import { HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onTriggerForm: (formIndex: number) => void;
  onTriggerAwakening: () => void;
  onTriggerTransparentWorld: () => void;
  onTriggerUltimate: () => void;
  onAdvanceTutorial: () => void;
  onSkipTutorial: () => void;
}

export function GameHud({
  hud,
  onTogglePause,
  onToggleMute,
  onTriggerForm,
  onTriggerAwakening,
  onTriggerTransparentWorld,
  onTriggerUltimate,
  onAdvanceTutorial,
  onSkipTutorial,
}: GameHudProps) {
  const [formPage, setFormPage] = useState(0);

  useEffect(() => {
    setFormPage(0);
  }, [hud.breathingStyle]);

  const playerPct = Math.max(0, Math.min(100, (hud.playerHp / hud.playerMaxHp) * 100));
  const enemyPct = Math.max(0, Math.min(100, (hud.enemyHp / hud.enemyMaxHp) * 100));
  const energyPct = Math.max(0, Math.min(100, (hud.playerEnergy / hud.playerMaxEnergy) * 100));
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

  const heavyReady = hud.heavyCooldown <= 0.05;
  const heavyFillPct =
    hud.maxHeavyCooldown > 0
      ? Math.max(0, Math.min(100, (1 - hud.heavyCooldown / hud.maxHeavyCooldown) * 100))
      : 100;

  const awkReady = !hud.awakeningActive && hud.awakeningMeter >= 100 && hud.awakeningCooldown <= 0.1;
  const awkTierName = hud.awakeningTier ? AWAKENING_SPECS[hud.awakeningTier].name : 'Slayer Focus';
  const ultSpec = ULTIMATE_SPECS[hud.equippedUltimate];
  const ultReady = hud.ultimateCooldown <= 0.05 && hud.playerEnergy >= ultSpec.energyCost;

  const stwAvailable = Boolean(hud.transparentWorldAvailable);
  const stwActive = Boolean(hud.transparentWorldActive);
  const stwCd = hud.transparentWorldCooldown ?? 0;
  const stwReady = stwAvailable && !stwActive && stwCd <= 0.05;

  const diffMeta = DIFFICULTY_SCALING[hud.difficultyMode] ?? DIFFICULTY_SCALING.standard;

  return (
    <div className="safe-area-hud pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-2 sm:gap-5">
        {/* Player Status + 0-100% Breathing Energy + XP Meter */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display truncate text-xs font-bold tracking-wider text-slate-100 sm:text-sm">
              {hud.playerName}
              <span className="font-mono-num tabular-nums ml-1.5 text-[10px] font-bold text-sky-300">
                Lv.{hud.playerLevel}/50
              </span>
              {hud.awakeningActive && (
                <span className="ml-1.5 text-[10px] font-extrabold text-amber-300 uppercase">
                  · {awkTierName}
                </span>
              )}
              {stwActive && (
                <span className="ml-1.5 text-[10px] font-extrabold text-cyan-300 uppercase">
                  · STW
                </span>
              )}
            </span>
            <span className="font-mono-num tabular-nums shrink-0 text-xs font-semibold text-sky-300">
              {Math.ceil(hud.playerHp)} / {hud.playerMaxHp}
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-sm border border-slate-700/90 bg-slate-950/90 sm:h-3.5">
            <div
              className="h-full bg-gradient-to-r from-sky-600 via-cyan-400 to-teal-300 transition-[width] duration-150 ease-out"
              style={{ width: `${playerPct}%` }}
            />
          </div>

          {/* 0 - 100% Breathing Energy Meter */}
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate font-semibold" style={{ color: styleDef.primaryColor }}>
              {hud.breathingStyleName} ({styleDef.forms.length} Forms)
            </span>
            <span className="font-mono-num tabular-nums shrink-0 font-bold text-slate-200">
              {Math.floor(hud.playerEnergy)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-sm border border-slate-800 bg-slate-950/90">
            <div
              className="h-full transition-[width] duration-75"
              style={{
                width: `${energyPct}%`,
                backgroundColor: styleDef.primaryColor,
              }}
            />
          </div>

          {/* Compact XP Progress Strip */}
          <div className="flex items-center gap-2 text-[10px]">
            <div className="h-1 flex-1 overflow-hidden rounded-sm bg-slate-900/95">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-[width] duration-200"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <span className="font-mono-num tabular-nums shrink-0 text-[9px] font-semibold text-amber-200/90">
              {hud.playerLevel >= 50
                ? 'MAX (1500 XP)'
                : `${hud.playerXp}/${hud.playerXpToNext} XP`}
            </span>
          </div>

          {/* Paginated Breathing Forms + Awakening + Transparent World + Ultimate + Heavy CD Strip (Desktop) */}
          <div className="pointer-events-auto mt-0.5 hidden flex-wrap items-center gap-1 sm:flex">
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
                  title={form.isUnknown ? `${form.name} (Canon form unknown)` : `${form.name} (${cost}% Energy)`}
                  className={`font-mono-num tabular-nums flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
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
                  ) : (
                    <span className="text-[9px] opacity-75">
                      {cd > 0.05 ? `${cd.toFixed(0)}s` : `${cost}%`}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Awakening Quick Button */}
            <button
              type="button"
              onClick={onTriggerAwakening}
              title={`[Q] ${awkTierName} (${Math.floor(hud.awakeningMeter)}%)`}
              className={`font-mono-num tabular-nums flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                hud.awakeningActive
                  ? 'border-amber-300 bg-amber-950/90 text-amber-200 ring-1 ring-amber-400/60'
                  : awkReady
                    ? 'border-amber-400 bg-amber-900/80 text-white hover:bg-amber-800'
                    : 'border-slate-800 bg-slate-950/80 text-slate-400'
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-300" />
              <span>
                {hud.awakeningActive
                  ? `${hud.awakeningTimer.toFixed(0)}s`
                  : `${Math.floor(hud.awakeningMeter)}%`}
              </span>
            </button>

            {/* Transparent World Quick Button */}
            <button
              type="button"
              onClick={onTriggerTransparentWorld}
              title="[T] Transparent World — Upper Moon & Demon King boss battles only (5s duration / 45s cooldown)"
              className={`font-mono-num tabular-nums flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                stwActive
                  ? 'border-cyan-300 bg-cyan-950/90 text-cyan-100 ring-1 ring-cyan-400/60'
                  : stwReady
                    ? 'border-cyan-400/80 bg-cyan-950/70 text-cyan-200 hover:bg-cyan-900/80'
                    : stwAvailable
                      ? 'border-slate-700 bg-slate-950/85 text-slate-400'
                      : 'border-slate-800 bg-slate-950/60 text-slate-600'
              }`}
            >
              <Eye className="h-3 w-3 text-cyan-300" />
              <span>
                {stwActive
                  ? `${(hud.transparentWorldTimer ?? 0).toFixed(1)}s`
                  : stwCd > 0.05
                    ? `${stwCd.toFixed(0)}s`
                    : stwAvailable
                      ? 'STW'
                      : 'Boss Only'}
              </span>
            </button>

            {/* Ultimate Quick Button */}
            <button
              type="button"
              onClick={onTriggerUltimate}
              title={`[U] ${ultSpec.name} (${ultSpec.energyCost}% Energy)`}
              className={`font-mono-num tabular-nums flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                ultReady
                  ? 'border-fuchsia-400 bg-fuchsia-950/85 text-fuchsia-100 hover:bg-fuchsia-900'
                  : 'border-slate-800 bg-slate-950/80 text-slate-500'
              }`}
            >
              <Flame className="h-3 w-3 text-fuchsia-300" />
              <span>
                {hud.ultimateCooldown > 0.05 ? `${hud.ultimateCooldown.toFixed(0)}s` : 'ULT'}
              </span>
            </button>

            {/* Heavy Attack Cooldown */}
            <div
              title="Heavy Overhead Strike (Key K / X — 2.0s Cooldown)"
              className={`font-mono-num tabular-nums relative flex items-center gap-1 overflow-hidden rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                heavyReady
                  ? 'border-rose-500/70 bg-rose-950/75 text-rose-200'
                  : 'border-slate-700 bg-slate-950/85 text-slate-400'
              }`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-rose-500/20 transition-[width] duration-75"
                style={{ width: `${heavyFillPct}%` }}
              />
              <Swords className="relative h-3 w-3 text-rose-300" />
              <span className="relative">
                {heavyReady ? 'Heavy' : `${hud.heavyCooldown.toFixed(1)}s`}
              </span>
            </div>

            {hud.counterReady && (
              <span className="ml-1 text-[11px] font-bold text-amber-300">Counter Ready</span>
            )}
          </div>

          {/* Mobile Compact Status */}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] sm:hidden">
            <span
              className={`font-mono-num tabular-nums rounded border px-1.5 py-0.5 font-bold ${
                heavyReady
                  ? 'border-rose-500/60 bg-rose-950/70 text-rose-200'
                  : 'border-slate-700 bg-slate-950/85 text-slate-400'
              }`}
            >
              {heavyReady ? 'Heavy' : `Hvy ${hud.heavyCooldown.toFixed(1)}s`}
            </span>
            <span className="font-mono-num tabular-nums rounded border border-amber-500/50 bg-slate-950/80 px-1.5 py-0.5 font-bold text-amber-300">
              {hud.awakeningActive ? `AWK ${hud.awakeningTimer.toFixed(0)}s` : `AWK ${Math.floor(hud.awakeningMeter)}%`}
            </span>
            {hud.counterReady && (
              <span className="font-bold text-amber-300">Counter</span>
            )}
          </div>

          {/* Dungeon / Optional Objective Strip */}
          {(hud.inDarkDungeon || hud.dungeonDoorLocked || hud.bonusObjectiveLabel) && hud.mode !== 'TUTORIAL' && (
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px]">
              {(hud.inDarkDungeon || hud.dungeonDoorLocked) && (
                <span
                  className={`flex items-center gap-1 font-semibold ${
                    hud.hasDungeonKey ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  <KeyRound className="h-3 w-3" />
                  {hud.hasDungeonKey
                    ? hud.dungeonDoorLocked
                      ? 'Dungeon Key Held · Approach Gate'
                      : 'Dungeon Gate Unlocked'
                    : 'Find Dungeon Key to Unlock Gate'}
                </span>
              )}
              {hud.bonusObjectiveLabel && (
                <span
                  className={`font-semibold ${
                    hud.bonusObjectiveMet ? 'text-emerald-300' : 'text-slate-300'
                  }`}
                >
                  Bonus: {hud.bonusObjectiveLabel} {hud.bonusObjectiveMet ? '✓' : ''}
                </span>
              )}
            </div>
          )}

          {/* Allies HP */}
          {hud.allies.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-3 text-[10px] text-slate-300">
              {hud.allies.map((a) => (
                <span key={a.name} className="font-mono-num tabular-nums">
                  {a.name.split(' ')[0]}: {Math.max(0, Math.ceil(a.hp))}/{a.maxHp}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Center Level / Survival Info, Coins, Pause & Mute */}
        <div className="pointer-events-auto flex shrink-0 flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={hud.muted ? 'Unmute audio' : 'Mute audio'}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700/80 bg-slate-950/85 text-slate-200 hover:border-sky-500/70"
            >
              {hud.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onTogglePause}
              aria-label="Pause battle"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700/80 bg-slate-950/85 text-slate-200 hover:border-sky-500/70"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-300">
            <Coins className="h-3.5 w-3.5" />
            <span className="font-mono-num tabular-nums font-bold">{hud.coins}</span>
            <span className="hidden text-slate-600 sm:inline" aria-hidden="true">·</span>
            <span className="hidden text-[10px] font-medium text-slate-300 sm:inline">
              {hud.mode === 'SURVIVAL'
                ? `Survival Wave ${hud.survivalWave ?? 1}/${hud.survivalMaxWaves ?? 20}`
                : MAP_DISPLAY_NAMES[hud.mapId]}
            </span>
          </div>
          {hud.difficultyMode !== 'standard' && (
            <span className="text-[9px] font-bold tracking-wider text-rose-300 uppercase">
              {diffMeta.label}
            </span>
          )}
          {hud.zoneTotal > 1 && hud.mode !== 'SURVIVAL' && (
            <div className="hidden flex-col items-center gap-0.5 sm:flex">
              <span className="text-[10px] font-semibold tracking-wide text-sky-300/90">
                Zone {hud.zoneIndex}/{hud.zoneTotal} · {hud.zoneName}
              </span>
              <div className="h-1 w-28 overflow-hidden rounded-sm bg-slate-900/90">
                <div
                  className="h-full bg-sky-400 transition-[width] duration-150"
                  style={{
                    width: `${Math.max(4, Math.min(100, (hud.playerWorldX / Math.max(1, hud.worldWidth)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Enemy / Rock Health */}
        <div className="flex min-w-0 flex-1 flex-col items-end gap-1">
          {hud.mode === 'TUTORIAL' && hud.tutorialStep === 10 ? (
            <>
              <div className="flex w-full items-baseline justify-between gap-2">
                <span className="font-mono-num tabular-nums shrink-0 text-xs font-semibold text-amber-300">
                  {Math.ceil(hud.rockHp)} / {hud.rockMaxHp}
                </span>
                <span className="font-display truncate text-right text-xs font-bold text-slate-100 sm:text-sm">
                  Giant Boulder
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-sm border border-slate-700/90 bg-slate-950/90 sm:h-3.5">
                <div
                  className="ml-auto h-full bg-gradient-to-l from-amber-500 to-stone-400 transition-[width] duration-150"
                  style={{ width: `${Math.max(0, (hud.rockHp / hud.rockMaxHp) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex w-full items-baseline justify-between gap-2">
                <span className="font-mono-num tabular-nums shrink-0 text-xs font-semibold text-rose-300">
                  {Math.ceil(hud.enemyHp)} / {hud.enemyMaxHp}
                </span>
                <span className="font-display truncate text-right text-xs font-bold tracking-wider text-rose-100 sm:text-sm">
                  {hud.isBossBattle && (
                    <span className="mr-1.5 text-[10px] font-extrabold tracking-widest text-rose-400 uppercase">
                      Boss ·
                    </span>
                  )}
                  {hud.enemyName}
                </span>
              </div>
              <div
                className={`relative w-full overflow-hidden rounded-sm border bg-slate-950/90 ${
                  hud.isBossBattle
                    ? 'h-3.5 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.35)] sm:h-4'
                    : 'h-3 border-slate-700/90 sm:h-3.5'
                }`}
              >
                <div
                  className="ml-auto h-full bg-gradient-to-l from-rose-600 via-red-500 to-amber-500 transition-[width] duration-150 ease-out"
                  style={{ width: `${enemyPct}%` }}
                />
                {/* 75% / 50% / 25% Boss Phase Threshold Markers */}
                {hud.isBossBattle && (
                  <>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-[25%] w-[1.5px] bg-slate-950/90"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-[50%] w-[1.5px] bg-slate-950/90"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-[75%] w-[1.5px] bg-slate-950/90"
                    />
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5 text-[11px] text-slate-300/85">
                <span className="truncate">{hud.enemySubtitle}</span>
                {hud.enemyDemonClass && hud.mode !== 'TUTORIAL' && (
                  <>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-[10px] font-semibold text-amber-300 uppercase">
                      {hud.enemyDemonClass}
                    </span>
                  </>
                )}
                {hud.enemyWaveTotal > 1 && (
                  <>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="font-mono-num tabular-nums shrink-0">
                      Wave {hud.enemyWaveIndex}/{hud.enemyWaveTotal}
                    </span>
                  </>
                )}
                {hud.isBossBattle && (
                  <>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="font-mono-num tabular-nums font-bold text-rose-400">
                      Phase {hud.bossPhase}/4
                    </span>
                  </>
                )}
              </div>

              {(() => {
                const pMax = hud.partnerEnemyMaxHp ?? 0;
                const pHp = hud.partnerEnemyHp ?? 0;
                if (!hud.partnerEnemyName || pMax <= 0) return null;
                return (
                  <div className="mt-1 flex w-full flex-col items-end gap-0.5">
                    <div className="flex w-full items-baseline justify-between gap-2 text-[10px]">
                      <span className="font-mono-num tabular-nums text-fuchsia-300">
                        {Math.max(0, Math.ceil(pHp))} / {pMax}
                      </span>
                      <span className="font-display truncate font-bold text-fuchsia-200">
                        {hud.partnerEnemyName}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-sm border border-fuchsia-500/60 bg-slate-950/90">
                      <div
                        className="ml-auto h-full bg-gradient-to-l from-fuchsia-600 to-pink-400 transition-[width] duration-150"
                        style={{
                          width: `${Math.max(0, Math.min(100, (pHp / pMax) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* Survival Mode Next Wave Countdown */}
      {hud.mode === 'SURVIVAL' && typeof hud.survivalCountdown === 'number' && hud.survivalCountdown > 0 && (
        <div className="mx-auto mt-3 rounded-lg border border-amber-400/70 bg-slate-950/92 px-5 py-2 text-center shadow-2xl">
          <p className="font-display text-sm font-extrabold tracking-widest text-amber-300">
            WAVE {hud.survivalWave} CLEARED · NEXT WAVE IN {hud.survivalCountdown.toFixed(1)}s
          </p>
          <p className="font-mono-num tabular-nums text-xs text-emerald-300">
            Vitality +28% · Energy +45% · Survival Coins Earned: +{hud.survivalCoinsEarned ?? 0}
          </p>
        </div>
      )}

      {/* Hybrid Finishing Execution Banner */}
      {hud.phase === 'FINISHING' && hud.finishingTitle && (
        <div className="mx-auto mt-10 rounded-lg border border-rose-400/80 bg-slate-950/92 px-6 py-2.5 text-center shadow-2xl">
          <p className="font-display text-base font-extrabold tracking-widest text-rose-300 sm:text-xl">
            {hud.finishingTitle}
          </p>
        </div>
      )}

      {/* Zone Traversal Guidance Banner */}
      {hud.advancePrompt && hud.mode === 'STORY' && (
        <div className="mx-auto mt-2 rounded border border-sky-500/50 bg-slate-950/85 px-3.5 py-1 text-xs font-bold tracking-wide text-sky-200 shadow-lg">
          {hud.advancePrompt}
        </div>
      )}

      {/* Compact Top-Left Wrapped Tutorial Dialogue Box (Clear of Fighters, Boulder & Touch Controls) */}
      {hud.mode === 'TUTORIAL' && (
        <div className="pointer-events-auto mt-2 w-full max-w-sm self-start rounded-lg border border-sky-500/45 bg-slate-950/88 px-3 py-2 text-left shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono-num tabular-nums text-[10px] font-bold tracking-wider text-sky-300 uppercase">
              Trial {hud.tutorialStep}/10 · {hud.tutorialTitle}
            </span>
          </div>
          {hud.tutorialMentorLine && (
            <p className="mt-1 text-[11px] leading-snug text-slate-200 break-words">
              “{hud.tutorialMentorLine}”
            </p>
          )}
          <p className="mt-1 text-[11px] font-semibold leading-snug text-amber-300 break-words">
            {hud.tutorialInstruction}
          </p>
          <div className="mt-2 flex items-center gap-2">
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
              <span>Skip Tutorial</span>
            </button>
          </div>
        </div>
      )}

      {/* Enemy Blood Demon Art / Ultimate Telegraph Warning */}
      {hud.enemyTelegraph && (
        <div className="mx-auto mt-2 rounded border border-rose-500/80 bg-rose-950/90 px-3.5 py-1 text-xs font-extrabold tracking-wide text-rose-200 shadow-lg">
          {hud.enemyTelegraph}
        </div>
      )}

      {/* Action / Cooldown / Energy Warning */}
      {hud.actionWarning && (
        <div className="mx-auto mt-2 rounded border border-amber-500/60 bg-slate-950/90 px-3 py-1 text-xs font-bold text-amber-300">
          {hud.actionWarning}
        </div>
      )}
    </div>
  );
}
