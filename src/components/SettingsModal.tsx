import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Gamepad2,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DEFAULT_CONTROLS_LAYOUT, TOUCH_CONTROL_ORDER } from '../game/controlsLayout';
import { AudioSettings, GameplaySettings, SaveData } from '../game/types';

interface SettingsModalProps {
  save: SaveData;
  returnLabel?: string;
  onClose: () => void;
  onOpenCustomizeControls: () => void;
  onUpdateAudio: (audio: AudioSettings) => void;
  onUpdateGameplay: (gameplay: GameplaySettings) => void;
  onToggleSkipSeenCutscenes: (skip: boolean) => void;
}

interface ToggleRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  activeColor?: 'sky' | 'emerald' | 'rose' | 'amber';
  onLabel?: string;
  offLabel?: string;
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  activeColor = 'sky',
  onLabel = 'ON',
  offLabel = 'OFF',
}: ToggleRowProps) {
  const activeStyle =
    activeColor === 'rose'
      ? 'bg-rose-600 text-white hover:bg-rose-500'
      : activeColor === 'emerald'
        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
        : activeColor === 'amber'
          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
          : 'bg-sky-500 text-slate-950 hover:bg-sky-400';

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 sm:px-4 sm:py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`min-h-[40px] min-w-[68px] shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
          enabled
            ? activeStyle
            : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
        }`}
      >
        {enabled ? onLabel : offLabel}
      </button>
    </div>
  );
}

export function SettingsModal({
  save,
  returnLabel = 'Back',
  onClose,
  onOpenCustomizeControls,
  onUpdateAudio,
  onUpdateGameplay,
  onToggleSkipSeenCutscenes,
}: SettingsModalProps) {
  const { audio, gameplay, controlsLayout } = save;
  const [showBloodWarning, setShowBloodWarning] = useState(false);

  const hasCustomLayout = TOUCH_CONTROL_ORDER.some((id) => {
    const cur = controlsLayout[id];
    const def = DEFAULT_CONTROLS_LAYOUT[id];
    return (
      Math.abs(cur.xPct - def.xPct) > 0.2 ||
      Math.abs(cur.yPct - def.yPct) > 0.2 ||
      Math.abs(cur.scale - def.scale) > 0.02
    );
  });

  const setVolume = (field: 'masterVolume' | 'musicVolume' | 'sfxVolume', value: number) => {
    onUpdateAudio({
      ...audio,
      [field]: Math.max(0, Math.min(1, value)),
    });
  };

  const handleToggleBlood = () => {
    if (gameplay.bloodEffectsEnabled) {
      onUpdateGameplay({ ...gameplay, bloodEffectsEnabled: false });
    } else {
      setShowBloodWarning(true);
    }
  };

  const confirmEnableBlood = () => {
    onUpdateGameplay({ ...gameplay, bloodEffectsEnabled: true });
    setShowBloodWarning(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 p-2.5 sm:p-5">
      <div className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-700/90 bg-slate-900 shadow-2xl">
        {/* Sticky Header with Visible Top-Left Back Button */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 px-3.5 py-2.5 sm:px-5 sm:py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-100 transition-colors hover:border-sky-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 text-sky-300" />
              <span>{returnLabel}</span>
            </button>
            <div>
              <h2 className="font-display text-base font-bold text-white sm:text-lg">
                Settings & Controls
              </h2>
              <p className="text-[11px] text-slate-400">
                Touch layout, combat visuals, performance & audio
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hidden min-h-[44px] rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 sm:inline-flex sm:items-center"
          >
            Done
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3.5 sm:p-5">
          {/* Controls Section */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-sky-300 uppercase">
              <Gamepad2 className="h-4 w-4" />
              <span>Touch Controls</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-500/35 bg-slate-950/80 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Customize Touch Controls</p>
                <p className="text-xs text-slate-400">
                  Drag, resize & preview all 12 battle buttons (
                  {hasCustomLayout ? 'Custom layout saved' : 'Default layout active'})
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCustomizeControls}
                className="flex min-h-[44px] items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-sky-400"
              >
                <Sliders className="h-4 w-4" />
                <span>Customize Controls</span>
              </button>
            </div>
          </section>

          {/* Visuals, Violence Filter & Performance */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-300 uppercase">
              <Sparkles className="h-4 w-4" />
              <span>Gameplay, Visual FX & Performance</span>
            </div>

            <div className="space-y-2">
              <ToggleRow
                label="Blood Effects"
                description="Stylized crimson impact particles during sword clashes (OFF by default; requires confirmation)"
                enabled={gameplay.bloodEffectsEnabled}
                activeColor="rose"
                onToggle={handleToggleBlood}
              />

              <ToggleRow
                label="Combat Visual Effects"
                description="Breathing slash arcs, sparks, dust waves & hit flashes"
                enabled={gameplay.combatVisualEffects}
                onToggle={() =>
                  onUpdateGameplay({
                    ...gameplay,
                    combatVisualEffects: !gameplay.combatVisualEffects,
                  })
                }
              />

              <ToggleRow
                label="Cinematic Effects"
                description="Impact hit-stop slow frames, cutscene letterbox framing & dramatic lighting"
                enabled={gameplay.cinematicEffects}
                onToggle={() =>
                  onUpdateGameplay({
                    ...gameplay,
                    cinematicEffects: !gameplay.cinematicEffects,
                  })
                }
              />

              <ToggleRow
                label="Dialogue"
                description="Show character dialogue bubbles during story & boss cutscenes"
                enabled={gameplay.dialogueEnabled}
                onToggle={() =>
                  onUpdateGameplay({
                    ...gameplay,
                    dialogueEnabled: !gameplay.dialogueEnabled,
                  })
                }
              />

              <ToggleRow
                label="Camera Effects"
                description="Dynamic combat zoom pulses & screen shake on heavy finishers"
                enabled={gameplay.cameraEffects}
                onToggle={() =>
                  onUpdateGameplay({
                    ...gameplay,
                    cameraEffects: !gameplay.cameraEffects,
                  })
                }
              />

              <ToggleRow
                label="Performance Mode"
                description="Caps resolution scale & halves particle load for higher FPS on mid-range Android phones"
                enabled={gameplay.performanceMode}
                activeColor="amber"
                onToggle={() =>
                  onUpdateGameplay({
                    ...gameplay,
                    performanceMode: !gameplay.performanceMode,
                  })
                }
              />
            </div>
          </section>

          {/* Audio Section */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-sky-300 uppercase">
              {audio.muted ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <span>Audio Settings</span>
            </div>

            <div className="space-y-2">
              <ToggleRow
                label="Music"
                description="Orchestral Main Menu & combat soundtrack"
                enabled={audio.musicEnabled}
                activeColor="sky"
                onLabel="ON"
                offLabel="OFF"
                onToggle={() => onUpdateAudio({ ...audio, musicEnabled: !audio.musicEnabled })}
              />

              <ToggleRow
                label="Sound Effects"
                description="Katana slashes, Breathing Arts & demon growls/laughter"
                enabled={audio.sfxEnabled}
                activeColor="emerald"
                onLabel="ON"
                offLabel="OFF"
                onToggle={() => onUpdateAudio({ ...audio, sfxEnabled: !audio.sfxEnabled })}
              />

              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-white">Master Mute</p>
                  <p className="text-xs text-slate-400">
                    Silence all game audio immediately
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateAudio({ ...audio, muted: !audio.muted })}
                  className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    audio.muted
                      ? 'border border-rose-500/60 bg-rose-950/50 text-rose-200'
                      : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                  }`}
                >
                  {audio.muted ? 'Muted' : 'Active'}
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
              {(
                [
                  { key: 'masterVolume', label: 'Master Volume' },
                  { key: 'musicVolume', label: 'Background Music Volume' },
                  { key: 'sfxVolume', label: 'Sound Effects Volume' },
                ] as const
              ).map((item) => {
                const pct = Math.round(audio[item.key] * 100);
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.label}</span>
                      <span className="font-mono-num font-bold text-sky-300">{pct}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={pct}
                      onChange={(e) => setVolume(item.key, Number(e.target.value) / 100)}
                      className="h-2.5 w-full cursor-pointer accent-sky-400"
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Story & Cutscene Preferences */}
          <section className="space-y-2.5">
            <ToggleRow
              label="Skip Already-Seen Cutscenes"
              description="Automatically bypass story dialogue you have already watched"
              enabled={save.skipSeenCutscenes}
              activeColor="emerald"
              onLabel="Enabled"
              offLabel="Disabled"
              onToggle={() => onToggleSkipSeenCutscenes(!save.skipSeenCutscenes)}
            />

            <ToggleRow
              label="Subtitles During Cutscenes"
              description="Show extra bottom captions beneath animated character speech bubbles"
              enabled={audio.subtitlesEnabled}
              onLabel="Enabled"
              offLabel="Disabled"
              onToggle={() =>
                onUpdateAudio({ ...audio, subtitlesEnabled: !audio.subtitlesEnabled })
              }
            />
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-sky-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Warning Modal before enabling Blood Effects */}
      {showBloodWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 p-4">
          <div className="w-full max-w-md rounded-xl border border-rose-500/50 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Content Warning: Blood Effects
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Enabling Blood Effects adds stylized crimson splash particles when katana
                  strikes and Blood Demon Arts land in combat. You can switch this off again
                  at any time in Settings.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBloodWarning(false)}
                className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Keep OFF
              </button>
              <button
                type="button"
                onClick={confirmEnableBlood}
                className="min-h-[44px] rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
              >
                Enable Blood Effects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
