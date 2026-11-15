import { useMemo, useState } from 'react';
import { ArrowLeft, Search, Skull, Swords } from 'lucide-react';
import { DemonTemplate, ENCYCLOPEDIA_DEMONS } from '../game/demons';
import { DemonArchetype, DemonDifficultyTier, MapId } from '../game/types';

interface DemonEncyclopediaModalProps {
  onClose: () => void;
  onChallengeDemon: (mapId: MapId, demon: DemonArchetype) => void;
}

const TIER_FILTERS: Array<'All' | DemonDifficultyTier> = [
  'All',
  'Easy',
  'Normal',
  'Hard',
  'Very Hard',
  'Extreme',
  'Insane',
];

function defaultArenaForDemon(archetype: DemonArchetype): MapId {
  if (archetype.startsWith('rui_') || archetype.startsWith('spider_')) return 'spider_mountain';
  if (archetype.includes('gyutaro') || archetype.includes('daki')) return 'entertainment_district';
  if (
    archetype.startsWith('hantengu_') ||
    archetype === 'gyokko' ||
    archetype === 'sekido' ||
    archetype === 'karaku' ||
    archetype === 'aizetsu' ||
    archetype === 'urogi' ||
    archetype === 'zohakuten' ||
    archetype === 'urami'
  ) {
    return 'swordsmith_village';
  }
  if (
    archetype === 'boss_kokushibo' ||
    archetype === 'kokushibo_demon' ||
    archetype === 'boss_doma' ||
    archetype === 'boss_akaza' ||
    archetype === 'akaza_awakened' ||
    archetype === 'boss_nakime' ||
    archetype === 'kaigaku' ||
    archetype === 'muzan_final' ||
    archetype === 'demon_king_tanjiro'
  ) {
    return 'infinity_castle';
  }
  if (
    archetype.startsWith('muzan_') ||
    archetype === 'boss_muzan' ||
    archetype === 'susamaru' ||
    archetype === 'yahaba' ||
    archetype === 'tamayo' ||
    archetype === 'yushiro' ||
    archetype === 'chachamaru' ||
    archetype === 'tanjiro_demon_form'
  ) {
    return 'japanese_village';
  }
  if (
    archetype === 'swamp_demon' ||
    archetype === 'temple_demon' ||
    archetype === 'kyogai' ||
    archetype === 'ubume'
  ) {
    return 'abandoned_temple';
  }
  if (archetype === 'boss_enmu' || archetype === 'rokuro' || archetype === 'wakuraba' || archetype === 'mukago' || archetype === 'kamanue') {
    return 'hashira_grounds';
  }
  return 'dark_forest';
}

function DemonPortraitSvg({ demon }: { demon: DemonTemplate }) {
  const v = demon.visual;
  return (
    <svg
      viewBox="0 0 130 140"
      className="h-32 w-32 shrink-0 rounded-xl border border-rose-900/60 bg-slate-950 shadow-inner"
      aria-hidden="true"
    >
      <circle cx="65" cy="58" r="46" fill={demon.bdaColor} opacity="0.18" />
      {v.wings && (
        <path
          d="M12 52 Q36 28 52 72 M118 52 Q94 28 78 72"
          fill="none"
          stroke={v.haoriAccent}
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      {v.drumHalo && (
        <circle
          cx="65"
          cy="60"
          r="50"
          fill="none"
          stroke={demon.bdaColor}
          strokeWidth="3"
          strokeDasharray="10 8"
        />
      )}
      {v.spiderLegs && (
        <path
          d="M22 108 L44 82 M108 108 L86 82 M16 86 L42 74 M114 86 L88 74"
          stroke={v.haoriAccent}
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {/* Torso / Pot Vessel */}
      {v.potVessel ? (
        <ellipse cx="65" cy="118" rx="30" ry="20" fill="#e2e8f0" stroke="#0284c7" strokeWidth="3" />
      ) : (
        <>
          <path
            d="M20 140 C26 106 42 96 65 96 C88 96 104 106 110 140 Z"
            fill={v.haoriPrimary}
          />
          <path d="M52 96 L65 140 L78 96 Z" fill={v.uniformColor} />
        </>
      )}
      {/* Neck & Head */}
      <rect x="57" y="78" width="16" height="20" rx="5" fill={v.skinColor} />
      <ellipse cx="65" cy="60" rx="22" ry="24" fill={v.skinColor} />
      {/* Cat Ears */}
      {v.catEars && (
        <>
          <path d="M44 42 L39 21 L54 34 Z" fill={v.hairColor} stroke={v.haoriAccent} strokeWidth="1.5" />
          <path d="M86 42 L91 21 L76 34 Z" fill={v.hairColor} stroke={v.haoriAccent} strokeWidth="1.5" />
        </>
      )}
      {/* Hair */}
      <path
        d="M40 58 C38 32 52 20 65 20 C80 20 92 32 90 58 C86 46 78 40 65 40 C52 40 44 46 40 58 Z"
        fill={v.hairColor}
      />
      {/* Horns */}
      {v.hasHorns && (
        <>
          <path d="M47 38 L39 18 L54 32 Z" fill={v.hornColor ?? demon.bdaColor} />
          <path d="M83 38 L91 18 L76 32 Z" fill={v.hornColor ?? demon.bdaColor} />
        </>
      )}
      {/* Fedora */}
      {v.fedora && (
        <g>
          <ellipse cx="65" cy="36" rx="28" ry="5" fill="#f8fafc" />
          <path d="M46 35 L50 20 L80 20 L84 35 Z" fill="#f8fafc" />
          <rect x="48" y="30" width="34" height="4" fill="#18181b" />
        </g>
      )}
      {/* Markings / Talisman */}
      {v.hasMarkings && (
        <path
          d="M46 68 L54 74 M84 68 L76 74"
          stroke={v.markingColor ?? demon.bdaColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
      {v.blindfoldMask && (
        <rect x="60" y="34" width="10" height="14" rx="1" fill="#fef3c7" stroke="#dc2626" strokeWidth="1.5" />
      )}
      {/* Eyes */}
      <ellipse cx="56" cy="61" rx="3.5" ry="3.5" fill={v.eyeColor} />
      <ellipse cx="74" cy="61" rx="3.5" ry="3.5" fill={v.eyeColor} />
      {v.extraEyes && (
        <>
          <ellipse cx="55" cy="51" rx="2.4" ry="2.2" fill={v.eyeColor} />
          <ellipse cx="75" cy="51" rx="2.4" ry="2.2" fill={v.eyeColor} />
          <ellipse cx="65" cy="48" rx="2.6" ry="2.4" fill={v.eyeColor} />
        </>
      )}
    </svg>
  );
}

export function DemonEncyclopediaModal({
  onClose,
  onChallengeDemon,
}: DemonEncyclopediaModalProps) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'All' | DemonDifficultyTier>('All');
  const [selectedArchetype, setSelectedArchetype] = useState<DemonArchetype>(
    ENCYCLOPEDIA_DEMONS[0]?.archetype ?? 'boss_kokushibo'
  );

  const filteredDemons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ENCYCLOPEDIA_DEMONS.filter((d) => {
      if (tierFilter !== 'All' && d.ability.difficultyTier !== tierFilter) return false;
      if (!q) return true;
      return (
        d.displayName.toLowerCase().includes(q) ||
        d.rankLabel.toLowerCase().includes(q) ||
        d.abilitySummary.toLowerCase().includes(q)
      );
    });
  }, [search, tierFilter]);

  const current =
    ENCYCLOPEDIA_DEMONS.find((d) => d.archetype === selectedArchetype) ??
    filteredDemons[0] ??
    ENCYCLOPEDIA_DEMONS[0];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 p-3 sm:p-6">
      <div className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-rose-900/60 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3.5 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-100 hover:border-sky-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 text-rose-300" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <Skull className="hidden h-5 w-5 text-rose-400 sm:block" />
              <div>
                <h2 className="font-display text-base font-bold text-white sm:text-xl">
                  Demon Encyclopedia ({ENCYCLOPEDIA_DEMONS.length} Canonical Demons)
                </h2>
                <p className="text-xs text-slate-400">
                  Inspect all 60 demons, Blood Demon Arts, multi-phase AI traits, and challenge any opponent.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/70 px-4 py-2.5 sm:px-6">
          <div className="relative min-w-52 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search demon name, rank, or art..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-1.5 pr-3 pl-9 text-xs text-slate-100 placeholder:text-slate-500 focus:border-rose-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {TIER_FILTERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setTierFilter(tier)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  tierFilter === tier
                    ? 'bg-rose-500/25 text-rose-200 ring-1 ring-rose-500/60'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12">
          {/* 60 Demons Scrollable Grid */}
          <div className="grid max-h-[46dvh] grid-cols-2 gap-2 overflow-y-auto border-b border-slate-800 p-4 sm:grid-cols-3 md:col-span-7 md:max-h-none md:grid-cols-2 md:border-r md:border-b-0">
            {filteredDemons.map((d) => {
              const rosterNum = ENCYCLOPEDIA_DEMONS.indexOf(d) + 1;
              const active = d.archetype === current.archetype;
              return (
                <button
                  key={d.archetype}
                  type="button"
                  onClick={() => setSelectedArchetype(d.archetype)}
                  className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-colors ${
                    active
                      ? 'border-rose-400 bg-rose-950/35'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-1">
                    <span className="font-mono-num truncate text-[10px] font-bold text-rose-300">
                      #{String(rosterNum).padStart(2, '0')} · {d.ability.difficultyTier}
                    </span>
                    <span
                      className="h-2.5 w-2.5 shrink-0"
                      style={{ backgroundColor: d.bdaColor }}
                    />
                  </div>
                  <span className="mt-1 line-clamp-1 text-xs font-bold text-white">
                    {d.displayName}
                  </span>
                  <span className="font-mono-num mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                    {d.baseHp} HP · {d.rankLabel}
                  </span>
                </button>
              );
            })}
            {filteredDemons.length === 0 && (
              <p className="col-span-full py-10 text-center text-xs text-slate-400">
                No demons match your filter. Clear search or switch difficulty tier.
              </p>
            )}
          </div>

          {/* Detail Dossier */}
          <div className="flex flex-col justify-between p-4 sm:p-6 md:col-span-5">
            <div>
              <div className="flex items-start gap-4">
                <DemonPortraitSvg demon={current} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold tracking-wider text-rose-400 uppercase">
                    {current.rankLabel} · {current.ability.difficultyTier}
                  </p>
                  <h3 className="font-display mt-1 text-xl font-extrabold text-white">
                    {current.displayName}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    {current.abilitySummary}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-800 py-3.5 text-xs">
                <div>
                  <span className="text-slate-400">Base Health</span>
                  <p className="font-mono-num mt-0.5 text-sm font-bold text-rose-300">
                    {current.baseHp} HP
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Attack Power</span>
                  <p className="font-mono-num mt-0.5 text-sm font-bold text-amber-300">
                    {(current.damageMult * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Movement Speed</span>
                  <p className="font-mono-num mt-0.5 text-sm font-bold text-sky-300">
                    {(current.speedMult * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Regen / Armor</span>
                  <p className="font-mono-num mt-0.5 text-sm font-bold text-emerald-300">
                    {current.regenPerSec}/s · {(current.defense * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
                <p className="font-semibold text-white">Blood Demon Art & AI Combat Profile</p>
                <p className="text-slate-400">
                  Signature Art:{' '}
                  <span className="text-slate-200">
                    {current.ability.projectileKind.replace(/_/g, ' ')}
                  </span>{' '}
                  · Phases:{' '}
                  <span className="font-mono-num text-rose-300">{current.ability.phases}</span>
                </p>
                <p className="text-slate-400">
                  Ultimate:{' '}
                  <span className="text-amber-300">{current.ability.ultimateText}</span>
                </p>
                <p className="text-slate-400">
                  Traits:{' '}
                  <span className="text-slate-200">
                    {[
                      current.ability.canBlock ? 'Blocks Attacks' : null,
                      current.ability.canTeleport ? 'Teleportation' : null,
                      current.ability.triggersRoomShift ? 'Biwa Room Shift' : null,
                      current.ability.cloneArchetype ? 'Summons Clones' : null,
                      current.ability.chillDuration ? 'Frost Slow' : null,
                      current.ability.poisonDps ? 'Venom Strike' : null,
                      current.visual.bodyBuild ?? 'standard',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onChallengeDemon(defaultArenaForDemon(current.archetype), current.archetype)}
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-rose-500"
            >
              <Swords className="h-4 w-4" />
              <span>Challenge in Free Battle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
