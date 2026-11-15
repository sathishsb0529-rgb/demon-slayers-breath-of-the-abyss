import { useState } from 'react';
import { ArrowLeft, Check, Coins, Lock, Palette, Sparkles } from 'lucide-react';
import { DemonSkinPreset, FEATURED_DEMON_SKIN_TARGETS, getDemonSkins } from '../game/characters';
import { DEMON_TEMPLATES } from '../game/demons';
import { DemonArchetype, SaveData } from '../game/types';

interface DemonSkinsModalProps {
  save: SaveData;
  onClose: () => void;
  onBuyDemonSkin: (archetype: DemonArchetype, skinId: string) => { ok: boolean; message: string };
  onSelectDemonSkin: (archetype: DemonArchetype, skinId: string) => void;
}

function DemonPreviewSvg({
  archetype,
  skin,
}: {
  archetype: DemonArchetype;
  skin: DemonSkinPreset;
}) {
  const tpl = DEMON_TEMPLATES[archetype];
  const isStickNodes = skin.renderStyle === 'stick_nodes';
  const skinCol = skin.skinColor ?? (isStickNodes ? '#0f172a' : tpl.visual.skinColor);
  const cloakCol = skin.haoriPrimary ?? tpl.visual.haoriPrimary;
  const accentCol = skin.haoriAccent ?? tpl.visual.haoriAccent;
  const auraCol = skin.markingColor ?? skin.eyeColor ?? tpl.bdaColor;

  return (
    <svg
      viewBox="0 0 140 140"
      className="h-32 w-32 shrink-0 rounded-xl border border-slate-700/80 bg-slate-950 shadow-inner"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`dskin-${archetype}-${skin.id}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={auraCol} stopOpacity="0.32" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="140" height="140" fill={`url(#dskin-${archetype}-${skin.id})`} />
      {/* Cloak / Shoulders */}
      <path
        d="M28 140 C34 104 48 94 70 94 C92 94 106 104 112 140 Z"
        fill={cloakCol}
        stroke={isStickNodes ? accentCol : 'none'}
        strokeWidth={isStickNodes ? 2.5 : 0}
      />
      <path d="M52 95 L70 140 L88 95 Z" fill={accentCol} opacity="0.65" />
      {/* Head */}
      <ellipse
        cx="70"
        cy="60"
        rx="21"
        ry="24"
        fill={skinCol}
        stroke={isStickNodes ? auraCol : 'none'}
        strokeWidth={isStickNodes ? 2.2 : 0}
      />
      {/* Eyes */}
      <ellipse cx="62" cy="62" rx="3.4" ry="3.2" fill={auraCol} />
      <ellipse cx="78" cy="62" rx="3.4" ry="3.2" fill={auraCol} />
      {/* Horns if present */}
      {tpl.visual.hasHorns && (
        <>
          <path d="M55 40 L46 22 L62 35 Z" fill={tpl.visual.hornColor ?? auraCol} />
          <path d="M85 40 L94 22 L78 35 Z" fill={tpl.visual.hornColor ?? auraCol} />
        </>
      )}
    </svg>
  );
}

export function DemonSkinsModal({
  save,
  onClose,
  onBuyDemonSkin,
  onSelectDemonSkin,
}: DemonSkinsModalProps) {
  const [selectedArch, setSelectedArch] = useState<DemonArchetype>(
    FEATURED_DEMON_SKIN_TARGETS[0]
  );
  const [previewSkinId, setPreviewSkinId] = useState<string>('original');
  const [confirmSkin, setConfirmSkin] = useState<DemonSkinPreset | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const skins = getDemonSkins(selectedArch);
  const equippedId = save.equippedDemonSkins[selectedArch] ?? 'original';
  const unlockedList = save.unlockedDemonSkins[selectedArch] ?? ['original'];
  const previewSkin = skins.find((s) => s.id === previewSkinId) ?? skins[0];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 p-3 sm:p-5">
      <div className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700/90 bg-slate-900 shadow-2xl">
        {/* Header with top-left Back button */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3.5 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-100 hover:border-sky-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 text-sky-300" />
              <span>Back</span>
            </button>
            <div>
              <h2 className="font-display text-base font-bold text-white sm:text-xl">
                Demon Skins & Stick Nodes Atelier
              </h2>
              <p className="text-xs text-slate-400">
                Purely cosmetic Upper Moon & Demon King looks · Zero stat boost
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-amber-300">
            <Coins className="h-4 w-4" />
            <span className="font-mono-num">{save.coins} Coins</span>
          </div>
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12">
          {/* Demon Target List */}
          <div className="flex flex-col gap-1.5 border-b border-slate-800 p-4 md:col-span-4 md:border-r md:border-b-0">
            {FEATURED_DEMON_SKIN_TARGETS.map((target) => {
              const tpl = DEMON_TEMPLATES[target];
              const active = selectedArch === target;
              const eq = save.equippedDemonSkins[target] ?? 'original';
              return (
                <button
                  key={target}
                  type="button"
                  onClick={() => {
                    setSelectedArch(target);
                    setPreviewSkinId(save.equippedDemonSkins[target] ?? 'original');
                    setConfirmSkin(null);
                    setFeedback(null);
                  }}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${
                    active
                      ? 'border-rose-400 bg-rose-950/40 text-white'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-display truncate font-bold text-white">{tpl.displayName}</p>
                    <p className="truncate text-[10px] text-slate-400">{tpl.rankLabel}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-rose-300">
                    {eq === 'original' ? 'Classic' : eq.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Preview & Skin Cards */}
          <div className="flex flex-col justify-between p-4 sm:p-5 md:col-span-8">
            <div>
              <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/75 p-4 sm:flex-row sm:items-center">
                <DemonPreviewSvg archetype={selectedArch} skin={previewSkin} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-rose-300 uppercase">
                    <Palette className="h-3.5 w-3.5" />
                    <span>{previewSkin.renderStyle === 'stick_nodes' ? 'Stick Nodes Style' : 'Anime Style'}</span>
                  </div>
                  <h3 className="font-display mt-1 text-xl font-bold text-white">
                    {DEMON_TEMPLATES[selectedArch].displayName} · {previewSkin.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {previewSkin.description}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-emerald-300">
                    Cosmetic only · Preserves 100% original demon HP, speed, and damage.
                  </p>
                </div>
              </div>

              {confirmSkin && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/60 bg-amber-950/35 px-4 py-2.5 text-xs">
                  <span className="text-amber-100">
                    Unlock <strong className="text-white">{confirmSkin.name}</strong> for{' '}
                    <strong className="font-mono-num text-amber-300">{confirmSkin.price} Coins</strong>?
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const res = onBuyDemonSkin(selectedArch, confirmSkin.id);
                        setFeedback(res.message);
                        setConfirmSkin(null);
                      }}
                      className="rounded-md bg-amber-400 px-3 py-1.5 font-bold text-slate-950 hover:bg-amber-300"
                    >
                      Confirm Purchase
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmSkin(null)}
                      className="rounded-md border border-slate-700 px-3 py-1.5 font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {feedback && (
                <p className="mt-2.5 text-xs font-bold text-emerald-300">{feedback}</p>
              )}

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {skins.map((sk) => {
                  const unlocked = sk.price === 0 || unlockedList.includes(sk.id);
                  const equipped = equippedId === sk.id;
                  const canAfford = save.coins >= sk.price;

                  return (
                    <div
                      key={sk.id}
                      onClick={() => setPreviewSkinId(sk.id)}
                      className={`flex cursor-pointer flex-col justify-between rounded-lg border p-3 transition-colors ${
                        equipped
                          ? 'border-rose-400 bg-rose-950/35'
                          : previewSkinId === sk.id
                            ? 'border-sky-400/75 bg-slate-800/80'
                            : 'border-slate-800 bg-slate-950/70 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">{sk.name}</span>
                          {sk.renderStyle === 'stick_nodes' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-sky-300">
                              <Sparkles className="h-3 w-3" />
                              Stick Nodes
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">{sk.description}</p>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
                        <span className="font-mono-num text-[11px] font-bold text-amber-300">
                          {unlocked ? 'Owned' : `${sk.price} Coins`}
                        </span>
                        {unlocked ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDemonSkin(selectedArch, sk.id);
                              setPreviewSkinId(sk.id);
                              setFeedback(`Equipped ${sk.name}`);
                            }}
                            className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold ${
                              equipped
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                            }`}
                          >
                            {equipped && <Check className="h-3 w-3" />}
                            <span>{equipped ? 'Equipped' : 'Equip'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewSkinId(sk.id);
                              setConfirmSkin(sk);
                            }}
                            className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold ${
                              canAfford
                                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                                : 'cursor-not-allowed bg-slate-800 text-slate-500'
                            }`}
                          >
                            <Lock className="h-3 w-3" />
                            <span>{canAfford ? `Buy ${sk.price}c` : `Need ${sk.price - save.coins}c`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
