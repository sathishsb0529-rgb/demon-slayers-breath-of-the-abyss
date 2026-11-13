import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Shield, Swords, Zap } from 'lucide-react';
import { BREATHING_STYLES } from '../game/breathing';
import { FORM_ENERGY_COSTS } from '../game/constants';
import { GameEngine } from '../game/engine';
import { HudSnapshot } from '../game/types';

interface MobileControlsProps {
  engine: GameEngine | null;
  hud: HudSnapshot;
}

interface TouchButtonProps {
  label: string;
  onPressStart: () => void;
  onPressEnd?: () => void;
  className?: string;
  children: React.ReactNode;
}

function TouchButton({
  label,
  onPressStart,
  onPressEnd,
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
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onLostPointerCapture={handlePointerUpOrCancel}
      className={`touch-none select-none transition-transform duration-75 ${
        pressed ? 'scale-92 brightness-125' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const;

export function MobileControls({ engine, hud }: MobileControlsProps) {
  const styleDef = BREATHING_STYLES[hud.breathingStyle];
  const heavyCooling = hud.heavyCooldown > 0.05;
  const heavyReadyPct =
    hud.maxHeavyCooldown > 0
      ? Math.max(0, Math.min(100, (1 - hud.heavyCooldown / hud.maxHeavyCooldown) * 100))
      : 100;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-3 pb-3 sm:px-5 sm:pb-4">
      {/* LEFT SIDE: Movement Pad */}
      <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3">
        <TouchButton
          label="Move Left"
          onPressStart={() => engine?.setHeldInput('left', true)}
          onPressEnd={() => engine?.setHeldInput('left', false)}
          className="flex h-15 w-15 items-center justify-center rounded-xl border border-slate-600/80 bg-slate-950/75 text-slate-100 shadow-lg sm:h-17 sm:w-17"
        >
          <ArrowLeft className="h-7 w-7" />
        </TouchButton>

        <TouchButton
          label="Move Right"
          onPressStart={() => engine?.setHeldInput('right', true)}
          onPressEnd={() => engine?.setHeldInput('right', false)}
          className="flex h-15 w-15 items-center justify-center rounded-xl border border-slate-600/80 bg-slate-950/75 text-slate-100 shadow-lg sm:h-17 sm:w-17"
        >
          <ArrowRight className="h-7 w-7" />
        </TouchButton>
      </div>

      {/* RIGHT SIDE: 5 Breathing Forms Row + Action Cluster */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {/* 5 Breathing Forms Quick Buttons */}
        <div className="flex items-center gap-1.5">
          {([1, 2, 3, 4, 5] as const).map((idx) => {
            const cost = FORM_ENERGY_COSTS[idx];
            const cd = hud.formCooldowns[idx - 1];
            const ready = hud.playerEnergy >= cost && cd <= 0.05;
            return (
              <TouchButton
                key={idx}
                label={`Breathing Form ${idx}`}
                onPressStart={() => engine?.triggerBreathingForm(idx)}
                className={`relative flex h-11 w-11 flex-col items-center justify-center overflow-hidden rounded-lg border shadow-md ${
                  ready
                    ? 'border-sky-400/90 bg-slate-950/85 text-white'
                    : 'border-slate-700/70 bg-slate-950/75 text-slate-500'
                }`}
              >
                <span
                  className="text-xs font-extrabold"
                  style={{ color: ready ? styleDef.primaryColor : undefined }}
                >
                  {ROMAN[idx - 1]}
                </span>
                <span className="font-mono-num text-[9px] font-semibold">
                  {cd > 0.05 ? `${cd.toFixed(0)}s` : `${cost}%`}
                </span>
              </TouchButton>
            );
          })}
        </div>

        {/* Movement & Combat Actions */}
        <div className="flex items-center gap-2">
          <TouchButton
            label="Dodge"
            onPressStart={() => engine?.triggerAction('dodge')}
            className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-slate-600/80 bg-slate-950/75 text-slate-200 shadow-md"
          >
            <Zap className="h-4 w-4 text-teal-300" />
            <span className="text-[9px] font-semibold">Dodge</span>
          </TouchButton>

          <TouchButton
            label="Jump"
            onPressStart={() => engine?.triggerAction('jump')}
            className="flex h-13 w-13 flex-col items-center justify-center rounded-xl border border-slate-600/80 bg-slate-950/75 text-slate-100 shadow-md"
          >
            <ArrowUp className="h-5 w-5 text-sky-300" />
            <span className="text-[9px] font-semibold">Jump</span>
          </TouchButton>

          <TouchButton
            label="Block"
            onPressStart={() => engine?.setHeldInput('block', true)}
            onPressEnd={() => engine?.setHeldInput('block', false)}
            className="flex h-13 w-13 flex-col items-center justify-center rounded-xl border border-slate-600/80 bg-slate-950/75 text-slate-200 shadow-md"
          >
            <Shield className="h-5 w-5 text-amber-300" />
            <span className="text-[9px] font-semibold">Block</span>
          </TouchButton>

          <TouchButton
            label="Heavy Attack"
            onPressStart={() => engine?.triggerAction('heavy')}
            className={`relative flex h-14 w-14 flex-col items-center justify-center overflow-hidden rounded-xl border shadow-lg ${
              heavyCooling
                ? 'border-slate-700 bg-slate-950/85 text-slate-400'
                : 'border-rose-500/80 bg-rose-950/80 text-rose-100'
            }`}
          >
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-rose-500/25 transition-[height] duration-75"
              style={{ height: `${heavyReadyPct}%` }}
            />
            <Swords className={`relative h-5 w-5 ${heavyCooling ? 'text-slate-500' : 'text-rose-300'}`} />
            <span className="font-mono-num relative text-[9px] font-bold">
              {heavyCooling ? `${hud.heavyCooldown.toFixed(1)}s` : 'Heavy'}
            </span>
          </TouchButton>

          <TouchButton
            label="Sword Attack"
            onPressStart={() => engine?.triggerAction('light')}
            className="flex h-15 w-15 flex-col items-center justify-center rounded-xl border border-sky-400/90 bg-sky-900/85 text-white shadow-lg"
          >
            <Swords className="h-6 w-6 text-sky-200" />
            <span className="text-[10px] font-bold">Slash</span>
          </TouchButton>
        </div>
      </div>
    </div>
  );
}
