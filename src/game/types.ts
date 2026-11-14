export type GamePhase =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'VICTORY'
  | 'DEFEAT';

export type GameMode = 'TUTORIAL' | 'STORY' | 'PRACTICE';

export type FighterRole = 'player' | 'ally' | 'demon' | 'rock';

export type StoryRouteId = 'tanjiro' | 'zenitsu' | 'inosuke' | 'kanao' | 'genya' | 'hashira';

export type BreathingStyleId =
  | 'water'
  | 'flame'
  | 'thunder'
  | 'beast'
  | 'wind'
  | 'insect'
  | 'sound'
  | 'mist'
  | 'love'
  | 'serpent'
  | 'stone'
  | 'sun';

export type MapId =
  | 'bamboo_forest'
  | 'mountain_training'
  | 'snowy_mountain'
  | 'japanese_village'
  | 'dark_forest'
  | 'abandoned_temple'
  | 'spider_mountain'
  | 'entertainment_district'
  | 'swordsmith_village'
  | 'hashira_grounds'
  | 'infinity_castle';

export type WeaponStyle =
  | 'katana'
  | 'dual_serrated'
  | 'dual_cleaver'
  | 'whip_katana'
  | 'stone_flail'
  | 'stinger_katana'
  | 'shotgun_katana'
  | 'flesh_katana'
  | 'blood_sickles'
  | 'obi_ribbons'
  | 'ice_fans'
  | 'unarmed_claws'
  | 'muzan_tentacles';

export type DemonArchetype =
  // Generic regular wave types (preserved for Level waves)
  | 'basic'
  | 'fast'
  | 'strong'
  | 'regenerating'
  | 'bda_special'
  // Complete 60-Demon Roster
  | 'boss_kokushibo'       // 1. Kokushibo
  | 'boss_doma'            // 2. Doma
  | 'boss_akaza'           // 3. Akaza
  | 'hantengu_base'        // 4. Hantengu
  | 'gyokko'               // 5. Gyokko
  | 'gyutaro'              // 6. Gyutaro
  | 'boss_daki'            // 7. Daki
  | 'kaigaku'              // 8. Kaigaku
  | 'boss_nakime'          // 9. Nakime
  | 'boss_enmu'            // 10. Enmu
  | 'rokuro'               // 11. Rokuro
  | 'wakuraba'             // 12. Wakuraba
  | 'mukago'               // 13. Mukago
  | 'boss_rui'             // 14. Rui
  | 'kamanue'              // 15. Kamanue
  | 'boss_muzan'           // 16. Muzan Kibutsuji
  | 'nezuko_base'          // 17. Nezuko Kamado
  | 'tamayo'               // 18. Tamayo
  | 'yushiro'              // 19. Yushiro
  | 'chachamaru'           // 20. Chachamaru
  | 'susamaru'             // 21. Susamaru
  | 'yahaba'               // 22. Yahaba
  | 'kyogai'               // 23. Kyogai
  | 'boss_hand'            // 24. Hand Demon
  | 'swamp_demon'          // 25. Swamp Demon
  | 'temple_demon'         // 26. Temple Demon
  | 'tongue_demon'         // 27. Tongue Demon
  | 'horned_demon'         // 28. Horned Demon
  | 'spider_mother_main'   // 29. Mother Spider Demon
  | 'spider_father_main'   // 30. Father Spider Demon
  | 'spider_brother_main'  // 31. Brother Spider Demon
  | 'spider_sister_main'   // 32. Sister Spider Demon
  | 'slasher'              // 33. Slasher
  | 'ubume'                // 34. Ubume
  | 'sekido'               // 35. Sekido
  | 'karaku'               // 36. Karaku
  | 'aizetsu'              // 37. Aizetsu
  | 'urogi'                // 38. Urogi
  | 'zohakuten'            // 39. Zohakuten
  | 'urami'                // 40. Urami
  | 'demon_king_tanjiro'   // 41. Demon King Tanjiro
  | 'tanjiro_demon_form'   // 42. Tanjiro's Demon Transformation
  | 'muzan_final'          // 43. Muzan's Final Form
  | 'muzan_child'          // 44. Muzan's Child Disguise
  | 'muzan_female'         // 45. Muzan's Female Disguise
  | 'muzan_adult'          // 46. Muzan's Adult Disguise
  | 'akaza_awakened'       // 47. Akaza's Awakened Form
  | 'kokushibo_demon'      // 48. Kokushibo's Transformed Form
  | 'gyutaro_awakened'     // 49. Gyutaro's Awakened Form
  | 'daki_awakened'        // 50. Daki's Awakened Form
  | 'nezuko_awakened'      // 51. Nezuko's Awakened Demon Form
  | 'nezuko_adult'         // 52. Nezuko's Adult Demon Form
  | 'rui_mother'           // 53. Mother Spider Subordinate
  | 'rui_father'           // 54. Father Spider Subordinate
  | 'rui_brother'          // 55. Brother Spider Subordinate
  | 'rui_sister'           // 56. Sister Spider Subordinate
  | 'hantengu_merged'      // 57. Hantengu's Merged Form
  | 'hantengu_fear'        // 58. Hantengu's Giant Fear Form
  | 'doma_ice_clone'       // 59. Doma's Ice Clone
  | 'doma_final';          // 60. Doma's Final Battle Form

export type DemonDifficultyTier =
  | 'Easy'
  | 'Normal'
  | 'Hard'
  | 'Very Hard'
  | 'Extreme'
  | 'Insane';

export type DemonSfxTheme =
  | 'feral'
  | 'ice'
  | 'martial'
  | 'moon_blade'
  | 'sickle'
  | 'obi_silk'
  | 'biwa'
  | 'drum'
  | 'thunder'
  | 'wind'
  | 'muzan'
  | 'water_pot';

export type FighterActionState =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'JUMP'
  | 'FALL'
  | 'LIGHT_ATTACK'
  | 'HEAVY_ATTACK'
  | 'JUMP_ATTACK'
  | 'RUNNING_ATTACK'
  | 'BREATHING_FORM'
  | 'COUNTER_ATTACK'
  | 'BLOCK'
  | 'DODGE'
  | 'HURT'
  | 'ATTACK_WINDUP'
  | 'BDA_CAST'
  | 'RAGDOLL'
  | 'GETTING_UP'
  | 'DEFEATED';

export type SwordTechniqueType =
  | 'horizontal_slash'
  | 'vertical_downward'
  | 'diagonal_upward'
  | 'reverse_diagonal'
  | 'quick_double'
  | 'heavy_overhead'
  | 'running_slash'
  | 'jumping_slash'
  | 'defensive_guard'
  | 'counter_slash';

export type AttackKind =
  | 'LIGHT_1'
  | 'LIGHT_2'
  | 'LIGHT_3'
  | 'LIGHT_4'
  | 'DOUBLE_SLASH'
  | 'HEAVY'
  | 'RUNNING_SLASH'
  | 'JUMP'
  | 'COUNTER'
  | 'BREATHING_1'
  | 'BREATHING_2'
  | 'BREATHING_3'
  | 'BREATHING_4'
  | 'BREATHING_5'
  | 'DEMON_CLAW'
  | 'DEMON_KICK'
  | 'DEMON_PUNCH_COMBO'
  | 'DEMON_HEAVY_SLAM'
  | 'DEMON_BDA_PROJECTILE'
  | 'DEMON_BDA_AREA'
  | 'DEMON_ULTIMATE'
  | 'MUZAN_TENTACLE_WHIP'
  | 'MUZAN_SHOCKWAVE';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BreathingFormSpec {
  index: 1 | 2 | 3 | 4 | 5;
  name: string;
  energyCost: number;
  cooldown: number;
  damageMult: number;
  range: number;
  reachY: number;
  startup: number;
  active: number;
  recovery: number;
  forwardImpulse: number;
  verticalImpulse: number;
  knockbackX: number;
  knockbackY: number;
  triggersRagdoll: boolean;
  hitstop: number;
  motionPattern:
    | 'forward_surge'
    | 'spin_wheel'
    | 'multi_dash'
    | 'upward_crescent'
    | 'dragon_finisher'
    | 'zigzag_blink'
    | 'whip_sweep'
    | 'overhead_crush'
    | 'pierce_thrust';
  description: string;
}

export interface BreathingStyleDef {
  id: BreathingStyleId;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  bladeBaseColor: string;
  bladeEdgeColor: string;
  tsubaColor: string;
  forms: [
    BreathingFormSpec,
    BreathingFormSpec,
    BreathingFormSpec,
    BreathingFormSpec,
    BreathingFormSpec,
  ];
}

export interface SlayerCharacterDef {
  id: string;
  name: string;
  title: string;
  routeId: StoryRouteId;
  price: number;
  isStarterChoice: boolean;
  isHashira: boolean;
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Master';
  specialAbility: string;
  defaultBreathing: BreathingStyleId;
  allowedBreathings: BreathingStyleId[];
  weapon: WeaponStyle;
  maxHp: number;
  speedMult: number;
  damageMult: number;
  attackSpeedMult: number;
  energyRegen: number;
  skinColor: string;
  hairColor: string;
  uniformColor: string;
  haoriPrimary: string;
  haoriAccent: string;
  scarfColor: string;
  eyeColor: string;
  bladeColor: string;
  description: string;
}

export interface AttackSpec {
  kind: AttackKind;
  technique?: SwordTechniqueType;
  damage: number;
  startup: number;
  active: number;
  recovery: number;
  knockbackX: number;
  knockbackY: number;
  triggersRagdoll: boolean;
  hitstop: number;
  range: number;
  reachY: number;
  forwardImpulse: number;
  verticalImpulse?: number;
  motionPattern?: BreathingFormSpec['motionPattern'];
  breathingStyle?: BreathingStyleId;
  formIndex?: 1 | 2 | 3 | 4 | 5;
  poisonDps?: number;
  isDoubleHit?: boolean;
}

export interface JointPose {
  pelvis: Vec2;
  chest: Vec2;
  head: Vec2;
  lShoulder: Vec2;
  lElbow: Vec2;
  lHand: Vec2;
  rShoulder: Vec2;
  rElbow: Vec2;
  rHand: Vec2;
  lKnee: Vec2;
  lFoot: Vec2;
  rKnee: Vec2;
  rFoot: Vec2;
  swordAngle: number;
  offhandAngle: number;
  torsoTilt: number;
  headTilt: number;
  scaleX: number;
  scaleY: number;
}

export type JointKey =
  | 'pelvis'
  | 'chest'
  | 'head'
  | 'lShoulder'
  | 'lElbow'
  | 'lHand'
  | 'rShoulder'
  | 'rElbow'
  | 'rHand'
  | 'lKnee'
  | 'lFoot'
  | 'rKnee'
  | 'rFoot';

export interface VerletNode {
  id: JointKey;
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  mass: number;
  radius: number;
}

export interface VerletConstraint {
  a: JointKey;
  b: JointKey;
  length: number;
  stiffness: number;
  minOnly?: boolean;
}

export interface RagdollBody {
  active: boolean;
  nodes: Record<JointKey, VerletNode>;
  constraints: VerletConstraint[];
  swordAngle: number;
  swordAngularVel: number;
  timer: number;
  minDuration: number;
  settledTime: number;
  keepDown: boolean;
}

export interface FighterVisualProfile {
  skinColor: string;
  hairColor: string;
  uniformColor: string;
  haoriPrimary: string;
  haoriAccent: string;
  scarfColor: string;
  eyeColor: string;
  bladeColor: string;
  weapon: WeaponStyle;
  scale: number;
  bodyBuild?: 'slim' | 'standard' | 'hulk' | 'child' | 'floating' | 'quadruped';
  hasHorns?: boolean;
  hornColor?: string;
  hasMarkings?: boolean;
  markingColor?: string;
  extraEyes?: boolean;
  spiderLegs?: boolean;
  kimono?: boolean;
  fedora?: boolean;
  drumHalo?: boolean;
  potVessel?: boolean;
  wings?: boolean;
  catEars?: boolean;
  blindfoldMask?: boolean;
  longClaws?: boolean;
  // Bespoke Demon / Character anatomy & props
  heldBiwa?: boolean;
  prayerBeads?: boolean;
  thirdEye?: boolean;
  rainbowEyes?: boolean;
  scars?: boolean;
  boarMask?: boolean;
  demonFleshArmor?: boolean;
  haoriPattern?: 'checkered' | 'triangles' | 'flame' | 'butterfly' | 'half_half' | 'stripes' | 'mist_clouds' | 'spider_web' | 'flames_akaza';
}

export interface Fighter {
  id: string;
  name: string;
  subtitle: string;
  role: FighterRole;
  characterId?: string;
  demonArchetype?: DemonArchetype;
  visual: FighterVisualProfile;
  breathingStyle: BreathingStyleId;
  damageMult: number;
  speedMult: number;
  attackSpeedMult: number;
  energyRegen: number;

  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;

  hp: number;
  maxHp: number;
  displayHp: number;
  energy: number;
  maxEnergy: number;

  state: FighterActionState;
  stateTimer: number;
  animTime: number;

  // Smooth pose blending
  lastPose: JointPose | null;
  blendFromPose: JointPose | null;
  blendTimer: number;
  blendDuration: number;

  currentAttack: AttackSpec | null;
  attackSwingId: number;
  hitTargetsThisSwing: Set<string>;
  comboStep: number;
  comboResetTimer: number;
  queuedNextCombo: boolean;
  secondHitFired: boolean;

  heavyCooldown: number;
  maxHeavyCooldown: number;
  formCooldowns: [number, number, number, number, number];
  dodgeCooldown: number;
  invulnTimer: number;
  counterWindowTimer: number;
  hitFlashTimer: number;
  parryFlashTimer: number;
  poisonTimer: number;
  poisonDps: number;
  chillTimer: number;
  regenTimer: number;
  bossPhase: 1 | 2 | 3;

  scarfPoints: Vec2[];
  ragdoll: RagdollBody;
  recoveryStartPose: JointPose | null;
  recoveryDuration: number;

  width: number;
  height: number;
  hitCount: number;
  damageTaken: number;
}

export interface ArenaPlatform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'wooden' | 'bridge' | 'stone' | 'tatami' | 'stair';
  baseX: number;
  baseY: number;
  moveAmpX?: number;
  moveAmpY?: number;
  moveSpeed?: number;
  phase?: number;
}

export interface ArenaObstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'rock' | 'fence' | 'crate' | 'pillar' | 'tree_trunk' | 'shoji_wall';
  solid: boolean;
  destructible: boolean;
  hp: number;
  maxHp: number;
  lastHitSwingId: number;
}

export interface ArenaWaterZone {
  id: string;
  x: number;
  w: number;
  kind: 'river' | 'waterfall_pool' | 'moat';
}

export interface ArenaDecorItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind:
    | 'lantern'
    | 'shrine'
    | 'torii'
    | 'house'
    | 'cave_mouth'
    | 'waterfall'
    | 'ruined_wall'
    | 'bamboo_cluster'
    | 'pine_tree'
    | 'castle_pillar'
    | 'shoji_portal'
    | 'bridge_rail'
    | 'forge_furnace'
    | 'wisteria_tree';
  tint?: string;
}

export interface MapZone {
  id: string;
  name: string;
  startX: number;
  endX: number;
  biomeHint: 'forest' | 'village' | 'river' | 'bridge' | 'cave' | 'temple' | 'mountain' | 'battlefield' | 'castle_hall' | 'castle_chasm' | 'castle_stairs' | 'castle_throne';
}

export interface BdaProjectile {
  id: number;
  ownerId: string;
  ownerRole: FighterRole;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  glowColor: string;
  life: number;
  maxLife: number;
  kind:
    | 'orb'
    | 'slash_wave'
    | 'ice_lotus'
    | 'ice_buddha'
    | 'ground_spike'
    | 'tentacle_zone'
    | 'pellet'
    | 'silk_thread'
    | 'blood_sickle'
    | 'temari_ball'
    | 'vector_arrow'
    | 'lightning_bolt'
    | 'wind_gust'
    | 'wooden_dragon'
    | 'swamp_pool'
    | 'compass_wave';
  triggeredRagdoll: boolean;
  bouncesLeft?: number;
  chillDuration?: number;
  poisonDps?: number;
  gravityScale?: number;
}

export interface SlashTrailPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  width: number;
  color: string;
  secondaryColor?: string;
  style?: BreathingStyleId;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  glowColor?: string;
  gravity: number;
  drag: number;
  kind: 'spark' | 'water' | 'flame' | 'lightning' | 'petal' | 'poison' | 'mist' | 'stone' | 'blood' | 'dust' | 'ring' | 'wood' | 'ice';
  rotation: number;
  vr: number;
}

export interface FloatingDamage {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  block: boolean;
  jumpPressed: boolean;
  lightPressed: boolean;
  heavyPressed: boolean;
  dodgePressed: boolean;
  formPressed: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface StoryEnemySpawn {
  archetype: DemonArchetype;
  name: string;
  subtitle: string;
  hpScale?: number;
  damageScale?: number;
  isBoss?: boolean;
  partnerArchetype?: DemonArchetype;
  partnerName?: string;
  partnerSubtitle?: string;
  partnerHpScale?: number;
}

export interface StoryLevelDef {
  id: number;
  chapter: 1 | 2 | 3 | 4 | 5;
  chapterTitle: string;
  title: string;
  intro: string;
  objectiveText: string;
  mapId: MapId;
  enemies: StoryEnemySpawn[];
  rewardCoins: number;
  difficulty: 'Normal' | 'Hard' | 'Hashira' | 'Upper Moon' | 'INSANE';
  isBossLevel: boolean;
  allyHashiraIds?: string[];
  allyIds?: string[];
  cutsceneId?: string;
  postCutsceneId?: string;
}

export interface TutorialStepDef {
  step: number;
  title: string;
  mentorLine: string;
  instruction: string;
}

// Animated Cutscene System Types
export interface CutsceneActorCue {
  id: string;
  role: 'slayer' | 'mentor' | 'hashira' | 'demon' | 'ally';
  characterId?: string;
  demonArchetype?: DemonArchetype;
  name: string;
  x: number;
  y?: number;
  facing: 1 | -1;
  action: 'idle' | 'walk' | 'run' | 'jump' | 'slash' | 'heavy' | 'breathing' | 'block' | 'dodge' | 'hurt' | 'bda' | 'transform';
  bubbleText?: string;
  emotion?: 'determined' | 'shock' | 'fear' | 'fierce' | 'calm' | 'rage';
}

export interface CutsceneBeat {
  duration: number;
  cameraX: number;
  cameraZoom: number;
  shake?: number;
  lightingMood: 'moonlit' | 'crimson' | 'dawn' | 'mist' | 'storm' | 'castle_gold';
  subtitle?: string;
  fxKind?: 'breathing' | 'clash' | 'bda' | 'transform' | 'boulder_split' | 'sunrise';
  fxColor?: string;
  actors: CutsceneActorCue[];
}

export interface CutsceneDef {
  id: string;
  title: string;
  mapId: MapId;
  beats: CutsceneBeat[];
}

export interface AudioSettings {
  muted: boolean;
  masterVolume: number; // 0..1
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  subtitlesEnabled: boolean;
}

export interface CharacterUpgrades {
  vitality: number; // +10 Max HP per level (0..5)
  blade: number;    // +6% Damage per level (0..5)
  breathing: number; // +1.2 Energy Regen per level (0..5)
}

export interface CharacterProfile {
  characterId: string;
  coins: number;
  highestUnlockedLevel: number;
  levelBestRanks: Record<number, 'S' | 'A' | 'B'>;
  seenCutscenes: string[];
  tutorialCompleted: boolean;
  selectedBreathing: BreathingStyleId;
  selectedSkinId: string;
  upgrades: CharacterUpgrades;
  totalDemonsDefeated: number;
  storyChoices: Record<string, string>;
}

export interface SaveData {
  coins: number;
  unlockedCharacters: string[];
  selectedCharacterId: string;
  selectedBreathing: BreathingStyleId;
  hasChosenStarter: boolean;
  tutorialCompleted: boolean;
  highestUnlockedLevel: number;
  levelBestRanks: Record<number, 'S' | 'A' | 'B'>;
  seenCutscenes: string[];
  skipSeenCutscenes: boolean;
  audio: AudioSettings;
  totalDemonsDefeated: number;
  characterProfiles: Record<string, CharacterProfile>;
}

export interface HudSnapshot {
  phase: GamePhase;
  mode: GameMode;
  levelId: number;
  levelTitle: string;
  mapId: MapId;
  playerName: string;
  playerHp: number;
  playerMaxHp: number;
  playerEnergy: number;
  playerMaxEnergy: number;
  breathingStyle: BreathingStyleId;
  breathingStyleName: string;
  heavyCooldown: number;
  maxHeavyCooldown: number;
  formCooldowns: [number, number, number, number, number];
  counterReady: boolean;
  actionWarning: string | null;

  enemyName: string;
  enemySubtitle: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyState: FighterActionState;
  enemyWaveIndex: number;
  enemyWaveTotal: number;
  bossPhase: 1 | 2 | 3;
  isBossBattle: boolean;
  enemyTelegraph: string | null;

  partnerEnemyName?: string | null;
  partnerEnemyHp?: number;
  partnerEnemyMaxHp?: number;

  allies: Array<{ name: string; hp: number; maxHp: number }>;

  zoneIndex: number;
  zoneTotal: number;
  zoneName: string;
  advancePrompt: string | null;
  playerWorldX: number;
  worldWidth: number;

  tutorialStep: number;
  tutorialTitle: string;
  tutorialInstruction: string;
  tutorialMentorLine: string;
  rockHp: number;
  rockMaxHp: number;

  coins: number;
  coinsEarnedThisRun: number;
  lastRank: 'S' | 'A' | 'B' | null;
  comboCount: number;
  muted: boolean;
  matchTime: number;
  ragdollHitsLanded: number;
}
