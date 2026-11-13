import { FORM_ENERGY_COSTS } from './constants';
import { AttackSpec, BreathingFormSpec, BreathingStyleDef, BreathingStyleId } from './types';

function mkForm(
  index: 1 | 2 | 3 | 4 | 5,
  name: string,
  motionPattern: BreathingFormSpec['motionPattern'],
  overrides: Partial<BreathingFormSpec> & { description: string }
): BreathingFormSpec {
  const baseDmg = [1.55, 2.05, 2.6, 3.25, 4.1][index - 1];
  const baseCd = [2.2, 3.4, 4.6, 5.8, 7.5][index - 1];
  return {
    index,
    name,
    energyCost: FORM_ENERGY_COSTS[index],
    cooldown: overrides.cooldown ?? baseCd,
    damageMult: overrides.damageMult ?? baseDmg,
    range: overrides.range ?? 138 + index * 18,
    reachY: overrides.reachY ?? 102 + index * 8,
    startup: overrides.startup ?? 0.1 + index * 0.015,
    active: overrides.active ?? 0.17 + index * 0.02,
    recovery: overrides.recovery ?? 0.18 + index * 0.015,
    forwardImpulse: overrides.forwardImpulse ?? 320 + index * 75,
    verticalImpulse: overrides.verticalImpulse ?? 0,
    knockbackX: overrides.knockbackX ?? 380 + index * 95,
    knockbackY: overrides.knockbackY ?? -220 - index * 55,
    triggersRagdoll: overrides.triggersRagdoll ?? index >= 3,
    hitstop: overrides.hitstop ?? 0.045 + index * 0.01,
    motionPattern,
    description: overrides.description,
  };
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
      mkForm(1, 'First Form: Water Surface Slash', 'forward_surge', {
        forwardImpulse: 620,
        range: 175,
        triggersRagdoll: true,
        description: 'Fast horizontal wave surge slicing forward.',
      }),
      mkForm(2, 'Second Form: Water Wheel', 'spin_wheel', {
        verticalImpulse: -420,
        forwardImpulse: 280,
        range: 150,
        reachY: 138,
        description: 'Leaping 360-degree spinning water arc.',
      }),
      mkForm(3, 'Third Form: Flowing Dance', 'multi_dash', {
        forwardImpulse: 740,
        range: 185,
        description: 'Fluid multi-step dash weaving through enemies.',
      }),
      mkForm(4, 'Fourth Form: Striking Tide', 'upward_crescent', {
        forwardImpulse: 460,
        range: 195,
        reachY: 130,
        description: 'Turbulent rising tide cleave launching demons.',
      }),
      mkForm(5, 'Fifth Form: Constant Flux Dragon', 'dragon_finisher', {
        forwardImpulse: 820,
        range: 245,
        reachY: 145,
        knockbackX: 840,
        knockbackY: -470,
        description: 'Roaring water dragon surge that shatters guards.',
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
      mkForm(1, 'First Form: Unknowing Fire', 'forward_surge', {
        forwardImpulse: 680,
        damageMult: 1.7,
        description: 'Blazing high-speed dash decapitation strike.',
      }),
      mkForm(2, 'Second Form: Rising Scorching Sun', 'upward_crescent', {
        forwardImpulse: 260,
        verticalImpulse: -260,
        reachY: 145,
        description: 'Upward solar flame arc igniting airborne targets.',
      }),
      mkForm(3, 'Third Form: Blazing Universe', 'overhead_crush', {
        forwardImpulse: 350,
        knockbackY: -380,
        description: 'Heavy downward inferno cleave with ember shockwave.',
      }),
      mkForm(4, 'Fourth Form: Blooming Flame Undulation', 'spin_wheel', {
        forwardImpulse: 220,
        range: 185,
        reachY: 135,
        description: 'Circular fire vortex deflecting incoming strikes.',
      }),
      mkForm(5, 'Fifth Form: Flame Tiger', 'dragon_finisher', {
        forwardImpulse: 850,
        damageMult: 4.35,
        range: 250,
        knockbackX: 880,
        knockbackY: -480,
        description: 'Colossal roaring tiger of fire obliterating foes.',
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
      mkForm(1, 'First Form: Thunderclap and Flash', 'zigzag_blink', {
        startup: 0.08,
        forwardImpulse: 960,
        range: 210,
        triggersRagdoll: true,
        description: 'Instantaneous godlike lightning dash slash.',
      }),
      mkForm(2, 'Second Form: Rice Spirit', 'upward_crescent', {
        startup: 0.09,
        forwardImpulse: 440,
        range: 175,
        description: 'Five consecutive arched lightning slashes.',
      }),
      mkForm(3, 'Third Form: Thunder Swarm', 'spin_wheel', {
        startup: 0.09,
        forwardImpulse: 310,
        range: 190,
        description: 'Radial storm of crackling yellow bolts.',
      }),
      mkForm(4, 'Fourth Form: Distant Thunder', 'pierce_thrust', {
        startup: 0.1,
        forwardImpulse: 640,
        range: 230,
        description: 'Long-range piercing lightning lance.',
      }),
      mkForm(5, 'Fifth Form: Heat Lightning', 'dragon_finisher', {
        startup: 0.1,
        forwardImpulse: 1020,
        range: 265,
        damageMult: 4.2,
        description: 'Blinding zigzag thunderbolt surge.',
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
      mkForm(1, 'First Fang: Pierce', 'pierce_thrust', {
        forwardImpulse: 560,
        range: 165,
        description: 'Fierce dual-blade forward fang thrust.',
      }),
      mkForm(2, 'Second Fang: Slice', 'forward_surge', {
        forwardImpulse: 420,
        range: 165,
        description: 'Double X-shaped serrated cross-slash.',
      }),
      mkForm(3, 'Third Fang: Devour', 'multi_dash', {
        forwardImpulse: 580,
        range: 180,
        description: 'Savage horizontal ripping twin strikes.',
      }),
      mkForm(4, 'Fourth Fang: Slice N Dice', 'spin_wheel', {
        forwardImpulse: 450,
        range: 190,
        description: 'Wild spinning whirlwind of dual blades.',
      }),
      mkForm(5, 'Fifth Fang: Crazy Cutting', 'overhead_crush', {
        verticalImpulse: -380,
        forwardImpulse: 540,
        range: 215,
        damageMult: 4.15,
        description: 'Leaping aerial berserker slam tearing everything.',
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
      mkForm(1, 'Butterfly Dance: Caprice', 'pierce_thrust', {
        startup: 0.06,
        verticalImpulse: -280,
        forwardImpulse: 520,
        description: 'Agile aerial stinger injecting wisteria venom.',
      }),
      mkForm(2, 'Dance of the Bee Sting', 'pierce_thrust', {
        startup: 0.065,
        forwardImpulse: 760,
        range: 195,
        description: 'Blindingly fast single-point piercing thrust.',
      }),
      mkForm(3, 'Dance of the Dragonfly', 'zigzag_blink', {
        startup: 0.07,
        forwardImpulse: 620,
        range: 185,
        description: 'Rapid hexagonal stinger flurry.',
      }),
      mkForm(4, 'Dance of the Centipede', 'multi_dash', {
        startup: 0.08,
        forwardImpulse: 880,
        range: 215,
        description: 'Unpredictable zigzag poison dash.',
      }),
      mkForm(5, 'Compound Eye Venom Thrust', 'dragon_finisher', {
        startup: 0.09,
        forwardImpulse: 780,
        range: 235,
        damageMult: 3.9,
        description: 'Concentrated lethal wisteria toxin burst.',
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
      mkForm(1, 'First Form: Roar', 'overhead_crush', {
        forwardImpulse: 380,
        range: 185,
        triggersRagdoll: true,
        description: 'Twin-cleaver slam triggering sonic detonations.',
      }),
      mkForm(2, 'Second Form: Rhythmic Blast', 'forward_surge', {
        forwardImpulse: 540,
        range: 185,
        description: 'Explosive dual-blade wave timed to combat rhythm.',
      }),
      mkForm(3, 'Third Form: Constant Resounding', 'spin_wheel', {
        forwardImpulse: 430,
        range: 200,
        description: 'Spinning cleaver storm bursting with gunpowder sparks.',
      }),
      mkForm(4, 'Fourth Form: Echoing Beat', 'multi_dash', {
        forwardImpulse: 660,
        range: 215,
        description: 'High-speed dashing concussive shockwaves.',
      }),
      mkForm(5, 'Fifth Form: String Performance', 'dragon_finisher', {
        forwardImpulse: 740,
        range: 255,
        damageMult: 4.25,
        description: 'Relentless chain of flamboyant explosive cleaves.',
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
      mkForm(1, 'First Form: Low Clouds Distant Haze', 'pierce_thrust', {
        startup: 0.075,
        forwardImpulse: 640,
        range: 175,
        description: 'Low-stance swift deceptive thrust.',
      }),
      mkForm(2, 'Second Form: Eight-Layered Mist', 'upward_crescent', {
        startup: 0.08,
        forwardImpulse: 460,
        range: 175,
        description: 'Eight rapid overlapping misty blade arcs.',
      }),
      mkForm(3, 'Third Form: Scattering Mist Splash', 'spin_wheel', {
        startup: 0.085,
        forwardImpulse: 320,
        range: 195,
        description: 'Circular slash dispersing shrouding fog.',
      }),
      mkForm(4, 'Fourth Form: Shifting Flow Slash', 'zigzag_blink', {
        startup: 0.07,
        forwardImpulse: 820,
        range: 210,
        description: 'Phantom blink step vanishing behind mist.',
      }),
      mkForm(5, 'Fifth Form: Sea of Clouds and Haze', 'multi_dash', {
        startup: 0.09,
        forwardImpulse: 880,
        range: 250,
        damageMult: 4.1,
        description: 'High-speed mist storm shrouding the battlefield.',
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
      mkForm(1, 'First Form: Shivers of First Love', 'whip_sweep', {
        forwardImpulse: 420,
        range: 210,
        reachY: 115,
        description: 'Extended whip-blade multi-sweep.',
      }),
      mkForm(2, 'Second Form: Love Pangs', 'upward_crescent', {
        forwardImpulse: 350,
        range: 220,
        reachY: 140,
        description: 'Long-range curving ribbon lash.',
      }),
      mkForm(3, 'Third Form: Catlove Shower', 'spin_wheel', {
        verticalImpulse: -360,
        forwardImpulse: 380,
        range: 225,
        description: 'Acrobatic leaping barrage of whip arcs.',
      }),
      mkForm(4, 'Fourth Form: Swaying Love Wildclaw', 'whip_sweep', {
        forwardImpulse: 560,
        range: 245,
        reachY: 135,
        description: 'Spiral dance tearing wide areas.',
      }),
      mkForm(5, 'Fifth Form: Cat-Legged Winds', 'dragon_finisher', {
        forwardImpulse: 690,
        range: 270,
        reachY: 155,
        damageMult: 4.1,
        description: 'Twirling cyclone of flexible razor ribbons.',
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
      mkForm(1, 'First Form: Winding Serpent Slash', 'whip_sweep', {
        forwardImpulse: 520,
        range: 175,
        description: 'Twisting S-curve slash bypassing guards.',
      }),
      mkForm(2, 'Second Form: Venom Fangs', 'zigzag_blink', {
        forwardImpulse: 710,
        range: 190,
        description: 'Sudden curving strike slipping behind enemies.',
      }),
      mkForm(3, 'Third Form: Coil Choke', 'spin_wheel', {
        forwardImpulse: 440,
        range: 195,
        description: 'Encircling serpentine vortex.',
      }),
      mkForm(4, 'Fourth Form: Twin-Headed Reptile', 'multi_dash', {
        forwardImpulse: 660,
        range: 210,
        description: 'Twin weaving horizontal lunges.',
      }),
      mkForm(5, 'Fifth Form: Slithering Serpent', 'dragon_finisher', {
        forwardImpulse: 820,
        range: 245,
        damageMult: 4.15,
        description: 'Relentless multi-curved serpent fang barrage.',
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
      mkForm(1, 'First Form: Serpentinite Bipolar', 'overhead_crush', {
        startup: 0.16,
        forwardImpulse: 340,
        range: 205,
        damageMult: 1.75,
        triggersRagdoll: true,
        knockbackX: 520,
        description: 'Crushing heavy flail-and-axe twin strike.',
      }),
      mkForm(2, 'Second Form: Upper Smash', 'upward_crescent', {
        startup: 0.17,
        forwardImpulse: 280,
        range: 210,
        reachY: 145,
        damageMult: 2.25,
        description: 'Boulder-splitting upward heave.',
      }),
      mkForm(3, 'Third Form: Stone Skin', 'spin_wheel', {
        startup: 0.15,
        forwardImpulse: 220,
        range: 215,
        damageMult: 2.75,
        description: 'Armored rotating shockwave deflecting foes.',
      }),
      mkForm(4, 'Fourth Form: Volcanic Rock Conquest', 'whip_sweep', {
        startup: 0.18,
        forwardImpulse: 440,
        range: 245,
        damageMult: 3.45,
        description: 'Wide sweeping iron chain devastation.',
      }),
      mkForm(5, 'Fifth Form: Arcs of Justice', 'overhead_crush', {
        startup: 0.2,
        forwardImpulse: 520,
        range: 265,
        reachY: 165,
        damageMult: 4.45,
        knockbackX: 920,
        knockbackY: -500,
        description: 'Earth-shattering tectonic impact.',
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
      mkForm(1, 'First Form: Dance (Waltz)', 'overhead_crush', {
        forwardImpulse: 520,
        damageMult: 1.85,
        triggersRagdoll: true,
        description: 'Single blazing high-arc solar cleave.',
      }),
      mkForm(2, 'Second Form: Clear Blue Sky', 'spin_wheel', {
        forwardImpulse: 340,
        range: 195,
        reachY: 150,
        damageMult: 2.35,
        description: '360-degree crimson solar ring.',
      }),
      mkForm(3, 'Third Form: Raging Sun', 'multi_dash', {
        forwardImpulse: 640,
        range: 205,
        damageMult: 2.95,
        description: 'Two overlapping horizontal solar arcs.',
      }),
      mkForm(4, 'Fourth Form: Beneficent Radiance', 'upward_crescent', {
        verticalImpulse: -420,
        forwardImpulse: 420,
        range: 215,
        damageMult: 3.6,
        description: 'Rising spiral of blazing golden sunfire.',
      }),
      mkForm(5, 'Fifth Form: Hinokami Halo Dragon', 'dragon_finisher', {
        forwardImpulse: 890,
        range: 270,
        reachY: 160,
        damageMult: 4.75,
        knockbackX: 940,
        knockbackY: -520,
        description: 'Mythic solar dragon dash scorching all demons.',
      }),
    ],
  },
};

export const ALL_BREATHING_IDS = Object.keys(BREATHING_STYLES) as BreathingStyleId[];

export function buildBreathingAttackSpec(
  styleId: BreathingStyleId,
  formIndex: 1 | 2 | 3 | 4 | 5,
  damageMult: number
): AttackSpec {
  const style = BREATHING_STYLES[styleId];
  const form = style.forms[formIndex - 1];
  const kindMap = {
    1: 'BREATHING_1',
    2: 'BREATHING_2',
    3: 'BREATHING_3',
    4: 'BREATHING_4',
    5: 'BREATHING_5',
  } as const;

  return {
    kind: kindMap[formIndex],
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
    formIndex,
    poisonDps: styleId === 'insect' ? 4 + formIndex * 1.5 : 0,
  };
}
