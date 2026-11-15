import { useEffect, useRef, useState } from 'react';
import { FastForward, Pause, Play } from 'lucide-react';
import { SoundEngine } from '../game/audio';
import { MAP_DISPLAY_NAMES } from '../game/campaign';
import { CutsceneEngine } from '../game/cutsceneEngine';
import { CutsceneDef, GameplaySettings } from '../game/types';

interface CutsceneOverlayProps {
  cutscene: CutsceneDef;
  sound: SoundEngine;
  subtitlesEnabled: boolean;
  gameplay: GameplaySettings;
  playerSkinId?: string;
  equippedDemonSkins?: Record<string, string>;
  onComplete: () => void;
  onSkip: () => void;
}

export function CutsceneOverlay({
  cutscene,
  sound,
  subtitlesEnabled,
  gameplay,
  playerSkinId,
  equippedDemonSkins,
  onComplete,
  onSkip,
}: CutsceneOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CutsceneEngine | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new CutsceneEngine(
      canvas,
      cutscene,
      sound,
      subtitlesEnabled,
      () => onCompleteRef.current(),
      {
        dialogueEnabled: gameplay.dialogueEnabled,
        cinematicEffects: gameplay.cinematicEffects,
        cameraEffects: gameplay.cameraEffects,
        bloodEffectsEnabled: gameplay.bloodEffectsEnabled,
        combatVisualEffects: gameplay.combatVisualEffects,
        performanceMode: gameplay.performanceMode,
        playerSkinId,
        equippedDemonSkins,
      }
    );
    engineRef.current = engine;
    setPaused(false);

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, [cutscene, sound, playerSkinId, equippedDemonSkins]);

  useEffect(() => {
    engineRef.current?.setSubtitlesEnabled(subtitlesEnabled);
  }, [subtitlesEnabled]);

  useEffect(() => {
    engineRef.current?.setDialogueEnabled(gameplay.dialogueEnabled);
  }, [gameplay.dialogueEnabled]);

  const handleTogglePause = () => {
    if (!engineRef.current) return;
    const nextPaused = engineRef.current.togglePause();
    setPaused(nextPaused);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'KeyP') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  return (
    <div className="fixed inset-0 z-50 bg-[#03050a] select-none">
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Top Overlay Controls Bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-4 py-2.5 sm:px-8 sm:py-3">
        <div className="pointer-events-auto min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-widest text-slate-400 uppercase sm:text-xs">
            {MAP_DISPLAY_NAMES[cutscene.mapId]} · {cutscene.beats.length} Scenes
          </p>
          <h2 className="font-display truncate text-sm font-bold text-white sm:text-xl">
            {cutscene.title}
          </h2>
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePause}
            aria-label={paused ? 'Resume cutscene' : 'Pause cutscene'}
            className="flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-sky-400 hover:text-white"
          >
            {paused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{paused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-sky-400 hover:text-white"
          >
            <FastForward className="h-3.5 w-3.5" />
            <span>Skip Cutscene</span>
          </button>
        </div>
      </div>

      {paused && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/35">
          <div className="rounded-lg border border-slate-700 bg-slate-950/90 px-6 py-3 text-center shadow-xl">
            <p className="font-display text-lg font-bold tracking-widest text-white uppercase">
              Cutscene Paused
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Press Space / P to resume or Esc to skip
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
