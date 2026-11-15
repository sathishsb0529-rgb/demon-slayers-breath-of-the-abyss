import { TouchControlId, TouchControlItemConfig, TouchControlsLayout } from './types';

export interface TouchControlMeta {
  id: TouchControlId;
  label: string;
  baseSize: number;
}

export const TOUCH_CONTROL_ORDER: TouchControlId[] = [
  'moveLeft',
  'moveRight',
  'dodge',
  'jump',
  'block',
  'heavy',
  'light',
  'breathing1',
  'breathing2',
  'breathing3',
  'breathing4',
  'awakening',
  'ultimate',
];

export const TOUCH_CONTROL_META: Record<TouchControlId, TouchControlMeta> = {
  moveLeft: { id: 'moveLeft', label: 'Move Left', baseSize: 60 },
  moveRight: { id: 'moveRight', label: 'Move Right', baseSize: 60 },
  dodge: { id: 'dodge', label: 'Dodge', baseSize: 48 },
  jump: { id: 'jump', label: 'Jump', baseSize: 52 },
  block: { id: 'block', label: 'Block', baseSize: 52 },
  heavy: { id: 'heavy', label: 'Heavy Attack', baseSize: 56 },
  light: { id: 'light', label: 'Sword Slash', baseSize: 62 },
  breathing1: { id: 'breathing1', label: 'Form Slot 1', baseSize: 44 },
  breathing2: { id: 'breathing2', label: 'Form Slot 2', baseSize: 44 },
  breathing3: { id: 'breathing3', label: 'Form Slot 3', baseSize: 44 },
  breathing4: { id: 'breathing4', label: 'Form Slot 4', baseSize: 44 },
  awakening: { id: 'awakening', label: 'Awakening', baseSize: 44 },
  ultimate: { id: 'ultimate', label: 'Ultimate', baseSize: 44 },
};

export const DEFAULT_CONTROLS_LAYOUT: TouchControlsLayout = {
  moveLeft: { xPct: 7.5, yPct: 83, scale: 1 },
  moveRight: { xPct: 17.5, yPct: 83, scale: 1 },
  dodge: { xPct: 57, yPct: 84, scale: 1 },
  jump: { xPct: 65, yPct: 84, scale: 1 },
  block: { xPct: 73.5, yPct: 84, scale: 1 },
  heavy: { xPct: 82.5, yPct: 83, scale: 1 },
  light: { xPct: 92, yPct: 82, scale: 1 },
  breathing1: { xPct: 61, yPct: 64, scale: 1 },
  breathing2: { xPct: 68.75, yPct: 64, scale: 1 },
  breathing3: { xPct: 76.5, yPct: 64, scale: 1 },
  breathing4: { xPct: 84.25, yPct: 64, scale: 1 },
  awakening: { xPct: 92, yPct: 64, scale: 1 },
  ultimate: { xPct: 52.5, yPct: 64, scale: 1 },
};

export function cloneDefaultControlsLayout(): TouchControlsLayout {
  const out = {} as TouchControlsLayout;
  for (const id of TOUCH_CONTROL_ORDER) {
    out[id] = { ...DEFAULT_CONTROLS_LAYOUT[id] };
  }
  return out;
}

export function sanitizeControlItem(
  id: TouchControlId,
  raw?: Partial<TouchControlItemConfig>
): TouchControlItemConfig {
  const def = DEFAULT_CONTROLS_LAYOUT[id];
  if (!raw || typeof raw !== 'object') return { ...def };
  const xPct =
    typeof raw.xPct === 'number' && Number.isFinite(raw.xPct)
      ? Math.max(3, Math.min(97, raw.xPct))
      : def.xPct;
  const yPct =
    typeof raw.yPct === 'number' && Number.isFinite(raw.yPct)
      ? Math.max(12, Math.min(94, raw.yPct))
      : def.yPct;
  const scale =
    typeof raw.scale === 'number' && Number.isFinite(raw.scale)
      ? Math.max(0.7, Math.min(1.45, Math.round(raw.scale * 100) / 100))
      : def.scale;
  return { xPct, yPct, scale };
}

export function sanitizeControlsLayout(
  raw?: Partial<Record<TouchControlId | 'breathing5', Partial<TouchControlItemConfig>>>
): TouchControlsLayout {
  const out = {} as TouchControlsLayout;
  for (const id of TOUCH_CONTROL_ORDER) {
    const legacyFallback = id === 'awakening' ? raw?.awakening ?? raw?.breathing5 : raw?.[id];
    out[id] = sanitizeControlItem(id, legacyFallback);
  }
  return out;
}

export function getControlPixelRect(
  id: TouchControlId,
  cfg: TouchControlItemConfig,
  viewW: number,
  viewH: number
): { cx: number; cy: number; size: number; half: number } {
  const w = Math.max(320, viewW);
  const h = Math.max(240, viewH);
  // Subtle responsive size adaptation for very short landscape screens (< 400px tall)
  const responsiveBase = h < 400 ? Math.max(0.86, h / 410) : 1;
  const size = Math.round(TOUCH_CONTROL_META[id].baseSize * responsiveBase * cfg.scale);
  const half = size * 0.5;
  const padX = 6;
  const minY = Math.max(54, half + 6);
  const maxY = Math.max(minY, h - half - 6);
  const cx = Math.max(half + padX, Math.min(w - half - padX, (cfg.xPct / 100) * w));
  const cy = Math.max(minY, Math.min(maxY, (cfg.yPct / 100) * h));
  return { cx, cy, size, half };
}

export function clampControlToViewport(
  id: TouchControlId,
  cx: number,
  cy: number,
  scale: number,
  viewW: number,
  viewH: number
): TouchControlItemConfig {
  const w = Math.max(320, viewW);
  const h = Math.max(240, viewH);
  const clampedScale = Math.max(0.7, Math.min(1.45, Math.round(scale * 100) / 100));
  const responsiveBase = h < 400 ? Math.max(0.86, h / 410) : 1;
  const half = (TOUCH_CONTROL_META[id].baseSize * responsiveBase * clampedScale) * 0.5;
  const minX = half + 6;
  const maxX = Math.max(minX, w - half - 6);
  const minY = Math.max(54, half + 6);
  const maxY = Math.max(minY, h - half - 6);

  const clampedX = Math.max(minX, Math.min(maxX, cx));
  const clampedY = Math.max(minY, Math.min(maxY, cy));

  return {
    xPct: Math.round((clampedX / w) * 1000) / 10,
    yPct: Math.round((clampedY / h) * 1000) / 10,
    scale: clampedScale,
  };
}

/**
 * Gently pushes a dragged/resized button away from neighboring controls so buttons
 * cannot accidentally overlap while staying strictly inside the playable viewport.
 */
export function resolveControlOverlap(
  targetId: TouchControlId,
  layout: TouchControlsLayout,
  viewW: number,
  viewH: number
): TouchControlsLayout {
  const next = { ...layout };
  let cfg = { ...next[targetId] };
  const margin = 6;

  for (let pass = 0; pass < 4; pass++) {
    let rect = getControlPixelRect(targetId, cfg, viewW, viewH);
    let adjusted = false;

    for (const otherId of TOUCH_CONTROL_ORDER) {
      if (otherId === targetId) continue;
      const otherRect = getControlPixelRect(otherId, next[otherId], viewW, viewH);
      const dx = rect.cx - otherRect.cx;
      const dy = rect.cy - otherRect.cy;
      const minSepX = rect.half + otherRect.half + margin;
      const minSepY = rect.half + otherRect.half + margin;

      if (Math.abs(dx) < minSepX && Math.abs(dy) < minSepY) {
        const overlapX = minSepX - Math.abs(dx);
        const overlapY = minSepY - Math.abs(dy);
        let pushX = rect.cx;
        let pushY = rect.cy;
        if (overlapX <= overlapY) {
          pushX += (dx >= 0 ? 1 : -1) * (overlapX + 1);
        } else {
          pushY += (dy >= 0 ? 1 : -1) * (overlapY + 1);
        }
        cfg = clampControlToViewport(targetId, pushX, pushY, cfg.scale, viewW, viewH);
        rect = getControlPixelRect(targetId, cfg, viewW, viewH);
        adjusted = true;
      }
    }

    if (!adjusted) break;
  }

  next[targetId] = cfg;
  return next;
}
