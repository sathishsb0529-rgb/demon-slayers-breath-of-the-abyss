import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpCircle,
  Check,
  Coins,
  Flame,
  Lock,
  Palette,
  Shield,
  Sparkles,
} from 'lucide-react';
import { AWAKENING_SPECS, ULTIMATE_SPECS } from '../game/breathing';
import {
  CharacterSkinPreset,
  getCharacterById,
  getCharacterSkins,
  SLAYER_CHARACTERS,
} from '../game/characters';
import { getCharacterProfile, getUpgradeCost, UPGRADE_STAT_META } from '../game/save';
import {
  AwakeningTierId,
  CharacterUpgrades,
  SaveData,
  UltimateId,
} from '../game/types';

interface CharacterUpgradeModalProps {
  save: SaveData;
  onClose: () => void;
  onUpgradeStat: (charId: string, stat: keyof CharacterUpgrades) => { ok: boolean; message: string };
  onSelectSkin: (charId: string, skinId: string) => void;
  onBuySkin: (charId: string, skinId: string) => { ok: boolean; message: string };
  onBuyAwakening: (charId: string, tierId: AwakeningTierId) => { ok: boolean; message: string };
  onBuyUltimate: (charId: string, ultId: UltimateId) => { ok: boolean; message: string };
  onEquipUltimate: (charId: string, ultId: UltimateId) => void;
}

type UpgradeTab = 'stats' | 'skins' | 'awakenings';

export function CharacterUpgradeModal({
  save,
  onClose,
  onUpgradeStat,
  onSelectSkin,
  onBuySkin,
  onBuyAwakening,
  onBuyUltimate,
  onEquipUltimate,
}: CharacterUpgradeModalProps) {
  const [charId, setCharId] = useState<string>(save.selectedCharacterId);
  const [tab, setTab] = useState<UpgradeTab>('stats');
  const [confirmStat, setConfirmStat] = useState<keyof CharacterUpgrades | null>(null);
  const [confirmSkin, setConfirmSkin] = useState<CharacterSkinPreset | null>(null);
  const [confirmAwk, setConfirmAwk] = useState<AwakeningTierId | null>(null);
  const [confirmUlt, setConfirmUlt] = useState<UltimateId | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const unlockedList = SLAYER_CHARACTERS.filter((c) => save.unlockedCharacters.includes(c.id));
  const activeChar = getCharacterById(charId);
  const profile = getCharacterProfile(save, activeChar.id);
  const skins = getCharacterSkins(activeChar.id);

  const vitLv = profile.upgrades.vitality ?? 0;
  const bladeLv = profile.upgrades.blade ?? 0;
  const defLv = profile.upgrades.defense ?? 0;
  const breathLv = profile.upgrades.breathing ?? 0;

  const computedMaxHp = activeChar.maxHp + vitLv * 22;
  const computedAttackPct = Math.round(activeChar.damageMult * (1 + bladeLv * 0.09) * 100);
  const computedDefPct = Math.min(58, (activeChar.id === 'genya' ? 12 : 0) + defLv * 7);
  const computedRegen = (activeChar.energyRegen + breathLv * 1.4).toFixed(1);
  const computedSpeedPct = Math.round(activeChar.speedMult * (1 + breathLv * 0.04) * 100);

  const pendingMeta = confirmStat
    ? UPGRADE_STAT_META.find((m) => m.key === confirmStat) ?? null
    : null;
  const pendingLevel = confirmStat ? (profile.upgrades[confirmStat] ?? 0) : 0;
  const pendingCost = confirmStat ? getUpgradeCost(pendingLevel) : 0;

  const clearConfirms = () => {
    setConfirmStat(null);
    setConfirmSkin(null);
    setConfirmAwk(null);
    setConfirmUlt(null);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/88 p-3 sm:p-5">
      <div className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700/90 bg-slate-900 shadow-2xl">
        {/* Top Header */}
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
                Slayer Training, Skins & Awakenings
              </h2>
              <p className="text-xs text-slate-400">
                Train combat attributes, unlock Slayer Skins, and master Awakenings & Ultimates.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-amber-300">
            <Coins className="h-4 w-4" />
            <span className="font-mono-num tabular-nums">{profile.coins} Coins</span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950/75 px-3.5 py-2 sm:px-6">
          <button
            type="button"
            onClick={() => {
              setTab('stats');
              clearConfirms();
            }}
            className={`min-h-[38px] rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === 'stats' ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            4 Stat Upgrades
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('awakenings');
              clearConfirms();
            }}
            className={`min-h-[38px] rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === 'awakenings'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            5 Awakenings & 7 Ultimates
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('skins');
              clearConfirms();
            }}
            className={`min-h-[38px] rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === 'skins'
                ? 'bg-fuchsia-400 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Slayer & Stick Nodes Skins
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5">
          {/* Unlocked Character Switcher */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-3">
            {unlockedList.map((c) => {
              const active = c.id === activeChar.id;
              const prof = getCharacterProfile(save, c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCharId(c.id);
                    clearConfirms();
                    setFeedback(null);
                  }}
                  className={`flex min-h-[40px] items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                    active
                      ? 'border-sky-400 bg-sky-500/20 text-white'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm border border-white/25"
                    style={{ backgroundColor: c.haoriAccent }}
                  />
                  <span>{c.name.split(' ')[0]}</span>
                  <span className="font-mono-num text-[10px] text-amber-300">
                    {prof.coins}c
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Stat Readout */}
          <div className="mt-3.5 grid grid-cols-2 gap-2.5 rounded-lg border border-slate-800 bg-slate-950/70 p-3 sm:grid-cols-5">
            <div>
              <p className="text-[11px] text-slate-400">Slayer</p>
              <p className="font-display truncate text-sm font-bold text-white">{activeChar.name}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Max Health</p>
              <p className="font-mono-num tabular-nums text-sm font-bold text-emerald-300">
                {computedMaxHp} HP
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Attack Power</p>
              <p className="font-mono-num tabular-nums text-sm font-bold text-rose-300">
                {computedAttackPct}%
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Defense Ward</p>
              <p className="font-mono-num tabular-nums text-sm font-bold text-sky-300">
                {computedDefPct}% DMG Cut
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Breathing / Spd</p>
              <p className="font-mono-num tabular-nums text-sm font-bold text-amber-300">
                {computedRegen}/s · {computedSpeedPct}%
              </p>
            </div>
          </div>

          {/* Confirmation Dialogs */}
          {confirmStat && pendingMeta && (
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/60 bg-amber-950/35 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <Shield className="h-4 w-4 shrink-0 text-amber-300" />
                <span>
                  Spend <strong className="font-mono-num text-amber-300">{pendingCost} Coins</strong> to upgrade{' '}
                  <strong>{pendingMeta.label}</strong> from Lv.{pendingLevel} to Lv.{pendingLevel + 1}?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = onUpgradeStat(activeChar.id, confirmStat);
                    setFeedback(res.message);
                    setConfirmStat(null);
                  }}
                  className="min-h-[40px] rounded-md bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300"
                >
                  Confirm Upgrade
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmStat(null)}
                  className="min-h-[40px] rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {confirmSkin && (
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/60 bg-amber-950/35 px-4 py-3">
              <span className="text-xs text-amber-100">
                Unlock cosmetic skin <strong className="text-white">{confirmSkin.name}</strong> for{' '}
                <strong className="font-mono-num text-amber-300">{confirmSkin.price} Coins</strong>?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = onBuySkin(activeChar.id, confirmSkin.id);
                    setFeedback(res.message);
                    setConfirmSkin(null);
                  }}
                  className="min-h-[40px] rounded-md bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300"
                >
                  Confirm Purchase
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSkin(null)}
                  className="min-h-[40px] rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {confirmAwk && (
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/60 bg-amber-950/35 px-4 py-3">
              <span className="text-xs text-amber-100">
                Unlock Awakening Tier <strong className="text-white">{AWAKENING_SPECS[confirmAwk].name}</strong> for{' '}
                <strong className="font-mono-num text-amber-300">{AWAKENING_SPECS[confirmAwk].price} Coins</strong>?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = onBuyAwakening(activeChar.id, confirmAwk);
                    setFeedback(res.message);
                    setConfirmAwk(null);
                  }}
                  className="min-h-[40px] rounded-md bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300"
                >
                  Confirm Unlock
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAwk(null)}
                  className="min-h-[40px] rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {confirmUlt && (
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-fuchsia-500/60 bg-fuchsia-950/35 px-4 py-3">
              <span className="text-xs text-fuchsia-100">
                Unlock Ultimate <strong className="text-white">{ULTIMATE_SPECS[confirmUlt].name}</strong> for{' '}
                <strong className="font-mono-num text-amber-300">{ULTIMATE_SPECS[confirmUlt].price} Coins</strong>?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = onBuyUltimate(activeChar.id, confirmUlt);
                    setFeedback(res.message);
                    setConfirmUlt(null);
                  }}
                  className="min-h-[40px] rounded-md bg-fuchsia-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-fuchsia-300"
                >
                  Confirm Unlock
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmUlt(null)}
                  className="min-h-[40px] rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {feedback && (
            <p className="mt-3 text-xs font-bold text-emerald-300">{feedback}</p>
          )}

          {/* TAB 1: 4 Stat Upgrade Cards */}
          {tab === 'stats' && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {UPGRADE_STAT_META.map((meta) => {
                const lv = profile.upgrades[meta.key] ?? 0;
                const nextLv = Math.min(5, lv + 1);
                const maxed = lv >= 5;
                const cost = getUpgradeCost(lv);
                const canPay = !maxed && profile.coins >= cost;
                const isStaged = confirmStat === meta.key;

                return (
                  <div
                    key={meta.key}
                    className={`flex flex-col justify-between rounded-lg border p-3.5 ${
                      maxed
                        ? 'border-emerald-500/45 bg-emerald-950/20'
                        : isStaged
                          ? 'border-amber-400 bg-slate-800/80'
                          : 'border-slate-800 bg-slate-950/65'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white">{meta.label}</h3>
                        <span className="font-mono-num tabular-nums text-xs font-bold text-sky-300">
                          {maxed ? 'Lv.5 / MAX' : `Lv.${lv} → Lv.${nextLv}`}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-emerald-300">
                        {meta.bonusPerLevelLabel} per tier
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {meta.description}
                      </p>

                      <div className="mt-2.5 grid grid-cols-5 gap-1">
                        {[1, 2, 3, 4, 5].map((tier) => (
                          <div
                            key={tier}
                            className={`h-1.5 rounded-sm ${
                              tier <= lv ? 'bg-sky-400' : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
                      <span className="font-mono-num tabular-nums text-xs font-bold text-amber-300">
                        {maxed ? 'Mastered' : `Cost: ${cost} Coins`}
                      </span>
                      {maxed ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-300">
                          <Check className="h-3.5 w-3.5" />
                          MAX Tier
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canPay}
                          onClick={() => {
                            clearConfirms();
                            setConfirmStat(meta.key);
                            setFeedback(null);
                          }}
                          className={`flex min-h-[40px] items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors ${
                            canPay
                              ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                              : 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-500'
                          }`}
                        >
                          <ArrowUpCircle className="h-3.5 w-3.5" />
                          <span>{canPay ? 'Upgrade' : `Need ${cost - profile.coins}c`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: 5 Awakenings & 7 Special Ultimates */}
          {tab === 'awakenings' && (
            <div className="mt-4 space-y-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-300 uppercase">
                  <Sparkles className="h-4 w-4" />
                  <span>5 Demon Slayer Awakening Tiers</span>
                </div>
                <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {(Object.values(AWAKENING_SPECS) as Array<(typeof AWAKENING_SPECS)[AwakeningTierId]>).map(
                    (tier) => {
                      const unlocked = profile.unlockedAwakenings.includes(tier.id);
                      const canAfford = profile.coins >= tier.price;
                      return (
                        <div
                          key={tier.id}
                          className={`flex flex-col justify-between rounded-lg border p-3 ${
                            unlocked
                              ? 'border-amber-400/60 bg-amber-950/20'
                              : 'border-slate-800 bg-slate-950/70'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white">{tier.name}</span>
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: tier.badgeColor }}
                              />
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                              {tier.summary}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
                            <span className="font-mono-num text-[11px] font-bold text-amber-300">
                              {unlocked ? 'Mastered' : `${tier.price} Coins`}
                            </span>
                            {unlocked ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                                <Check className="h-3.5 w-3.5" />
                                Active in Combat
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={!canAfford}
                                onClick={() => {
                                  clearConfirms();
                                  setConfirmAwk(tier.id);
                                  setFeedback(null);
                                }}
                                className={`flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-bold ${
                                  canAfford
                                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                                    : 'cursor-not-allowed bg-slate-800 text-slate-500'
                                }`}
                              >
                                <Lock className="h-3 w-3" />
                                <span>{canAfford ? 'Unlock' : `Need ${tier.price - profile.coins}c`}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-fuchsia-300 uppercase">
                  <Flame className="h-4 w-4" />
                  <span>7 Special Ultimate Attacks (Key U / ULT Button)</span>
                </div>
                <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {(Object.values(ULTIMATE_SPECS) as Array<(typeof ULTIMATE_SPECS)[UltimateId]>).map(
                    (ult) => {
                      const unlocked = profile.unlockedUltimates.includes(ult.id);
                      const equipped = profile.equippedUltimate === ult.id;
                      const canAfford = profile.coins >= ult.price;
                      return (
                        <div
                          key={ult.id}
                          className={`flex flex-col justify-between rounded-lg border p-3 ${
                            equipped
                              ? 'border-fuchsia-400 bg-fuchsia-950/30'
                              : unlocked
                                ? 'border-slate-700 bg-slate-950/80'
                                : 'border-slate-800 bg-slate-950/60'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white">{ult.name}</span>
                              <span className="font-mono-num text-[10px] font-bold text-fuchsia-300">
                                {ult.energyCost}% Energy · {ult.cooldown}s CD
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                              {ult.description}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
                            <span className="font-mono-num text-[11px] font-bold text-amber-300">
                              {unlocked ? 'Unlocked' : `${ult.price} Coins`}
                            </span>
                            {unlocked ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onEquipUltimate(activeChar.id, ult.id);
                                  setFeedback(`Equipped Ultimate: ${ult.name}`);
                                }}
                                className={`flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-bold ${
                                  equipped
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-fuchsia-400 text-slate-950 hover:bg-fuchsia-300'
                                }`}
                              >
                                {equipped && <Check className="h-3 w-3" />}
                                <span>{equipped ? 'Equipped' : 'Equip Ultimate'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!canAfford}
                                onClick={() => {
                                  clearConfirms();
                                  setConfirmUlt(ult.id);
                                  setFeedback(null);
                                }}
                                className={`flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-bold ${
                                  canAfford
                                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                                    : 'cursor-not-allowed bg-slate-800 text-slate-500'
                                }`}
                              >
                                <Lock className="h-3 w-3" />
                                <span>{canAfford ? `Buy ${ult.price}c` : `Need ${ult.price - profile.coins}c`}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Slayer & Stick Nodes Cosmetic Skins */}
          {tab === 'skins' && (
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold tracking-wider text-slate-300 uppercase">
                <span className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-sky-300" />
                  <span>Slayer Haori & Stick Nodes Cosmetic Skins</span>
                </span>
                <span className="text-[11px] font-semibold normal-case text-emerald-300">
                  Cosmetic only · Zero gameplay stat boost
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {skins.map((sk) => {
                  const unlocked = sk.price === 0 || profile.unlockedSkins.includes(sk.id);
                  const equipped = profile.selectedSkinId === sk.id;
                  const canAfford = profile.coins >= sk.price;

                  return (
                    <div
                      key={sk.id}
                      className={`flex flex-col justify-between rounded-lg border p-3 text-left text-xs ${
                        equipped
                          ? 'border-sky-400 bg-sky-500/20 text-white'
                          : 'border-slate-800 bg-slate-950/70 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 shrink-0 rounded border border-white/25"
                              style={{ backgroundColor: sk.haoriPrimary }}
                            />
                            <span className="font-bold text-white">{sk.name}</span>
                          </div>
                          {sk.renderStyle === 'stick_nodes' && (
                            <span className="text-[10px] font-bold text-sky-300">Stick Nodes</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-400">{sk.description}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
                        <span className="font-mono-num text-[11px] font-bold text-amber-300">
                          {unlocked ? 'Owned' : `${sk.price} Coins`}
                        </span>
                        {unlocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectSkin(activeChar.id, sk.id);
                              setFeedback(`Equipped ${sk.name} for ${activeChar.name.split(' ')[0]}!`);
                            }}
                            className={`flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-bold ${
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
                            onClick={() => {
                              clearConfirms();
                              setConfirmSkin(sk);
                              setFeedback(null);
                            }}
                            className={`flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-bold ${
                              canAfford
                                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                                : 'cursor-not-allowed bg-slate-800 text-slate-500'
                            }`}
                          >
                            <Lock className="h-3 w-3" />
                            <span>{canAfford ? `Buy ${sk.price}c` : `Need ${sk.price - profile.coins}c`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
