import { useState } from 'react';
import { Check, Sparkles, Swords, X } from 'lucide-react';
import { BREATHING_STYLES } from '../game/breathing';
import {
  getCampaignForCharacter,
  getCharacterCampaignInfo,
  getLevelById,
  getRouteLevelBriefing,
} from '../game/campaign';
import { getCharacterById, SLAYER_CHARACTERS, STARTER_CHARACTERS } from '../game/characters';
import { getCharacterProfile } from '../game/save';
import { BreathingStyleId, SaveData, SlayerCharacterDef } from '../game/types';

interface CharacterSelectModalProps {
  save: SaveData;
  subtitle?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirmSelect: (charId: string, breathing: BreathingStyleId) => void;
}

const WEAPON_LABELS: Record<SlayerCharacterDef['weapon'], string> = {
  katana: 'Curved Nichirin Katana',
  dual_serrated: 'Twin Serrated Nichirin Blades',
  dual_cleaver: 'Chained Twin Cleavers',
  whip_katana: 'Flexible Ribbon Whip-Katana',
  stone_flail: 'Spiked Iron Flail & Axe',
  stinger_katana: 'Wisteria Venom Stinger Blade',
  shotgun_katana: 'Nichirin Katana & Double-Barrel Shotgun',
  flesh_katana: 'Flesh Katana',
  blood_sickles: 'Blood Sickles',
  obi_ribbons: 'Obi Ribbons',
  ice_fans: 'War Fans',
  unarmed_claws: 'Claws',
  muzan_tentacles: 'Tentacles',
};

function SlayerPortraitSvg({ slayer }: { slayer: SlayerCharacterDef }) {
  const styleDef = BREATHING_STYLES[slayer.defaultBreathing];
  return (
    <svg
      viewBox="0 0 140 150"
      className="h-36 w-36 shrink-0 rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-inner"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`glow-${slayer.id}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={styleDef.primaryColor} stopOpacity="0.34" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="140" height="150" fill={`url(#glow-${slayer.id})`} />
      {/* Nichirin Katana silhouette behind shoulder */}
      <path
        d="M18 128 L108 26"
        stroke={styleDef.bladeEdgeColor}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M18 128 L108 26"
        stroke={styleDef.bladeBaseColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="112" r="5" fill={styleDef.tsubaColor} />
      {/* Shoulders & Haori */}
      <path
        d="M20 150 C24 114 44 102 70 102 C96 102 116 114 120 150 Z"
        fill={slayer.haoriPrimary}
      />
      <path d="M52 103 L70 150 L88 103 Z" fill={slayer.uniformColor} />
      <path d="M36 108 L48 150 L32 150 Z" fill={slayer.haoriAccent} opacity="0.85" />
      <path d="M104 108 L92 150 L108 150 Z" fill={slayer.haoriAccent} opacity="0.85" />
      {/* Scarf / Collar */}
      <path d="M46 102 Q70 116 94 102 L89 96 Q70 107 51 96 Z" fill={slayer.scarfColor} />
      {/* Neck & Head */}
      <rect x="61" y="84" width="18" height="20" rx="6" fill={slayer.skinColor} />
      <ellipse cx="70" cy="64" rx="23" ry="26" fill={slayer.skinColor} />
      {/* Hair silhouette */}
      <path
        d="M44 64 C42 36 58 24 72 24 C88 24 100 38 96 64 C93 52 86 44 70 43 C54 43 48 52 44 64 Z"
        fill={slayer.hairColor}
      />
      {/* Eyes */}
      <ellipse cx="61" cy="67" rx="3.4" ry="3.8" fill={slayer.eyeColor} />
      <ellipse cx="79" cy="67" rx="3.4" ry="3.8" fill={slayer.eyeColor} />
      <circle cx="62" cy="66" r="1.1" fill="#ffffff" />
      <circle cx="80" cy="66" r="1.1" fill="#ffffff" />
      {/* Tanjiro forehead mark / Genya scar detail */}
      {slayer.id === 'tanjiro' && (
        <path d="M54 47 L60 43 L62 51 Z" fill="#991b1b" />
      )}
      {slayer.id === 'genya' && (
        <path d="M82 58 L89 72" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
      )}
      {slayer.id === 'inosuke' && (
        <path d="M50 38 L44 26 L58 34 M90 38 L96 26 L82 34" stroke="#94a3b8" strokeWidth="2.5" fill="none" />
      )}
    </svg>
  );
}

export function CharacterSelectModal({
  save,
  subtitle = 'Select your Demon Slayer protagonist to begin your story route.',
  confirmLabel,
  onClose,
  onConfirmSelect,
}: CharacterSelectModalProps) {
  const unlockedHashira = SLAYER_CHARACTERS.filter(
    (c) => !c.isStarterChoice && save.unlockedCharacters.includes(c.id)
  );
  const [groupTab, setGroupTab] = useState<'starters' | 'hashira'>(() =>
    STARTER_CHARACTERS.some((c) => c.id === save.selectedCharacterId) ? 'starters' : 'hashira'
  );
  const [selectedId, setSelectedId] = useState<string>(save.selectedCharacterId);
  const activeDef: SlayerCharacterDef = getCharacterById(selectedId);
  const [selectedBreathing, setSelectedBreathing] = useState<BreathingStyleId>(() =>
    activeDef.allowedBreathings.includes(save.selectedBreathing)
      ? save.selectedBreathing
      : activeDef.defaultBreathing
  );

  const listToDisplay =
    groupTab === 'hashira' && unlockedHashira.length > 0 ? unlockedHashira : STARTER_CHARACTERS;

  const handlePickCharacter = (char: SlayerCharacterDef) => {
    setSelectedId(char.id);
    setSelectedBreathing(char.defaultBreathing);
  };

  const styleDef = BREATHING_STYLES[selectedBreathing];
  const activeProfile = getCharacterProfile(save, activeDef.id);
  const campaignInfo = getCharacterCampaignInfo(activeDef.id);
  const routePreview = getRouteLevelBriefing(getLevelById(activeProfile.highestUnlockedLevel), activeDef.routeId);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 p-3 sm:p-6">
      <div className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700/90 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-6">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-widest text-white sm:text-xl">
              CHOOSE YOUR SLAYER
            </h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {unlockedHashira.length > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setGroupTab('starters');
                    handlePickCharacter(STARTER_CHARACTERS[0]);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    groupTab === 'starters' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  5 Starters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupTab('hashira');
                    handlePickCharacter(unlockedHashira[0]);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    groupTab === 'hashira' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Unlocked ({unlockedHashira.length})
                </button>
              </div>
            )}
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
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12">
          {/* Roster Cards */}
          <div className="flex flex-col gap-2 border-b border-slate-800 p-4 md:col-span-5 md:border-r md:border-b-0">
            {listToDisplay.map((char) => {
              const chosen = char.id === activeDef.id;
              const equipped = char.id === save.selectedCharacterId;
              const charStyle = BREATHING_STYLES[char.defaultBreathing];
              const charProf = getCharacterProfile(save, char.id);
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => handlePickCharacter(char)}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                    chosen
                      ? 'border-sky-400 bg-slate-800/95 shadow-md'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-9 w-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: charStyle.primaryColor }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display truncate text-sm font-bold text-white">
                          {char.name}
                        </span>
                        {equipped && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        )}
                      </div>
                      <p className="truncate text-[11px] text-slate-400">
                        {charStyle.name} · Lv.{charProf.highestUnlockedLevel}/50 · {charProf.coins} Coins
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-num shrink-0 text-[11px] font-semibold text-slate-300">
                    {char.maxHp + charProf.upgrades.vitality * 22} HP
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail Spotlight */}
          <div className="flex flex-col justify-between p-4 sm:p-6 md:col-span-7">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <SlayerPortraitSvg slayer={activeDef} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wider text-sky-300 uppercase">
                    {activeDef.title} · {activeDef.difficulty} Mastery
                  </p>
                  <h3 className="font-display mt-1 text-2xl font-extrabold text-white">
                    {activeDef.name}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-amber-300">
                    Special Ability: {activeDef.specialAbility}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Weapon: <span className="text-slate-200">{WEAPON_LABELS[activeDef.weapon]}</span>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {activeDef.description}
                  </p>
                </div>
              </div>

              {/* Combat Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-800 py-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-slate-400">Vitality</span>
                  <p className="font-mono-num mt-0.5 text-sm font-bold text-emerald-300">
                    {activeDef.maxHp} HP
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Blade Power</span>
                  <p className="font-mono-num mt-0.5 text-sm font-bold text-rose-300">
                    {(activeDef.damageMult * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Footwork</span>
                  <p className="font-mono-num mt-0.5 text-sm font-bold text-sky-300">
                    {(activeDef.speedMult * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Swing Speed</span>
                  <p className="font-mono-num mt-0.5 text-sm font-bold text-amber-300">
                    {(activeDef.attackSpeedMult * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Breathing Selector */}
              <div className="mt-4">
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Breathing Style
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeDef.allowedBreathings.map((bId) => {
                    const st = BREATHING_STYLES[bId];
                    const chosen = selectedBreathing === bId;
                    return (
                      <button
                        key={bId}
                        type="button"
                        onClick={() => setSelectedBreathing(bId)}
                        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                          chosen
                            ? 'border-sky-400 bg-sky-500/20 text-white'
                            : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: st.primaryColor }}
                        />
                        <span>{st.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Independent Character Campaign & Save Preview */}
              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <p className="flex items-center justify-between gap-2 text-[11px] font-bold text-sky-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{campaignInfo.campaignTitle}</span>
                  </span>
                  <span className="font-mono-num text-emerald-300">
                    Save: Lv.{activeProfile.highestUnlockedLevel}/50 · {activeProfile.coins} Coins
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {activeProfile.highestUnlockedLevel === 1
                    ? (getCampaignForCharacter(activeDef.id)[0]?.intro ?? routePreview.routeIntro)
                    : routePreview.routeIntro}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirmSelect(activeDef.id, selectedBreathing)}
                className="flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg transition-colors hover:bg-sky-400"
              >
                <Swords className="h-4 w-4" />
                <span>
                  {confirmLabel ?? `Select ${activeDef.name.split(' ')[0]} (${styleDef.name})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
