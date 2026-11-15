import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lock,
  Shield,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { BREATHING_STYLES, ULTIMATE_SPECS } from '../game/breathing';
import { getFormEnergyCost } from '../game/constants';
import { getControlPixelRect } from '../game/controlsLayout';
import { GameEngine } from '../game/engine';
import { HudSnapshot, TouchControlsLayout } from '../game/types';

interface MobileControlsProps {
  engine: GameEngine | null;
  hud: HudSnapshot;
  controlsLayout: TouchControlsLayout;
}

interface TouchButtonProps {
  label: string;
  onPressStart: () => void;
  onPressEnd?: () => void;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}

function TouchButton({
  label,
  onPressStart,
  onPressEnd,
  style,
  className = '',
  children,
}: TouchButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unavailable
    }
    setPressed(true);
    onPressStart();
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (pressed) {
      setPressed(false);
      onPressEnd?.();
    }
  };

  return (
    <button
      type="button"
      aria-label={label}
      style={style}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onLostPointerCapture={handlePointerUpOrCancel}
      className={`pointer-events-auto absolute touch-none select-none transition-transform duration-75 ${
        pressed ? 'scale-92 brightness-125' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function MobileControls({ engine, hud, controlsLayout }: MobileControlsProps) {
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 800,
    h: typeof window !== 'undefined' ? window.innerHeight : 360,
  }));
  const [formPage, setFormPage] = useState(0);

  useEffect(() => {
    setFormPage(0);
  }, [hud.breathingStyle]);

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

  const styleDef = BREATHING_STYLES[hud.breathingStyle];
  const totalPages = Math.max(1, Math.ceil(styleDef.forms.length / 4));
  const safePage = Math.min(formPage, totalPages - 1);
  const pageForms = styleDef.forms.slice(safePage * 4, safePage * 4 + 4);

  const heavyCooling = hud.heavyCooldown > 0.05;
  const heavyReadyPct =
    hud.maxHeavyCooldown > 0
      ? Math.max(0, Math.min(100, (1 - hud.heavyCooldown / hud.maxHeavyCooldown) * 100))
      : 100;

  const boxStyle = (id: keyof TouchControlsLayout): React.CSSProperties => {
    const rect = getControlPixelRect(id, controlsLayout[id], viewport.w, viewport.h);
    return {
      left: `${rect.cx - rect.half}px`,
      top: `${rect.cy - rect.half}px`,
      width: `${rect.size}px`,
      height: `${rect.size}px`,
    };
  };

  // Anchor compact Page Switcher directly above breathing1..4 cluster
  const b1Rect = getControlPixelRect('breathing1', controlsLayout.breathing1, viewport.w, viewport.h);
  const b4Rect = getControlPixelRect('breathing4', controlsLayout.breathing4, viewport.w, viewport.h);
  const pagerLeft = Math.min(b1Rect.cx - b1Rect.half, b4Rect.cx - b4Rect.half);
  const pagerRight = Math.max(b1Rect.cx + b1Rect.half, b4Rect.cx + b4Rect.half);
  const pagerTop = Math.max(54, Math.min(b1Rect.cy - b1Rect.half, b4Rect.cy - b4Rect.half) - 28);

  const awkReady = !hud.awakeningActive && hud.awakeningMeter >= 100 && hud.awakeningCooldown <= 0.1;
  const ultSpec = ULTIMATE_SPECS[hud.equippedUltimate];
  const ultReady = hud.ultimateCooldown <= 0.05 && hud.playerEnergy >= ultSpec.energyCost;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {/* Move Left */}
      <TouchButton
        label="Move Left"
        style={boxStyle('moveLeft')}
        onPressStart={() => engine?.setHeldInput('left', true)}
        onPressEnd={() => engine?.setHeldInput('left', false)}
        className="flex items-center justify-center rounded-xl border border-slate-600/80 bg-slate-950/75 text-slate-100 shadow-lg"
      >
        <ArrowLeft className="h-[46%] w-[46%]" />
      </TouchButton>

      {/* Move Right */}
      <TouchButton
        label="Move Right"
        style={boxStyle('moveRight')}
        onPressStart={() => engine?.setHeldInput('right', true)}
        onPressEnd={() => engine?.setHeldInput('right', false)}
        className="flex items-center justify-center rounded-xl border border-slate-600/80 bg-slate-950/75 text-slate-100 shadow-lg"
      >
        <ArrowRight className="h-[46%] w-[46%]" />
      </TouchButton>

      {/* Breathing Form Page Switcher anchored directly above slots */}
      {totalPages > 1 && (
        <div
          style={{
            left: `${pagerLeft}px`,
            top: `${pagerTop}px`,
            width: `${Math.max(120, pagerRight - pagerLeft)}px`,
          }}
          className="pointer-events-auto absolute flex h-6 items-center justify-between rounded-md border border-slate-700/85 bg-slate-950/85 px-1 text-[10px] font-bold text-slate-200 shadow-md"
        >
          <button
            type="button"
            aria-label="Previous breathing forms page"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFormPage((p) => (p - 1 + totalPages) % totalPages);
            }}
            className="flex h-5 w-7 items-center justify-center rounded text-sky-300 active:bg-slate-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono-num tracking-tight text-slate-300">
            Forms {safePage + 1}/{totalPages}
          </span>
          <button
            type="button"
            aria-label="Next breathing forms page"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFormPage((p) => (p + 1) % totalPages);
            }}
            className="flex h-5 w-7 items-center justify-center rounded text-sky-300 active:bg-slate-800"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 4 Paginated Breathing Form Slots */}
      {[0, 1, 2, 3].map((slotIdx) => {
        const controlId = `breathing${slotIdx + 1}` as keyof TouchControlsLayout;
        const form = pageForms[slotIdx];
        if (!form) return null;

        const cost = getFormEnergyCost(form.index, styleDef.forms.length);
        const cd = hud.formCooldowns[form.index - 1] ?? 0;
        const ready = !form.isUnknown && hud.playerEnergy >= cost && cd <= 0.05;

        return (
          <TouchButton
            key={`${safePage}_${form.index}`}
            label={form.name}
            style={boxStyle(controlId)}
            onPressStart={() => engine?.triggerBreathingForm(form.index)}
            className={`flex flex-col items-center justify-center overflow-hidden rounded-lg border shadow-md ${
              form.isUnknown
                ? 'border-slate-800/80 bg-slate-950/60 text-slate-600'
                : ready
                  ? 'border-sky-400/90 bg-slate-950/85 text-white'
                  : 'border-slate-700/70 bg-slate-950/75 text-slate-500'
            }`}
          >
            <span
              className="text-[11px] font-extrabold leading-none"
              style={{ color: form.isUnknown ? undefined : ready ? styleDef.primaryColor : undefined }}
            >
              {form.index}
            </span>
            {form.isUnknown ? (
              <Lock className="mt-0.5 h-3 w-3 text-slate-600" />
            ) : (
              <span className="font-mono-num mt-0.5 text-[9px] font-semibold leading-none">
                {cd > 0.05 ? `${cd.toFixed(0)}s` : `${cost}%`}
              </span>
            )}
          </TouchButton>
        );
      })}

      {/* Awakening Button */}
      <TouchButton
        label="Activate Awakening"
        style={boxStyle('awakening')}
        onPressStart={() => engine?.triggerAwakening()}
        className={`flex flex-col items-center justify-center overflow-hidden rounded-xl border shadow-md ${
          hud.awakeningActive
            ? 'border-amber-300 bg-amber-950/90 text-amber-200 animate-pulse'
            : awkReady
              ? 'border-amber-400 bg-amber-900/85 text-white'
              : 'border-slate-700/80 bg-slate-950/80 text-slate-400'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-amber-500/25 transition-[height] duration-100"
          style={{ height: `${Math.min(100, Math.round(hud.awakeningMeter))}%` }}
        />
        <Sparkles className={`relative h-[36%] w-[36%] ${awkReady || hud.awakeningActive ? 'text-amber-300' : 'text-slate-500'}`} />
        <span className="font-mono-num relative mt-0.5 text-[8px] font-bold leading-none">
          {hud.awakeningActive
            ? `${hud.awakeningTimer.toFixed(0)}s`
            : `${Math.floor(hud.awakeningMeter)}%`}
        </span>
      </TouchButton>

      {/* Ultimate Attack Button */}
      <TouchButton
        label={ultSpec.name}
        style={boxStyle('ultimate')}
        onPressStart={() => engine?.triggerUltimate()}
        className={`flex flex-col items-center justify-center overflow-hidden rounded-xl border shadow-md ${
          ultReady
            ? 'border-fuchsia-400 bg-fuchsia-950/90 text-fuchsia-100'
            : 'border-slate-700/80 bg-slate-950/80 text-slate-500'
        }`}
      >
        <Flame className={`h-[36%] w-[36%] ${ultReady ? 'text-fuchsia-300' : 'text-slate-500'}`} />
        <span className="font-mono-num mt-0.5 text-[8px] font-bold leading-none">
          {hud.ultimateCooldown > 0.05 ? `${hud.ultimateCooldown.toFixed(0)}s` : `${ultSpec.energyCost}%`}
        </span>
      </TouchButton>

      {/* Dodge */}
      <TouchButton
        label="Dodge"
        style={boxStyle('dodge')}
        onPressStart={() => engine?.triggerAction('dodge')}
        className="flex flex-col items-center justify-center rounded-xl border border-slate-600/80 bg-slate-950/75 text-slate-200 shadow-md"
      >
        <Zap className="h-[36%] w-[36%] text-teal-300" />
        <span className="mt-0.5 text-[9px] font-semibold leading-none">Dodge</span>
      </TouchButton>

      {/* Jump */}
      <TouchButton
        label="Jump"
        style={boxStyle('jump')}
        onPressStart={() => engine?.triggerAction('jump')}
        className="flex flex-col items-center justify-center rounded-xl border border-slate-600/80 bg-slate-950/75 text-slate-100 shadow-md"
      >
        <ArrowUp className="h-[38%] w-[38%] text-sky-300" />
        <span className="mt-0.5 text-[9px] font-semibold leading-none">Jump</span>
      </TouchButton>

      {/* Block */}
      <TouchButton
        label="Block"
        style={boxStyle('block')}
        onPressStart={() => engine?.setHeldInput('block', true)}
        onPressEnd={() => engine?.setHeldInput('block', false)}
        className="flex flex-col items-center justify-center rounded-xl border border-slate-600/80 bg-slate-950/75 text-slate-200 shadow-md"
      >
        <Shield className="h-[38%] w-[38%] text-amber-300" />
        <span className="mt-0.5 text-[9px] font-semibold leading-none">Block</span>
      </TouchButton>

      {/* Heavy Attack */}
      <TouchButton
        label="Heavy Attack"
        style={boxStyle('heavy')}
        onPressStart={() => engine?.triggerAction('heavy')}
        className={`flex flex-col items-center justify-center overflow-hidden rounded-xl border shadow-lg ${
          heavyCooling
            ? 'border-slate-700 bg-slate-950/85 text-slate-400'
            : 'border-rose-500/80 bg-rose-950/80 text-rose-100'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-rose-500/25 transition-[height] duration-75"
          style={{ height: `${heavyReadyPct}%` }}
        />
        <Swords
          className={`relative h-[38%] w-[38%] ${heavyCooling ? 'text-slate-500' : 'text-rose-300'}`}
        />
        <span className="font-mono-num relative mt-0.5 text-[9px] font-bold leading-none">
          {heavyCooling ? `${hud.heavyCooldown.toFixed(1)}s` : 'Heavy'}
        </span>
      </TouchButton>

      {/* Sword Slash */}
      <TouchButton
        label="Sword Attack"
        style={boxStyle('light')}
        onPressStart={() => engine?.triggerAction('light')}
        className="flex flex-col items-center justify-center rounded-xl border border-sky-400/90 bg-sky-900/85 text-white shadow-lg"
      >
        <Swords className="h-[40%] w-[40%] text-sky-200" />
        <span className="mt-0.5 text-[10px] font-bold leading-none">Slash</span>
      </TouchButton>
    </div>
  );
}
