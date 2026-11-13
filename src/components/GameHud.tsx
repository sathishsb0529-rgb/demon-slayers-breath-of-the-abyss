import { Coins, Pause, Swords, Volume2, VolumeX } from 'lucide-react';
import { BREATHING_STYLES } from '../game/breathing';
import { MAP_DISPLAY_NAMES } from '../game/campaign';
import { FORM_ENERGY_COSTS } from '../game/constants';
import { HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onTriggerForm: (formIndex: 1 | 2 | 3 | 4 | 5) => void;
}

export function GameHud({ hud, onTogglePause, onToggleMute, onTriggerForm }: GameHudProps) {
  const playerPct = Math.max(0, Math.min(100, (hud.playerHp / hud.playerMaxHp) * 100));
  const enemyPct = Math.max(0, Math.min(100, (hud.enemyHp / hud.enemyMaxHp) * 100));
  const energyPct = Math.max(0, Math.min(100, (hud.playerEnergy / hud.playerMaxEnergy) * 100));
  const styleDef = BREATHING_STYLES[hud.breathingStyle];
  const heavyReady = hud.heavyCooldown <= 0.05;
  const heavyFillPct =
    hud.maxHeavyCooldown > 0
      ? Math.max(0, Math.min(100, (1 - hud.heavyCooldown / hud.maxHeavyCooldown) * 100))
      : 100;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col px-3 pt-2 sm:px-5 sm:pt-3">
      <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-2 sm:gap-5">
        {/* Player Status + 0-100% Breathing Energy Meter */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display truncate text-xs font-bold tracking-wider text-slate-100 sm:text-sm">
              {hud.playerName}
            </span>
            <span className="font-mono-num shrink-0 text-xs font-semibold text-sky-300">
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
              {hud.breathingStyleName}
            </span>
            <span className="font-mono-num shrink-0 font-bold text-slate-200">
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

          {/* 5 Breathing Forms + Heavy 2.0s Cooldown Strip (Desktop / Quick Clickable) */}
          <div className="pointer-events-auto mt-0.5 hidden items-center gap-1 sm:flex">
            {([1, 2, 3, 4, 5] as const).map((idx) => {
              const cost = FORM_ENERGY_COSTS[idx];
              const cd = hud.formCooldowns[idx - 1];
              const ready = hud.playerEnergy >= cost && cd <= 0.05;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onTriggerForm(idx)}
                  title={`${styleDef.forms[idx - 1].name} (${cost}% Energy)`}
                  className={`font-mono-num flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                    ready
                      ? 'border-slate-600 bg-slate-900/90 text-slate-100 hover:border-sky-400'
                      : 'border-slate-800 bg-slate-950/80 text-slate-500'
                  }`}
                >
                  <span>{idx}</span>
                  <span className="text-[9px] opacity-75">
                    {cd > 0.05 ? `${cd.toFixed(0)}s` : `${cost}%`}
                  </span>
                </button>
              );
            })}

            {/* Heavy Attack 2.0s Cooldown Readout */}
            <div
              title="Heavy Overhead Strike (Key K / X — 2.0s Cooldown)"
              className={`font-mono-num relative ml-1 flex items-center gap-1 overflow-hidden rounded border px-1.5 py-0.5 text-[10px] font-bold ${
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
                {heavyReady ? 'Heavy Ready' : `Heavy ${hud.heavyCooldown.toFixed(1)}s`}
              </span>
            </div>

            {hud.counterReady && (
              <span className="ml-1 text-[11px] font-bold text-amber-300">Counter Ready</span>
            )}
          </div>

          {/* Level 50 AI Allies HP */}
          {hud.allies.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-300">
              {hud.allies.map((a) => (
                <span key={a.name} className="font-mono-num">
                  {a.name.split(' ')[0]}: {Math.max(0, Math.ceil(a.hp))}/{a.maxHp}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Center Level Info, Map Name, Coins, Pause & Mute */}
        <div className="pointer-events-auto flex shrink-0 flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={hud.muted ? 'Unmute audio' : 'Mute audio'}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700/80 bg-slate-950/85 text-slate-200 hover:border-sky-500/70 sm:h-9 sm:w-9"
            >
              {hud.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onTogglePause}
              aria-label="Pause battle"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700/80 bg-slate-950/85 text-slate-200 hover:border-sky-500/70 sm:h-9 sm:w-9"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-300">
            <Coins className="h-3.5 w-3.5" />
            <span className="font-mono-num font-bold">{hud.coins}</span>
            <span className="hidden text-slate-600 sm:inline" aria-hidden="true">·</span>
            <span className="hidden text-[10px] font-medium text-slate-300 sm:inline">
              {MAP_DISPLAY_NAMES[hud.mapId]}
            </span>
          </div>
        </div>

        {/* Enemy / Rock Health */}
        <div className="flex min-w-0 flex-1 flex-col items-end gap-1">
          {hud.mode === 'TUTORIAL' && hud.tutorialStep === 10 ? (
            <>
              <div className="flex w-full items-baseline justify-between gap-2">
                <span className="font-mono-num shrink-0 text-xs font-semibold text-amber-300">
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
                <span className="font-mono-num shrink-0 text-xs font-semibold text-rose-300">
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
                className={`w-full overflow-hidden rounded-sm border bg-slate-950/90 ${
                  hud.isBossBattle
                    ? 'h-3.5 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.35)] sm:h-4'
                    : 'h-3 border-slate-700/90 sm:h-3.5'
                }`}
              >
                <div
                  className="ml-auto h-full bg-gradient-to-l from-rose-600 via-red-500 to-amber-500 transition-[width] duration-150 ease-out"
                  style={{ width: `${enemyPct}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300/85">
                <span className="truncate">{hud.enemySubtitle}</span>
                {hud.enemyWaveTotal > 1 && (
                  <>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="font-mono-num shrink-0">
                      Wave {hud.enemyWaveIndex}/{hud.enemyWaveTotal}
                    </span>
                  </>
                )}
                {hud.bossPhase > 1 && (
                  <>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="font-bold text-rose-400">Phase {hud.bossPhase}</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tutorial Step Guidance Banner */}
      {hud.mode === 'TUTORIAL' && (
        <div className="mx-auto mt-2 max-w-xl rounded-lg border border-sky-500/40 bg-slate-950/85 px-3.5 py-2 text-center shadow-lg">
          <p className="text-[11px] font-bold tracking-wide text-sky-300">
            Trial {hud.tutorialStep}/10 · {hud.tutorialTitle}
          </p>
          <p className="mt-0.5 text-xs text-slate-200">{hud.tutorialMentorLine}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-amber-300">{hud.tutorialInstruction}</p>
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
