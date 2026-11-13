import { Check, Film, Play, X } from 'lucide-react';
import { CUTSCENES, MAP_DISPLAY_NAMES } from '../game/campaign';
import { SaveData } from '../game/types';

interface StoryGalleryModalProps {
  save: SaveData;
  onClose: () => void;
  onPlayCutscene: (cutsceneId: string) => void;
}

const ORDERED_CUTSCENES = Object.values(CUTSCENES);

export function StoryGalleryModal({
  save,
  onClose,
  onPlayCutscene,
}: StoryGalleryModalProps) {
  const seenSet = new Set(save.seenCutscenes);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 p-3 sm:p-6">
      <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-700/90 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Film className="h-5 w-5 text-sky-400" />
            <div>
              <h2 className="font-display text-lg font-bold text-white sm:text-xl">
                Story Cutscene Gallery ({ORDERED_CUTSCENES.length} Episodes)
              </h2>
              <p className="text-xs text-slate-400">
                Replay any animated battle prologue or boss confrontation with your selected Slayer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Episode Grid */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto p-4 sm:grid-cols-2 sm:p-6">
          {ORDERED_CUTSCENES.map((cs, idx) => {
            const seen = seenSet.has(cs.id);
            const totalDuration = cs.beats.reduce((sum, b) => sum + b.duration, 0);

            return (
              <div
                key={cs.id}
                className="flex flex-col justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/75 p-4 transition-colors hover:border-slate-600"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono-num font-bold text-sky-300">
                      Episode {String(idx + 1).padStart(2, '0')} · {MAP_DISPLAY_NAMES[cs.mapId]}
                    </span>
                    {seen ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        Watched
                      </span>
                    ) : (
                      <span className="text-slate-500">Unwatched</span>
                    )}
                  </div>
                  <h3 className="font-display mt-1.5 text-base font-bold text-white">
                    {cs.title}
                  </h3>
                  <p className="font-mono-num mt-1 text-xs text-slate-400">
                    {cs.beats.length} Animated Beats · {totalDuration.toFixed(1)}s Runtime
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onPlayCutscene(cs.id)}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-sky-500/45 bg-sky-500/15 px-4 py-2 text-xs font-bold text-sky-200 transition-colors hover:bg-sky-500 hover:text-slate-950"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Watch Animated Scene</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
