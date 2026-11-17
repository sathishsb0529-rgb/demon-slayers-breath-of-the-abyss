import { getCharacterById } from './characters';
import {
  BreathingStyleId,
  CutsceneDef,
  MapId,
  StoryEnemySpawn,
  StoryLevelDef,
  StoryRouteId,
  TutorialStepDef,
} from './types';

export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    step: 1,
    title: 'Arrival at Mt. Sagiri',
    mentorLine: 'Urokodaki: "You wish to wield a Nichirin blade? First, calm your breath under the mountain mist."',
    instruction: 'Move forward or wait a moment to begin your trial.',
  },
  {
    step: 2,
    title: 'Meet the Mentor',
    mentorLine: 'Urokodaki: "Demons regenerate and strike without mercy. Approach me so we may test your stance."',
    instruction: 'Walk or run closer to your mentor.',
  },
  {
    step: 3,
    title: 'Learn Footwork',
    mentorLine: 'Urokodaki: "Never plant your heels in place. Sprint across the training ground!"',
    instruction: 'Move Left and Right (A/D or Touch Arrows) across the ground.',
  },
  {
    step: 4,
    title: 'Learn Jumping',
    mentorLine: 'Urokodaki: "Clear sweeping claws and reach higher ledges by taking to the air!"',
    instruction: 'Press Jump (Space / W or Touch Jump) twice.',
  },
  {
    step: 5,
    title: 'Learn Sword Techniques',
    mentorLine: 'Urokodaki: "Let the katana follow your hips and shoulders—chain slashes cleanly!"',
    instruction: 'Land 3 Sword Attacks (J or Touch Slash) on the training sparring stance.',
  },
  {
    step: 6,
    title: 'Learn Blocking & Parrying',
    mentorLine: 'Urokodaki: "Raise your blade edge vertically to deflect incoming force!"',
    instruction: 'Hold Block (L / S or Touch Block) to defend against 2 strikes.',
  },
  {
    step: 7,
    title: 'Learn Dodging',
    mentorLine: 'Urokodaki: "Some blows carry crushing weight. Step cleanly through the threat!"',
    instruction: 'Perform 2 Dodges (Shift or Touch Dodge).',
  },
  {
    step: 8,
    title: 'Breathing Control',
    mentorLine: 'Urokodaki: "Draw oxygen deep into every cell. Feel your Breathing Energy climb!"',
    instruction: 'Let your Breathing Energy meter reach at least 40%.',
  },
  {
    step: 9,
    title: 'Practice Breathing Techniques',
    mentorLine: 'Urokodaki: "Channel your energy into your blade and unleash a Breathing Form!"',
    instruction: 'Activate any Breathing Form (Keys 1-5 / E or Touch Form button).',
  },
  {
    step: 10,
    title: 'Split the Giant Boulder',
    mentorLine: 'Sabito: "Only a true Breathing strike or Heavy cleave (2.0s cooldown) splits this boulder. Show your resolve!"',
    instruction: 'Shatter the Giant Boulder using Heavy Attacks (K) & Breathing Forms!',
  },
];

export const MAP_DISPLAY_NAMES: Record<MapId, string> = {
  bamboo_forest: 'Bamboo Forest',
  mountain_training: 'Mountain Training Ground',
  snowy_mountain: 'Snowy Mountain',
  japanese_village: 'Japanese Village',
  dark_forest: 'Dark Forest',
  abandoned_temple: 'Abandoned Temple',
  spider_mountain: 'Spider Mountain',
  entertainment_district: 'Entertainment District',
  swordsmith_village: 'Swordsmith Village',
  hashira_grounds: 'Hashira Training Grounds',
  infinity_castle: 'Infinity Castle',
  burning_village: 'Burning Village',
  haunted_temple: 'Haunted Temple',
  underground_tunnel: 'Underground Tunnel',
  poisonous_forest: 'Poisonous Forest',
  final_fortress: 'Final Fortress',
};

const CHAPTER_TITLES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Chapter 1: Training & Beginning',
  2: 'Chapter 2: Demon Hunting',
  3: 'Chapter 3: Hashira & Upper Moons',
  4: 'Chapter 4: The Final Preparation',
  5: 'Chapter 5: Infinity Castle',
};

const OPTIONAL_OBJECTIVES: NonNullable<StoryLevelDef['optionalObjective']>[] = [
  { id: 'perfect_dodges', label: 'Perform 3 Perfect Dodges', bonusCoins: 25, bonusXp: 15 },
  { id: 'breathing_finisher', label: 'Finish a Demon with a Breathing Form', bonusCoins: 25, bonusXp: 15 },
  { id: 'fast_clear', label: 'Clear Stage Under 95s', bonusCoins: 30, bonusXp: 18 },
  { id: 'no_damage', label: 'Clear Stage Taking ≤ 15% Damage', bonusCoins: 35, bonusXp: 20 },
  { id: 'secret_chest', label: 'Open a Hidden Slayer Cache / Chest', bonusCoins: 30, bonusXp: 15 },
];

function makeLevel(
  id: number,
  chapter: 1 | 2 | 3 | 4 | 5,
  title: string,
  mapId: MapId,
  enemies: StoryEnemySpawn[],
  difficulty: StoryLevelDef['difficulty'],
  rewardCoins: number,
  intro: string,
  isBossLevel = false,
  allyIds?: string[],
  cutsceneId?: string,
  postCutsceneId?: string,
  extra?: {
    rewardXp?: number;
    hasUndergroundDungeon?: boolean;
    optionalObjective?: StoryLevelDef['optionalObjective'];
  }
): StoryLevelDef {
  const defaultCoins = isBossLevel ? rewardCoins : 50;
  const defaultXp =
    extra?.rewardXp ??
    (isBossLevel
      ? id >= 49
        ? 180
        : id >= 41
          ? 110
          : id >= 20
            ? 85
            : 55
      : 30);
  const opt =
    extra?.optionalObjective ??
    OPTIONAL_OBJECTIVES[extra?.hasUndergroundDungeon ? 4 : id % OPTIONAL_OBJECTIVES.length];

  return {
    id,
    chapter,
    chapterTitle: CHAPTER_TITLES[chapter],
    title,
    intro,
    objectiveText: isBossLevel
      ? `Defeat Boss: ${enemies[enemies.length - 1].name}`
      : `Defeat ${enemies.length} ${enemies.length > 1 ? 'Demons' : 'Demon'}`,
    mapId,
    enemies,
    rewardCoins: defaultCoins,
    rewardXp: defaultXp,
    difficulty,
    isBossLevel,
    hasUndergroundDungeon: extra?.hasUndergroundDungeon ?? (isBossLevel && id >= 20),
    optionalObjective: opt,
    allyHashiraIds: allyIds,
    allyIds,
    cutsceneId,
    postCutsceneId,
  };
}

export const STORY_LEVELS: StoryLevelDef[] = [
  // CHAPTER 1: TRAINING AND BEGINNING (1 - 10)
  makeLevel(1, 1, 'First Night Beneath Bamboo', 'bamboo_forest', [
    { archetype: 'temple_demon', name: 'Temple Demon', subtitle: 'Feral Night Prowler' },
  ], 'Normal', 50, 'Your first patrol outside Mt. Sagiri. Cross the bamboo grove and silver river bridge to hunt down the prowling demon.', false, undefined, 'cs_first_demon'),
  makeLevel(2, 1, 'Echoes on the Trail', 'mountain_training', [
    { archetype: 'basic', name: 'Ridge Stalker', subtitle: 'Lesser Demon', hpScale: 1.05 },
    { archetype: 'chachamaru', name: 'Feline Demon Mirage', subtitle: 'Agile Prowler', hpScale: 0.9 },
  ], 'Normal', 50, 'Swift demons ambush the mountain pass and waterfall gorge under thick dawn mist.'),
  makeLevel(3, 1, 'Blizzard at Dawn', 'snowy_mountain', [
    { archetype: 'fast', name: 'Frost Claw', subtitle: 'Swift Demon' },
    { archetype: 'horned_demon', name: 'Horned Demon', subtitle: 'Heavy Charger', hpScale: 0.95 },
  ], 'Normal', 50, 'Freezing winds sweep across the icicle pass and timber ravine bridge. Watch for heavy horned charges.'),
  makeLevel(4, 1, 'Wisteria Gate Trial', 'haunted_temple', [
    { archetype: 'tongue_demon', name: 'Tongue Demon', subtitle: 'Caged Lasher' },
    { archetype: 'regenerating', name: 'Moss Fiend', subtitle: 'Regenerating Demon' },
  ], 'Normal', 50, 'Final Selection deepens inside a haunted shrine perimeter. Overcome regenerating fiends.'),
  makeLevel(5, 1, 'The Hand Demon of Mt. Fujikasane', 'dark_forest', [
    { archetype: 'boss_hand', name: 'Hand Demon', subtitle: 'Final Selection Terror', isBoss: true },
  ], 'Hard', 120, 'A grotesque giant demon who hunted dozens of apprentices awaits deep inside the dark forest clearing.', true, undefined, 'cs_hand_demon'),
  makeLevel(6, 1, 'Shadows of the Swamp', 'japanese_village', [
    { archetype: 'muzan_child', name: 'Shadow Infiltrator', subtitle: 'Muzan Scout' },
    { archetype: 'swamp_demon', name: 'Swamp Demon', subtitle: 'Abyssal Ambusher' },
  ], 'Normal', 50, 'Villagers vanish after sunset. Cross the lantern market street and canal bridge to intercept the Swamp Demon.'),
  makeLevel(7, 1, 'Crimson Blood Awakening', 'burning_village', [
    { archetype: 'nezuko_base', name: 'Nezuko · Blood Trial', subtitle: 'Kamado Instincts' },
  ], 'Normal', 50, 'Protect survivors amidst burning rafters as Exploding Blood instincts surge.'),
  makeLevel(8, 1, 'Temari & Arrow Ambush', 'japanese_village', [
    { archetype: 'yahaba', name: 'Yahaba · Arrow Demon', subtitle: 'Asakusa Assassin' },
    { archetype: 'susamaru', name: 'Susamaru · Temari Demon', subtitle: 'Asakusa Assassin' },
  ], 'Hard', 50, 'Deflect bouncing Temari spheres and vector arrows across the village rooftops and square.'),
  makeLevel(9, 1, 'Asakusa Physician & Progenitor', 'underground_tunnel', [
    { archetype: 'yushiro', name: 'Yushiro · Talisman Test', subtitle: 'Blindfold Talisman', hpScale: 0.9 },
    { archetype: 'muzan_adult', name: 'Muzan · Disguise Mirage', subtitle: 'Tsukihiko Illusion', hpScale: 0.65 },
  ], 'Hard', 50, 'Navigate subterranean passages beneath Asakusa before Muzan’s oppressive aura strikes.'),
  makeLevel(10, 1, 'Kyogai · Tsuzumi Mansion', 'abandoned_temple', [
    { archetype: 'strong', name: 'Stone Arm Brute', subtitle: 'Guardian Demon', hpScale: 1.15 },
    { archetype: 'kyogai', name: 'Kyogai · Drum Demon', subtitle: 'Former Lower Six', isBoss: true },
  ], 'Hard', 140, 'Advance through the crumbling temple halls as Kyogai twists gravity with his embedded drums.', true),

  // CHAPTER 2: DEMON HUNTING (11 - 20)
  makeLevel(11, 2, 'Threads of the Spider Mother', 'spider_mountain', [
    { archetype: 'spider_mother_main', name: 'Mother Spider Demon', subtitle: 'Mt. Natagumo', hpScale: 1.05 },
    { archetype: 'spider_sister_main', name: 'Sister Spider Demon', subtitle: 'Mt. Natagumo', hpScale: 1.05 },
  ], 'Hard', 50, 'Inosuke and Tanjiro press into Spider Mountain where silver threads ensnare fallen slayers.', false, ['inosuke'], 'cs_spider_mountain'),
  makeLevel(12, 2, 'The Venomous Brood', 'poisonous_forest', [
    { archetype: 'spider_brother_main', name: 'Brother Spider Demon', subtitle: 'Venom Spinner', hpScale: 1.15 },
  ], 'Hard', 50, 'Zenitsu dashes through toxic spore pools to sever the Brother Spider Demon’s lair.', false, ['zenitsu']),
  makeLevel(13, 2, 'The Carapace Father', 'spider_mountain', [
    { archetype: 'spider_father_main', name: 'Father Spider Demon', subtitle: 'Armored Titan', hpScale: 1.15 },
  ], 'Hard', 50, 'Fight alongside Giyu Tomioka across the gorge bridge to shatter the colossal spider titan.', false, ['giyu']),
  makeLevel(14, 2, 'Lower Moon Five: Rui', 'poisonous_forest', [
    { archetype: 'boss_rui', name: 'Rui', subtitle: 'Lower Rank Five', isBoss: true },
  ], 'Hard', 180, 'Tanjiro and Nezuko stand united against Lower Rank Five Rui amidst razor-sharp crimson threads.', true, ['nezuko_ally']),
  makeLevel(15, 2, 'Lower Ranks: Kamanue & Mukago', 'snowy_mountain', [
    { archetype: 'kamanue', name: 'Kamanue · Lower Six', subtitle: 'Twelve Kizuki' },
    { archetype: 'mukago', name: 'Mukago · Lower Four', subtitle: 'Twelve Kizuki' },
  ], 'Hard', 50, 'Two fugitive Lower Ranks ambush the snowbound mountain pass.'),
  makeLevel(16, 2, 'Lower Moon One: Enmu & Slasher', 'underground_tunnel', [
    { archetype: 'slasher', name: 'Slasher', subtitle: 'Mugen Express Phantom' },
    { archetype: 'boss_enmu', name: 'Enmu', subtitle: 'Lower Rank One', isBoss: true },
  ], 'Hard', 200, 'Fight beside Kyojuro Rengoku through darkened rail tunnels to break Enmu’s nightmare Blood Demon Art.', true, ['rengoku']),
  makeLevel(17, 2, 'Lower Two & Three Purge', 'haunted_temple', [
    { archetype: 'wakuraba', name: 'Wakuraba · Lower Three', subtitle: 'Velocity Blitz' },
    { archetype: 'rokuro', name: 'Rokuro · Lower Two', subtitle: 'Crimson Maul' },
  ], 'Hard', 50, 'Two powered-up Lower Ranks hunt lone slayers through cursed temple ruins.'),
  makeLevel(18, 2, 'Neon Lanterns of Yoshiwara', 'entertainment_district', [
    { archetype: 'muzan_female', name: 'Crimson Mistress Shade', subtitle: 'Upper Disguise', hpScale: 0.78 },
    { archetype: 'boss_daki', name: 'Daki · Sash Form', subtitle: 'Upper Rank Six', hpScale: 0.85 },
  ], 'Hard', 50, 'Scout the glowing alleys and balconies of Yoshiwara with Sound Hashira Tengen Uzui.', false, ['tengen']),
  makeLevel(19, 2, 'Awakened Obi Storm', 'burning_village', [
    { archetype: 'daki_awakened', name: "Daki's Awakened Form", subtitle: 'Third-Eye Upper Six', hpScale: 1.05 },
  ], 'Hashira', 50, 'Zenitsu and Inosuke charge through the blazing roofs to cut Daki’s sweeping obi ribbons!', false, ['zenitsu', 'inosuke']),
  makeLevel(20, 2, 'Upper Moon Six: Gyutaro & Daki', 'entertainment_district', [
    {
      archetype: 'gyutaro',
      name: 'Gyutaro · Upper Rank Six',
      subtitle: 'Poison Blood Sickles',
      isBoss: true,
      partnerArchetype: 'daki_awakened',
      partnerName: 'Daki · Awakened Obi',
      partnerSubtitle: 'Upper Six Sibling',
      partnerHpScale: 0.78,
    },
  ], 'Hashira', 280, 'Descend the subterranean cellar behind Yoshiwara and defeat Gyutaro and Daki together!', true, ['tengen', 'zenitsu', 'inosuke'], 'cs_upper_moon_six', undefined, { hasUndergroundDungeon: true, rewardXp: 90 }),

  // CHAPTER 3: HASHIRA AND UPPER MOONS (21 - 30)
  makeLevel(21, 3, 'Hantengu’s Emotion Split', 'dark_forest', [
    { archetype: 'sekido', name: 'Sekido · Anger', subtitle: 'Hantengu Clone' },
    { archetype: 'karaku', name: 'Karaku · Pleasure', subtitle: 'Hantengu Clone' },
  ], 'Hashira', 50, 'Guard the forest trail with Nezuko against Sekido’s lightning and Karaku’s gales.', false, ['nezuko_ally'], 'cs_swordsmith'),
  makeLevel(22, 3, 'Sorrow & Joy of Upper Four', 'swordsmith_village', [
    { archetype: 'aizetsu', name: 'Aizetsu · Sorrow', subtitle: 'Hantengu Clone' },
    { archetype: 'urogi', name: 'Urogi · Joy', subtitle: 'Winged Clone' },
  ], 'Hashira', 50, 'Fight beside Genya through the forge village against Aizetsu and Urogi.', false, ['genya']),
  makeLevel(23, 3, 'Porcelain Terror: Gyokko', 'swordsmith_village', [
    { archetype: 'nezuko_awakened', name: 'Demon Mirage Sentinel', subtitle: 'Upper Guard', hpScale: 0.85 },
    { archetype: 'gyokko', name: 'Gyokko · Upper Rank Five', subtitle: 'Porcelain Artisan', isBoss: true },
  ], 'Hashira', 300, 'Traverse the hidden kiln tunnels with Mist Hashira Muichiro Tokito to strike Gyokko down!', true, ['muichiro'], undefined, undefined, { hasUndergroundDungeon: true, rewardXp: 95 }),
  makeLevel(24, 3, 'Hantengu: Urami Resentment', 'burning_village', [
    { archetype: 'urami', name: 'Urami · Giant Resentment', subtitle: 'Upper Rank Four Shield', hpScale: 1.05 },
  ], 'Hashira', 50, 'Love Hashira Mitsuri Kanroji holds the wooden dragons back amidst burning timber!', false, ['mitsuri']),
  makeLevel(25, 3, 'Upper Moon Four: Zohakuten', 'poisonous_forest', [
    { archetype: 'hantengu_base', name: 'Hantengu Core', subtitle: 'Upper Four', hpScale: 0.75 },
    { archetype: 'zohakuten', name: 'Zohakuten · Hatred', subtitle: 'Upper Rank Four', isBoss: true },
  ], 'Upper Moon', 340, 'With Nezuko, Genya, and Mitsuri, break through the blighted woods and Zohakuten’s drum waves!', true, ['nezuko_ally', 'mitsuri', 'genya'], undefined, undefined, { hasUndergroundDungeon: true, rewardXp: 105 }),
  makeLevel(26, 3, 'Hashira Training: Summit', 'hashira_grounds', [
    { archetype: 'ubume', name: 'Ubume · Phantom Trial', subtitle: 'Hashira Training Memory', hpScale: 1.15 },
  ], 'Hashira', 50, 'Sharpen your reflexes alongside fellow slayers at Demon Slayer Corps headquarters.', false, undefined, 'cs_hashira_meeting'),
  makeLevel(27, 3, 'Hashira Sparring: Crimson Medicine', 'hashira_grounds', [
    { archetype: 'tamayo', name: 'Tamayo Illusion', subtitle: 'Aroma Training', hpScale: 1.15 },
    { archetype: 'strong', name: 'Stone Trial Sentinel', subtitle: 'Heavy Sparring Spirit', hpScale: 1.65 },
  ], 'Hashira', 50, 'Resist intoxicating Blood Aroma under Gyomei’s stone training watch.', false, ['gyomei']),
  makeLevel(28, 3, 'Night Raid on the Estate', 'bamboo_forest', [
    { archetype: 'muzan_child', name: "Muzan's Child Illusion", subtitle: 'Phantom Scout', hpScale: 1.2 },
    { archetype: 'muzan_female', name: "Muzan's Female Illusion", subtitle: 'Phantom Aristocrat', hpScale: 1.2 },
  ], 'Upper Moon', 50, 'Muzan dispatches phantom manifestations under cover of the bamboo night.'),
  makeLevel(29, 3, 'Ruins of the Ancient Shrine', 'haunted_temple', [
    { archetype: 'nezuko_adult', name: 'Blood Burst Echo', subtitle: 'Awakened Demon', hpScale: 1.2 },
    { archetype: 'tanjiro_demon_form', name: 'Abyssal Slayer Shade', subtitle: 'Dark Vision', hpScale: 1.2 },
  ], 'Upper Moon', 50, 'Clear the haunted shrine ruins with Sanemi before the Corps gathers.'),
  makeLevel(30, 3, 'Trial of the Red Blade', 'hashira_grounds', [
    { archetype: 'boss_akaza', name: 'Akaza Mirage', subtitle: 'Upper Rank Three Echo', isBoss: true, hpScale: 1.0 },
  ], 'Upper Moon', 360, 'Face a phantom manifestation of Upper Rank Three beside Giyu to prove Hashira mastery.', true, ['giyu'], undefined, undefined, { hasUndergroundDungeon: false, rewardXp: 110 }),

  // CHAPTER 4: THE FINAL PREPARATION (31 - 40)
  makeLevel(31, 4, 'Blizzard Crucible', 'snowy_mountain', [
    { archetype: 'regenerating', name: 'Glacier Fiend', subtitle: 'Elite Regenerator', hpScale: 1.85 },
    { archetype: 'hantengu_fear', name: 'Fear Titan Echo', subtitle: 'Elite Heavy', hpScale: 1.15 },
  ], 'Upper Moon', 50, 'Push your body to the limit in freezing mountain battles.'),
  makeLevel(32, 4, 'Lanterns Before the Storm', 'burning_village', [
    { archetype: 'susamaru', name: 'Temari Phantasm', subtitle: 'Elite Bombardier', hpScale: 1.45 },
    { archetype: 'yahaba', name: 'Vector Phantasm', subtitle: 'Elite Art User', hpScale: 1.45 },
  ], 'Upper Moon', 50, 'Eliminate elite echoes setting fire to the evacuation town.'),
  makeLevel(33, 4, 'Abyssal Woods Purge', 'poisonous_forest', [
    { archetype: 'rui_father', name: 'Carapace Remnant', subtitle: 'Elite Brute', hpScale: 1.5 },
    { archetype: 'rui_mother', name: 'Silk Remnant', subtitle: 'Elite Art User', hpScale: 1.5 },
  ], 'Upper Moon', 50, 'Survive relentless regeneration amidst toxic mire.'),
  makeLevel(34, 4, 'Widow Peak Webs', 'underground_tunnel', [
    { archetype: 'rui_brother', name: 'Venom Remnant', subtitle: 'Elite Art User', hpScale: 1.6 },
    { archetype: 'rui_sister', name: 'Acid Thread Remnant', subtitle: 'Elite Sprinter', hpScale: 1.6 },
  ], 'Upper Moon', 50, 'Destroy lingering Upper Moon remnants inside cavernous tunnels.'),
  makeLevel(35, 4, 'Forge Defense: Crimson Dawn', 'swordsmith_village', [
    { archetype: 'hantengu_merged', name: 'Hatred Remnant', subtitle: 'Upper Four Echo', hpScale: 1.15 },
  ], 'Upper Moon', 50, 'Ensure every Nichirin blade is tempered before the final descent.'),
  makeLevel(36, 4, 'Moonlit Duelists', 'bamboo_forest', [
    { archetype: 'tanjiro_demon_form', name: "Tanjiro's Demon Shade", subtitle: 'Crimson Nightmare', hpScale: 1.3 },
    { archetype: 'rokuro', name: 'Crimson Regent', subtitle: 'Elite Demon', hpScale: 1.7 },
  ], 'Upper Moon', 50, 'Precision parries decide survival beneath the swaying bamboo.'),
  makeLevel(37, 4, 'Ashen Pagoda Gauntlet', 'haunted_temple', [
    { archetype: 'kyogai', name: 'Resonant Drum Shade', subtitle: 'Elite Art User', hpScale: 1.6 },
    { archetype: 'wakuraba', name: 'Gale Blitz Shade', subtitle: 'Elite Sprinter', hpScale: 1.6 },
  ], 'Upper Moon', 50, 'Break through heavily fortified haunted temple guardians.'),
  makeLevel(38, 4, 'Crimson District Remnant', 'entertainment_district', [
    { archetype: 'daki_awakened', name: 'Sash Remnant', subtitle: 'Upper Six Echo', hpScale: 1.3 },
    { archetype: 'gyutaro_awakened', name: "Gyutaro's Awakened Form", subtitle: 'Upper Six Echo', hpScale: 1.25 },
  ], 'Upper Moon', 50, 'Cleanse the remaining Upper Rank echoes.'),
  makeLevel(39, 4, 'Final Hashira Summit', 'hashira_grounds', [
    { archetype: 'muzan_adult', name: "Muzan's Adult Aspect", subtitle: 'Progenitor Vessel', hpScale: 1.25 },
  ], 'Upper Moon', 50, 'Stand with the Hashira at Corps headquarters before the Infinity Castle opens.', false, ['giyu', 'sanemi']),
  makeLevel(40, 4, 'The Biwa Resounds', 'underground_tunnel', [
    { archetype: 'boss_enmu', name: 'Kagaya Trap Guardian', subtitle: 'Infinity Herald', isBoss: true, hpScale: 1.55, damageScale: 1.35 },
  ], 'Upper Moon', 320, 'Shoji doors drop beneath your feet into a subterranean vault as Nakime summons the Corps!', true, ['giyu', 'mitsuri'], 'cs_infinity_castle', undefined, { hasUndergroundDungeon: true, rewardXp: 110 }),

  // CHAPTER 5: INFINITY CASTLE & FINAL FORTRESS (41 - 50)
  makeLevel(41, 5, 'Black Thunder: Kaigaku', 'infinity_castle', [
    { archetype: 'fast', name: 'Castle Sentinel', subtitle: 'Lower Rank Strength', hpScale: 2.1 },
    { archetype: 'kaigaku', name: 'Kaigaku · Upper Rank Six', subtitle: 'Corrupted Thunder', isBoss: true },
  ], 'Upper Moon', 360, 'Cross the shifting foyer and dark dungeon wing to strike down Black Lightning Kaigaku.', true, ['zenitsu'], undefined, undefined, { hasUndergroundDungeon: true, rewardXp: 115 }),
  makeLevel(42, 5, 'Battle Against Nakime', 'infinity_castle', [
    { archetype: 'boss_nakime', name: 'Nakime', subtitle: 'Upper Rank Four · Biwa', isBoss: true },
  ], 'Upper Moon', 390, 'Obanai Iguro and Mitsuri Kanroji traverse the vertical stairways to silence Nakime’s Biwa.', true, ['obanai', 'mitsuri'], undefined, undefined, { hasUndergroundDungeon: true, rewardXp: 120 }),
  makeLevel(43, 5, 'Akaza Encounter: Tanjiro & Giyu', 'infinity_castle', [
    { archetype: 'boss_akaza', name: 'Akaza', subtitle: 'Upper Rank Three (Phase I)', isBoss: true, hpScale: 1.05 },
  ], 'Upper Moon', 420, 'Unlock the deeper sanctum with Giyu to face Upper Rank Three Akaza!', true, ['giyu'], 'cs_akaza_duel', undefined, { hasUndergroundDungeon: true, rewardXp: 125 }),
  makeLevel(44, 5, 'Final Akaza Battle: Selfless State', 'final_fortress', [
    { archetype: 'akaza_awakened', name: "Akaza's Awakened Form", subtitle: 'Upper Rank Three · Compass Needle', isBoss: true, hpScale: 1.3, damageScale: 1.2 },
  ], 'INSANE', 460, 'Beside Giyu Tomioka, enter the Transparent World & Selfless State to shatter Akaza!', true, ['giyu'], undefined, undefined, { hasUndergroundDungeon: true, rewardXp: 135 }),
  makeLevel(45, 5, 'Doma Chamber: Kanao & Inosuke', 'infinity_castle', [
    { archetype: 'doma_ice_clone', name: "Doma's Cryo Clone", subtitle: 'Lotus Guardian', hpScale: 1.15 },
    { archetype: 'boss_doma', name: 'Doma', subtitle: 'Upper Rank Two (Phase I)', isBoss: true, hpScale: 1.05 },
  ], 'Upper Moon', 440, 'Kanao and Inosuke descend the frozen dungeon toward Upper Rank Two Doma!', true, ['kanao', 'inosuke'], 'cs_doma_duel', undefined, { hasUndergroundDungeon: true, rewardXp: 130 }),
  makeLevel(46, 5, 'Final Doma Battle: Rime Bodhisattva', 'final_fortress', [
    { archetype: 'doma_final', name: "Doma's Final Battle Form", subtitle: 'Upper Rank Two · Rime Bodhisattva', isBoss: true, hpScale: 1.3, damageScale: 1.2 },
  ], 'INSANE', 500, 'With Kanao and Inosuke at your side, shatter Doma’s freezing clones and giant Bodhisattva!', true, ['kanao', 'inosuke'], undefined, undefined, { hasUndergroundDungeon: true, rewardXp: 145 }),
  makeLevel(47, 5, 'Kokushibo: Sanemi & Gyomei', 'infinity_castle', [
    { archetype: 'boss_kokushibo', name: 'Kokushibo', subtitle: 'Upper Rank One (Phase I)', isBoss: true, hpScale: 1.05 },
  ], 'INSANE', 520, 'Unseal the Upper One chamber and clash beside Sanemi and Gyomei against six-eyed Kokushibo!', true, ['sanemi', 'gyomei', 'muichiro'], 'cs_kokushibo_duel', undefined, { hasUndergroundDungeon: true, rewardXp: 150 }),
  makeLevel(48, 5, 'Final Kokushibo: Eclipse of Six Eyes', 'final_fortress', [
    { archetype: 'kokushibo_demon', name: "Kokushibo's Transformation", subtitle: 'Upper Rank One · Calamity', isBoss: true, hpScale: 1.32, damageScale: 1.22 },
  ], 'INSANE', 580, 'Sanemi, Gyomei, and Genya unleash crimson red blades against transformed Kokushibo!', true, ['sanemi', 'gyomei', 'genya'], undefined, undefined, { hasUndergroundDungeon: true, rewardXp: 165 }),
  makeLevel(49, 5, 'Demon King Vessel Assault', 'final_fortress', [
    { archetype: 'boss_muzan', name: 'Muzan · Awakening Cocoon', subtitle: 'Progenitor Aspect', hpScale: 0.85 },
    { archetype: 'demon_king_tanjiro', name: 'Demon King Mirage', subtitle: 'Abyssal Eclipse', hpScale: 0.95, isBoss: true },
  ], 'INSANE', 640, 'Break through the fortress dungeon gate into the Demon King’s outer ward alongside the Hashira.', true, ['giyu', 'obanai', 'mitsuri'], undefined, undefined, { hasUndergroundDungeon: true, rewardXp: 175 }),
  makeLevel(50, 5, 'Final Muzan Battle: Dawn Approaching', 'final_fortress', [
    { archetype: 'muzan_final', name: 'Muzan Kibutsuji · Final Form', subtitle: 'Progenitor of Demons', isBoss: true },
  ], 'INSANE', 950, 'Unite with the Hashira inside the Final Fortress Throne and hold Muzan until the sun rises!', true, ['giyu', 'sanemi', 'gyomei'], 'cs_muzan_finale', 'cs_ending', { hasUndergroundDungeon: true, rewardXp: 240 }),
];

export interface CharacterCampaignSummary {
  characterId: string;
  campaignTitle: string;
  startingLocation: string;
  prologueCutsceneId: string;
  rivalBossName: string;
  canonPartnerText: string;
}

const CHARACTER_CAMPAIGN_INFO: Record<string, CharacterCampaignSummary> = {
  tanjiro: {
    characterId: 'tanjiro',
    campaignTitle: 'Hinokami Chronicles: Path to Sunrise',
    startingLocation: 'Bamboo Forest Outside Mt. Sagiri',
    prologueCutsceneId: 'cs_opening',
    rivalBossName: 'Akaza & Muzan Kibutsuji',
    canonPartnerText: 'Nezuko, Zenitsu, Inosuke & Giyu Tomioka',
  },
  zenitsu: {
    characterId: 'zenitsu',
    campaignTitle: 'Thunderclap Flash: Breaking the Cowardice',
    startingLocation: 'Dark Forest Trail & Spider Ravine',
    prologueCutsceneId: 'cs_zenitsu_opening',
    rivalBossName: 'Kaigaku · Upper Rank Six',
    canonPartnerText: 'Tanjiro, Inosuke & Tengen Uzui',
  },
  inosuke: {
    characterId: 'inosuke',
    campaignTitle: 'Lord of the Mountains: Savage Dual-Fang Path',
    startingLocation: 'Spider Mountain Foothills',
    prologueCutsceneId: 'cs_inosuke_opening',
    rivalBossName: 'Doma · Upper Rank Two',
    canonPartnerText: 'Kanao Tsuyuri, Tanjiro & Zenitsu',
  },
  kanao: {
    characterId: 'kanao',
    campaignTitle: 'Vermilion Eye: Butterfly Inheritance',
    startingLocation: 'Butterfly Estate & Mt. Fujikasane',
    prologueCutsceneId: 'cs_kanao_opening',
    rivalBossName: 'Doma · Upper Rank Two',
    canonPartnerText: 'Inosuke Hashibira & Shinobu Kocho',
  },
  genya: {
    characterId: 'genya',
    campaignTitle: 'Scarred Resolve: Demon-Eater Brotherhood',
    startingLocation: 'Mountain Training Gorge',
    prologueCutsceneId: 'cs_genya_opening',
    rivalBossName: 'Zohakuten & Kokushibo',
    canonPartnerText: 'Sanemi Shinazugawa & Tanjiro Kamado',
  },
  basic_slayer: {
    characterId: 'basic_slayer',
    campaignTitle: 'Corps Vanguard: Steel Beneath the Moon',
    startingLocation: 'Wisteria Gate Mountain Trail',
    prologueCutsceneId: 'cs_opening',
    rivalBossName: 'Rui & Muzan Kibutsuji',
    canonPartnerText: 'Demon Slayer Corps & Hashira Pillars',
  },
  giyu: {
    characterId: 'giyu',
    campaignTitle: 'Water Hashira Chronicle: Dead Calm',
    startingLocation: 'Snowy Mountain Pass',
    prologueCutsceneId: 'cs_giyu_opening',
    rivalBossName: 'Akaza · Upper Rank Three',
    canonPartnerText: 'Tanjiro Kamado & Sanemi Shinazugawa',
  },
  rengoku: {
    characterId: 'rengoku',
    campaignTitle: 'Flame Hashira Chronicle: Set Your Heart Ablaze',
    startingLocation: 'Snowy Rail Pass & Mugen Approach',
    prologueCutsceneId: 'cs_rengoku_opening',
    rivalBossName: 'Enmu & Akaza · Upper Three',
    canonPartnerText: 'Tanjiro, Zenitsu & Inosuke',
  },
  shinobu: {
    characterId: 'shinobu',
    campaignTitle: 'Insect Hashira Chronicle: Wisteria Vengeance',
    startingLocation: 'Spider Mountain Poisoned Canopy',
    prologueCutsceneId: 'cs_shinobu_opening',
    rivalBossName: 'Doma · Upper Rank Two',
    canonPartnerText: 'Kanao Tsuyuri & Giyu Tomioka',
  },
  tengen: {
    characterId: 'tengen',
    campaignTitle: 'Sound Hashira Chronicle: Flamboyant Score',
    startingLocation: 'Yoshiwara Lantern Alleys',
    prologueCutsceneId: 'cs_tengen_opening',
    rivalBossName: 'Gyutaro & Daki · Upper Six',
    canonPartnerText: 'Tanjiro, Zenitsu & Inosuke',
  },
  muichiro: {
    characterId: 'muichiro',
    campaignTitle: 'Mist Hashira Chronicle: Memories Beyond Haze',
    startingLocation: 'Swordsmith Village Hot Spring Trail',
    prologueCutsceneId: 'cs_muichiro_opening',
    rivalBossName: 'Gyokko & Kokushibo',
    canonPartnerText: 'Sanemi, Gyomei & Genya',
  },
  mitsuri: {
    characterId: 'mitsuri',
    campaignTitle: 'Love Hashira Chronicle: Unyielding Ribbon',
    startingLocation: 'Swordsmith Village Bridge',
    prologueCutsceneId: 'cs_mitsuri_opening',
    rivalBossName: 'Zohakuten & Nakime',
    canonPartnerText: 'Obanai Iguro & Tanjiro Kamado',
  },
  obanai: {
    characterId: 'obanai',
    campaignTitle: 'Serpent Hashira Chronicle: Twisting Crimson',
    startingLocation: 'Dark Forest Ruins & Hashira Estate',
    prologueCutsceneId: 'cs_obanai_opening',
    rivalBossName: 'Nakime & Muzan Final Form',
    canonPartnerText: 'Mitsuri Kanroji & Tanjiro Kamado',
  },
  sanemi: {
    characterId: 'sanemi',
    campaignTitle: 'Wind Hashira Chronicle: Tempest of Scars',
    startingLocation: 'Moonlit Bamboo Gorge',
    prologueCutsceneId: 'cs_sanemi_opening',
    rivalBossName: 'Kokushibo · Upper Rank One',
    canonPartnerText: 'Gyomei Himejima & Genya Shinazugawa',
  },
  gyomei: {
    characterId: 'gyomei',
    campaignTitle: 'Stone Hashira Chronicle: Tectonic Prayer',
    startingLocation: 'Abandoned Temple Sanctum',
    prologueCutsceneId: 'cs_gyomei_opening',
    rivalBossName: 'Kokushibo & Muzan Final Form',
    canonPartnerText: 'Sanemi Shinazugawa & Muichiro Tokito',
  },
};

export function getCharacterCampaignInfo(charId: string): CharacterCampaignSummary {
  return CHARACTER_CAMPAIGN_INFO[charId] ?? CHARACTER_CAMPAIGN_INFO.tanjiro;
}

const campaignCache = new Map<string, StoryLevelDef[]>();

/**
 * Generates an independent 50-level campaign tailored specifically to each playable character:
 * distinct Level 1 starting mission/location, character-accurate team allies, canon Upper Moon matchups,
 * and unique narrative briefings.
 */
export function getCampaignForCharacter(charId: string): StoryLevelDef[] {
  if (charId === 'tanjiro') return STORY_LEVELS;
  const cached = campaignCache.get(charId);
  if (cached) return cached;

  const charDef = getCharacterById(charId);
  const firstName = charDef.name.split(' ')[0];

  const customLevels = STORY_LEVELS.map((lvl) => {
    let title = lvl.title;
    let mapId = lvl.mapId;
    let intro = lvl.intro;
    let enemies = lvl.enemies.map((e) => ({ ...e }));
    let allyIds = lvl.allyIds ? [...lvl.allyIds] : undefined;
    let cutsceneId = lvl.cutsceneId;

    // Distinct Level 1 Starting Point & Mission per character!
    if (lvl.id === 1) {
      if (charId === 'zenitsu') {
        title = 'Trembling Steps in the Dark Woods';
        mapId = 'dark_forest';
        enemies = [{ archetype: 'tongue_demon', name: 'Tsuzumi Stalker', subtitle: 'Mansion Prowler' }];
        intro = 'Alone on a midnight mission, Zenitsu must steady his breath and unleash Thunderclap and Flash!';
        cutsceneId = 'cs_zenitsu_opening';
      } else if (charId === 'inosuke') {
        title = 'Mountain Charge: Beast’s First Prey';
        mapId = 'mountain_training';
        enemies = [{ archetype: 'horned_demon', name: 'Horned Brute', subtitle: 'Mountain Challenger' }];
        intro = 'Bursting off the mountain slopes, Inosuke races ahead to prove his serrated fangs against horned demons!';
        cutsceneId = 'cs_inosuke_opening';
      } else if (charId === 'kanao') {
        title = 'Quiet Blade at Fujikasane';
        mapId = 'abandoned_temple';
        enemies = [{ archetype: 'spider_sister_main', name: 'Night Web Prowler', subtitle: 'Silk Ambush' }];
        intro = 'Silent and observant, Kanao tracks demon scent trails through overgrown temple ruins.';
        cutsceneId = 'cs_kanao_opening';
      } else if (charId === 'genya') {
        title = 'Buckshot Baptism on the Gorge';
        mapId = 'mountain_training';
        enemies = [{ archetype: 'swamp_demon', name: 'Gorge Ambush Demon', subtitle: 'Abyssal Lurker' }];
        intro = 'Armed with a sawed-off Nichirin shotgun and unyielding grit, Genya hunts his first nocturnal demon.';
        cutsceneId = 'cs_genya_opening';
      } else if (charId === 'giyu') {
        title = 'Snowy Ridge Patrol';
        mapId = 'snowy_mountain';
        enemies = [{ archetype: 'fast', name: 'Frost Predator', subtitle: 'Mountain Lurker' }];
        intro = 'As Water Hashira, Giyu patrols the freezing mountain pass where tragedy struck the Kamado family.';
        cutsceneId = 'cs_giyu_opening';
      } else if (charId === 'rengoku') {
        title = 'Blazing Track Through the Frost';
        mapId = 'snowy_mountain';
        enemies = [{ archetype: 'slasher', name: 'Phantom Rail Ripper', subtitle: 'Night Ambush' }];
        intro = 'Kyojuro Rengoku ignites the snowy night defending travelers from high-speed demon predators!';
        cutsceneId = 'cs_rengoku_opening';
      } else if (charId === 'shinobu') {
        title = 'Wisteria Sting in Spider Woods';
        mapId = 'spider_mountain';
        enemies = [{ archetype: 'spider_mother_main', name: 'Brood Weaver', subtitle: 'Spider Mountain Scout' }];
        intro = 'Shinobu glides across the webbed forest, testing lethal wisteria toxins against demon nests.';
        cutsceneId = 'cs_shinobu_opening';
      } else if (charId === 'tengen') {
        title = 'Lantern Shadow Investigation';
        mapId = 'entertainment_district';
        enemies = [{ archetype: 'muzan_female', name: 'Yoshiwara Spy', subtitle: 'Obi Servant' }];
        intro = 'Tengen Uzui infiltrates the crimson alleys with flamboyant dual cleavers to expose Upper Moon Six.';
        cutsceneId = 'cs_tengen_opening';
      } else if (charId === 'muichiro') {
        title = 'Misty Trail to the Forge';
        mapId = 'swordsmith_village';
        enemies = [{ archetype: 'karaku', name: 'Misty Forest Ambush', subtitle: 'Demon Infiltrator' }];
        intro = 'Shrouded in haze, young Mist Hashira Muichiro protects the concealed paths toward Swordsmith Village.';
        cutsceneId = 'cs_muichiro_opening';
      } else if (charId === 'mitsuri') {
        title = 'Bridge Guardian of Swordsmith Town';
        mapId = 'swordsmith_village';
        enemies = [{ archetype: 'urogi', name: 'Sky Talons', subtitle: 'Village Raider' }];
        intro = 'Mitsuri leaps across hot-spring bridges with her whip katana to shield innocent artisans.';
        cutsceneId = 'cs_mitsuri_opening';
      } else if (charId === 'obanai') {
        title = 'Coils Beneath the Dead Trees';
        mapId = 'dark_forest';
        enemies = [{ archetype: 'swamp_demon', name: 'Serpent Quarry', subtitle: 'Tunneling Demon' }];
        intro = 'Obanai tracks elusive blood scents across twisted woodland hollows with Serpent Breathing.';
        cutsceneId = 'cs_obanai_opening';
      } else if (charId === 'sanemi') {
        title = 'Tempest Hunter in Bamboo Night';
        mapId = 'bamboo_forest';
        enemies = [{ archetype: 'horned_demon', name: 'Crimson Horned Demon', subtitle: 'Night Marauder' }];
        intro = 'Wind Hashira Sanemi cuts a furious swath through forest marauders before tracking Upper Moon One.';
        cutsceneId = 'cs_sanemi_opening';
      } else if (charId === 'gyomei') {
        title = 'Iron Chains at the Sanctuary';
        mapId = 'abandoned_temple';
        enemies = [{ archetype: 'strong', name: 'Temple Ravager', subtitle: 'Brute Demon' }];
        intro = 'Stone Hashira Gyomei stands before ancient shrines, swinging his chained flail against towering fiends.';
        cutsceneId = 'cs_gyomei_opening';
      }
    }

    // Canon Team Pairings dynamically anchored around who the player controls!
    if (lvl.id === 14 && charId !== 'tanjiro') {
      allyIds = ['tanjiro', 'nezuko_ally'];
      intro = `${firstName} reinforces Tanjiro and Nezuko on Mt. Natagumo as Rui unleashes razor-sharp blood threads!`;
    } else if (lvl.id === 20) {
      const districtSquad = ['tanjiro', 'zenitsu', 'inosuke', 'tengen'].filter((id) => id !== charId);
      allyIds = districtSquad.slice(0, 3);
      intro = `${firstName} fights side-by-side with ${allyIds.map((id) => getCharacterById(id).name.split(' ')[0]).join(', ')} against both Gyutaro and Daki!`;
    } else if (lvl.id === 41 && charId === 'zenitsu') {
      title = 'Zenitsu vs Kaigaku: Seventh Form Awakening';
      allyIds = undefined;
      intro = 'Face your former senior disciple alone inside the shifting foyer—unleash Flaming Thunder God!';
    } else if (lvl.id === 42) {
      allyIds = charId === 'obanai' ? ['mitsuri'] : charId === 'mitsuri' ? ['obanai'] : ['obanai', 'mitsuri'];
    } else if (lvl.id === 43 || lvl.id === 44) {
      // Canon Tanjiro + Giyu vs Akaza
      allyIds = charId === 'giyu' ? ['tanjiro'] : charId === 'tanjiro' ? ['giyu'] : ['tanjiro', 'giyu'];
      title = lvl.id === 43 ? 'Akaza Clash: Tanjiro & Giyu' : 'Final Akaza: Selfless State';
      intro = `Alongside ${allyIds.map((id) => getCharacterById(id).name.split(' ')[0]).join(' and ')}, confront Upper Rank Three Akaza’s Destructive Death martial arts!`;
    } else if (lvl.id === 45 || lvl.id === 46) {
      // Canon Kanao + Inosuke vs Doma
      allyIds = charId === 'kanao' ? ['inosuke'] : charId === 'inosuke' ? ['kanao'] : ['kanao', 'inosuke'];
      title = lvl.id === 45 ? 'Doma Frost Hall: Kanao & Inosuke' : 'Final Doma: Ice Lotus & Bodhisattva';
      intro = `Fight with ${allyIds.map((id) => getCharacterById(id).name.split(' ')[0]).join(' and ')} to shatter Doma’s Cryo Clones and Rime Bodhisattva!`;
    } else if (lvl.id === 47 || lvl.id === 48) {
      // Canon Sanemi + Gyomei (+ Muichiro / Genya) vs Kokushibo
      const kokuSquad = ['sanemi', 'gyomei', 'muichiro', 'genya'].filter((id) => id !== charId);
      allyIds = kokuSquad.slice(0, 3);
      title = lvl.id === 47 ? 'Kokushibo Duel: Sanemi & Gyomei' : 'Final Kokushibo: Red Blade Pinnacle';
      intro = `Unite with ${allyIds.map((id) => getCharacterById(id).name.split(' ')[0]).join(', ')} against six-eyed Upper Rank One Kokushibo!`;
    } else if (lvl.id === 50) {
      const finalePool = ['tanjiro', 'giyu', 'sanemi', 'gyomei', 'obanai'].filter((id) => id !== charId);
      allyIds = finalePool.slice(0, 3);
    }

    return {
      ...lvl,
      title,
      mapId,
      intro,
      enemies,
      allyIds,
      allyHashiraIds: allyIds,
      cutsceneId,
    };
  });

  campaignCache.set(charId, customLevels);
  return customLevels;
}

export function getLevelById(id: number, charId = 'tanjiro'): StoryLevelDef {
  const list = getCampaignForCharacter(charId);
  return list.find((l) => l.id === id) ?? list[0];
}

export function getRouteLevelBriefing(
  level: StoryLevelDef,
  routeId: StoryRouteId,
  charId?: string
): { routeLabel: string; routeIntro: string; routeObjective: string } {
  const info = charId ? getCharacterCampaignInfo(charId) : null;
  if (info) {
    return {
      routeLabel: info.campaignTitle,
      routeObjective: level.objectiveText,
      routeIntro: level.intro,
    };
  }
  if (routeId === 'zenitsu') {
    return {
      routeLabel: 'Zenitsu · Lightning Path',
      routeObjective: level.objectiveText,
      routeIntro: level.intro,
    };
  }
  return {
    routeLabel: 'Tanjiro · Sun & Water Path',
    routeObjective: level.objectiveText,
    routeIntro: level.intro,
  };
}

// Animated Cinematic Cutscene Catalog (automatic within campaigns)
export const CUTSCENES: Record<string, CutsceneDef> = {
  cs_opening: {
    id: 'cs_opening',
    title: 'Prologue: Night of the Crimson Blade',
    mapId: 'bamboo_forest',
    beats: [
      {
        duration: 2.8,
        cameraX: 640,
        cameraZoom: 1.06,
        lightingMood: 'moonlit',
        subtitle: 'Under the towering bamboo forest, Total Concentration awakens.',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 740, facing: 1, action: 'walk', emotion: 'determined', bubbleText: 'One more step before dawn—keep breathing!' },
          { id: 'ally1', role: 'ally', characterId: 'zenitsu', name: 'Zenitsu', x: 960, facing: -1, action: 'idle', emotion: 'fear', bubbleText: 'These woods stretch on forever!' },
        ],
      },
      {
        duration: 2.8,
        cameraX: 800,
        cameraZoom: 1.2,
        lightingMood: 'mist',
        fxKind: 'breathing',
        fxColor: '#38bdf8',
        subtitle: 'Nichirin steel hums beneath the silver moonlight.',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 860, facing: 1, action: 'breathing', emotion: 'fierce', bubbleText: 'Total Concentration — Draw!' },
          { id: 'ally1', role: 'hashira', characterId: 'giyu', name: 'Giyu', x: 1080, facing: -1, action: 'block', emotion: 'calm', bubbleText: 'Follow your breath across the valley.' },
        ],
      },
    ],
  },
  cs_tutorial_boulder: {
    id: 'cs_tutorial_boulder',
    title: 'Trial of the Giant Boulder',
    mapId: 'mountain_training',
    beats: [
      {
        duration: 2.4,
        cameraX: 680,
        cameraZoom: 1.08,
        lightingMood: 'mist',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 840, facing: 1, action: 'run', emotion: 'determined', bubbleText: 'I must sever this boulder!' },
          { id: 'mentor', role: 'mentor', characterId: 'giyu', name: 'Sabito', x: 1090, facing: -1, action: 'idle', emotion: 'calm', bubbleText: 'Strike cleanly—no hesitation!' },
        ],
      },
      {
        duration: 2.6,
        cameraX: 820,
        cameraZoom: 1.24,
        shake: 12,
        lightingMood: 'dawn',
        fxKind: 'boulder_split',
        fxColor: '#38bdf8',
        subtitle: 'A single true Breathing cleave splits solid stone.',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 980, facing: 1, action: 'heavy', emotion: 'fierce', bubbleText: 'CLEAVE!' },
          { id: 'mentor', role: 'mentor', characterId: 'giyu', name: 'Sabito', x: 1120, facing: -1, action: 'idle', emotion: 'calm', bubbleText: 'Well struck. Final Selection awaits.' },
        ],
      },
    ],
  },
  cs_first_demon: {
    id: 'cs_first_demon',
    title: 'First Demon Encounter',
    mapId: 'bamboo_forest',
    beats: [
      {
        duration: 2.5,
        cameraX: 680,
        cameraZoom: 1.06,
        lightingMood: 'moonlit',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 760, facing: 1, action: 'walk', emotion: 'determined' },
          { id: 'enemy', role: 'demon', demonArchetype: 'temple_demon', name: 'Temple Demon', x: 1140, facing: -1, action: 'run', emotion: 'rage', bubbleText: 'Fresh meat in a Corps coat!' },
        ],
      },
      {
        duration: 2.6,
        cameraX: 820,
        cameraZoom: 1.2,
        shake: 8,
        lightingMood: 'moonlit',
        fxKind: 'clash',
        fxColor: '#f43f5e',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 920, facing: 1, action: 'slash', emotion: 'fierce', bubbleText: 'Stay back! Ready the blade!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'temple_demon', name: 'Temple Demon', x: 1020, facing: -1, action: 'bda', emotion: 'rage', bubbleText: 'GRAAAH!' },
        ],
      },
    ],
  },
  cs_hand_demon: {
    id: 'cs_hand_demon',
    title: 'Final Selection Terror',
    mapId: 'dark_forest',
    beats: [
      {
        duration: 2.6,
        cameraX: 740,
        cameraZoom: 1.06,
        shake: 10,
        lightingMood: 'crimson',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 780, facing: 1, action: 'block', emotion: 'shock', bubbleText: 'That towering shape... Urokodaki’s warning!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'boss_hand', name: 'Hand Demon', x: 1120, facing: -1, action: 'heavy', emotion: 'rage', bubbleText: 'Another fox mask?! Come die!' },
        ],
      },
      {
        duration: 2.4,
        cameraX: 820,
        cameraZoom: 1.22,
        lightingMood: 'crimson',
        fxKind: 'breathing',
        fxColor: '#38bdf8',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 860, facing: 1, action: 'breathing', emotion: 'fierce', bubbleText: 'For Sabito and Makomo—I strike!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'boss_hand', name: 'Hand Demon', x: 1090, facing: -1, action: 'bda', emotion: 'rage' },
        ],
      },
    ],
  },
  cs_spider_mountain: {
    id: 'cs_spider_mountain',
    title: 'Mt. Natagumo Silk Trap',
    mapId: 'spider_mountain',
    beats: [
      {
        duration: 2.5,
        cameraX: 740,
        cameraZoom: 1.08,
        lightingMood: 'moonlit',
        fxKind: 'bda',
        fxColor: '#f43f5e',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 760, facing: 1, action: 'dodge', emotion: 'shock', bubbleText: 'The forest is laced with razor threads!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'boss_rui', name: 'Rui · Lower Five', x: 1120, facing: -1, action: 'bda', emotion: 'calm', bubbleText: 'Do not disturb my family.' },
        ],
      },
      {
        duration: 2.5,
        cameraX: 860,
        cameraZoom: 1.2,
        shake: 10,
        lightingMood: 'crimson',
        fxKind: 'breathing',
        fxColor: '#f97316',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 920, facing: 1, action: 'breathing', emotion: 'fierce', bubbleText: 'Cut the web apart!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'boss_rui', name: 'Rui · Lower Five', x: 1080, facing: -1, action: 'block', emotion: 'rage' },
        ],
      },
    ],
  },
  cs_upper_moon_six: {
    id: 'cs_upper_moon_six',
    title: 'Flames of Yoshiwara',
    mapId: 'entertainment_district',
    beats: [
      {
        duration: 2.6,
        cameraX: 760,
        cameraZoom: 1.08,
        lightingMood: 'crimson',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 720, facing: 1, action: 'run', emotion: 'determined' },
          { id: 'uzui', role: 'hashira', characterId: 'tengen', name: 'Tengen Uzui', x: 870, facing: 1, action: 'slash', emotion: 'fierce', bubbleText: 'Watch his poisoned blood sickles!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'gyutaro', name: 'Gyutaro · Upper Six', x: 1140, facing: -1, action: 'bda', emotion: 'rage', bubbleText: 'Heh... Come dance in the flames!' },
        ],
      },
      {
        duration: 2.4,
        cameraX: 900,
        cameraZoom: 1.22,
        shake: 12,
        lightingMood: 'crimson',
        fxKind: 'clash',
        fxColor: '#fbbf24',
        actors: [
          { id: 'uzui', role: 'hashira', characterId: 'tengen', name: 'Tengen Uzui', x: 970, facing: 1, action: 'heavy', emotion: 'fierce', bubbleText: 'Let’s make this flamboyant!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'gyutaro', name: 'Gyutaro · Upper Six', x: 1090, facing: -1, action: 'slash', emotion: 'rage' },
          { id: 'daki', role: 'demon', demonArchetype: 'daki_awakened', name: 'Daki · Upper Six', x: 1190, facing: -1, action: 'bda', emotion: 'rage' },
        ],
      },
    ],
  },
  cs_swordsmith: {
    id: 'cs_swordsmith',
    title: 'Ambush on Swordsmith Village',
    mapId: 'swordsmith_village',
    beats: [
      {
        duration: 2.6,
        cameraX: 760,
        cameraZoom: 1.08,
        lightingMood: 'crimson',
        fxKind: 'bda',
        fxColor: '#facc15',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 780, facing: 1, action: 'block', emotion: 'shock', bubbleText: 'Demons inside the hidden forge!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'sekido', name: 'Sekido', x: 1120, facing: -1, action: 'bda', emotion: 'rage', bubbleText: 'Die beneath crimson lightning!' },
        ],
      },
      {
        duration: 2.3,
        cameraX: 860,
        cameraZoom: 1.2,
        lightingMood: 'storm',
        fxKind: 'breathing',
        fxColor: '#f43f5e',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 910, facing: 1, action: 'breathing', emotion: 'fierce', bubbleText: 'Protect the swordsmiths!' },
          { id: 'enemy2', role: 'demon', demonArchetype: 'gyokko', name: 'Gyokko', x: 1150, facing: -1, action: 'idle', emotion: 'calm', bubbleText: 'Witness my glorious porcelain art!' },
        ],
      },
    ],
  },
  cs_hashira_meeting: {
    id: 'cs_hashira_meeting',
    title: 'The Hashira Assembly',
    mapId: 'hashira_grounds',
    beats: [
      {
        duration: 2.8,
        cameraX: 780,
        cameraZoom: 1.04,
        lightingMood: 'dawn',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 740, facing: 1, action: 'idle', emotion: 'determined' },
          { id: 'giyu', role: 'hashira', characterId: 'giyu', name: 'Giyu', x: 960, facing: -1, action: 'idle', emotion: 'calm', bubbleText: 'Every Pillar sharpens their blade.' },
          { id: 'sanemi', role: 'hashira', characterId: 'sanemi', name: 'Sanemi', x: 1120, facing: -1, action: 'breathing', emotion: 'fierce', bubbleText: 'Show us if you can survive Hashira training!' },
        ],
      },
    ],
  },
  cs_infinity_castle: {
    id: 'cs_infinity_castle',
    title: 'Descent Into the Infinity Castle',
    mapId: 'infinity_castle',
    beats: [
      {
        duration: 2.8,
        cameraX: 760,
        cameraZoom: 1.05,
        shake: 10,
        lightingMood: 'castle_gold',
        fxKind: 'bda',
        fxColor: '#fbbf24',
        subtitle: 'A single Biwa chord drops the Demon Slayer Corps into Muzan’s shifting abyss.',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 760, facing: 1, action: 'jump', emotion: 'shock', bubbleText: 'The floor vanished—it’s the Infinity Castle!' },
          { id: 'nakime', role: 'demon', demonArchetype: 'boss_nakime', name: 'Nakime', x: 1140, facing: -1, action: 'bda', emotion: 'calm', bubbleText: 'Welcome to the Demon King’s domain.' },
        ],
      },
      {
        duration: 2.6,
        cameraX: 880,
        cameraZoom: 1.22,
        lightingMood: 'crimson',
        fxKind: 'transform',
        fxColor: '#f43f5e',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 840, facing: 1, action: 'slash', emotion: 'fierce', bubbleText: 'Muzan Kibutsuji!!' },
          { id: 'muzan', role: 'demon', demonArchetype: 'boss_muzan', name: 'Muzan Kibutsuji', x: 1120, facing: -1, action: 'transform', emotion: 'rage', bubbleText: 'None of you leave here alive.' },
        ],
      },
    ],
  },
  cs_akaza_duel: {
    id: 'cs_akaza_duel',
    title: 'Compass Needle Awakens: Tanjiro & Giyu vs Akaza',
    mapId: 'infinity_castle',
    beats: [
      {
        duration: 2.5,
        cameraX: 780,
        cameraZoom: 1.12,
        lightingMood: 'castle_gold',
        fxKind: 'bda',
        fxColor: '#38bdf8',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 750, facing: 1, action: 'block', emotion: 'fierce', bubbleText: 'Akaza! We won’t let you pass!' },
          { id: 'giyu', role: 'hashira', characterId: 'giyu', name: 'Giyu', x: 870, facing: 1, action: 'breathing', emotion: 'calm', bubbleText: 'Eleventh Form: Dead Calm.' },
          { id: 'akaza', role: 'demon', demonArchetype: 'boss_akaza', name: 'Akaza', x: 1130, facing: -1, action: 'bda', emotion: 'fierce', bubbleText: 'Technique Deployment: Compass Needle!' },
        ],
      },
      {
        duration: 2.3,
        cameraX: 890,
        cameraZoom: 1.24,
        shake: 12,
        lightingMood: 'crimson',
        fxKind: 'clash',
        fxColor: '#38bdf8',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 920, facing: 1, action: 'slash', emotion: 'fierce', bubbleText: 'Together, Tomioka-san!' },
          { id: 'akaza', role: 'demon', demonArchetype: 'boss_akaza', name: 'Akaza', x: 1050, facing: -1, action: 'heavy', emotion: 'fierce' },
        ],
      },
    ],
  },
  cs_doma_duel: {
    id: 'cs_doma_duel',
    title: 'Lotus Chamber of Frost: Kanao & Inosuke vs Doma',
    mapId: 'infinity_castle',
    beats: [
      {
        duration: 2.8,
        cameraX: 800,
        cameraZoom: 1.12,
        lightingMood: 'mist',
        fxKind: 'bda',
        fxColor: '#7dd3fc',
        actors: [
          { id: 'kanao_a', role: 'slayer', characterId: 'kanao', name: 'Kanao', x: 750, facing: 1, action: 'run', emotion: 'fierce', bubbleText: 'Do not breathe the frost dust!' },
          { id: 'inosuke_a', role: 'ally', characterId: 'inosuke', name: 'Inosuke', x: 875, facing: 1, action: 'slash', emotion: 'rage', bubbleText: 'Step aside! I’ll shred his golden fans!' },
          { id: 'doma', role: 'demon', demonArchetype: 'boss_doma', name: 'Doma · Upper Two', x: 1140, facing: -1, action: 'bda', emotion: 'calm', bubbleText: 'Care to dance amidst freezing lotuses?' },
        ],
      },
    ],
  },
  cs_kokushibo_duel: {
    id: 'cs_kokushibo_duel',
    title: 'Eclipse of Six Eyes: Sanemi & Gyomei vs Kokushibo',
    mapId: 'infinity_castle',
    beats: [
      {
        duration: 2.8,
        cameraX: 820,
        cameraZoom: 1.15,
        shake: 10,
        lightingMood: 'castle_gold',
        fxKind: 'clash',
        fxColor: '#c084fc',
        actors: [
          { id: 'gyomei_a', role: 'hashira', characterId: 'gyomei', name: 'Gyomei', x: 750, facing: 1, action: 'heavy', emotion: 'fierce', bubbleText: 'Stay together—his Moon Breathing reaches everywhere!' },
          { id: 'sanemi_a', role: 'hashira', characterId: 'sanemi', name: 'Sanemi', x: 880, facing: 1, action: 'breathing', emotion: 'rage', bubbleText: 'Upper Moon One—taste Wind Breathing!' },
          { id: 'koku', role: 'demon', demonArchetype: 'boss_kokushibo', name: 'Kokushibo · Upper One', x: 1150, facing: -1, action: 'slash', emotion: 'calm', bubbleText: 'Show me the pinnacle of this era.' },
        ],
      },
    ],
  },
  cs_muzan_finale: {
    id: 'cs_muzan_finale',
    title: 'The Final Stand Before Dawn',
    mapId: 'infinity_castle',
    beats: [
      {
        duration: 2.7,
        cameraX: 800,
        cameraZoom: 1.08,
        shake: 12,
        lightingMood: 'crimson',
        fxKind: 'transform',
        fxColor: '#f43f5e',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 740, facing: 1, action: 'breathing', emotion: 'fierce', bubbleText: 'Muzan ends tonight!' },
          { id: 'giyu', role: 'hashira', characterId: 'giyu', name: 'Giyu', x: 860, facing: 1, action: 'slash', emotion: 'determined', bubbleText: 'Hold the line until sunrise!' },
          { id: 'muzan', role: 'demon', demonArchetype: 'muzan_final', name: 'Muzan · Final Form', x: 1150, facing: -1, action: 'transform', emotion: 'rage', bubbleText: 'Come and perish, Demon Slayers!' },
        ],
      },
      {
        duration: 2.6,
        cameraX: 900,
        cameraZoom: 1.24,
        shake: 16,
        lightingMood: 'crimson',
        fxKind: 'clash',
        fxColor: '#f43f5e',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 920, facing: 1, action: 'heavy', emotion: 'fierce', bubbleText: 'HINOKAMI KAGURA!' },
          { id: 'muzan', role: 'demon', demonArchetype: 'muzan_final', name: 'Muzan · Final Form', x: 1080, facing: -1, action: 'bda', emotion: 'rage' },
        ],
      },
    ],
  },
  cs_ending: {
    id: 'cs_ending',
    title: 'Sunrise Over the Corps',
    mapId: 'bamboo_forest',
    beats: [
      {
        duration: 3.2,
        cameraX: 780,
        cameraZoom: 1.05,
        lightingMood: 'dawn',
        fxKind: 'sunrise',
        fxColor: '#fde047',
        subtitle: 'As golden morning rays pierce the sky, the Demon King turns to ash.',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 860, facing: 1, action: 'idle', emotion: 'calm', bubbleText: 'The sun... We survived till dawn!' },
          { id: 'giyu', role: 'hashira', characterId: 'giyu', name: 'Giyu', x: 1050, facing: -1, action: 'idle', emotion: 'calm', bubbleText: 'Rest well, Demon Slayer Corps.' },
        ],
      },
    ],
  },
};

// Build tailored opening cutscenes per character dynamically when needed
function makeCharacterOpeningCutscene(characterId: string): CutsceneDef {
  const info = getCharacterCampaignInfo(characterId);
  const charDef = getCharacterById(characterId);
  const firstName = charDef.name.split(' ')[0];
  const mapMap: Record<string, MapId> = {
    zenitsu: 'dark_forest',
    inosuke: 'mountain_training',
    kanao: 'abandoned_temple',
    genya: 'mountain_training',
    giyu: 'snowy_mountain',
    rengoku: 'snowy_mountain',
    shinobu: 'spider_mountain',
    tengen: 'entertainment_district',
    muichiro: 'swordsmith_village',
    mitsuri: 'swordsmith_village',
    obanai: 'dark_forest',
    sanemi: 'bamboo_forest',
    gyomei: 'abandoned_temple',
  };
  const mapId = mapMap[characterId] ?? 'bamboo_forest';

  const lineMap: Record<string, string> = {
    zenitsu: 'Even if my knees shake... one Lightning strike is enough!',
    inosuke: 'Outta my way! Lord Inosuke is hunting tonight!',
    kanao: 'Shinobu-sama taught me to see every strike clearly.',
    genya: 'I will grow strong enough for my brother to acknowledge me!',
    giyu: 'Stay alert. Scent of demons lingers across this mountain pass.',
    rengoku: 'Set your heart ablaze! No innocent soul falls on my watch!',
    shinobu: 'Let us test a gentle dose of wisteria poison tonight.',
    tengen: 'Time to tear this alley wide open in flamboyant style!',
    muichiro: 'Where did that mist come from...? Ready my blade.',
    mitsuri: 'Stay safe behind me—every Demon Slayer must protect the village!',
    obanai: 'Sinuous precision leaves no demon an escape route.',
    sanemi: 'Let every filthy demon step out under the moonlight and bleed!',
    gyomei: 'Namu Amida Butsu... May my iron chains grant swift deliverance.',
  };

  return {
    id: info.prologueCutsceneId,
    title: info.campaignTitle,
    mapId,
    beats: [
      {
        duration: 2.6,
        cameraX: 700,
        cameraZoom: 1.08,
        lightingMood: 'moonlit',
        subtitle: `${info.campaignTitle} — ${info.startingLocation}`,
        actors: [
          {
            id: 'hero',
            role: 'slayer',
            characterId: charDef.id,
            name: firstName,
            x: 820,
            facing: 1,
            action: 'breathing',
            emotion: 'determined',
            bubbleText: lineMap[characterId] ?? 'Total Concentration Breathing — Begin!',
          },
        ],
      },
    ],
  };
}

export function buildCutsceneForPlayer(
  cutsceneId: string,
  characterId: string,
  _breathing: BreathingStyleId
): CutsceneDef {
  const customOpening =
    cutsceneId.endsWith('_opening') && !CUTSCENES[cutsceneId]
      ? makeCharacterOpeningCutscene(characterId)
      : null;

  const base = customOpening ?? CUTSCENES[cutsceneId] ?? CUTSCENES.cs_opening;
  const charDef = getCharacterById(characterId);
  const firstName = charDef.name.split(' ')[0];

  return {
    ...base,
    beats: base.beats.map((beat) => ({
      ...beat,
      actors: beat.actors.map((actor) => {
        if (actor.id !== 'hero') return actor;
        let bubble = actor.bubbleText;
        if (cutsceneId === 'cs_ending') {
          if (characterId === 'zenitsu') {
            bubble = 'I actually survived Muzan?! The night is finally over!';
          } else if (characterId === 'inosuke') {
            bubble = 'King of the Mountains stands undefeated at dawn!';
          } else if (characterId === 'kanao') {
            bubble = 'Everyone’s sacrifice brought this quiet sunrise.';
          } else if (characterId === 'genya') {
            bubble = 'Brother... we tore down the fortress together!';
          } else if (characterId === 'sanemi') {
            bubble = 'We finally dragged Muzan into the sun... rest in peace, everyone.';
          } else if (charDef.isHashira) {
            bubble = 'Peace returns to every village under the morning sun.';
          }
        }
        return {
          ...actor,
          characterId: charDef.id,
          name: firstName,
          bubbleText: bubble,
        };
      }),
    })),
  };
}
