import { useState } from 'react';
import { ArrowUpCircle, Check, Coins, Lock, Palette, ShieldCheck, X } from 'lucide-react';
import { BREATHING_STYLES } from '../game/breathing';
import { getCharacterById, getCharacterSkins, SLAYER_CHARACTERS } from '../game/characters';
import { getCharacterProfile, getUpgradeCost } from '../game/save';
import { BreathingStyleId, CharacterUpgrades, SaveData, SlayerCharacterDef } from '../game/types';

interface RosterShopModalProps {
  save: SaveData;
  onClose: () => void;
  onSelectCharacter: (charId: string, breathing?: BreathingStyleId) => void;
  onBuyCharacter: (charId: string) => { ok: boolean; message: string };
  onUpgradeStat: (charId: string, stat: keyof CharacterUpgrades) => { ok: boolean; message: string };
  onSelectSkin: (charId: string, skinId: string) => void;
}

export function RosterShopModal({
  save,
  onClose,
  onSelectCharacter,
  onBuyCharacter,
  onUpgradeStat,
  onSelectSkin,
}: RosterShopModalProps) {
  const [inspectId, setInspectId] = useState<string>(save.selectedCharacterId);
  const [confirmBuyId, setConfirmBuyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const inspected: SlayerCharacterDef = getCharacterById(inspectId);
  const isUnlocked = save.unlockedCharacters.includes(inspected.id);
  const isSelected = save.selectedCharacterId === inspected.id;
  const canAfford = save.coins >= inspected.price;
  const inspectedProfile = getCharacterProfile(save, inspected.id);
  const skins = getCharacterSkins(inspected.id);

  const handleConfirmPurchase = () => {
    const res = onBuyCharacter(inspected.id);
    setFeedback(res.message);
    setConfirmBuyId(null);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6">
      <div className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700/90 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-6">
          <div>
            <h2 className="font-display text-lg font-bold text-white sm:text-xl">
              Slayer Roster & Shop
            </h2>
            <p className="text-xs text-slate-400">
              Unlock series-inspired Demon Slayers and Hashira with earned Slayer Coins.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm font-bold text-amber-300">
              <Coins className="h-4 w-4" />
              <span className="font-mono-num">{save.coins} Coins</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-5">
          {/* Character List */}
          <div className="grid grid-cols-2 gap-2 border-b border-slate-800 p-4 sm:grid-cols-3 md:col-span-3 md:border-r md:border-b-0">
            {SLAYER_CHARACTERS.map((c) => {
              const unlocked = save.unlockedCharacters.includes(c.id);
              const selected = save.selectedCharacterId === c.id;
              const active = inspectId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setInspectId(c.id);
                    setConfirmBuyId(null);
                    setFeedback(null);
                  }}
                  className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-colors ${
                    active
                      ? 'border-sky-400 bg-slate-800'
                      : unlocked
                        ? 'border-slate-700/80 bg-slate-950/60 hover:border-slate-500'
                        : 'border-slate-800 bg-slate-950/40 opacity-80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-1">
                    <span
                      className="h-3 w-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: c.haoriAccent }}
                    />
                    {selected ? (
                      <span className="text-[10px] font-bold text-sky-300">Equipped</span>
                    ) : unlocked ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <span className="font-mono-num flex items-center gap-0.5 text-[11px] font-bold text-amber-300">
                        <Lock className="h-3 w-3" />
                        {c.price}
                      </span>
                    )}
                  </div>
                  <span className="mt-1.5 line-clamp-1 text-xs font-bold text-slate-100">
                    {c.name}
                  </span>
                  <span className="line-clamp-1 text-[10px] text-slate-400">
                    {c.isHashira ? 'Hashira' : 'Slayer'} · {BREATHING_STYLES[c.defaultBreathing].name.replace(' Breathing', '')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Character Details & Purchase / Breathing Selection */}
          <div className="flex flex-col justify-between p-4 sm:p-5 md:col-span-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-sky-300">
                  {inspected.isHashira ? 'Hashira Rank' : 'Demon Slayer Corps'}
                </span>
                {isUnlocked && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Unlocked
                  </span>
                )}
              </div>

              <h3 className="font-display mt-1 text-2xl font-bold text-white">
                {inspected.name}
              </h3>
              <p className="text-xs font-medium text-slate-400">
                {inspected.title} · Difficulty: {inspected.difficulty}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-amber-300">
                {inspected.specialAbility}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {inspected.description}
              </p>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-2 border-y border-slate-800 py-3 text-xs">
                <div>
                  <span className="text-slate-400">Max HP </span>
                  <span className="font-mono-num font-bold text-slate-100">{inspected.maxHp}</span>
                </div>
                <div>
                  <span className="text-slate-400">Attack </span>
                  <span className="font-mono-num font-bold text-rose-300">
                    {(inspected.damageMult * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Speed / Swing </span>
                  <span className="font-mono-num font-bold text-sky-300">
                    {(inspected.speedMult * 100).toFixed(0)}% / {(inspected.attackSpeedMult * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Energy Regen </span>
                  <span className="font-mono-num font-bold text-emerald-300">
                    {inspected.energyRegen}/s
                  </span>
                </div>
              </div>

              {/* Breathing Style Options */}
              <div className="mt-4">
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Breathing Techniques
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {inspected.allowedBreathings.map((bId) => {
                    const st = BREATHING_STYLES[bId];
                    const activeStyle =
                      isSelected && save.selectedBreathing === bId;
                    return (
                      <button
                        key={bId}
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => onSelectCharacter(inspected.id, bId)}
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          activeStyle
                            ? 'border-sky-400 bg-sky-500/20 text-white'
                            : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500 disabled:opacity-50'
                        }`}
                      >
                        {st.name}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 space-y-1 text-[11px] text-slate-400">
                  {BREATHING_STYLES[
                    isSelected ? save.selectedBreathing : inspected.defaultBreathing
                  ].forms.map((f) => (
                    <div key={f.index} className="flex justify-between gap-2">
                      <span className="truncate">{f.name}</span>
                      <span className="font-mono-num shrink-0 text-sky-300">
                        {f.energyCost}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrades & Costume Skins (Per-Character Progression) */}
              {isUnlocked && (
                <div className="mt-4 space-y-3 border-t border-slate-800 pt-3">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Slayer Training Upgrades (Coins: {inspectedProfile.coins})
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { key: 'vitality', label: 'Vitality +22HP' },
                          { key: 'blade', label: 'Blade +9% ATK' },
                          { key: 'breathing', label: 'Breath +5% SPD' },
                        ] as const
                      ).map((u) => {
                        const lv = inspectedProfile.upgrades[u.key];
                        const cost = getUpgradeCost(lv);
                        const maxed = lv >= 5;
                        const canPay = !maxed && inspectedProfile.coins >= cost;
                        return (
                          <button
                            key={u.key}
                            type="button"
                            disabled={maxed || !canPay}
                            onClick={() => {
                              const res = onUpgradeStat(inspected.id, u.key);
                              setFeedback(res.message);
                            }}
                            className={`flex flex-col items-start rounded-md border p-2 text-left text-[11px] transition-colors ${
                              maxed
                                ? 'border-emerald-500/40 bg-emerald-950/25 text-emerald-300'
                                : canPay
                                  ? 'border-sky-500/40 bg-slate-950/75 text-slate-100 hover:border-sky-400'
                                  : 'border-slate-800 bg-slate-950/40 text-slate-500'
                            }`}
                          >
                            <span className="flex w-full items-center justify-between font-bold">
                              <span>{u.label.split(' ')[0]}</span>
                              <ArrowUpCircle className="h-3 w-3 text-sky-300" />
                            </span>
                            <span className="text-[10px] opacity-80">{u.label.split(' ').slice(1).join(' ')}</span>
                            <span className="font-mono-num mt-1 text-[10px] font-bold text-amber-300">
                              Lv.{lv}/5 · {maxed ? 'MAX' : `${cost}c`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                      <Palette className="h-3.5 w-3.5 text-sky-300" />
                      <span>Haori & Nichirin Style</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {skins.map((sk) => {
                        const activeSkin = inspectedProfile.selectedSkinId === sk.id;
                        return (
                          <button
                            key={sk.id}
                            type="button"
                            onClick={() => {
                              onSelectSkin(inspected.id, sk.id);
                              setFeedback(`Equipped ${sk.name}`);
                            }}
                            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                              activeSkin
                                ? 'border-sky-400 bg-sky-500/20 text-white'
                                : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-sm border border-white/20"
                              style={{ backgroundColor: sk.haoriPrimary }}
                            />
                            <span>{sk.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {feedback && (
                <p className="mt-3 text-xs font-semibold text-amber-300">{feedback}</p>
              )}
            </div>

            {/* Action Footer */}
            <div className="mt-5">
              {isUnlocked ? (
                <button
                  type="button"
                  onClick={() => onSelectCharacter(inspected.id)}
                  disabled={isSelected}
                  className={`w-full rounded-lg px-4 py-3 text-sm font-bold transition-colors ${
                    isSelected
                      ? 'border border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                      : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                  }`}
                >
                  {isSelected ? 'Currently Selected' : `Select ${inspected.name}`}
                </button>
              ) : confirmBuyId === inspected.id ? (
                <div className="flex flex-col gap-2 rounded-lg border border-amber-500/50 bg-amber-950/30 p-3">
                  <p className="text-center text-xs font-semibold text-amber-200">
                    Spend {inspected.price} Slayer Coins to unlock {inspected.name}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmPurchase}
                      className="flex-1 rounded-md bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
                    >
                      Confirm Purchase
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmBuyId(null)}
                      className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => setConfirmBuyId(inspected.id)}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition-colors ${
                    canAfford
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                      : 'cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  <Coins className="h-4 w-4" />
                  <span>
                    {canAfford
                      ? `Unlock for ${inspected.price} Coins`
                      : `Need ${inspected.price} Coins (${inspected.price - save.coins} short)`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
