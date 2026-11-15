import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Eye,
  Minus,
  Move,
  Plus,
  RotateCcw,
  Shield,
  Swords,
  Zap,
} from 'lucide-react';
import {
  clampControlToViewport,
  cloneDefaultControlsLayout,
  getControlPixelRect,
  resolveControlOverlap,
  TOUCH_CONTROL_META,
  TOUCH_CONTROL_ORDER,
} from '../game/controlsLayout';
import { TouchControlId, TouchControlsLayout } from '../game/types';

interface ControlCustomizerModalProps {
  initialLayout: TouchControlsLayout;
  onBack: () => void;
  onSave: (layout: TouchControlsLayout) => void;
}

const ROMAN: Record<TouchControlId, string> = {
  moveLeft: 'Left',
  moveRight: 'Right',
  dodge: 'Dodge',
  jump: 'Jump',
  block: 'Block',
  heavy: 'Heavy',
  light: 'Slash',
  breathing1: 'F1',
  breathing2: 'F2',
  breathing3: 'F3',
  breathing4: 'F4',
  awakening: 'Awkn',
  ultimate: 'Ult',
};

function renderControlGlyph(id: TouchControlId) {
  switch (id) {
    case 'moveLeft':
      return <ArrowLeft className="h-[44%] w-[44%] text-slate-100" />;
    case 'moveRight':
      return <ArrowRight className="h-[44%] w-[44%] text-slate-100" />;
    case 'dodge':
      return (
        <>
          <Zap className="h-[36%] w-[36%] text-teal-300" />
          <span className="mt-0.5 text-[9px] font-semibold leading-none">Dodge</span>
        </>
      );
    case 'jump':
      return (
        <>
          <ArrowUp className="h-[38%] w-[38%] text-sky-300" />
          <span className="mt-0.5 text-[9px] font-semibold leading-none">Jump</span>
        </>
      );
    case 'block':
      return (
        <>
          <Shield className="h-[38%] w-[38%] text-amber-300" />
          <span className="mt-0.5 text-[9px] font-semibold leading-none">Block</span>
        </>
      );
    case 'heavy':
      return (
        <>
          <Swords className="h-[38%] w-[38%] text-rose-300" />
          <span className="mt-0.5 text-[9px] font-bold leading-none">Heavy</span>
        </>
      );
    case 'light':
      return (
        <>
          <Swords className="h-[40%] w-[40%] text-sky-200" />
          <span className="mt-0.5 text-[10px] font-bold leading-none">Slash</span>
        </>
      );
    case 'awakening':
      return (
        <>
          <Zap className="h-[36%] w-[36%] text-amber-300" />
          <span className="mt-0.5 text-[8px] font-bold leading-none text-amber-200">Awaken</span>
        </>
      );
    case 'ultimate':
      return (
        <>
          <Swords className="h-[36%] w-[36%] text-fuchsia-300" />
          <span className="mt-0.5 text-[8px] font-bold leading-none text-fuchsia-200">Ult</span>
        </>
      );
    default:
      return (
        <>
          <span className="text-xs font-extrabold leading-none text-sky-300">{ROMAN[id]}</span>
          <span className="mt-0.5 text-[8px] font-semibold leading-none text-slate-400">Form</span>
        </>
      );
  }
}

export function ControlCustomizerModal({
  initialLayout,
  onBack,
  onSave,
}: ControlCustomizerModalProps) {
  const [draft, setDraft] = useState<TouchControlsLayout>(() => {
    const copy = {} as TouchControlsLayout;
    for (const id of TOUCH_CONTROL_ORDER) {
      copy[id] = { ...initialLayout[id] };
    }
    return copy;
  });
  const [selectedId, setSelectedId] = useState<TouchControlId>('light');
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPressed, setPreviewPressed] = useState<TouchControlId | null>(null);
  const [lastPreviewAction, setLastPreviewAction] = useState<string>('Tap any control to test reach');
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 800,
    h: typeof window !== 'undefined' ? window.innerHeight : 360,
  }));

  const dragRef = useRef<{
    id: TouchControlId;
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  useEffect(() => {
    const syncViewport = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', syncViewport);
    return () => {
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
    };
  }, []);

  const selectedCfg = draft[selectedId];
  const selectedScalePct = Math.round(selectedCfg.scale * 100);

  const updateSelectedScale = (nextScale: number) => {
    const clampedScale = Math.max(0.7, Math.min(1.45, Math.round(nextScale * 100) / 100));
    setDraft((prev) => {
      const curr = prev[selectedId];
      const rect = getControlPixelRect(selectedId, curr, viewport.w, viewport.h);
      const resized = clampControlToViewport(
        selectedId,
        rect.cx,
        rect.cy,
        clampedScale,
        viewport.w,
        viewport.h
      );
      const withResized: TouchControlsLayout = { ...prev, [selectedId]: resized };
      return resolveControlOverlap(selectedId, withResized, viewport.w, viewport.h);
    });
  };

  const handleReset = () => {
    setDraft(cloneDefaultControlsLayout());
    setLastPreviewAction('Restored default Android layout');
  };

  const handleButtonPointerDown = (
    id: TouchControlId,
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);

    if (previewMode) {
      setPreviewPressed(id);
      setLastPreviewAction(`Tested: ${TOUCH_CONTROL_META[id].label}`);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      return;
    }

    const rect = getControlPixelRect(id, draft[id], viewport.w, viewport.h);
    dragRef.current = {
      id,
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.cx,
      offsetY: e.clientY - rect.cy,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleButtonPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const active = dragRef.current;
    if (!active || active.pointerId !== e.pointerId || previewMode) return;
    e.preventDefault();
    const targetCx = e.clientX - active.offsetX;
    const targetCy = e.clientY - active.offsetY;
    setDraft((prev) => {
      const clamped = clampControlToViewport(
        active.id,
        targetCx,
        targetCy,
        prev[active.id].scale,
        viewport.w,
        viewport.h
      );
      return {
        ...prev,
        [active.id]: clamped,
      };
    });
  };

  const handleButtonPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (previewMode) {
      setPreviewPressed(null);
      return;
    }
    const active = dragRef.current;
    if (!active || active.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDraft((prev) => resolveControlOverlap(active.id, prev, viewport.w, viewport.h));
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[#040812]/96 select-none touch-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Subtle landscape horizon guide so player can judge thumb placement over gameplay area */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-dashed border-slate-800/80 bg-gradient-to-b from-transparent to-slate-950/75"
        style={{ height: '48%' }}
      />

      {/* Top Action Bar (fits compactly on 720px+ landscape phones) */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-950/92 px-3 py-2 sm:px-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-sky-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <div className="hidden sm:block">
            <h2 className="font-display text-sm font-bold text-white">Customize Touch Controls</h2>
            <p className="text-[11px] text-slate-400">
              {previewMode
                ? lastPreviewAction
                : 'Drag any button to reposition · Tap to resize individually'}
            </p>
          </div>
        </div>

        {/* Size Control for Selected Button */}
        {!previewMode && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/95 px-2.5 py-1.5">
            <span className="max-w-[92px] truncate text-[11px] font-bold text-sky-300">
              {TOUCH_CONTROL_META[selectedId].label}
            </span>
            <button
              type="button"
              aria-label="Decrease button size"
              onClick={() => updateSelectedScale(selectedCfg.scale - 0.1)}
              className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-950 text-slate-200 hover:border-sky-400"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="range"
              aria-label="Button size"
              min={70}
              max={145}
              step={5}
              value={selectedScalePct}
              onChange={(e) => updateSelectedScale(Number(e.target.value) / 100)}
              className="h-2 w-20 cursor-pointer accent-sky-400 sm:w-28"
            />
            <button
              type="button"
              aria-label="Increase button size"
              onClick={() => updateSelectedScale(selectedCfg.scale + 0.1)}
              className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-950 text-slate-200 hover:border-sky-400"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono-num w-10 text-right text-[11px] font-bold text-slate-200">
              {selectedScalePct}%
            </span>
          </div>
        )}

        {/* Right Controls: Preview, Reset, Save */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setPreviewMode((v) => !v);
              setPreviewPressed(null);
            }}
            className={`flex min-h-[44px] items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors ${
              previewMode
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-400'
            }`}
          >
            {previewMode ? <Move className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{previewMode ? 'Edit' : 'Preview'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:border-amber-400"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-300" />
            <span className="hidden sm:inline">Reset Defaults</span>
            <span className="sm:hidden">Reset</span>
          </button>

          <button
            type="button"
            onClick={() => onSave(draft)}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
          >
            <Check className="h-4 w-4" />
            <span>Save Layout</span>
          </button>
        </div>
      </div>

      {/* Preview status banner on narrow screens */}
      <div className="pointer-events-none relative z-10 px-4 pt-2 text-center sm:hidden">
        <span className="rounded bg-slate-900/90 px-2.5 py-1 text-[11px] font-medium text-slate-300">
          {previewMode ? lastPreviewAction : 'Drag controls anywhere · Release snaps clear'}
        </span>
      </div>

      {/* Interactive Positioned Controls */}
      <div className="pointer-events-none fixed inset-0 z-10">
        {TOUCH_CONTROL_ORDER.map((id) => {
          const rect = getControlPixelRect(id, draft[id], viewport.w, viewport.h);
          const isSelected = !previewMode && selectedId === id;
          const isTesting = previewMode && previewPressed === id;

          return (
            <button
              key={id}
              type="button"
              aria-label={`Customize ${TOUCH_CONTROL_META[id].label}`}
              onPointerDown={(e) => handleButtonPointerDown(id, e)}
              onPointerMove={handleButtonPointerMove}
              onPointerUp={handleButtonPointerUp}
              onPointerCancel={handleButtonPointerUp}
              onLostPointerCapture={handleButtonPointerUp}
              style={{
                left: `${rect.cx - rect.half}px`,
                top: `${rect.cy - rect.half}px`,
                width: `${rect.size}px`,
                height: `${rect.size}px`,
              }}
              className={`pointer-events-auto absolute flex flex-col items-center justify-center rounded-xl border touch-none select-none transition-transform duration-75 ${
                isTesting ? 'scale-92 brightness-125' : ''
              } ${
                isSelected
                  ? 'border-2 border-sky-400 bg-sky-950/80 text-white shadow-[0_0_0_3px_rgba(56,189,248,0.28)]'
                  : id === 'light'
                    ? 'border-sky-400/80 bg-sky-900/80 text-white'
                    : id === 'heavy'
                      ? 'border-rose-500/80 bg-rose-950/80 text-rose-100'
                      : 'border-slate-600/85 bg-slate-950/85 text-slate-100'
              }`}
            >
              {renderControlGlyph(id)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
