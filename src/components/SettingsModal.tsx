import { Film, Volume2, VolumeX, X } from 'lucide-react';
import { AudioSettings, SaveData } from '../game/types';

interface SettingsModalProps {
  save: SaveData;
  onClose: () => void;
  onUpdateAudio: (audio: AudioSettings) => void;
  onToggleSkipSeenCutscenes: (skip: boolean) => void;
  onReplayPrologue: () => void;
}

export function SettingsModal({
  save,
  onClose,
  onUpdateAudio,
  onToggleSkipSeenCutscenes,
  onReplayPrologue,
}: SettingsModalProps) {
  const { audio } = save;

  const setVolume = (field: 'masterVolume' | 'musicVolume' | 'sfxVolume', value: number) => {
    onUpdateAudio({
      ...audio,
      [field]: Math.max(0, Math.min(1, value)),
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/88 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-700/90 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <h2 className="font-display text-lg font-bold text-white">Game & Audio Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Audio Mute */}
          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
            <div className="flex items-center gap-2.5">
              {audio.muted ? (
                <VolumeX className="h-5 w-5 text-rose-400" />
              ) : (
                <Volume2 className="h-5 w-5 text-sky-400" />
              )}
              <div>
                <p className="text-sm font-semibold text-white">Audio Output</p>
                <p className="text-xs text-slate-400">
                  Procedural Japanese taiko music & sword sound effects
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateAudio({ ...audio, muted: !audio.muted })}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                audio.muted
                  ? 'border border-rose-500/60 bg-rose-950/50 text-rose-200'
                  : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
              }`}
            >
              {audio.muted ? 'Muted' : 'Active'}
            </button>
          </div>

          {/* Volume Sliders */}
          <div className="space-y-3.5">
            {(
              [
                { key: 'masterVolume', label: 'Master Volume' },
                { key: 'musicVolume', label: 'Map Music Volume' },
                { key: 'sfxVolume', label: 'Combat SFX Volume' },
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
                    className="h-2 w-full cursor-pointer accent-sky-400"
                  />
                </div>
              );
            })}
          </div>

          {/* Cutscene Preference */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Skip Already-Seen Cutscenes</p>
                <p className="text-xs text-slate-400">
                  Automatically bypass story dialogue you have already watched
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleSkipSeenCutscenes(!save.skipSeenCutscenes)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  save.skipSeenCutscenes
                    ? 'bg-emerald-500 text-slate-950'
                    : 'border border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                {save.skipSeenCutscenes ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Subtitles During Cutscenes</p>
                <p className="text-xs text-slate-400">
                  Show extra bottom captions beneath animated character speech bubbles
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateAudio({ ...audio, subtitlesEnabled: !audio.subtitlesEnabled })
                }
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  audio.subtitlesEnabled
                    ? 'bg-sky-500 text-slate-950'
                    : 'border border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                {audio.subtitlesEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onReplayPrologue}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-sky-400"
            >
              <Film className="h-4 w-4 text-sky-300" />
              <span>Watch Opening Prologue</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-sky-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
