import { useState } from 'react';
import { ArrowLeft, Lock, Play, Swords, Users } from 'lucide-react';
import { ALL_BREATHING_IDS, BREATHING_STYLES } from '../game/breathing';
import {
  getCampaignForCharacter,
  getCharacterCampaignInfo,
  getRouteLevelBriefing,
  MAP_DISPLAY_NAMES,
} from '../game/campaign';
import { getCharacterById } from '../game/characters';
import { ENCYCLOPEDIA_DEMONS } from '../game/demons';
import {
  BreathingStyleId,
  DemonArchetype,
  MapId,
  SaveData,
  StoryLevelDef,
} from '../game/types';

interface CampaignModalProps {
  save: SaveData;
  onClose: () => void;
  onStartLevel: (levelId: number) => void;
  onStartTutorial: () => void;
  onStartPractice: (
    mapId: MapId,
    demon: DemonArchetype,
    breathing: BreathingStyleId
  ) => void;
}

const CHAPTERS: Array<{ id: 1 | 2 | 3 | 4 | 5; label: string }> = [
  { id: 1, label: 'Ch. 1 · Beginning' },
  { id: 2, label: 'Ch. 2 · Hunting' },
  { id: 3, label: 'Ch. 3 · Upper Moons' },
  { id: 4, label: 'Ch. 4 · Preparation' },
  { id: 5, label: 'Ch. 5 · Infinity Castle' },
];

const PRACTICE_MAPS: MapId[] = [
  'bamboo_forest',
  'mountain_training',
  'snowy_mountain',
  'japanese_village',
  'dark_forest',
  'abandoned_temple',
  'spider_mountain',
  'entertainment_district',
  'swordsmith_village',
  'hashira_grounds',
  'infinity_castle',
  'burning_village',
  'haunted_temple',
  'underground_tunnel',
  'poisonous_forest',
  'final_fortress',
];

const PRACTICE_DEMONS: Array<{ id: DemonArchetype; label: string }> = [
  { id: 'basic', label: 'Basic Demon (Lesser)' },
  { id: 'fast', label: 'Fast Demon (Lesser)' },
  { id: 'strong', label: 'Strong Demon (Brute)' },
  { id: 'regenerating', label: 'Regenerating Demon' },
  { id: 'bda_special', label: 'Blood Demon Art User' },
  ...ENCYCLOPEDIA_DEMONS.map((d, idx) => ({
    id: d.archetype,
    label: `#${String(idx + 1).padStart(2, '0')} ${d.displayName} (${d.ability.difficultyTier})`,
  })),
];

export function CampaignModal({
  save,
  onClose,
  onStartLevel,
  onStartTutorial,
  onStartPractice,
}: CampaignModalProps) {
  const activeChar = getCharacterById(save.selectedCharacterId);
  const charCampaign = getCampaignForCharacter(activeChar.id);
  const campaignInfo = getCharacterCampaignInfo(activeChar.id);

  const [tab, setTab] = useState<'story' | 'practice'>('story');
  const [activeChapter, setActiveChapter] = useState<1 | 2 | 3 | 4 | 5>(() => {
    const ch = Math.ceil(save.highestUnlockedLevel / 10);
    return Math.max(1, Math.min(5, ch)) as 1 | 2 | 3 | 4 | 5;
  });
  const [selectedLevel, setSelectedLevel] = useState<StoryLevelDef>(() => {
    return (
      charCampaign.find((l) => l.id === save.highestUnlockedLevel) ?? charCampaign[0]
    );
  });

  const [practiceMap, setPracticeMap] = useState<MapId>('bamboo_forest');
  const [practiceDemon, setPracticeDemon] = useState<DemonArchetype>('basic');
  const [practiceStyle, setPracticeStyle] = useState<BreathingStyleId>(save.selectedBreathing);

  const routeBrief = getRouteLevelBriefing(selectedLevel, activeChar.routeId, activeChar.id);
  const chapterLevels = charCampaign.filter((l) => l.chapter === activeChapter);
  const levelUnlocked = selectedLevel.id <= save.highestUnlockedLevel;

  return (
    <div className="safe-area-modal fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 sm:p-6">
      <div className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700/90 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3.5 py-2.5 sm:px-6 sm:py-3">
          <div className="flex flex-wrap items-center gap-3">
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
                {campaignInfo.campaignTitle}
              </h2>
              <p className="text-[11px] text-sky-300">
                {activeChar.name} · Save Slot Lv.{save.highestUnlockedLevel}/50
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setTab('story')}
              className={`min-h-[38px] rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                tab === 'story' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              50-Level Story
            </button>
            <button
              type="button"
              onClick={() => setTab('practice')}
              className={`min-h-[38px] rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                tab === 'practice' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Free Battle ({PRACTICE_MAPS.length} Maps)
            </button>
          </div>
        </div>

        {tab === 'story' ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Chapter Selector + Rock Trial Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/60 px-4 py-2.5 sm:px-6">
              <div className="flex flex-wrap items-center gap-1.5">
                {CHAPTERS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveChapter(ch.id)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                      activeChapter === ch.id
                        ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/60'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onStartTutorial}
                className="rounded-md border border-amber-500/50 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-900/50"
              >
                {save.tutorialCompleted ? 'Replay Boulder Trial' : 'Play Rock Training Tutorial'}
              </button>
            </div>

            {/* Levels Grid + Mission Briefing */}
            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-5">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-800 p-4 sm:grid-cols-2 md:col-span-3 md:border-r md:border-b-0">
                {chapterLevels.map((lvl) => {
                  const unlocked = lvl.id <= save.highestUnlockedLevel;
                  const bestRank = save.levelBestRanks[lvl.id];
                  const selected = selectedLevel.id === lvl.id;

                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                        selected
                          ? 'border-sky-400 bg-slate-800/90'
                          : unlocked
                            ? 'border-slate-700/80 bg-slate-950/60 hover:border-slate-500'
                            : 'border-slate-800/70 bg-slate-950/35 opacity-60'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="font-mono-num text-xs font-bold text-sky-300">
                          Level {lvl.id}
                        </span>
                        {!unlocked ? (
                          <Lock className="h-3.5 w-3.5 text-slate-500" />
                        ) : bestRank ? (
                          <span className="font-mono-num text-xs font-bold text-amber-300">
                            Rank {bestRank}
                          </span>
                        ) : lvl.isBossLevel ? (
                          <span className="text-[11px] font-bold text-rose-400">Boss</span>
                        ) : null}
                      </div>
                      <span className="mt-1 line-clamp-1 text-xs font-semibold text-slate-100">
                        {lvl.title}
                      </span>
                      <span className="mt-0.5 text-[11px] text-slate-400">
                        {MAP_DISPLAY_NAMES[lvl.mapId]} · {lvl.difficulty}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mission Briefing Panel */}
              <div className="flex flex-col justify-between p-4 sm:p-5 md:col-span-2">
                <div>
                  <p className="text-xs font-semibold text-sky-300">
                    {selectedLevel.chapterTitle}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-emerald-300">
                    {routeBrief.routeLabel}
                  </p>
                  <h3 className="font-display mt-1 text-xl font-bold text-white">
                    Lv.{selectedLevel.id}: {selectedLevel.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                    {routeBrief.routeIntro}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Arena</span>
                      <span className="font-semibold text-slate-100">
                        {MAP_DISPLAY_NAMES[selectedLevel.mapId]}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Objective</span>
                      <span className="text-right font-semibold text-slate-100">
                        {routeBrief.routeObjective}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Difficulty</span>
                      <span className="font-semibold text-rose-300">
                        {selectedLevel.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reward</span>
                      <span className="font-mono-num tabular-nums font-bold text-amber-300">
                        +{selectedLevel.rewardCoins} Coins · +{selectedLevel.rewardXp ?? (selectedLevel.isBossLevel ? 55 : 30)} XP
                      </span>
                    </div>
                    {selectedLevel.hasUndergroundDungeon && (
                      <div className="flex justify-between gap-2 text-cyan-300">
                        <span className="text-slate-400">Route Feature</span>
                        <span className="text-right font-semibold">
                          Dark Underground Dungeon (Key & Gate)
                        </span>
                      </div>
                    )}
                    {selectedLevel.optionalObjective && (
                      <div className="flex justify-between gap-2 text-emerald-300">
                        <span className="text-slate-400">Bonus Objective</span>
                        <span className="text-right font-semibold">
                          {selectedLevel.optionalObjective.label} (+{selectedLevel.optionalObjective.bonusCoins}c)
                        </span>
                      </div>
                    )}
                    {(selectedLevel.allyIds ?? selectedLevel.allyHashiraIds) && (
                      <div className="flex items-center justify-between gap-2 text-emerald-300">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Users className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Allies</span>
                        </span>
                        <span className="text-right font-semibold">
                          {(selectedLevel.allyIds ?? selectedLevel.allyHashiraIds ?? [])
                            .map((id) => getCharacterById(id).name.split(' ')[0])
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  {levelUnlocked ? (
                    <button
                      type="button"
                      onClick={() => onStartLevel(selectedLevel.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>Deploy to Level {selectedLevel.id}</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 text-xs font-semibold text-slate-400">
                      <Lock className="h-4 w-4" />
                      <span>Clear Level {selectedLevel.id - 1} to unlock</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Free Battle Tab */
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:p-6 md:grid-cols-3">
            <div>
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                1. Select Arena ({PRACTICE_MAPS.length} Maps)
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-1.5">
                {PRACTICE_MAPS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPracticeMap(m)}
                    className={`rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      practiceMap === m
                        ? 'border-sky-400 bg-sky-500/15 text-sky-200'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {MAP_DISPLAY_NAMES[m]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                2. Select Breathing Style
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-1.5">
                {ALL_BREATHING_IDS.map((bId) => {
                  const st = BREATHING_STYLES[bId];
                  return (
                    <button
                      key={bId}
                      type="button"
                      onClick={() => setPracticeStyle(bId)}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                        practiceStyle === bId
                          ? 'border-sky-400 bg-slate-800 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span>{st.name}</span>
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: st.primaryColor }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  3. Select Demon Opponent ({PRACTICE_DEMONS.length})
                </h3>
                <div className="mt-2 grid max-h-80 grid-cols-1 gap-1.5 overflow-y-auto pr-1">
                  {PRACTICE_DEMONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setPracticeDemon(d.id)}
                      className={`rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                        practiceDemon === d.id
                          ? 'border-rose-400 bg-rose-950/40 text-rose-100'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStartPractice(practiceMap, practiceDemon, practiceStyle)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400"
              >
                <Swords className="h-4 w-4" />
                <span>Start Free Battle</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
