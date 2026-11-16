import { getFormEnergyCost } from './constants';
import {
  AttackSpec,
  AwakeningTierId,
  BreathingFormSpec,
  BreathingStyleDef,
  BreathingStyleId,
  UltimateId,
} from './types';

function mkForm(
  index: number,
  totalForms: number,
  name: string,
  motionPattern: BreathingFormSpec['motionPattern'],
  overrides: Partial<BreathingFormSpec> & { description: string }
): BreathingFormSpec {
  const progress = (index - 1) / Math.max(1, totalForms - 1);
  const defaultDmg = Number((1.55 + progress * 3.1).toFixed(2));
  const defaultCd = Number((2.1 + progress * 5.8).toFixed(1));
  return {
    index,
    name,
    energyCost: overrides.energyCost ?? getFormEnergyCost(index, totalForms),
    cooldown: overrides.cooldown ?? defaultCd,
    damageMult: overrides.damageMult ?? defaultDmg,
    range: overrides.range ?? Math.round(148 + progress * 115),
    reachY: overrides.reachY ?? Math.round(108 + progress * 52),
    startup: overrides.startup ?? Number((0.09 + progress * 0.06).toFixed(3)),
    active: overrides.active ?? Number((0.16 + progress * 0.12).toFixed(3)),
    recovery: overrides.recovery ?? Number((0.16 + progress * 0.08).toFixed(3)),
    forwardImpulse: overrides.forwardImpulse ?? Math.round(340 + progress * 520),
    verticalImpulse: overrides.verticalImpulse ?? 0,
    knockbackX: overrides.knockbackX ?? Math.round(380 + progress * 500),
    knockbackY: overrides.knockbackY ?? Math.round(-210 - progress * 280),
    triggersRagdoll: overrides.triggersRagdoll ?? (index >= 3 || progress >= 0.45),
    hitstop: overrides.hitstop ?? Number((0.042 + progress * 0.045).toFixed(3)),
    isUnknown: overrides.isUnknown,
    isSun13thCombo: overrides.isSun13thCombo,
    motionPattern,
    description: overrides.description,
  };
}

function mkUnknownForm(index: number, totalForms: number): BreathingFormSpec {
  return mkForm(index, totalForms, 'Unknown', 'forward_surge', {
    isUnknown: true,
    energyCost: 0,
    cooldown: 0,
    damageMult: 0,
    description: 'Canon form unrevealed in records.',
  });
}

export const BREATHING_STYLES: Record<BreathingStyleId, BreathingStyleDef> = {
  water: {
    id: 'water',
    name: 'Water Breathing',
    primaryColor: '#38bdf8',
    secondaryColor: '#e0f2fe',
    glowColor: '#0284c7',
    bladeBaseColor: '#0369a1',
    bladeEdgeColor: '#7dd3fc',
    tsubaColor: '#334155',
    forms: [
      mkForm(1, 11, 'First Form: Water Surface Slash', 'forward_surge', {
        forwardImpulse: 620,
        range: 175,
        triggersRagdoll: true,
        description: 'Fast horizontal wave surge slicing forward.',
      }),
      mkForm(2, 11, 'Second Form: Water Wheel', 'spin_wheel', {
        verticalImpulse: -410,
        forwardImpulse: 300,
        range: 155,
        reachY: 138,
        description: 'Leaping 360-degree spinning water arc.',
      }),
      mkForm(3, 11, 'Third Form: Flowing Dance', 'multi_dash', {
        forwardImpulse: 740,
        range: 185,
        description: 'Fluid multi-step dash weaving through enemies.',
      }),
      mkForm(4, 11, 'Fourth Form: Striking Tide', 'upward_crescent', {
        forwardImpulse: 480,
        range: 195,
        reachY: 132,
        description: 'Turbulent multi-slash tide cleave.',
      }),
      mkForm(5, 11, 'Fifth Form: Blessed Rain After the Drought', 'forward_surge', {
        forwardImpulse: 560,
        range: 180,
        description: 'Graceful painless downward arc finishing weakened foes.',
      }),
      mkForm(6, 11, 'Sixth Form: Whirlpool', 'spin_wheel', {
        forwardImpulse: 360,
        range: 205,
        reachY: 145,
        description: 'Twisting spiral vortex slicing surrounding demons.',
      }),
      mkForm(7, 11, 'Seventh Form: Drop Ripple Thrust', 'pierce_thrust', {
        startup: 0.075,
        forwardImpulse: 690,
        range: 215,
        description: 'Zero-ripple pinpoint piercing thrust.',
      }),
      mkForm(8, 11, 'Eighth Form: Waterfall Basin', 'overhead_crush', {
        verticalImpulse: -260,
        forwardImpulse: 440,
        range: 205,
        knockbackY: 220,
        description: 'Crashing overhead waterfall cleave flattening foes.',
      }),
      mkForm(9, 11, 'Ninth Form: Splashing Water Flow, Turbulent', 'zigzag_blink', {
        forwardImpulse: 820,
        range: 215,
        description: 'High-mobility footing skimming waves across any terrain.',
      }),
      mkForm(10, 11, 'Tenth Form: Constant Flux', 'dragon_finisher', {
        forwardImpulse: 850,
        range: 255,
        reachY: 152,
        knockbackX: 860,
        knockbackY: -470,
        description: 'Continuously strengthening roaring water dragon surge.',
      }),
      mkForm(11, 11, 'Eleventh Form: Dead Calm', 'spin_wheel', {
        startup: 0.06,
        active: 0.32,
        forwardImpulse: 220,
        range: 260,
        reachY: 165,
        damageMult: 4.8,
        knockbackX: 880,
        knockbackY: -420,
        description: 'Giyu Tomioka’s serene defensive sphere nullifying all attacks.',
      }),
    ],
  },

  flame: {
    id: 'flame',
    name: 'Flame Breathing',
    primaryColor: '#f97316',
    secondaryColor: '#fef08a',
    glowColor: '#dc2626',
    bladeBaseColor: '#9a3412',
    bladeEdgeColor: '#fb923c',
    tsubaColor: '#eab308',
    forms: [
      mkForm(1, 9, 'First Form: Unknowing Fire', 'forward_surge', {
        forwardImpulse: 700,
        damageMult: 1.7,
        description: 'Blazing high-speed dash decapitation strike.',
      }),
      mkForm(2, 9, 'Second Form: Rising Scorching Sun', 'upward_crescent', {
        forwardImpulse: 270,
        verticalImpulse: -280,
        reachY: 145,
        description: 'Upward solar flame arc igniting airborne targets.',
      }),
      mkForm(3, 9, 'Third Form: Blazing Universe', 'overhead_crush', {
        forwardImpulse: 370,
        knockbackY: -380,
        description: 'Heavy downward inferno cleave with ember shockwave.',
      }),
      mkForm(4, 9, 'Fourth Form: Blooming Flame Undulation', 'spin_wheel', {
        forwardImpulse: 240,
        range: 190,
        reachY: 138,
        description: 'Circular fire vortex deflecting incoming strikes.',
      }),
      mkForm(5, 9, 'Fifth Form: Flame Tiger', 'dragon_finisher', {
        forwardImpulse: 820,
        damageMult: 3.45,
        range: 240,
        description: 'Roaring tiger of crimson flame.',
      }),
      mkUnknownForm(6, 9),
      mkUnknownForm(7, 9),
      mkUnknownForm(8, 9),
      mkForm(9, 9, 'Ninth Form: Rengoku', 'dragon_finisher', {
        forwardImpulse: 960,
        range: 280,
        reachY: 170,
        damageMult: 5.1,
        knockbackX: 940,
        knockbackY: -520,
        description: 'Esoteric Art carving a cataclysmic roaring dragon of fire.',
      }),
    ],
  },

  thunder: {
    id: 'thunder',
    name: 'Thunder Breathing',
    primaryColor: '#facc15',
    secondaryColor: '#fef9c3',
    glowColor: '#eab308',
    bladeBaseColor: '#854d0e',
    bladeEdgeColor: '#fde047',
    tsubaColor: '#cbd5e1',
    forms: [
      mkForm(1, 7, 'First Form: Thunderclap and Flash', 'zigzag_blink', {
        startup: 0.075,
        forwardImpulse: 980,
        range: 220,
        triggersRagdoll: true,
        description: 'Instantaneous godlike lightning dash slash.',
      }),
      mkForm(2, 7, 'Second Form: Rice Spirit', 'upward_crescent', {
        startup: 0.085,
        forwardImpulse: 460,
        range: 180,
        description: 'Five consecutive arched lightning slashes.',
      }),
      mkForm(3, 7, 'Third Form: Thunder Swarm', 'spin_wheel', {
        startup: 0.085,
        forwardImpulse: 320,
        range: 195,
        description: 'Radial storm of crackling yellow bolts.',
      }),
      mkForm(4, 7, 'Fourth Form: Distant Thunder', 'pierce_thrust', {
        startup: 0.095,
        forwardImpulse: 640,
        range: 235,
        description: 'Long-range piercing lightning lance.',
      }),
      mkForm(5, 7, 'Fifth Form: Heat Lightning', 'upward_crescent', {
        startup: 0.09,
        forwardImpulse: 560,
        range: 225,
        description: 'Single upward ripping stormbolt shattering flesh.',
      }),
      mkForm(6, 7, 'Sixth Form: Rumble and Flash', 'spin_wheel', {
        startup: 0.09,
        forwardImpulse: 480,
        range: 245,
        description: 'Relentless series of sweeping lightning shocks.',
      }),
      mkForm(7, 7, 'Seventh Form: Flaming Thunder God', 'dragon_finisher', {
        startup: 0.075,
        active: 0.25,
        forwardImpulse: 1120,
        range: 285,
        reachY: 165,
        damageMult: 5.0,
        knockbackX: 950,
        knockbackY: -510,
        description: 'Zenitsu’s original lightning dragon flash faster than sound.',
      }),
    ],
  },

  beast: {
    id: 'beast',
    name: 'Beast Breathing',
    primaryColor: '#94a3b8',
    secondaryColor: '#e2e8f0',
    glowColor: '#38bdf8',
    bladeBaseColor: '#334155',
    bladeEdgeColor: '#93c5fd',
    tsubaColor: '#64748b',
    forms: [
      mkForm(1, 11, 'First Fang: Pierce', 'pierce_thrust', {
        forwardImpulse: 560,
        range: 168,
        description: 'Fierce dual-blade forward fang thrust.',
      }),
      mkForm(2, 11, 'Second Fang: Slice', 'forward_surge', {
        forwardImpulse: 440,
        range: 168,
        description: 'Double X-shaped serrated cross-slash.',
      }),
      mkForm(3, 11, 'Third Fang: Devour', 'multi_dash', {
        forwardImpulse: 590,
        range: 182,
        description: 'Savage horizontal ripping twin strikes.',
      }),
      mkForm(4, 11, "Fourth Fang: Slice 'n' Dice", 'spin_wheel', {
        forwardImpulse: 460,
        range: 192,
        description: 'Wild spinning whirlwind of dual blades.',
      }),
      mkForm(5, 11, 'Fifth Fang: Crazy Cutting', 'overhead_crush', {
        verticalImpulse: -360,
        forwardImpulse: 540,
        range: 210,
        description: 'Leaping aerial berserker slam tearing everything.',
      }),
      mkForm(6, 11, 'Sixth Fang: Palisade Bite', 'forward_surge', {
        forwardImpulse: 500,
        range: 205,
        description: 'Jagged twin sawtooth decapitation bite.',
      }),
      mkForm(7, 11, 'Seventh Form: Spatial Awareness', 'zigzag_blink', {
        forwardImpulse: 680,
        range: 235,
        description: 'Sensory vibration lock-on pouncing across wide ground.',
      }),
      mkForm(8, 11, 'Eighth Form: Explosive Rush', 'multi_dash', {
        forwardImpulse: 880,
        range: 240,
        description: 'Reckless full-speed boar charge ignoring defense.',
      }),
      mkForm(9, 11, 'Ninth Fang: Extending Bendy Slash', 'whip_sweep', {
        forwardImpulse: 620,
        range: 255,
        description: 'Dislocated-joint ultra-long lunging slash.',
      }),
      mkForm(10, 11, 'Tenth Fang: Whirling Fangs', 'spin_wheel', {
        forwardImpulse: 540,
        range: 250,
        reachY: 155,
        damageMult: 4.35,
        description: 'High-RPM spinning dual-sword cyclone.',
      }),
      mkForm(11, 11, 'Improvised: Throwing Strike', 'dragon_finisher', {
        forwardImpulse: 740,
        range: 280,
        damageMult: 4.65,
        knockbackX: 880,
        knockbackY: -470,
        description: 'Wild hurling dual-blade finisher catching escaping demons.',
      }),
    ],
  },

  wind: {
    id: 'wind',
    name: 'Wind Breathing',
    primaryColor: '#34d399',
    secondaryColor: '#ecfdf5',
    glowColor: '#059669',
    bladeBaseColor: '#047857',
    bladeEdgeColor: '#6ee7b7',
    tsubaColor: '#cbd5e1',
    forms: [
      mkForm(1, 9, 'First Form: Dust Whirlwind Cutter', 'forward_surge', {
        startup: 0.08,
        forwardImpulse: 760,
        range: 195,
        triggersRagdoll: true,
        description: 'Cyclone-fast forward gale dash tearing demon guards.',
      }),
      mkForm(2, 9, 'Second Form: Claws-Purifying Wind', 'upward_crescent', {
        forwardImpulse: 440,
        range: 185,
        reachY: 140,
        description: 'Four sweeping claw-like emerald wind arcs.',
      }),
      mkForm(3, 9, 'Third Form: Clean Storm Wind Tree', 'spin_wheel', {
        forwardImpulse: 340,
        range: 205,
        description: 'Defensive whirlwind vortex slicing everything nearby.',
      }),
      mkForm(4, 9, 'Fourth Form: Rising Dust Storm', 'upward_crescent', {
        verticalImpulse: -340,
        forwardImpulse: 490,
        range: 215,
        description: 'Violent rising spiral of razor air currents.',
      }),
      mkForm(5, 9, 'Fifth Form: Cold Mountain Wind', 'overhead_crush', {
        verticalImpulse: -360,
        forwardImpulse: 520,
        range: 225,
        description: 'Descending circular gale shredding everything below.',
      }),
      mkForm(6, 9, 'Sixth Form: Black Wind Mountain Mist', 'upward_crescent', {
        forwardImpulse: 640,
        range: 235,
        description: 'Sudden uppercut tempest splitting demon limbs.',
      }),
      mkForm(7, 9, 'Seventh Form: Gale, Sudden Gusts', 'zigzag_blink', {
        forwardImpulse: 840,
        range: 240,
        description: 'Mid-air gale leap slashing with tornado pressure.',
      }),
      mkForm(8, 9, 'Eighth Form: Primary Gale Slash', 'multi_dash', {
        forwardImpulse: 880,
        range: 255,
        description: 'Relentless torrential wind circular cuts.',
      }),
      mkForm(9, 9, 'Ninth Form: Idaten Typhoon', 'dragon_finisher', {
        verticalImpulse: -380,
        forwardImpulse: 900,
        range: 275,
        reachY: 165,
        damageMult: 4.8,
        knockbackX: 900,
        knockbackY: -500,
        description: 'Backflip hurricane unleashing ferocious emerald gusts.',
      }),
    ],
  },

  stone: {
    id: 'stone',
    name: 'Stone Breathing',
    primaryColor: '#a8a29e',
    secondaryColor: '#e7e5e4',
    glowColor: '#57534e',
    bladeBaseColor: '#44403c',
    bladeEdgeColor: '#d6d3d1',
    tsubaColor: '#78716c',
    forms: [
      mkForm(1, 5, 'First Form: Serpentinite Bipolar', 'overhead_crush', {
        startup: 0.15,
        forwardImpulse: 340,
        range: 210,
        damageMult: 1.85,
        triggersRagdoll: true,
        knockbackX: 520,
        description: 'Crushing heavy flail-and-axe twin strike.',
      }),
      mkForm(2, 5, 'Second Form: Upper Smash', 'upward_crescent', {
        startup: 0.16,
        forwardImpulse: 300,
        range: 215,
        reachY: 148,
        damageMult: 2.4,
        description: 'Boulder-splitting upward heave.',
      }),
      mkForm(3, 5, 'Third Form: Stone Skin', 'spin_wheel', {
        startup: 0.14,
        forwardImpulse: 240,
        range: 225,
        damageMult: 3.0,
        description: 'Armored rotating chain shockwave deflecting foes.',
      }),
      mkForm(4, 5, 'Fourth Form: Volcanic Rock, Rapid Conquest', 'whip_sweep', {
        startup: 0.16,
        forwardImpulse: 460,
        range: 255,
        damageMult: 3.7,
        description: 'Wide sweeping iron chain and axe devastation.',
      }),
      mkForm(5, 5, 'Fifth Form: Arcs of Justice', 'overhead_crush', {
        startup: 0.19,
        forwardImpulse: 540,
        range: 275,
        reachY: 170,
        damageMult: 4.75,
        knockbackX: 940,
        knockbackY: -510,
        description: 'Earth-shattering synchronized flail and axe impact.',
      }),
    ],
  },

  mist: {
    id: 'mist',
    name: 'Mist Breathing',
    primaryColor: '#a5f3fc',
    secondaryColor: '#f0fdfa',
    glowColor: '#5eead4',
    bladeBaseColor: '#0f766e',
    bladeEdgeColor: '#ccfbf1',
    tsubaColor: '#99f6e4',
    forms: [
      mkForm(1, 7, 'First Form: Low Clouds, Distant Haze', 'pierce_thrust', {
        startup: 0.075,
        forwardImpulse: 640,
        range: 175,
        description: 'Low-stance swift deceptive thrust.',
      }),
      mkForm(2, 7, 'Second Form: Eight-Layered Mist', 'upward_crescent', {
        forwardImpulse: 460,
        range: 180,
        description: 'Eight rapid overlapping misty blade arcs.',
      }),
      mkForm(3, 7, 'Third Form: Scattering Mist Splash', 'spin_wheel', {
        forwardImpulse: 330,
        range: 200,
        description: 'Circular slash dispersing shrouding fog.',
      }),
      mkForm(4, 7, 'Fourth Form: Shifting Flow Slash', 'zigzag_blink', {
        startup: 0.07,
        forwardImpulse: 820,
        range: 215,
        description: 'Phantom blink step vanishing behind mist.',
      }),
      mkForm(5, 7, 'Fifth Form: Sea of Clouds and Haze', 'multi_dash', {
        forwardImpulse: 860,
        range: 245,
        description: 'High-speed mist storm shrouding the battlefield.',
      }),
      mkForm(6, 7, 'Sixth Form: Lunar Dispersing Mist', 'upward_crescent', {
        verticalImpulse: -380,
        forwardImpulse: 560,
        range: 250,
        description: 'Leaping downward multi-slash mist rain.',
      }),
      mkForm(7, 7, 'Seventh Form: Obscuring Clouds', 'dragon_finisher', {
        startup: 0.07,
        forwardImpulse: 960,
        range: 265,
        damageMult: 4.75,
        description: 'Muichiro’s blinding speed vanishing illusion strike.',
      }),
    ],
  },

  love: {
    id: 'love',
    name: 'Love Breathing',
    primaryColor: '#f472b6',
    secondaryColor: '#fce7f3',
    glowColor: '#db2777',
    bladeBaseColor: '#9d174d',
    bladeEdgeColor: '#fbcfe8',
    tsubaColor: '#f472b6',
    forms: [
      mkForm(1, 6, 'First Form: Shivers of First Love', 'whip_sweep', {
        forwardImpulse: 440,
        range: 215,
        reachY: 118,
        description: 'Extended whip-blade multi-sweep.',
      }),
      mkForm(2, 6, 'Second Form: Love Pangs', 'upward_crescent', {
        forwardImpulse: 360,
        range: 225,
        reachY: 145,
        description: 'Long-range curving ribbon lash.',
      }),
      mkForm(3, 6, 'Third Form: Catlove Shower', 'spin_wheel', {
        verticalImpulse: -360,
        forwardImpulse: 390,
        range: 230,
        description: 'Acrobatic leaping barrage of whip arcs.',
      }),
      mkUnknownForm(4, 6),
      mkForm(5, 6, 'Fifth Form: Swaying Love, Wildclaw', 'whip_sweep', {
        verticalImpulse: -320,
        forwardImpulse: 600,
        range: 255,
        reachY: 150,
        description: 'Mid-air somersault spiral tearing wide areas.',
      }),
      mkForm(6, 6, 'Sixth Form: Cat-Legged Winds of Love', 'dragon_finisher', {
        forwardImpulse: 730,
        range: 275,
        reachY: 160,
        damageMult: 4.55,
        description: 'Twirling cyclone of flexible pink razor ribbons.',
      }),
    ],
  },

  serpent: {
    id: 'serpent',
    name: 'Serpent Breathing',
    primaryColor: '#34d399',
    secondaryColor: '#d1fae5',
    glowColor: '#059669',
    bladeBaseColor: '#065f46',
    bladeEdgeColor: '#6ee7b7',
    tsubaColor: '#eab308',
    forms: [
      mkForm(1, 5, 'First Form: Winding Serpent Slash', 'whip_sweep', {
        forwardImpulse: 530,
        range: 180,
        description: 'Twisting S-curve slash bypassing guards.',
      }),
      mkForm(2, 5, 'Second Form: Venom Fangs of the Narrow Head', 'zigzag_blink', {
        forwardImpulse: 730,
        range: 198,
        description: 'Sudden curving strike slipping behind enemies.',
      }),
      mkForm(3, 5, 'Third Form: Coil Choke', 'spin_wheel', {
        forwardImpulse: 460,
        range: 205,
        description: 'Encircling serpentine vortex.',
      }),
      mkForm(4, 5, 'Fourth Form: Twin-Headed Reptile', 'multi_dash', {
        forwardImpulse: 680,
        range: 220,
        description: 'Twin weaving horizontal lunges.',
      }),
      mkForm(5, 5, 'Fifth Form: Slithering Serpent', 'dragon_finisher', {
        forwardImpulse: 840,
        range: 255,
        damageMult: 4.45,
        description: 'Relentless multi-curved serpent fang barrage.',
      }),
    ],
  },

  flower: {
    id: 'flower',
    name: 'Flower Breathing',
    primaryColor: '#fb7185',
    secondaryColor: '#ffe4e6',
    glowColor: '#e11d48',
    bladeBaseColor: '#be123c',
    bladeEdgeColor: '#fda4af',
    tsubaColor: '#f9a8d4',
    forms: [
      mkUnknownForm(1, 7),
      mkForm(2, 7, 'Second Form: Honorable Shadow Plum', 'spin_wheel', {
        forwardImpulse: 420,
        range: 190,
        reachY: 135,
        description: 'Deflecting petal flurry spinning outward in layered arcs.',
      }),
      mkUnknownForm(3, 7),
      mkForm(4, 7, 'Fourth Form: Crimson Hanagoromo', 'upward_crescent', {
        forwardImpulse: 560,
        range: 210,
        reachY: 145,
        description: 'Curving scarlet sleeve-like slash cutting cleanly through mist.',
      }),
      mkForm(5, 7, 'Fifth Form: Peonies of Futility', 'multi_dash', {
        forwardImpulse: 720,
        range: 225,
        description: 'Graceful ninefold flurry of swirling crimson peony petals.',
      }),
      mkForm(6, 7, 'Sixth Form: Whirling Peach', 'zigzag_blink', {
        verticalImpulse: -280,
        forwardImpulse: 790,
        range: 235,
        description: 'Evading aerial twist returning an instant counter slash.',
      }),
      mkForm(7, 7, 'Final Form: Equinoctial Vermilion Eye', 'dragon_finisher', {
        startup: 0.06,
        active: 0.24,
        forwardImpulse: 960,
        range: 265,
        reachY: 155,
        damageMult: 4.85,
        knockbackX: 890,
        knockbackY: -480,
        description: 'Heightened crimson vision slowing time to strike demon necks cleanly.',
      }),
    ],
  },

  insect: {
    id: 'insect',
    name: 'Insect Breathing',
    primaryColor: '#c084fc',
    secondaryColor: '#f3e8ff',
    glowColor: '#9333ea',
    bladeBaseColor: '#581c87',
    bladeEdgeColor: '#e9d5ff',
    tsubaColor: '#a855f7',
    forms: [
      mkForm(1, 4, 'Butterfly Dance: Caprice', 'pierce_thrust', {
        startup: 0.06,
        verticalImpulse: -280,
        forwardImpulse: 540,
        range: 185,
        description: 'Agile aerial stinger injecting wisteria venom.',
      }),
      mkForm(2, 4, 'Dance of the Bee Sting: True Flutter', 'pierce_thrust', {
        startup: 0.065,
        forwardImpulse: 790,
        range: 208,
        damageMult: 2.35,
        description: 'Blindingly fast single-point piercing thrust.',
      }),
      mkForm(3, 4, 'Dance of the Dragonfly: Compound Eye Hexagon', 'zigzag_blink', {
        startup: 0.07,
        forwardImpulse: 680,
        range: 215,
        damageMult: 3.1,
        description: 'Rapid six-hit hexagonal stinger flurry.',
      }),
      mkForm(4, 4, 'Dance of the Centipede: Hundred-Legged Zigzag', 'multi_dash', {
        startup: 0.075,
        forwardImpulse: 940,
        range: 255,
        damageMult: 4.35,
        triggersRagdoll: true,
        description: 'Bridge-shattering unpredictable zigzag venom rush.',
      }),
    ],
  },

  sound: {
    id: 'sound',
    name: 'Sound Breathing',
    primaryColor: '#fbbf24',
    secondaryColor: '#fef3c7',
    glowColor: '#f43f5e',
    bladeBaseColor: '#92400e',
    bladeEdgeColor: '#fde68a',
    tsubaColor: '#f59e0b',
    forms: [
      mkForm(1, 5, 'First Form: Roar', 'overhead_crush', {
        forwardImpulse: 410,
        range: 195,
        triggersRagdoll: true,
        description: 'Twin-cleaver slam triggering sonic gunpowder detonations.',
      }),
      mkUnknownForm(2, 5),
      mkUnknownForm(3, 5),
      mkForm(4, 5, 'Fourth Form: Constant Resounding Slashes', 'spin_wheel', {
        forwardImpulse: 580,
        range: 235,
        reachY: 145,
        damageMult: 3.35,
        description: 'Spinning cleaver defense bursting with anti-demon bombs.',
      }),
      mkForm(5, 5, 'Fifth Form: String Performance', 'dragon_finisher', {
        forwardImpulse: 790,
        range: 265,
        reachY: 155,
        damageMult: 4.5,
        description: 'Relentless chain of flamboyant explosive Musical Score cleaves.',
      }),
    ],
  },

  sun: {
    id: 'sun',
    name: 'Sun Breathing',
    primaryColor: '#fb7185',
    secondaryColor: '#fde047',
    glowColor: '#ea580c',
    bladeBaseColor: '#09090b',
    bladeEdgeColor: '#f97316',
    tsubaColor: '#dc2626',
    forms: [
      mkForm(1, 13, 'First Form: Dance (Waltz)', 'overhead_crush', {
        forwardImpulse: 540,
        damageMult: 1.85,
        triggersRagdoll: true,
        description: 'Single blazing high-arc solar cleave.',
      }),
      mkForm(2, 13, 'Second Form: Clear Blue Sky', 'spin_wheel', {
        forwardImpulse: 360,
        range: 195,
        reachY: 150,
        description: '360-degree crimson solar ring.',
      }),
      mkForm(3, 13, 'Third Form: Raging Sun', 'multi_dash', {
        forwardImpulse: 640,
        range: 205,
        description: 'Two overlapping horizontal solar arcs.',
      }),
      mkForm(4, 13, 'Fourth Form: Burning Bones, Summer Sun', 'spin_wheel', {
        forwardImpulse: 420,
        range: 215,
        description: 'Spiral defensive dome deflecting demonic tentacles.',
      }),
      mkForm(5, 13, 'Fifth Form: Setting Sun Transformation', 'upward_crescent', {
        verticalImpulse: -360,
        forwardImpulse: 520,
        range: 220,
        description: 'Inverted aerial flip delivering an overhead sun slash.',
      }),
      mkForm(6, 13, 'Sixth Form: Solar Heat Haze', 'forward_surge', {
        forwardImpulse: 720,
        range: 230,
        description: 'Heat-mirage slash lengthening reach deceptively.',
      }),
      mkForm(7, 13, 'Seventh Form: Beneficent Radiance', 'upward_crescent', {
        verticalImpulse: -410,
        forwardImpulse: 480,
        range: 225,
        description: 'Rising spiral of blazing golden sunfire.',
      }),
      mkForm(8, 13, 'Eighth Form: Sunflower Thrust', 'pierce_thrust', {
        startup: 0.075,
        forwardImpulse: 840,
        range: 245,
        description: 'Piercing solar beam thrust shattering Upper defenses.',
      }),
      mkForm(9, 13, 'Ninth Form: Dragon Sun Halo Head Dance', 'dragon_finisher', {
        forwardImpulse: 920,
        range: 265,
        reachY: 155,
        description: 'Mythic solar dragon sweep scorching multiple foes.',
      }),
      mkForm(10, 13, 'Tenth Form: Fire Wheel', 'spin_wheel', {
        verticalImpulse: -320,
        forwardImpulse: 660,
        range: 235,
        description: 'Spinning vertical fire wheel cleaving behind targets.',
      }),
      mkForm(11, 13, 'Eleventh Form: Fake Rainbow', 'zigzag_blink', {
        startup: 0.065,
        forwardImpulse: 980,
        range: 230,
        description: 'High-speed heat afterimage evasion dash-slash.',
      }),
      mkForm(12, 13, 'Twelfth Form: Flame Dance', 'multi_dash', {
        forwardImpulse: 780,
        range: 255,
        description: 'Two-combo downward and horizontal blazing dance.',
      }),
      mkForm(13, 13, 'Thirteenth Form', 'dragon_finisher', {
        startup: 0.08,
        active: 0.42,
        recovery: 0.24,
        forwardImpulse: 1050,
        range: 295,
        reachY: 175,
        damageMult: 5.6,
        knockbackX: 980,
        knockbackY: -540,
        energyCost: 58,
        cooldown: 9.2,
        isSun13thCombo: true,
        description: 'Chains Forms 1 through 12 in an unbroken solar dance against Muzan.',
      }),
    ],
  },

  moon: {
    id: 'moon',
    name: 'Moon Breathing',
    primaryColor: '#a855f7',
    secondaryColor: '#f5d0fe',
    glowColor: '#7e22ce',
    bladeBaseColor: '#4c1d95',
    bladeEdgeColor: '#e879f9',
    tsubaColor: '#c084fc',
    forms: [
      mkForm(1, 16, 'First Form: Dark Moon, Evening Palace', 'forward_surge', {
        forwardImpulse: 680,
        range: 205,
        description: 'Instant draw-slash releasing crescent moon blades.',
      }),
      mkForm(2, 16, 'Second Form: Pearl Flower Moongazing', 'upward_crescent', {
        forwardImpulse: 480,
        range: 205,
        description: 'Several shielding crescent arcs erupting upward.',
      }),
      mkForm(3, 16, 'Third Form: Loathsome Moon, Chains', 'spin_wheel', {
        forwardImpulse: 440,
        range: 225,
        description: 'Twin sweeping moon arcs spawning razor crescents.',
      }),
      mkUnknownForm(4, 16),
      mkForm(5, 16, 'Fifth Form: Moon Spirit Calamitous Eddy', 'upward_crescent', {
        verticalImpulse: -280,
        forwardImpulse: 520,
        range: 235,
        description: 'Curving layered crescent tornado shredding enemies.',
      }),
      mkForm(6, 16, 'Sixth Form: Perpetual Night, Lonely Moon - Incessant', 'multi_dash', {
        forwardImpulse: 760,
        range: 245,
        description: 'Torrential barrage of wild crescent slashes.',
      }),
      mkForm(7, 16, 'Seventh Form: Mirror of Misfortune, Moonlit', 'whip_sweep', {
        forwardImpulse: 600,
        range: 265,
        description: 'Massive wide crescent wave splitting grounds in five directions.',
      }),
      mkForm(8, 16, 'Eighth Form: Moon-Dragon Ringtail', 'dragon_finisher', {
        forwardImpulse: 820,
        range: 270,
        description: 'Colossal tri-crescent dragon wave obliterating guards.',
      }),
      mkForm(9, 16, 'Ninth Form: Waning Moonswaths', 'multi_dash', {
        forwardImpulse: 840,
        range: 265,
        description: 'Continuous storm of descending crescent blades.',
      }),
      mkForm(10, 16, 'Tenth Form: Drilling Slashes, Moon Through Bamboo Leaves', 'pierce_thrust', {
        forwardImpulse: 860,
        range: 275,
        description: 'Tri-layer spinning moon buzzsaws drilling forward.',
      }),
      mkUnknownForm(11, 16),
      mkUnknownForm(12, 16),
      mkUnknownForm(13, 16),
      mkForm(14, 16, 'Fourteenth Form: Catastrophe, Tenman Crescent Moon', 'dragon_finisher', {
        forwardImpulse: 900,
        range: 290,
        reachY: 175,
        description: 'Titanic omni-directional vortex of crescent moon blades.',
      }),
      mkUnknownForm(15, 16),
      mkForm(16, 16, 'Sixteenth Form: Moonbow, Half Moon', 'overhead_crush', {
        verticalImpulse: -360,
        forwardImpulse: 960,
        range: 310,
        reachY: 185,
        damageMult: 5.5,
        knockbackX: 980,
        knockbackY: -540,
        description: 'Six crashing vertical crescent moonbeams shattering the floor.',
      }),
    ],
  },
};

export const ALL_BREATHING_IDS = Object.keys(BREATHING_STYLES) as BreathingStyleId[];

export interface AwakeningTierSpec {
  id: AwakeningTierId;
  name: string;
  requiredLevel: number;
  duration: number;
  damageBonus: number;
  speedBonus: number;
  badgeColor: string;
  summary: string;
}

export const AWAKENING_SPECS: Record<AwakeningTierId, AwakeningTierSpec> = {
  mark: {
    id: 'mark',
    name: 'Demon Slayer Mark',
    requiredLevel: 1,
    duration: 12,
    damageBonus: 0.22,
    speedBonus: 0.14,
    badgeColor: '#ef4444',
    summary: 'Manifests forehead mark: +22% Attack, +14% Speed & faster Breathing recovery.',
  },
  transparent_world: {
    id: 'transparent_world',
    name: 'Transparent World',
    requiredLevel: 4,
    duration: 13,
    damageBonus: 0.28,
    speedBonus: 0.2,
    badgeColor: '#38bdf8',
    summary: 'X-Ray vision revealing demon skeletons, vital organs & weak points (+22% crits) while slowing enemy strikes.',
  },
  red_blade: {
    id: 'red_blade',
    name: 'Bright Red Nichirin Blade',
    requiredLevel: 7,
    duration: 13,
    damageBonus: 0.34,
    speedBonus: 0.16,
    badgeColor: '#dc2626',
    summary: 'Scorches blade crimson: suppresses demon cellular regeneration and inflicts burning damage.',
  },
  selfless_state: {
    id: 'selfless_state',
    name: 'Selfless State',
    requiredLevel: 10,
    duration: 14,
    damageBonus: 0.38,
    speedBonus: 0.24,
    badgeColor: '#a5f3fc',
    summary: 'Erases fighting spirit: evades Akaza Compass tracking & grants counter-guard poise.',
  },
  transcendent: {
    id: 'transcendent',
    name: 'Transcendent Slayer Mode',
    requiredLevel: 14,
    duration: 15,
    damageBonus: 0.48,
    speedBonus: 0.28,
    badgeColor: '#fbbf24',
    summary: 'Fuses Mark, Transparent World, Bright Red Blade & Selfless State simultaneously.',
  },
};

export function getUnlockedAwakeningsForLevel(playerLevel: number): AwakeningTierId[] {
  const safeLv = Math.max(1, Math.floor(playerLevel));
  return (Object.values(AWAKENING_SPECS) as AwakeningTierSpec[])
    .filter((tier) => safeLv >= tier.requiredLevel)
    .map((tier) => tier.id);
}

export interface UltimateAttackSpec {
  id: UltimateId;
  name: string;
  price: number;
  cooldown: number;
  energyCost: number;
  damageMult: number;
  range: number;
  reachY: number;
  forwardImpulse: number;
  color: string;
  secondaryColor: string;
  description: string;
}

export const ULTIMATE_SPECS: Record<UltimateId, UltimateAttackSpec> = {
  eternal_sun: {
    id: 'eternal_sun',
    name: 'Eternal Sun Judgment',
    price: 0,
    cooldown: 14,
    energyCost: 35,
    damageMult: 5.4,
    range: 310,
    reachY: 185,
    forwardImpulse: 920,
    color: '#fb7185',
    secondaryColor: '#fde047',
    description: 'Blazing solar horizon cleave burning demons with radiant sunfire.',
  },
  crimson_dragon: {
    id: 'crimson_dragon',
    name: 'Crimson Dragon Tempest',
    price: 240,
    cooldown: 14,
    energyCost: 38,
    damageMult: 5.65,
    range: 325,
    reachY: 180,
    forwardImpulse: 960,
    color: '#f97316',
    secondaryColor: '#fef08a',
    description: 'Spiraling flame & water dragon rush shattering Upper Moon armor.',
  },
  solar_annihilation: {
    id: 'solar_annihilation',
    name: 'Solar Annihilation Halo',
    price: 300,
    cooldown: 15,
    energyCost: 40,
    damageMult: 5.9,
    range: 340,
    reachY: 195,
    forwardImpulse: 880,
    color: '#ef4444',
    secondaryColor: '#fbbf24',
    description: 'Massive 360-degree sunrise detonation purging nearby Blood Demon Arts.',
  },
  transparent_counter: {
    id: 'transparent_counter',
    name: 'Transparent World Piercer',
    price: 320,
    cooldown: 13,
    energyCost: 34,
    damageMult: 5.5,
    range: 315,
    reachY: 170,
    forwardImpulse: 1080,
    color: '#38bdf8',
    secondaryColor: '#e0f2fe',
    description: 'Time-slowing precision flash targeting lethal demonic vital cores.',
  },
  red_moon_execution: {
    id: 'red_moon_execution',
    name: 'Red Moon Execution',
    price: 360,
    cooldown: 15,
    energyCost: 40,
    damageMult: 6.0,
    range: 335,
    reachY: 190,
    forwardImpulse: 940,
    color: '#a855f7',
    secondaryColor: '#f43f5e',
    description: 'Sixfold scarlet crescent deluge halting demon regeneration.',
  },
  absolute_zero: {
    id: 'absolute_zero',
    name: 'Dead Calm: Absolute Stillness',
    price: 380,
    cooldown: 15,
    energyCost: 38,
    damageMult: 5.75,
    range: 350,
    reachY: 195,
    forwardImpulse: 760,
    color: '#22d3ee',
    secondaryColor: '#ecfeff',
    description: 'Sub-zero serene domain severing every hostile strike in range.',
  },
  final_judgment: {
    id: 'final_judgment',
    name: 'Hinokami Final Judgment',
    price: 480,
    cooldown: 16,
    energyCost: 42,
    damageMult: 6.45,
    range: 365,
    reachY: 205,
    forwardImpulse: 1040,
    color: '#facc15',
    secondaryColor: '#dc2626',
    description: 'Ultimate Demon Slayer Corps crescendo breaking even Muzan Kibutsuji.',
  },
};

export function getHighestAwakeningTier(unlocked: AwakeningTierId[]): AwakeningTierId {
  const order: AwakeningTierId[] = ['transcendent', 'selfless_state', 'red_blade', 'transparent_world', 'mark'];
  for (const id of order) {
    if (unlocked.includes(id)) return id;
  }
  return 'mark';
}

export function buildBreathingAttackSpec(
  styleId: BreathingStyleId,
  formIndex: number,
  damageMult: number
): AttackSpec {
  const style = BREATHING_STYLES[styleId];
  const safeIdx = Math.max(1, Math.min(style.forms.length, formIndex));
  const form = style.forms[safeIdx - 1];
  const kindMap: Record<number, AttackSpec['kind']> = {
    1: 'BREATHING_1',
    2: 'BREATHING_2',
    3: 'BREATHING_3',
    4: 'BREATHING_4',
    5: 'BREATHING_5',
  };

  return {
    kind: kindMap[safeIdx] ?? 'BREATHING_FORM',
    damage: Math.round(14 * form.damageMult * damageMult),
    startup: form.startup,
    active: form.active,
    recovery: form.recovery,
    knockbackX: form.knockbackX,
    knockbackY: form.knockbackY,
    triggersRagdoll: form.triggersRagdoll,
    hitstop: form.hitstop,
    range: form.range,
    reachY: form.reachY,
    forwardImpulse: form.forwardImpulse,
    verticalImpulse: form.verticalImpulse,
    motionPattern: form.motionPattern,
    breathingStyle: styleId,
    formIndex: safeIdx,
    isSun13thCombo: form.isSun13thCombo,
    poisonDps: styleId === 'insect' ? 4 + safeIdx * 1.6 : 0,
  };
}

export function buildUltimateAttackSpec(
  ultimateId: UltimateId,
  styleId: BreathingStyleId,
  damageMult: number
): AttackSpec {
  const ult = ULTIMATE_SPECS[ultimateId] ?? ULTIMATE_SPECS.eternal_sun;
  return {
    kind: 'ULTIMATE_ATTACK',
    damage: Math.round(15 * ult.damageMult * damageMult),
    startup: 0.14,
    active: 0.36,
    recovery: 0.28,
    knockbackX: 980,
    knockbackY: -520,
    triggersRagdoll: true,
    hitstop: 0.095,
    range: ult.range,
    reachY: ult.reachY,
    forwardImpulse: ult.forwardImpulse,
    verticalImpulse: -180,
    motionPattern: 'dragon_finisher',
    breathingStyle: styleId,
    ultimateId,
    poisonDps: styleId === 'insect' ? 10 : 0,
  };
}
