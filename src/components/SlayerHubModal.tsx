import { useState } from 'react';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Check,
  Coins,
  Flame,
  Lock,
  ShieldAlert,
  Skull,
  Sparkles,
  Swords,
  Target,
} from 'lucide-react';
import { MAP_DISPLAY_NAMES } from '../game/campaign';
import { DIFFICULTY_SCALING } from '../game/constants';
import {
  ACHIEVEMENTS,
  getCharacterProfile,
  getTotalXpForProfile,
  MAX_TOTAL_XP,
  SECRET_BOSSES,
  TRAINING_CHALLENGES,
} from '../game/save';
import { DifficultyMode, SaveData } from '../game/types';

type HubTab = 'missions' | 'trials' | 'difficulty' | 'stats';

interface SlayerHubModalProps {
  save: SaveData;
  onClose: () => void;
  onClaimMission: (missionId: string) => { ok: boolean; message: string };
  onClaimAchievement: (achId: string) => { ok: boolean; message: string };
  onSetDifficulty: (mode: DifficultyMode) => void;
  onStartTraining: (trainingId: string) => void;
  onStartSecretBoss: (secretBossId: string) => void;
}

const DIFFICULTY_ORDER: DifficultyMode[] = ['standard', 'hard', 'nightmare', 'abyssal'];

export function SlayerHubModal({
  save,
  onClose,
  onClaimMission,
  onClaimAchievement,
  onSetDifficulty,
  onStartTraining,
  onStartSecretBoss,
}: SlayerHubModalProps) {
  const [activeTab, setActiveTab] = useState<HubTab>('missions');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const profile = getCharacterProfile(save);
  const totalXp = getTotalXpForProfile(profile.playerLevel, profile.playerXp);
  const abyssalUnlocked =
    profile.playerLevel >= 50 ||
    profile.highestUnlockedLevel >= 50 ||
    Boolean(profile.levelBestRanks[50]);

  const claimableMissionsCount = save.dailyMissions.filter(
    (m) => !m.claimed && m.progress >= m.target
  ).length;
  const claimableAchievementsCount = ACHIEVEMENTS.filter(
    (a) =>
      !save.claimedAchievements.includes(a.id) &&
      (save.playerStats?.[a.metric] ?? 0) >= a.target
  ).length;

  const statRows: Array<{ label: string; value: number }> = [
    { label: 'Demons Defeated', value: save.playerStats.demonsDefeated },
    { label: 'Bosses Slain', value: save.playerStats.bossesDefeated },
    { label: 'Story Levels Cleared', value: save.playerStats.levelsCleared },
    { label: 'Perfect Dodges', value: save.playerStats.perfectDodges },
    { label: 'No-Damage Victories', value: save.playerStats.noDamageWins },
    { label: 'Breathing Finishers', value: save.playerStats.breathingFinishers },
    { label: 'Chests & Caches Found', value: save.playerStats.chestsFound },
    { label: 'SSS Combat Ranks', value: save.playerStats.sssRanks },
    { label: 'Training Trials Cleared', value: save.playerStats.trainingCompleted },
    { label: 'Secret Bosses Defeated', value: save.playerStats.secretBossesCleared },
    { label: 'Total Damage Dealt', value: save.playerStats.totalDamageDealt },
    { label: 'Survival Best Wave', value: save.survivalStats.highestWave },
    { label: 'Survival Full Clears', value: save.survivalStats.totalWins },
  ];

  return (
    <div className="safe-area-modal fixed inset-0 z-40 flex flex-col bg-slate-950/95 text-slate-100 backdrop-blur-md">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-100 hover:border-sky-400 hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4 text-sky-300" />
            <span>Back</span>
          </button>
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-wide text-white sm:text-xl">
              Corps Command Hub
            </h2>
            <p className="text-[11px] text-slate-400">
              Daily Missions · Achievements · Hashira Trials · Difficulty · Records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="tabular-nums rounded-lg border border-sky-500/40 bg-sky-950/60 px-3 py-1.5 text-xs font-bold text-sky-200">
            Lv.{profile.playerLevel}/50 · {totalXp}/{MAX_TOTAL_XP} XP
          </div>
          <div className="tabular-nums flex items-center gap-1.5 rounded-lg border border-amber-500/45 bg-amber-950/60 px-3 py-1.5 text-xs font-extrabold text-amber-300">
            <Coins className="h-3.5 w-3.5" />
            <span>{profile.coins}</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-1.5 border-b border-slate-800/80 bg-slate-900/60 px-4 py-2 sm:px-6">
        <button
          type="button"
          onClick={() => setActiveTab('missions')}
          className={`flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors ${
            activeTab === 'missions'
              ? 'border-sky-400 bg-sky-500/20 text-sky-200'
              : 'border-slate-700/80 bg-slate-900 text-slate-300 hover:border-slate-500'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>Missions & Achievements</span>
          {claimableMissionsCount + claimableAchievementsCount > 0 && (
            <span className="tabular-nums rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
              {claimableMissionsCount + claimableAchievementsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trials')}
          className={`flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors ${
            activeTab === 'trials'
              ? 'border-rose-400 bg-rose-500/20 text-rose-200'
              : 'border-slate-700/80 bg-slate-900 text-slate-300 hover:border-slate-500'
          }`}
        >
          <Swords className="h-4 w-4" />
          <span>Trials & Secret Bosses</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('difficulty')}
          className={`flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors ${
            activeTab === 'difficulty'
              ? 'border-amber-400 bg-amber-500/20 text-amber-200'
              : 'border-slate-700/80 bg-slate-900 text-slate-300 hover:border-slate-500'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Difficulty: {DIFFICULTY_SCALING[save.selectedDifficulty].label}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors ${
            activeTab === 'stats'
              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
              : 'border-slate-700/80 bg-slate-900 text-slate-300 hover:border-slate-500'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Combat Records</span>
        </button>
      </nav>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mx-4 mt-3 rounded-lg border px-3.5 py-2 text-xs font-semibold sm:mx-6 ${
            feedback.ok
              ? 'border-emerald-500/50 bg-emerald-950/70 text-emerald-200'
              : 'border-rose-500/50 bg-rose-950/70 text-rose-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {activeTab === 'missions' && (
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            {/* Daily Missions */}
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="font-display flex items-center gap-2 text-sm font-bold tracking-wider text-sky-300 uppercase">
                  <Sparkles className="h-4 w-4" />
                  <span>Daily Slayer Missions ({save.dailyMissionDate})</span>
                </h3>
                <span className="tabular-nums text-[11px] text-slate-400">
                  {save.dailyMissions.filter((m) => m.claimed).length} / {save.dailyMissions.length} Claimed
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {save.dailyMissions.map((m) => {
                  const pct = Math.min(100, Math.round((m.progress / Math.max(1, m.target)) * 100));
                  const canClaim = !m.claimed && m.progress >= m.target;
                  return (
                    <div
                      key={m.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-3.5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-white">{m.title}</h4>
                          <span className="tabular-nums rounded bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-sky-300">
                            {m.progress}/{m.target}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{m.description}</p>
                        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-sm bg-slate-950">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="tabular-nums mt-2 flex items-center gap-3 text-[11px] font-semibold">
                          <span className="text-amber-300">+{m.rewardCoins} Coins</span>
                          <span className="text-sky-300">+{m.rewardXp} XP</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canClaim}
                        onClick={() => {
                          const res = onClaimMission(m.id);
                          setFeedback({ ok: res.ok, text: res.message });
                        }}
                        className={`mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                          m.claimed
                            ? 'border border-emerald-500/35 bg-emerald-950/40 text-emerald-300'
                            : canClaim
                              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                              : 'border border-slate-700 bg-slate-800/70 text-slate-400'
                        }`}
                      >
                        {m.claimed ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Claimed</span>
                          </>
                        ) : canClaim ? (
                          <span>Claim Reward</span>
                        ) : (
                          <span>In Progress</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Achievements */}
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="font-display flex items-center gap-2 text-sm font-bold tracking-wider text-amber-300 uppercase">
                  <Award className="h-4 w-4" />
                  <span>Corps Achievements</span>
                </h3>
                <span className="tabular-nums text-[11px] text-slate-400">
                  {save.claimedAchievements.length} / {ACHIEVEMENTS.length} Claimed
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {ACHIEVEMENTS.map((a) => {
                  const val = save.playerStats?.[a.metric] ?? 0;
                  const clamped = Math.min(a.target, val);
                  const pct = Math.min(100, Math.round((clamped / Math.max(1, a.target)) * 100));
                  const claimed = save.claimedAchievements.includes(a.id);
                  const canClaim = !claimed && val >= a.target;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="truncate text-sm font-bold text-white">{a.title}</h4>
                          <span className="tabular-nums shrink-0 text-[11px] font-bold text-slate-300">
                            {clamped}/{a.target}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">{a.description}</p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-slate-950">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="tabular-nums mt-1.5 flex items-center gap-3 text-[11px] font-semibold">
                          <span className="text-amber-300">+{a.rewardCoins} Coins</span>
                          <span className="text-sky-300">+{a.rewardXp} XP</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canClaim}
                        onClick={() => {
                          const res = onClaimAchievement(a.id);
                          setFeedback({ ok: res.ok, text: res.message });
                        }}
                        className={`flex min-h-[44px] shrink-0 items-center justify-center rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                          claimed
                            ? 'border border-emerald-500/35 bg-emerald-950/40 text-emerald-300'
                            : canClaim
                              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                              : 'border border-slate-700 bg-slate-800 text-slate-400'
                        }`}
                      >
                        {claimed ? 'Claimed' : canClaim ? 'Claim' : 'Locked'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'trials' && (
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            {/* Training Challenges */}
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="font-display flex items-center gap-2 text-sm font-bold tracking-wider text-emerald-300 uppercase">
                  <Swords className="h-4 w-4" />
                  <span>Hashira Combat Training Challenges</span>
                </h3>
                <span className="tabular-nums text-[11px] text-slate-400">
                  {profile.completedTrainingIds.length} / {TRAINING_CHALLENGES.length} Cleared
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {TRAINING_CHALLENGES.map((ch) => {
                  const done = profile.completedTrainingIds.includes(ch.id);
                  return (
                    <div
                      key={ch.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-white">{ch.title}</h4>
                            <p className="text-[11px] font-semibold text-emerald-300">{ch.subtitle}</p>
                          </div>
                          {done && (
                            <span className="flex items-center gap-1 rounded border border-emerald-500/45 bg-emerald-950/70 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              <Check className="h-3 w-3" />
                              Cleared
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs text-slate-300">{ch.description}</p>
                        <div className="tabular-nums mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                          <span>Arena: {MAP_DISPLAY_NAMES[ch.mapId]}</span>
                          <span>Opponent: {ch.enemyName}</span>
                          <span className="font-bold text-amber-300">+{ch.rewardCoins} Coins</span>
                          <span className="font-bold text-sky-300">+{ch.rewardXp} XP</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onStartTraining(ch.id)}
                        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-400"
                      >
                        <Swords className="h-4 w-4" />
                        <span>{done ? 'Replay Trial' : 'Start Trial'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Secret Boss Encounters */}
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="font-display flex items-center gap-2 text-sm font-bold tracking-wider text-rose-300 uppercase">
                  <Skull className="h-4 w-4" />
                  <span>Hidden Secret Boss Encounters</span>
                </h3>
                <span className="tabular-nums text-[11px] text-slate-400">
                  {profile.clearedSecretBossIds.length} / {SECRET_BOSSES.length} Defeated
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {SECRET_BOSSES.map((sb) => {
                  const unlocked =
                    profile.highestUnlockedLevel >= sb.minLevel ||
                    profile.playerLevel >= sb.minPlayerLevel;
                  const cleared = profile.clearedSecretBossIds.includes(sb.id);
                  return (
                    <div
                      key={sb.id}
                      className={`flex flex-col justify-between rounded-xl border p-4 ${
                        unlocked
                          ? 'border-rose-500/45 bg-slate-900/95'
                          : 'border-slate-800 bg-slate-900/60 opacity-85'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-white">{sb.title}</h4>
                          {cleared ? (
                            <span className="rounded border border-emerald-500/45 bg-emerald-950/70 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              Defeated
                            </span>
                          ) : !unlocked ? (
                            <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                          ) : null}
                        </div>
                        <p className="text-[11px] font-semibold text-rose-300">{sb.subtitle}</p>
                        <p className="mt-1.5 text-xs text-slate-300">{sb.description}</p>
                        <div className="tabular-nums mt-2.5 space-y-1 text-[11px] text-slate-400">
                          <div>Arena: {MAP_DISPLAY_NAMES[sb.mapId]}</div>
                          <div>Requirement: {sb.unlockRequirementLabel}</div>
                          <div className="flex items-center gap-3 font-bold">
                            <span className="text-amber-300">+{sb.rewardCoins} Coins</span>
                            <span className="text-sky-300">+{sb.rewardXp} XP</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!unlocked}
                        onClick={() => onStartSecretBoss(sb.id)}
                        className={`mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-extrabold ${
                          unlocked
                            ? 'bg-rose-600 text-white hover:bg-rose-500'
                            : 'border border-slate-700 bg-slate-800 text-slate-400'
                        }`}
                      >
                        {unlocked ? (
                          <>
                            <Flame className="h-4 w-4" />
                            <span>{cleared ? 'Rematch Secret Boss' : 'Challenge Secret Boss'}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-3.5 w-3.5" />
                            <span>Locked</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'difficulty' && (
          <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
            {DIFFICULTY_ORDER.map((mode) => {
              const cfg = DIFFICULTY_SCALING[mode];
              const isSelected = save.selectedDifficulty === mode;
              const isLocked = mode === 'abyssal' && !abyssalUnlocked;
              return (
                <button
                  key={mode}
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    onSetDifficulty(mode);
                    setFeedback({ ok: true, text: `Combat difficulty set to ${cfg.label}.` });
                  }}
                  className={`flex min-h-[132px] flex-col justify-between rounded-xl border p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/35'
                      : isLocked
                        ? 'border-slate-800 bg-slate-900/50 opacity-75'
                        : 'border-slate-800 bg-slate-900/90 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-base font-extrabold text-white">
                        {cfg.label}
                      </span>
                      {isSelected ? (
                        <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">
                          ACTIVE
                        </span>
                      ) : isLocked ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <Lock className="h-3.5 w-3.5" />
                          Lv.50 Unlock
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-300">{cfg.description}</p>
                    {isLocked && (
                      <p className="mt-1 text-[11px] font-semibold text-rose-300">
                        Unlock by reaching Slayer Lv.50 or clearing Story Level 50.
                      </p>
                    )}
                  </div>

                  <div className="tabular-nums mt-3 flex flex-wrap gap-3 border-t border-slate-800/80 pt-2 text-[11px] font-semibold text-slate-300">
                    <span>Enemy HP {cfg.hpMult.toFixed(2)}x</span>
                    <span>Damage {cfg.dmgMult.toFixed(2)}x</span>
                    <span>AI Pace {cfg.aiRateMult.toFixed(2)}x</span>
                    <span className="text-amber-300">Rewards {cfg.rewardMult.toFixed(2)}x</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {statRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5"
                >
                  <div className="text-[11px] font-semibold text-slate-400">{row.label}</div>
                  <div className="tabular-nums font-display mt-1 text-2xl font-extrabold text-white">
                    {row.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
