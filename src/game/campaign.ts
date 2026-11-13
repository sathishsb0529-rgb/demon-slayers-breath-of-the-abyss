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
};

const CHAPTER_TITLES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Chapter 1: Training & Beginning',
  2: 'Chapter 2: Demon Hunting',
  3: 'Chapter 3: Hashira & Upper Moons',
  4: 'Chapter 4: The Final Preparation',
  5: 'Chapter 5: Infinity Castle',
};

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
  allyHashiraIds?: string[],
  cutsceneId?: string
): StoryLevelDef {
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
    rewardCoins,
    difficulty,
    isBossLevel,
    allyHashiraIds,
    cutsceneId,
  };
}

export const STORY_LEVELS: StoryLevelDef[] = [
  // CHAPTER 1: TRAINING AND BEGINNING (1 - 10)
  makeLevel(1, 1, 'First Night Beneath Bamboo', 'bamboo_forest', [
    { archetype: 'temple_demon', name: 'Temple Demon', subtitle: 'Feral Night Prowler' },
  ], 'Normal', 45, 'Your first patrol outside Mt. Sagiri. A predatory demon stalks the bamboo grove.', false, undefined, 'cs_first_demon'),
  makeLevel(2, 1, 'Echoes on the Trail', 'mountain_training', [
    { archetype: 'basic', name: 'Ridge Stalker', subtitle: 'Lesser Demon', hpScale: 1.05 },
    { archetype: 'chachamaru', name: 'Feline Demon Mirage', subtitle: 'Agile Prowler', hpScale: 0.9 },
  ], 'Normal', 55, 'Swift demons ambush the mountain pass under thick dawn mist.'),
  makeLevel(3, 1, 'Blizzard at Dawn', 'snowy_mountain', [
    { archetype: 'fast', name: 'Frost Claw', subtitle: 'Swift Demon' },
    { archetype: 'horned_demon', name: 'Horned Demon', subtitle: 'Heavy Charger', hpScale: 0.9 },
  ], 'Normal', 65, 'Freezing winds sweep the ridge. Watch for heavy horned charges.'),
  makeLevel(4, 1, 'Wisteria Gate Trial', 'mountain_training', [
    { archetype: 'tongue_demon', name: 'Tongue Demon', subtitle: 'Caged Lasher' },
    { archetype: 'regenerating', name: 'Moss Fiend', subtitle: 'Regenerating Demon' },
  ], 'Normal', 75, 'Final Selection begins. Overcome demons capable of closing shallow wounds.'),
  makeLevel(5, 1, 'The Hand Demon of Mt. Fujikasane', 'dark_forest', [
    { archetype: 'boss_hand', name: 'Hand Demon', subtitle: 'Final Selection Terror', isBoss: true },
  ], 'Hard', 120, 'A grotesque giant demon who hunted dozens of apprentices awaits in the dark clearing.', true, undefined, 'cs_hand_demon'),
  makeLevel(6, 1, 'Shadows of the Swamp', 'japanese_village', [
    { archetype: 'muzan_child', name: 'Shadow Infiltrator', subtitle: 'Muzan Scout' },
    { archetype: 'swamp_demon', name: 'Swamp Demon', subtitle: 'Abyssal Ambusher' },
  ], 'Normal', 80, 'Villagers vanish after sunset. Intercept the Swamp Demon hiding below the lanterns.'),
  makeLevel(7, 1, 'Crimson Blood Awakening', 'dark_forest', [
    { archetype: 'nezuko_base', name: 'Nezuko · Blood Trial', subtitle: 'Kamado Instincts' },
  ], 'Normal', 85, 'Spar and restrain a demon surging with Exploding Blood energy.'),
  makeLevel(8, 1, 'Temari & Arrow Ambush', 'japanese_village', [
    { archetype: 'yahaba', name: 'Yahaba · Arrow Demon', subtitle: 'Asakusa Assassin' },
    { archetype: 'susamaru', name: 'Susamaru · Temari Demon', subtitle: 'Asakusa Assassin' },
  ], 'Hard', 95, 'Deflect bouncing Temari spheres and vector arrows inside the courtyard.'),
  makeLevel(9, 1, 'Asakusa Physician & Progenitor', 'japanese_village', [
    { archetype: 'yushiro', name: 'Yushiro · Talisman Test', subtitle: 'Blindfold Talisman', hpScale: 0.85 },
    { archetype: 'muzan_adult', name: 'Muzan · Disguise Mirage', subtitle: 'Tsukihiko Illusion', hpScale: 0.55 },
  ], 'Hard', 105, 'Tamayo and Yushiro test your resolve before Muzan’s oppressive aura strikes.'),
  makeLevel(10, 1, 'Kyogai · Tsuzumi Mansion', 'abandoned_temple', [
    { archetype: 'strong', name: 'Stone Arm Brute', subtitle: 'Guardian Demon', hpScale: 1.15 },
    { archetype: 'kyogai', name: 'Kyogai · Drum Demon', subtitle: 'Former Lower Six', isBoss: true },
  ], 'Hard', 150, 'The shifting temple echoes with Kyogai’s rapid drum slash waves.', true),

  // CHAPTER 2: DEMON HUNTING (11 - 20)
  makeLevel(11, 2, 'Threads of the Spider Mother', 'spider_mountain', [
    { archetype: 'spider_mother_main', name: 'Mother Spider Demon', subtitle: 'Mt. Natagumo', hpScale: 1.05 },
    { archetype: 'spider_sister_main', name: 'Sister Spider Demon', subtitle: 'Mt. Natagumo', hpScale: 1.05 },
  ], 'Hard', 115, 'Silver puppet threads bind lost slayers between ancient pines.', false, undefined, 'cs_spider_mountain'),
  makeLevel(12, 2, 'The Venomous Brood', 'spider_mountain', [
    { archetype: 'spider_brother_main', name: 'Brother Spider Demon', subtitle: 'Venom Spinner', hpScale: 1.1 },
  ], 'Hard', 120, 'Avoid corrosive spider venom while leaping over woodland barricades.'),
  makeLevel(13, 2, 'The Carapace Father', 'spider_mountain', [
    { archetype: 'spider_father_main', name: 'Father Spider Demon', subtitle: 'Armored Titan', hpScale: 1.15 },
  ], 'Hard', 130, 'Shatter the colossal spider brute guarding the mountain heart.'),
  makeLevel(14, 2, 'Lower Moon Five: Rui', 'spider_mountain', [
    { archetype: 'boss_rui', name: 'Rui', subtitle: 'Lower Rank Five', isBoss: true },
  ], 'Hard', 200, 'Face the ruthless Lower Moon Five amidst razor-sharp crimson threads.', true),
  makeLevel(15, 2, 'Lower Ranks: Kamanue & Mukago', 'snowy_mountain', [
    { archetype: 'kamanue', name: 'Kamanue · Lower Six', subtitle: 'Twelve Kizuki' },
    { archetype: 'mukago', name: 'Mukago · Lower Four', subtitle: 'Twelve Kizuki' },
  ], 'Hard', 135, 'Two fugitive Lower Ranks ambush the snowbound mountain pass.'),
  makeLevel(16, 2, 'Lower Moon One: Enmu & Slasher', 'snowy_mountain', [
    { archetype: 'slasher', name: 'Slasher', subtitle: 'Mugen Express Phantom' },
    { archetype: 'boss_enmu', name: 'Enmu', subtitle: 'Lower Rank One', isBoss: true },
  ], 'Hard', 220, 'Cut down Slasher and shatter Enmu’s nightmare Blood Demon Art.', true),
  makeLevel(17, 2, 'Lower Two & Three Purge', 'bamboo_forest', [
    { archetype: 'wakuraba', name: 'Wakuraba · Lower Three', subtitle: 'Velocity Blitz' },
    { archetype: 'rokuro', name: 'Rokuro · Lower Two', subtitle: 'Crimson Maul' },
  ], 'Hard', 145, 'Two powered-up Lower Ranks hunt lone slayers under the full moon.'),
  makeLevel(18, 2, 'Neon Lanterns of Yoshiwara', 'entertainment_district', [
    { archetype: 'muzan_female', name: 'Crimson Mistress Shade', subtitle: 'Upper Disguise', hpScale: 0.72 },
    { archetype: 'boss_daki', name: 'Daki · Sash Form', subtitle: 'Upper Rank Six', hpScale: 0.78 },
  ], 'Hard', 160, 'Investigate the glowing rooftops of the Entertainment District.'),
  makeLevel(19, 2, 'Awakened Obi Storm', 'entertainment_district', [
    { archetype: 'daki_awakened', name: "Daki's Awakened Form", subtitle: 'Third-Eye Upper Six', hpScale: 1.0 },
  ], 'Hashira', 175, 'Daki awakens her third eye—dodge sweeping silk ribbons across the balconies!'),
  makeLevel(20, 2, 'Upper Moon Six: Gyutaro & Daki', 'entertainment_district', [
    { archetype: 'daki_awakened', name: "Daki's Awakened Form", subtitle: 'Upper Rank Six', hpScale: 0.85 },
    { archetype: 'gyutaro', name: 'Gyutaro · Upper Rank Six', subtitle: 'Poison Blood Sickles', isBoss: true },
  ], 'Hashira', 285, 'Survive Gyutaro’s poisoned blood sickles amid blazing Entertainment District rooftops!', true, undefined, 'cs_upper_moon_six'),

  // CHAPTER 3: HASHIRA AND UPPER MOONS (21 - 30)
  makeLevel(21, 3, 'Hantengu’s Emotion Split', 'dark_forest', [
    { archetype: 'sekido', name: 'Sekido · Anger', subtitle: 'Hantengu Clone' },
    { archetype: 'karaku', name: 'Karaku · Pleasure', subtitle: 'Hantengu Clone' },
  ], 'Hashira', 175, 'Guard the forest trail against Sekido’s lightning and Karaku’s gales.', false, undefined, 'cs_swordsmith'),
  makeLevel(22, 3, 'Sorrow & Joy of Upper Four', 'swordsmith_village', [
    { archetype: 'aizetsu', name: 'Aizetsu · Sorrow', subtitle: 'Hantengu Clone' },
    { archetype: 'urogi', name: 'Urogi · Joy', subtitle: 'Winged Clone' },
  ], 'Hashira', 185, 'Defend the forge rooftops from spear thrusts and aerial sonic dives.'),
  makeLevel(23, 3, 'Porcelain Terror: Gyokko', 'swordsmith_village', [
    { archetype: 'nezuko_awakened', name: 'Nezuko · Blood Burst Assist', subtitle: 'Sparring Trial', hpScale: 0.8 },
    { archetype: 'gyokko', name: 'Gyokko · Upper Rank Five', subtitle: 'Porcelain Artisan', isBoss: true },
  ], 'Hashira', 205, 'Track Gyokko as he teleports between porcelain pots across the smithy.'),
  makeLevel(24, 3, 'Hantengu: Urami Resentment', 'swordsmith_village', [
    { archetype: 'urami', name: 'Urami · Giant Resentment', subtitle: 'Upper Rank Four Shield', hpScale: 1.0 },
  ], 'Hashira', 215, 'Break through Urami’s colossal guard to expose the fleeing core.'),
  makeLevel(25, 3, 'Upper Moon Four: Zohakuten', 'swordsmith_village', [
    { archetype: 'hantengu_base', name: 'Hantengu Core', subtitle: 'Upper Four', hpScale: 0.7 },
    { archetype: 'zohakuten', name: 'Zohakuten · Hatred', subtitle: 'Upper Rank Four', isBoss: true },
  ], 'Upper Moon', 345, 'Survive wooden dragon onslaughts and drum lightning shockwaves.', true),
  makeLevel(26, 3, 'Hashira Training: Summit', 'hashira_grounds', [
    { archetype: 'ubume', name: 'Ubume · Phantom Trial', subtitle: 'Hashira Training Memory', hpScale: 1.1 },
  ], 'Hashira', 210, 'Sharpen your reflexes against phantom illusions at Corps headquarters.', false, undefined, 'cs_hashira_meeting'),
  makeLevel(27, 3, 'Hashira Sparring: Crimson Medicine', 'hashira_grounds', [
    { archetype: 'tamayo', name: 'Tamayo Illusion', subtitle: 'Aroma Training', hpScale: 1.1 },
    { archetype: 'strong', name: 'Stone Trial Sentinel', subtitle: 'Heavy Sparring Spirit', hpScale: 1.6 },
  ], 'Hashira', 220, 'Resist intoxicating Blood Aroma while shattering armored stone endurance.'),
  makeLevel(28, 3, 'Night Raid on the Estate', 'bamboo_forest', [
    { archetype: 'muzan_child', name: "Muzan's Child Illusion", subtitle: 'Phantom Scout', hpScale: 1.15 },
    { archetype: 'muzan_female', name: "Muzan's Female Illusion", subtitle: 'Phantom Aristocrat', hpScale: 1.15 },
  ], 'Upper Moon', 235, 'Muzan dispatches phantom manifestations under cover of the bamboo night.'),
  makeLevel(29, 3, 'Ruins of the Ancient Shrine', 'abandoned_temple', [
    { archetype: 'nezuko_adult', name: 'Blood Burst Echo', subtitle: 'Awakened Demon', hpScale: 1.15 },
    { archetype: 'tanjiro_demon_form', name: 'Abyssal Slayer Shade', subtitle: 'Dark Vision', hpScale: 1.15 },
  ], 'Upper Moon', 250, 'Clear the final stronghold before the Corps gathers.'),
  makeLevel(30, 3, 'Trial of the Red Blade', 'hashira_grounds', [
    { archetype: 'boss_akaza', name: 'Akaza Mirage', subtitle: 'Upper Rank Three Echo', isBoss: true, hpScale: 0.95 },
  ], 'Upper Moon', 380, 'Face a phantom manifestation of Upper Rank Three to prove Hashira mastery.', true),

  // CHAPTER 4: THE FINAL PREPARATION (31 - 40)
  makeLevel(31, 4, 'Blizzard Crucible', 'snowy_mountain', [
    { archetype: 'regenerating', name: 'Glacier Fiend', subtitle: 'Elite Regenerator', hpScale: 1.8 },
    { archetype: 'hantengu_fear', name: 'Fear Titan Echo', subtitle: 'Elite Heavy', hpScale: 1.1 },
  ], 'Upper Moon', 260, 'Push your body to the limit in freezing mountain battles.'),
  makeLevel(32, 4, 'Lanterns Before the Storm', 'japanese_village', [
    { archetype: 'susamaru', name: 'Temari Phantasm', subtitle: 'Elite Bombardier', hpScale: 1.4 },
    { archetype: 'yahaba', name: 'Vector Phantasm', subtitle: 'Elite Art User', hpScale: 1.4 },
  ], 'Upper Moon', 270, 'Eliminate elite echoes infiltrating the final evacuation town.'),
  makeLevel(33, 4, 'Abyssal Woods Purge', 'dark_forest', [
    { archetype: 'rui_father', name: 'Carapace Remnant', subtitle: 'Elite Brute', hpScale: 1.45 },
    { archetype: 'rui_mother', name: 'Silk Remnant', subtitle: 'Elite Art User', hpScale: 1.45 },
  ], 'Upper Moon', 280, 'Survive relentless regeneration in the pitch-black canopy.'),
  makeLevel(34, 4, 'Widow Peak Webs', 'spider_mountain', [
    { archetype: 'rui_brother', name: 'Venom Remnant', subtitle: 'Elite Art User', hpScale: 1.55 },
    { archetype: 'rui_sister', name: 'Acid Thread Remnant', subtitle: 'Elite Sprinter', hpScale: 1.55 },
  ], 'Upper Moon', 290, 'Destroy lingering Upper Moon remnants on Spider Mountain.'),
  makeLevel(35, 4, 'Forge Defense: Crimson Dawn', 'swordsmith_village', [
    { archetype: 'hantengu_merged', name: 'Hatred Remnant', subtitle: 'Upper Four Echo', hpScale: 1.1 },
  ], 'Upper Moon', 310, 'Ensure every Nichirin blade is tempered before the final descent.'),
  makeLevel(36, 4, 'Moonlit Duelists', 'bamboo_forest', [
    { archetype: 'tanjiro_demon_form', name: "Tanjiro's Demon Shade", subtitle: 'Crimson Nightmare', hpScale: 1.25 },
    { archetype: 'rokuro', name: 'Crimson Regent', subtitle: 'Elite Demon', hpScale: 1.65 },
  ], 'Upper Moon', 320, 'Precision parries decide survival beneath the swaying bamboo.'),
  makeLevel(37, 4, 'Ashen Pagoda Gauntlet', 'abandoned_temple', [
    { archetype: 'kyogai', name: 'Resonant Drum Shade', subtitle: 'Elite Art User', hpScale: 1.55 },
    { archetype: 'wakuraba', name: 'Gale Blitz Shade', subtitle: 'Elite Sprinter', hpScale: 1.55 },
  ], 'Upper Moon', 330, 'Break through heavily fortified temple guardians.'),
  makeLevel(38, 4, 'Crimson District Remnant', 'entertainment_district', [
    { archetype: 'daki_awakened', name: 'Sash Remnant', subtitle: 'Upper Six Echo', hpScale: 1.25 },
    { archetype: 'gyutaro_awakened', name: "Gyutaro's Awakened Form", subtitle: 'Upper Six Echo', hpScale: 1.2 },
  ], 'Upper Moon', 345, 'Cleanse the remaining Upper Rank echoes.'),
  makeLevel(39, 4, 'Final Hashira Summit', 'hashira_grounds', [
    { archetype: 'muzan_adult', name: "Muzan's Adult Aspect", subtitle: 'Progenitor Vessel', hpScale: 1.2 },
  ], 'Upper Moon', 360, 'One final test at Corps headquarters before the Infinity Castle opens.'),
  makeLevel(40, 4, 'The Biwa Resounds', 'hashira_grounds', [
    { archetype: 'boss_enmu', name: 'Kagaya Trap Guardian', subtitle: 'Infinity Herald', isBoss: true, hpScale: 1.5, damageScale: 1.3 },
  ], 'Upper Moon', 440, 'Shoji doors open beneath your feet as Nakime summons the Corps into the abyss.', true, undefined, 'cs_infinity_castle'),

  // CHAPTER 5: INFINITY CASTLE (41 - 50)
  makeLevel(41, 5, 'Black Thunder: Kaigaku', 'infinity_castle', [
    { archetype: 'fast', name: 'Castle Sentinel', subtitle: 'Lower Rank Strength', hpScale: 2.0 },
    { archetype: 'kaigaku', name: 'Kaigaku · Upper Rank Six', subtitle: 'Corrupted Thunder', isBoss: true },
  ], 'Upper Moon', 440, 'Gravity twists inside the castle as Kaigaku strikes with black lightning.', true),
  makeLevel(42, 5, 'Battle Against Nakime', 'infinity_castle', [
    { archetype: 'boss_nakime', name: 'Nakime', subtitle: 'Upper Rank Four · Biwa', isBoss: true },
  ], 'Upper Moon', 500, 'Disrupt the Biwa demon shifting the Infinity Castle platforms.', true),
  makeLevel(43, 5, 'First Akaza Battle', 'infinity_castle', [
    { archetype: 'boss_akaza', name: 'Akaza', subtitle: 'Upper Rank Three (Phase I)', isBoss: true, hpScale: 0.96 },
  ], 'Upper Moon', 540, 'Upper Rank Three leaps into the rotating hall with Destructive Death martial arts.', true, undefined, 'cs_akaza_duel'),
  makeLevel(44, 5, 'Final Akaza Battle', 'infinity_castle', [
    { archetype: 'akaza_awakened', name: "Akaza's Awakened Form", subtitle: 'Upper Rank Three · Compass Needle', isBoss: true, hpScale: 1.25, damageScale: 1.15 },
  ], 'INSANE', 650, 'Unlock the Transparent World mindset to overcome Awakened Akaza!', true),
  makeLevel(45, 5, 'First Doma Battle', 'infinity_castle', [
    { archetype: 'doma_ice_clone', name: "Doma's Cryo Clone", subtitle: 'Lotus Guardian', hpScale: 1.1 },
    { archetype: 'boss_doma', name: 'Doma', subtitle: 'Upper Rank Two (Phase I)', isBoss: true, hpScale: 0.96 },
  ], 'Upper Moon', 600, 'Deadly frost lotus Blood Demon Arts freeze the air inside the lotus chamber.', true, undefined, 'cs_doma_duel'),
  makeLevel(46, 5, 'Final Doma Battle', 'infinity_castle', [
    { archetype: 'doma_final', name: "Doma's Final Battle Form", subtitle: 'Upper Rank Two · Rime Bodhisattva', isBoss: true, hpScale: 1.25, damageScale: 1.15 },
  ], 'INSANE', 720, 'Shatter the icy storm and Cryo Clones of Upper Rank Two!', true),
  makeLevel(47, 5, 'First Kokushibo Battle', 'infinity_castle', [
    { archetype: 'boss_kokushibo', name: 'Kokushibo', subtitle: 'Upper Rank One (Phase I)', isBoss: true, hpScale: 0.96 },
  ], 'INSANE', 700, 'Confront the six-eyed samurai demon wielding Moon Breathing flesh blades.', true, undefined, 'cs_kokushibo_duel'),
  makeLevel(48, 5, 'Final Kokushibo Battle', 'infinity_castle', [
    { archetype: 'kokushibo_demon', name: "Kokushibo's Transformation", subtitle: 'Upper Rank One · Calamity', isBoss: true, hpScale: 1.28, damageScale: 1.18 },
  ], 'INSANE', 850, 'Survive relentless crescent blades in the grand suspended shrine.', true),
  makeLevel(49, 5, 'Demon King Vessel Assault', 'infinity_castle', [
    { archetype: 'boss_muzan', name: 'Muzan · Awakening Cocoon', subtitle: 'Progenitor Aspect', hpScale: 0.72 },
    { archetype: 'demon_king_tanjiro', name: 'Demon King Mirage', subtitle: 'Abyssal Eclipse', hpScale: 0.88, isBoss: true },
  ], 'INSANE', 900, 'Cut through the nightmarish vision guarding the Demon King throne.', true),
  makeLevel(50, 5, 'Final Muzan Battle', 'infinity_castle', [
    { archetype: 'muzan_final', name: 'Muzan Kibutsuji · Final Form', subtitle: 'Progenitor of Demons', isBoss: true },
  ], 'INSANE', 2000, 'Stand beside fellow Hashira AI allies and defeat Muzan Kibutsuji before sunrise!', true, ['giyu', 'rengoku'], 'cs_muzan_finale'),
];

export function getLevelById(id: number): StoryLevelDef {
  return STORY_LEVELS.find((l) => l.id === id) ?? STORY_LEVELS[0];
}

export function getRouteLevelBriefing(
  level: StoryLevelDef,
  routeId: StoryRouteId
): { routeLabel: string; routeIntro: string; routeObjective: string } {
  if (routeId === 'zenitsu') {
    return {
      routeLabel: 'Zenitsu · Lightning Path',
      routeObjective: level.isBossLevel
        ? `Thunderclap Blitz: ${level.objectiveText}`
        : `High-Speed Purge: ${level.objectiveText}`,
      routeIntro:
        level.chapter === 5
          ? 'Even inside the shifting Infinity Castle, Zenitsu steadies his breath for a godlike flash against Upper Moon wrath.'
          : `${level.intro} Zenitsu relies on blistering Thunder Breathing dashes and fast counter strikes.`,
    };
  }
  if (routeId === 'inosuke') {
    return {
      routeLabel: 'Inosuke · Mountain Beast Path',
      routeObjective: `Ferocious Assault: ${level.objectiveText}`,
      routeIntro:
        level.chapter === 2
          ? 'Inosuke charges headfirst into Spider Mountain, tearing through webs and armored demon carapaces alike.'
          : `${level.intro} Crush enemy guards with relentless Beast Breathing pressure.`,
    };
  }
  if (routeId === 'kanao') {
    return {
      routeLabel: 'Kanao · Vermilion Eye Path',
      routeObjective: `Precision Counter: ${level.objectiveText}`,
      routeIntro:
        level.chapter === 5
          ? 'Inside the frost chamber, Kanao sharpens her Vermilion Eye vision to track every lotus and fan strike.'
          : `${level.intro} Time blocks and dodge counters to punish openings cleanly.`,
    };
  }
  if (routeId === 'genya') {
    return {
      routeLabel: 'Genya · Demon-Eater Path',
      routeObjective: `Buckshot & Steel: ${level.objectiveText}`,
      routeIntro:
        level.chapter === 3
          ? 'Alongside the Hashira, Genya unleashes Nichirin shotgun blasts on heavy strikes to stagger Upper Ranks.'
          : `${level.intro} Combine heavy Nichirin buckshot blasts with tough close-range slashes.`,
    };
  }
  if (routeId === 'hashira') {
    return {
      routeLabel: 'Hashira Vanguard Route',
      routeObjective: `Pillar Command: ${level.objectiveText}`,
      routeIntro: `${level.intro} Fight as a Pillar of the Demon Slayer Corps with elite breathing flow.`,
    };
  }
  return {
    routeLabel: 'Tanjiro · Sun & Water Path',
    routeObjective: level.objectiveText,
    routeIntro:
      level.id === 50
        ? 'With every memory of the Corps burning in your blade, unleash Hinokami Kagura beside the Hashira to end Muzan!'
        : level.intro,
  };
}

// Animated Cinematic Cutscene Catalog (driven by real 60 FPS Canvas skeletal choreography)
export const CUTSCENES: Record<string, CutsceneDef> = {
  cs_opening: {
    id: 'cs_opening',
    title: 'Prologue: Night of the Crimson Blade',
    mapId: 'snowy_mountain',
    beats: [
      {
        duration: 2.8,
        cameraX: 600,
        cameraZoom: 1.05,
        lightingMood: 'moonlit',
        subtitle: 'Under the frozen peaks of Mt. Sagiri, the Corps prepares for the long night.',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 740, facing: 1, action: 'walk', bubbleText: 'One more swing before dawn!' },
          { id: 'ally1', role: 'ally', characterId: 'zenitsu', name: 'Zenitsu', x: 960, facing: -1, action: 'idle', bubbleText: 'Must we really fight in this cold?!' },
        ],
      },
      {
        duration: 2.8,
        cameraX: 780,
        cameraZoom: 1.18,
        lightingMood: 'mist',
        fxKind: 'breathing',
        fxColor: '#38bdf8',
        subtitle: 'Total Concentration Breathing awakens within the Nichirin steel.',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 860, facing: 1, action: 'breathing', bubbleText: 'Total Concentration — Draw!' },
          { id: 'ally1', role: 'hashira', characterId: 'giyu', name: 'Giyu', x: 1080, facing: -1, action: 'block', bubbleText: 'Keep your wrist steady.' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 840, facing: 1, action: 'run', bubbleText: 'I must sever this boulder!' },
          { id: 'mentor', role: 'mentor', characterId: 'giyu', name: 'Sabito', x: 1090, facing: -1, action: 'idle', bubbleText: 'Strike cleanly—no hesitation!' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 980, facing: 1, action: 'heavy', bubbleText: 'CLEAVE!' },
          { id: 'mentor', role: 'mentor', characterId: 'giyu', name: 'Sabito', x: 1120, facing: -1, action: 'idle', bubbleText: 'Well struck. Final Selection awaits.' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 760, facing: 1, action: 'walk' },
          { id: 'enemy', role: 'demon', demonArchetype: 'temple_demon', name: 'Temple Demon', x: 1140, facing: -1, action: 'run', bubbleText: 'Fresh meat in a Corps coat!' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 920, facing: 1, action: 'slash', bubbleText: 'Stay back! Ready the blade!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'temple_demon', name: 'Temple Demon', x: 1020, facing: -1, action: 'bda', bubbleText: 'GRAAAH!' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 780, facing: 1, action: 'block', bubbleText: 'That towering shape... Urokodaki’s warning!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'boss_hand', name: 'Hand Demon', x: 1120, facing: -1, action: 'heavy', bubbleText: 'Another fox mask?! Come die!' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 860, facing: 1, action: 'breathing', bubbleText: 'For Sabito and Makomo—I strike!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'boss_hand', name: 'Hand Demon', x: 1090, facing: -1, action: 'bda' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 760, facing: 1, action: 'dodge', bubbleText: 'The forest is laced with razor threads!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'boss_rui', name: 'Rui · Lower Five', x: 1120, facing: -1, action: 'bda', bubbleText: 'Do not disturb my family.' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 920, facing: 1, action: 'breathing', bubbleText: 'Cut the web apart!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'boss_rui', name: 'Rui · Lower Five', x: 1080, facing: -1, action: 'block' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 740, facing: 1, action: 'run' },
          { id: 'uzui', role: 'hashira', characterId: 'tengen', name: 'Tengen Uzui', x: 890, facing: 1, action: 'slash', bubbleText: 'Watch his poisoned blood sickles!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'gyutaro', name: 'Gyutaro · Upper Six', x: 1160, facing: -1, action: 'bda', bubbleText: 'Heh... Come dance in the flames!' },
        ],
      },
      {
        duration: 2.4,
        cameraX: 890,
        cameraZoom: 1.22,
        shake: 12,
        lightingMood: 'crimson',
        fxKind: 'clash',
        fxColor: '#fbbf24',
        actors: [
          { id: 'uzui', role: 'hashira', characterId: 'tengen', name: 'Tengen Uzui', x: 980, facing: 1, action: 'heavy', bubbleText: 'Let’s make this flamboyant!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'gyutaro', name: 'Gyutaro · Upper Six', x: 1100, facing: -1, action: 'slash' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 780, facing: 1, action: 'block', bubbleText: 'Demons inside the hidden forge!' },
          { id: 'enemy', role: 'demon', demonArchetype: 'sekido', name: 'Sekido', x: 1120, facing: -1, action: 'bda', bubbleText: 'Die beneath crimson lightning!' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 910, facing: 1, action: 'breathing', bubbleText: 'Protect the swordsmiths!' },
          { id: 'enemy2', role: 'demon', demonArchetype: 'gyokko', name: 'Gyokko', x: 1150, facing: -1, action: 'idle', bubbleText: 'Witness my glorious porcelain art!' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 740, facing: 1, action: 'idle' },
          { id: 'giyu', role: 'hashira', characterId: 'giyu', name: 'Giyu', x: 960, facing: -1, action: 'idle', bubbleText: 'Every Pillar sharpens their blade.' },
          { id: 'rengoku', role: 'hashira', characterId: 'rengoku', name: 'Rengoku', x: 1120, facing: -1, action: 'breathing', bubbleText: 'Set your heart ablaze!' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 760, facing: 1, action: 'jump', bubbleText: 'The floor vanished—it’s the Infinity Castle!' },
          { id: 'nakime', role: 'demon', demonArchetype: 'boss_nakime', name: 'Nakime', x: 1140, facing: -1, action: 'bda', bubbleText: 'Welcome to the Demon King’s domain.' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 840, facing: 1, action: 'slash', bubbleText: 'Muzan Kibutsuji!!' },
          { id: 'muzan', role: 'demon', demonArchetype: 'boss_muzan', name: 'Muzan Kibutsuji', x: 1120, facing: -1, action: 'transform', bubbleText: 'None of you leave here alive.' },
        ],
      },
    ],
  },
  cs_akaza_duel: {
    id: 'cs_akaza_duel',
    title: 'Compass Needle Awakens',
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 800, facing: 1, action: 'block', bubbleText: 'Here he comes—Upper Rank Three!' },
          { id: 'akaza', role: 'demon', demonArchetype: 'boss_akaza', name: 'Akaza', x: 1120, facing: -1, action: 'bda', bubbleText: 'Technique Deployment: Compass Needle!' },
        ],
      },
      {
        duration: 2.3,
        cameraX: 860,
        cameraZoom: 1.24,
        shake: 12,
        lightingMood: 'crimson',
        fxKind: 'clash',
        fxColor: '#38bdf8',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 920, facing: 1, action: 'slash', bubbleText: 'Show me your martial arts!' },
          { id: 'akaza', role: 'demon', demonArchetype: 'boss_akaza', name: 'Akaza', x: 1040, facing: -1, action: 'heavy' },
        ],
      },
    ],
  },
  cs_doma_duel: {
    id: 'cs_doma_duel',
    title: 'Lotus Chamber of Frost',
    mapId: 'infinity_castle',
    beats: [
      {
        duration: 2.6,
        cameraX: 780,
        cameraZoom: 1.12,
        lightingMood: 'mist',
        fxKind: 'bda',
        fxColor: '#7dd3fc',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'kanao', name: 'Kanao', x: 780, facing: 1, action: 'run', bubbleText: 'Do not breathe the frost dust!' },
          { id: 'doma', role: 'demon', demonArchetype: 'boss_doma', name: 'Doma · Upper Two', x: 1130, facing: -1, action: 'bda', bubbleText: 'Care to dance amidst freezing lotuses?' },
        ],
      },
    ],
  },
  cs_kokushibo_duel: {
    id: 'cs_kokushibo_duel',
    title: 'Eclipse of Six Eyes',
    mapId: 'infinity_castle',
    beats: [
      {
        duration: 2.8,
        cameraX: 800,
        cameraZoom: 1.15,
        shake: 10,
        lightingMood: 'castle_gold',
        fxKind: 'clash',
        fxColor: '#c084fc',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'gyomei', name: 'Gyomei', x: 790, facing: 1, action: 'heavy', bubbleText: 'Stay sharp—his Moon Breathing reaches everywhere!' },
          { id: 'koku', role: 'demon', demonArchetype: 'boss_kokushibo', name: 'Kokushibo · Upper One', x: 1130, facing: -1, action: 'slash', bubbleText: 'Show me the pinnacle of this era.' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 760, facing: 1, action: 'breathing', bubbleText: 'Muzan ends tonight!' },
          { id: 'giyu', role: 'hashira', characterId: 'giyu', name: 'Giyu', x: 870, facing: 1, action: 'slash', bubbleText: 'Hold the line!' },
          { id: 'muzan', role: 'demon', demonArchetype: 'muzan_final', name: 'Muzan · Final Form', x: 1150, facing: -1, action: 'transform', bubbleText: 'Come and perish, Demon Slayers!' },
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
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 920, facing: 1, action: 'heavy', bubbleText: 'HINOKAMI KAGURA!' },
          { id: 'muzan', role: 'demon', demonArchetype: 'muzan_final', name: 'Muzan · Final Form', x: 1080, facing: -1, action: 'bda' },
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
        duration: 3.0,
        cameraX: 780,
        cameraZoom: 1.05,
        lightingMood: 'dawn',
        fxKind: 'sunrise',
        fxColor: '#fde047',
        subtitle: 'As golden morning rays pierce the sky, the Demon King turns to ash.',
        actors: [
          { id: 'hero', role: 'slayer', characterId: 'tanjiro', name: 'Tanjiro', x: 860, facing: 1, action: 'idle', bubbleText: 'The sun... We survived till dawn!' },
          { id: 'giyu', role: 'hashira', characterId: 'giyu', name: 'Giyu', x: 1050, facing: -1, action: 'idle', bubbleText: 'Rest well, Corps.' },
        ],
      },
    ],
  },
};

export function buildCutsceneForPlayer(
  cutsceneId: string,
  characterId: string,
  _breathing: BreathingStyleId
): CutsceneDef {
  const base = CUTSCENES[cutsceneId] ?? CUTSCENES.cs_opening;
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
          if (charDef.routeId === 'zenitsu') {
            bubble = 'I actually survived Muzan?! The night is finally over!';
          } else if (charDef.routeId === 'inosuke') {
            bubble = 'King of the Mountains stands undefeated at dawn!';
          } else if (charDef.routeId === 'kanao') {
            bubble = 'Everyone’s sacrifice brought this quiet sunrise.';
          } else if (charDef.routeId === 'genya') {
            bubble = 'We tore down the fortress together!';
          } else if (charDef.routeId === 'hashira') {
            bubble = 'Peace returns to every village under the sun.';
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
