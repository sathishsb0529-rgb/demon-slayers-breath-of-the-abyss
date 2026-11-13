import { BREATHING_STYLES } from './breathing';
import { GROUND_Y } from './constants';
import { ragdollToJointPose } from './physics';
import { Fighter, JointPose, Vec2, WeaponStyle } from './types';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

function lerpVec(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function easeOutCubic(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return 1 - Math.pow(1 - c, 3);
}

function easeInOutQuad(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

/**
 * 2-bone limb IK solver keeping upper arm and forearm strictly coupled
 * so the sword hilt stays welded inside the warrior's gripping hand.
 */
function solveArm2Bone(
  shoulder: Vec2,
  targetHand: Vec2,
  upperLen: number,
  lowerLen: number,
  bendDir: number
): { elbow: Vec2; hand: Vec2 } {
  const dx = targetHand.x - shoulder.x;
  const dy = targetHand.y - shoulder.y;
  const rawDist = Math.hypot(dx, dy) || 1;
  const maxReach = upperLen + lowerLen - 0.5;
  const minReach = Math.abs(upperLen - lowerLen) + 1;
  const dist = Math.max(minReach, Math.min(maxReach, rawDist));

  const hand = {
    x: shoulder.x + (dx / rawDist) * dist,
    y: shoulder.y + (dy / rawDist) * dist,
  };

  const cosA =
    (upperLen * upperLen + dist * dist - lowerLen * lowerLen) /
    (2 * upperLen * dist);
  const clampedCos = Math.max(-1, Math.min(1, cosA));
  const angleA = Math.acos(clampedCos);
  const baseAngle = Math.atan2(hand.y - shoulder.y, hand.x - shoulder.x);
  const elbowAngle = baseAngle + bendDir * angleA;

  return {
    elbow: {
      x: shoulder.x + Math.cos(elbowAngle) * upperLen,
      y: shoulder.y + Math.sin(elbowAngle) * upperLen,
    },
    hand,
  };
}

export function lerpPose(a: JointPose, b: JointPose, t: number): JointPose {
  const ct = Math.max(0, Math.min(1, t));
  return {
    pelvis: lerpVec(a.pelvis, b.pelvis, ct),
    chest: lerpVec(a.chest, b.chest, ct),
    head: lerpVec(a.head, b.head, ct),
    lShoulder: lerpVec(a.lShoulder, b.lShoulder, ct),
    lElbow: lerpVec(a.lElbow, b.lElbow, ct),
    lHand: lerpVec(a.lHand, b.lHand, ct),
    rShoulder: lerpVec(a.rShoulder, b.rShoulder, ct),
    rElbow: lerpVec(a.rElbow, b.rElbow, ct),
    rHand: lerpVec(a.rHand, b.rHand, ct),
    lKnee: lerpVec(a.lKnee, b.lKnee, ct),
    lFoot: lerpVec(a.lFoot, b.lFoot, ct),
    rKnee: lerpVec(a.rKnee, b.rKnee, ct),
    rFoot: lerpVec(a.rFoot, b.rFoot, ct),
    swordAngle: lerpAngle(a.swordAngle, b.swordAngle, ct),
    offhandAngle: lerpAngle(a.offhandAngle, b.offhandAngle, ct),
    torsoTilt: lerp(a.torsoTilt, b.torsoTilt, ct),
    headTilt: lerp(a.headTilt, b.headTilt, ct),
    scaleX: lerp(a.scaleX, b.scaleX, ct),
    scaleY: lerp(a.scaleY, b.scaleY, ct),
  };
}

export function evaluateFighterPose(fighter: Fighter): JointPose {
  if (fighter.state === 'RAGDOLL' || fighter.state === 'DEFEATED') {
    if (fighter.ragdoll.active) {
      fighter.lastPose = ragdollToJointPose(fighter);
      return fighter.lastPose;
    }
  }

  const target = computeProceduralPose(
    fighter,
    fighter.state === 'GETTING_UP' ? 'IDLE' : fighter.state
  );

  if (fighter.state === 'GETTING_UP' && fighter.recoveryStartPose) {
    const progress = Math.min(1, fighter.stateTimer / Math.max(0.1, fighter.recoveryDuration));
    const result = lerpPose(fighter.recoveryStartPose, target, easeOutCubic(progress));
    fighter.lastPose = result;
    return result;
  }

  if (fighter.blendFromPose && fighter.blendTimer < fighter.blendDuration) {
    const bt = easeOutCubic(fighter.blendTimer / Math.max(0.02, fighter.blendDuration));
    const blended = lerpPose(fighter.blendFromPose, target, bt);
    fighter.lastPose = blended;
    return blended;
  }

  fighter.lastPose = target;
  return target;
}

function computeProceduralPose(fighter: Fighter, overrideState?: Fighter['state']): JointPose {
  const st = overrideState ?? fighter.state;
  const f = fighter.facing;
  const t = fighter.animTime;
  const stT = fighter.stateTimer;
  const scale = fighter.visual.scale;
  const isDemon = fighter.role === 'demon';
  const build = fighter.visual.bodyBuild ?? 'standard';
  const floatBob = build === 'floating' ? Math.sin(t * 2.8) * 14 + 18 : 0;

  const pt = (lx: number, ly: number): Vec2 => ({
    x: fighter.x + lx * f * scale,
    y: fighter.y - (ly + floatBob) * scale,
  });

  // Neutral Chudan / Wakigamae-inspired ready stance
  let pelvis = pt(-2, 46);
  let chest = pt(3, 74);
  let head = pt(6, 95);
  let lKnee = pt(-13, 24);
  let lFoot = pt(-19, 2);
  let rKnee = pt(15, 25);
  let rFoot = pt(19, 2);
  let lHandTarget = pt(-5, 56);
  let rHandTarget = pt(20, 66);
  let swordAngle = f === 1 ? -0.52 : Math.PI + 0.52;
  let offhandAngle = f === 1 ? -0.6 : Math.PI + 0.6;
  let torsoTilt = 0.08 * f;
  let headTilt = 0.04 * f;
  let scaleX = build === 'hulk' ? 1.12 : build === 'slim' ? 0.92 : 1;
  let scaleY = 1;

  if (st === 'IDLE') {
    const breath = Math.sin(t * 3.4);
    pelvis = pt(-2, 45 + breath * 1.3);
    chest = pt(3, 73 + breath * 2.0);
    head = pt(6, 94 + breath * 2.1);
    lKnee = pt(-14, 24 + breath * 0.5);
    lFoot = pt(-20, 2);
    rKnee = pt(15, 25 + breath * 0.5);
    rFoot = pt(20, 2);
    if (isDemon) {
      pelvis = pt(-3, 42 + breath * 1.5);
      chest = pt(8, 69 + breath * 2.1);
      head = pt(14, 88 + breath * 2.1);
      lHandTarget = pt(0, 49 + breath * 2.4);
      rHandTarget = pt(28, 53 + breath * 2.4);
      torsoTilt = 0.25 * f;
      swordAngle = f === 1 ? 0.48 : Math.PI - 0.48;
    } else {
      // Sword held gracefully angled forward-upward in lead hand, offhand poised near scabbard
      lHandTarget = pt(-8, 53 + breath * 1.5);
      rHandTarget = pt(22, 63 + breath * 1.9);
      const localS = -0.54 + breath * 0.04;
      swordAngle = f === 1 ? localS : Math.PI - localS;
    }
  } else if (st === 'WALK' || st === 'RUN') {
    const isRun = st === 'RUN';
    const freq = isRun ? 13 : 8.4;
    const stride = isRun ? 25 : 16;
    const lift = isRun ? 14 : 8;
    const bob = Math.abs(Math.sin(t * freq)) * (isRun ? 4.2 : 2.2);
    const lean = isRun ? 11 : 5;

    pelvis = pt(lean * 0.45, 44 + bob);
    chest = pt(lean, 72 + bob);
    head = pt(lean + 4, 92 + bob);

    const p1 = Math.sin(t * freq);
    const p2 = Math.sin(t * freq + Math.PI);
    lFoot = pt(p1 * stride, 2 + Math.max(0, Math.cos(t * freq)) * lift);
    rFoot = pt(p2 * stride, 2 + Math.max(0, Math.cos(t * freq + Math.PI)) * lift);
    lKnee = pt(p1 * stride * 0.65 + 4, 24 + Math.max(0, Math.cos(t * freq)) * (lift * 0.7));
    rKnee = pt(p2 * stride * 0.65 + 4, 24 + Math.max(0, Math.cos(t * freq + Math.PI)) * (lift * 0.7));

    lHandTarget = pt(lean - 4 - p1 * 16, 54 + bob);
    rHandTarget = pt(lean + (isRun ? 4 : 14) + p2 * 7, isRun ? 54 + bob : 60 + bob);
    torsoTilt = (isRun ? 0.34 : 0.16) * f;
    // When running like anime swordsman, sword is swept cleanly back alongside hip
    const localS = isRun ? 2.52 : 0.38;
    swordAngle = f === 1 ? localS : Math.PI - localS;
  } else if (st === 'JUMP' || st === 'FALL') {
    const rising = st === 'JUMP';
    pelvis = pt(0, rising ? 48 : 44);
    chest = pt(rising ? 3 : 5, rising ? 76 : 72);
    head = pt(rising ? 6 : 8, rising ? 97 : 92);
    lKnee = pt(-12, rising ? 34 : 28);
    lFoot = pt(-18, rising ? 16 : 8);
    rKnee = pt(16, rising ? 36 : 30);
    rFoot = pt(10, rising ? 18 : 10);
    lHandTarget = pt(-16, rising ? 68 : 88);
    rHandTarget = pt(20, 64);
    const localS = rising ? -0.95 : 0.42;
    swordAngle = f === 1 ? localS : Math.PI - localS;
    scaleX *= rising ? 0.94 : 1.04;
    scaleY *= rising ? 1.06 : 0.96;
  } else if (st === 'BLOCK') {
    // 9. Defensive Sword Movement (firm vertical/diagonal parry guard)
    pelvis = pt(-5, 41);
    chest = pt(-1, 69);
    head = pt(3, 89);
    lKnee = pt(-16, 22);
    lFoot = pt(-23, 2);
    rKnee = pt(15, 24);
    rFoot = pt(21, 2);
    rHandTarget = pt(21, 73);
    lHandTarget = pt(17, 68);
    const localS = -1.42;
    swordAngle = f === 1 ? localS : Math.PI - localS;
    torsoTilt = -0.06 * f;
  } else if (st === 'DODGE') {
    pelvis = pt(7, 38);
    chest = pt(15, 62);
    head = pt(19, 80);
    lKnee = pt(-14, 22);
    lFoot = pt(-26, 4);
    rKnee = pt(16, 25);
    rFoot = pt(22, 4);
    lHandTarget = pt(-16, 50);
    rHandTarget = pt(-4, 48);
    torsoTilt = 0.48 * f;
    swordAngle = f === 1 ? 2.75 : Math.PI - 2.75;
    scaleX *= 1.12;
    scaleY *= 0.9;
  } else if (st === 'HURT') {
    pelvis = pt(-4, 43);
    chest = pt(-10, 70);
    head = pt(-14, 90);
    lHandTarget = pt(-22, 54);
    rHandTarget = pt(10, 48);
    torsoTilt = -0.32 * f;
    headTilt = -0.38 * f;
    swordAngle = f === 1 ? 0.8 : Math.PI - 0.8;
  } else if (st === 'ATTACK_WINDUP' || st === 'BDA_CAST') {
    const spec = fighter.currentAttack;
    const dur = spec ? spec.startup : 0.35;
    const p = easeOutCubic(stT / Math.max(0.05, dur));
    pelvis = pt(-7 * p, 41);
    chest = pt(-5 * p, 68);
    head = pt(3, 87);
    if (st === 'BDA_CAST') {
      rHandTarget = pt(22, 82);
      lHandTarget = pt(20, 76);
    } else {
      rHandTarget = pt(-16 * p, 90 + 12 * p);
      lHandTarget = pt(20, 58);
    }
    torsoTilt = -0.22 * p * f;
    const localS = lerp(-0.5, -2.3, p);
    swordAngle = f === 1 ? localS : Math.PI - localS;
  } else if (
    st === 'LIGHT_ATTACK' ||
    st === 'HEAVY_ATTACK' ||
    st === 'JUMP_ATTACK' ||
    st === 'RUNNING_ATTACK' ||
    st === 'COUNTER_ATTACK' ||
    st === 'BREATHING_FORM'
  ) {
    const spec = fighter.currentAttack;
    const startup = spec ? spec.startup : 0.09;
    const active = spec ? spec.active : 0.12;
    const recovery = spec ? spec.recovery : 0.15;
    const activeEnd = startup + active;
    const total = activeEnd + recovery;
    const pattern = spec?.motionPattern;
    const tech = spec?.technique;

    if (st === 'BREATHING_FORM' && pattern) {
      if (stT < startup) {
        const p = easeOutCubic(stT / startup);
        pelvis = pt(-9 * p, 39);
        chest = pt(3, 65);
        head = pt(9, 85);
        rHandTarget = pt(-14 * p, 56);
        lHandTarget = pt(14, 52);
        torsoTilt = 0.28 * f;
        const localS = lerp(-0.5, 2.75, p);
        swordAngle = f === 1 ? localS : Math.PI - localS;
      } else {
        const p = Math.min(1, (stT - startup) / Math.max(0.1, total - startup));
        const swing = easeOutCubic(Math.min(1, p * 1.95));
        pelvis = pt(11, 41);
        chest = pt(19, 67);
        head = pt(24, 87);
        lKnee = pt(-14, 20);
        lFoot = pt(-28, 2);
        rKnee = pt(22, 24);
        rFoot = pt(28, 2);
        torsoTilt = 0.4 * f;

        if (pattern === 'spin_wheel') {
          const rot = swing * Math.PI * 2;
          rHandTarget = pt(14 + Math.cos(rot) * 22, 68 + Math.sin(rot) * 18);
          lHandTarget = pt(-10, 58);
          swordAngle = f === 1 ? rot - 0.5 : Math.PI - (rot - 0.5);
        } else if (pattern === 'upward_crescent') {
          rHandTarget = pt(34, lerp(42, 96, swing));
          lHandTarget = pt(-12, 58);
          const localA = lerp(1.35, -1.85, swing);
          swordAngle = f === 1 ? localA : Math.PI - localA;
        } else if (pattern === 'overhead_crush') {
          rHandTarget = pt(34, lerp(100, 42, swing));
          lHandTarget = pt(28, lerp(96, 40, swing));
          const localA = lerp(-2.45, 0.85, swing);
          swordAngle = f === 1 ? localA : Math.PI - localA;
        } else if (pattern === 'pierce_thrust') {
          rHandTarget = pt(lerp(-8, 46, swing), 66);
          lHandTarget = pt(-14, 56);
          swordAngle = f === 1 ? 0.02 : Math.PI - 0.02;
        } else {
          rHandTarget = pt(lerp(8, 38, swing), lerp(82, 56, swing));
          lHandTarget = pt(-14, 56);
          const localA = lerp(-2.15, 0.35, swing);
          swordAngle = f === 1 ? localA : Math.PI - localA;
        }
        scaleX *= 1.06;
        scaleY *= 0.94;
      }
    } else if (spec?.kind === 'DEMON_KICK') {
      // Martial roundhouse / tornado kick for demons
      if (stT < startup) {
        const p = easeOutCubic(stT / startup);
        pelvis = pt(-6 * p, 44);
        chest = pt(-8 * p, 70);
        head = pt(-4, 90);
        rKnee = pt(6, 36);
        rFoot = pt(4, 20);
      } else {
        const p = easeOutCubic(Math.min(1, (stT - startup) / Math.max(0.08, active)));
        pelvis = pt(8 * p, 45);
        chest = pt(-6, 72);
        head = pt(-4, 92);
        rKnee = pt(26 * p, 48);
        rFoot = pt(50 * p, 58);
        lHandTarget = pt(-18, 60);
        rHandTarget = pt(16, 62);
        torsoTilt = -0.2 * f;
      }
    } else {
      // AUTHENTIC JAPANESE SWORDSMANSHIP — 10-TECHNIQUE KINEMATICS
      const inStartup = stT < startup;
      const inActive = stT >= startup && stT <= activeEnd;
      const startFrac = inStartup ? easeInOutQuad(stT / Math.max(0.03, startup)) : 1;
      const swingFrac = inStartup
        ? 0
        : inActive
          ? easeOutCubic((stT - startup) / Math.max(0.04, active))
          : 1;
      const recFrac = stT > activeEnd ? easeInOutQuad((stT - activeEnd) / Math.max(0.05, recovery)) : 0;

      if (tech === 'heavy_overhead' || st === 'HEAVY_ATTACK') {
        // 6. Heavy Overhead Strike (two-handed jodan stance -> explosive downward lunge cleave)
        if (inStartup) {
          pelvis = pt(-9 * startFrac, 44);
          chest = pt(-11 * startFrac, 72);
          head = pt(-6 * startFrac, 92);
          lFoot = pt(-24, 2);
          rFoot = pt(12, 2);
          rHandTarget = pt(lerp(18, -10, startFrac), lerp(66, 102, startFrac));
          lHandTarget = pt(lerp(-6, -13, startFrac), lerp(56, 98, startFrac));
          torsoTilt = -0.26 * startFrac * f;
          const localA = lerp(-0.55, -2.58, startFrac);
          swordAngle = f === 1 ? localA : Math.PI - localA;
        } else {
          const s = swingFrac;
          const lunge = lerp(-8, 12, s);
          pelvis = pt(lunge, lerp(44, 39, s) + recFrac * 4);
          chest = pt(lunge + lerp(-8, 18, s), lerp(72, 64, s) + recFrac * 6);
          head = pt(lunge + lerp(-4, 22, s), lerp(92, 84, s) + recFrac * 7);
          lKnee = pt(-16, 21);
          lFoot = pt(-28, 2);
          rKnee = pt(22, 25);
          rFoot = pt(30, 2);
          rHandTarget = pt(lerp(-8, 36, s), lerp(102, 46, s) + recFrac * 10);
          lHandTarget = pt(lerp(-11, 30, s), lerp(98, 43, s) + recFrac * 10);
          torsoTilt = lerp(-0.22, 0.42, s) * f;
          const localA = lerp(-2.58, 0.92, s) - recFrac * 0.25;
          swordAngle = f === 1 ? localA : Math.PI - localA;
        }
      } else if (tech === 'horizontal_slash') {
        // 1. Horizontal Sword Slash (hip coiling back -> snap waist forward -> sweeping wrist slice)
        if (inStartup) {
          pelvis = pt(-5 * startFrac, 43);
          chest = pt(-4 * startFrac, 71);
          head = pt(2, 91);
          rHandTarget = pt(lerp(20, -14, startFrac), lerp(64, 58, startFrac));
          lHandTarget = pt(lerp(-6, 10, startFrac), 58);
          torsoTilt = -0.14 * startFrac * f;
          const localA = lerp(-0.52, -2.35, startFrac);
          swordAngle = f === 1 ? localA : Math.PI - localA;
        } else {
          const s = swingFrac;
          pelvis = pt(lerp(-5, 8, s), 42);
          chest = pt(lerp(-4, 15, s), 69);
          head = pt(lerp(2, 18, s), 89);
          lKnee = pt(-14, 22);
          lFoot = pt(-24, 2);
          rKnee = pt(20, 24);
          rFoot = pt(28, 2);
          rHandTarget = pt(lerp(-14, 40, s), lerp(58, 66, s) + recFrac * 3);
          lHandTarget = pt(lerp(10, -14, s), 55);
          torsoTilt = lerp(-0.14, 0.28, s) * f;
          const localA = lerp(-2.35, 0.24, s) - recFrac * 0.16;
          swordAngle = f === 1 ? localA : Math.PI - localA;
        }
      } else if (tech === 'vertical_downward') {
        // 2. Vertical Downward Slash (step in with high right elbow -> crisp downward wrist cut)
        if (inStartup) {
          pelvis = pt(-3 * startFrac, 45);
          chest = pt(-2 * startFrac, 74);
          head = pt(4, 94);
          rHandTarget = pt(lerp(18, 4, startFrac), lerp(65, 100, startFrac));
          lHandTarget = pt(lerp(-6, -2, startFrac), lerp(56, 88, startFrac));
          torsoTilt = -0.12 * startFrac * f;
          const localA = lerp(-0.52, -2.15, startFrac);
          swordAngle = f === 1 ? localA : Math.PI - localA;
        } else {
          const s = swingFrac;
          pelvis = pt(lerp(-3, 7, s), lerp(45, 40, s));
          chest = pt(lerp(-2, 14, s), lerp(74, 67, s));
          head = pt(lerp(4, 18, s), lerp(94, 87, s));
          lKnee = pt(-14, 22);
          lFoot = pt(-23, 2);
          rKnee = pt(21, 25);
          rFoot = pt(29, 2);
          rHandTarget = pt(lerp(4, 34, s), lerp(100, 44, s) + recFrac * 8);
          lHandTarget = pt(lerp(-2, -12, s), 55);
          torsoTilt = lerp(-0.12, 0.34, s) * f;
          const localA = lerp(-2.15, 0.82, s) - recFrac * 0.2;
          swordAngle = f === 1 ? localA : Math.PI - localA;
        }
      } else if (tech === 'diagonal_upward') {
        // 3. Diagonal Upward Slash (low knee bend -> rising hip/shoulder lift)
        if (inStartup) {
          pelvis = pt(-4 * startFrac, 39);
          chest = pt(3, 66);
          head = pt(8, 86);
          rHandTarget = pt(lerp(18, 4, startFrac), lerp(60, 38, startFrac));
          lHandTarget = pt(-10, 52);
          torsoTilt = 0.22 * f;
          const localA = lerp(0.5, 1.32, startFrac);
          swordAngle = f === 1 ? localA : Math.PI - localA;
        } else {
          const s = swingFrac;
          pelvis = pt(lerp(-2, 8, s), lerp(39, 47, s));
          chest = pt(lerp(3, 14, s), lerp(66, 75, s));
          head = pt(lerp(8, 17, s), lerp(86, 95, s));
          lKnee = pt(-12, 23);
          lFoot = pt(-20, 2);
          rKnee = pt(20, 27);
          rFoot = pt(27, 2);
          rHandTarget = pt(lerp(4, 34, s), lerp(38, 92, s) - recFrac * 10);
          lHandTarget = pt(-12, 56);
          torsoTilt = lerp(0.22, 0.08, s) * f;
          const localA = lerp(1.32, -1.55, s) + recFrac * 0.2;
          swordAngle = f === 1 ? localA : Math.PI - localA;
        }
      } else if (tech === 'reverse_diagonal') {
        // 4. Reverse Diagonal Slash (arm drawn across upper-left -> snapping reverse cut)
        if (inStartup) {
          pelvis = pt(-3 * startFrac, 43);
          chest = pt(0, 71);
          head = pt(5, 91);
          rHandTarget = pt(lerp(18, -8, startFrac), lerp(68, 86, startFrac));
          lHandTarget = pt(12, 58);
          const localA = lerp(-0.5, -1.85, startFrac);
          swordAngle = f === 1 ? localA : Math.PI - localA;
        } else {
          const s = swingFrac;
          pelvis = pt(lerp(-3, 9, s), 42);
          chest = pt(lerp(0, 15, s), 69);
          head = pt(lerp(5, 19, s), 89);
          rFoot = pt(28, 2);
          rHandTarget = pt(lerp(-8, 38, s), lerp(86, 48, s));
          lHandTarget = pt(-14, 54);
          torsoTilt = lerp(0.05, 0.3, s) * f;
          const localA = lerp(-1.85, 0.88, s) - recFrac * 0.18;
          swordAngle = f === 1 ? localA : Math.PI - localA;
        }
      } else if (tech === 'quick_double') {
        // 5. Quick Double Slash (two-beat continuous X-slash)
        const pTotal = Math.min(1, Math.max(0, (stT - startup) / Math.max(0.08, active)));
        const firstBeat = Math.min(1, pTotal * 2);
        const secondBeat = Math.max(0, Math.min(1, (pTotal - 0.5) * 2));
        pelvis = pt(8, 42);
        chest = pt(15, 69);
        head = pt(19, 89);
        lFoot = pt(-22, 2);
        rFoot = pt(28, 2);
        torsoTilt = 0.28 * f;
        if (inStartup) {
          rHandTarget = pt(-8, 86);
          const localA = -2.1;
          swordAngle = f === 1 ? localA : Math.PI - localA;
        } else if (pTotal < 0.5) {
          const s = easeOutCubic(firstBeat);
          rHandTarget = pt(lerp(-8, 36, s), lerp(86, 46, s));
          const localA = lerp(-2.1, 0.78, s);
          swordAngle = f === 1 ? localA : Math.PI - localA;
        } else {
          const s = easeOutCubic(secondBeat);
          rHandTarget = pt(lerp(36, 32, s), lerp(46, 88, s));
          const localA = lerp(0.78, -1.62, s);
          swordAngle = f === 1 ? localA : Math.PI - localA;
        }
        lHandTarget = pt(-12, 56);
      } else if (tech === 'running_slash' || st === 'RUNNING_ATTACK') {
        // 7. Running Sword Attack (low sprinter lunge + horizontal iaijutsu draw-slash)
        const s = swingFrac;
        pelvis = pt(10, 40);
        chest = pt(21, 65);
        head = pt(26, 84);
        lKnee = pt(-18, 22);
        lFoot = pt(-34, 6);
        rKnee = pt(22, 24);
        rFoot = pt(32, 2);
        torsoTilt = 0.44 * f;
        rHandTarget = pt(lerp(-14, 42, s), lerp(52, 64, s));
        lHandTarget = pt(-16, 52);
        const localA = lerp(2.55, 0.14, s) - recFrac * 0.12;
        swordAngle = f === 1 ? localA : Math.PI - localA;
      } else if (tech === 'jumping_slash' || st === 'JUMP_ATTACK') {
        // 8. Jumping Sword Attack (mid-air knee tuck + full aerial overhead crescent)
        const s = swingFrac;
        pelvis = pt(2, 46);
        chest = pt(10, 72);
        head = pt(14, 92);
        lKnee = pt(-14, 34);
        lFoot = pt(-20, 18);
        rKnee = pt(18, 36);
        rFoot = pt(14, 18);
        torsoTilt = lerp(-0.1, 0.35, s) * f;
        rHandTarget = pt(lerp(4, 36, s), lerp(96, 48, s));
        lHandTarget = pt(-12, 66);
        const localA = lerp(-2.25, 0.72, s);
        swordAngle = f === 1 ? localA : Math.PI - localA;
      } else {
        // 10. Counterattack (coiled parry step -> lightning-fast rising diagonal riposte)
        const s = swingFrac;
        pelvis = pt(lerp(-6, 12, s), 41);
        chest = pt(lerp(-2, 18, s), 68);
        head = pt(lerp(2, 22, s), 88);
        lFoot = pt(-26, 2);
        rFoot = pt(32, 2);
        torsoTilt = 0.36 * f;
        rHandTarget = pt(lerp(0, 40, s), lerp(44, 86, s));
        lHandTarget = pt(-12, 58);
        const localA = lerp(1.25, -1.68, s);
        swordAngle = f === 1 ? localA : Math.PI - localA;
      }
    }
  }

  // Exact anatomical shoulders anchored to chest
  const shoulderSpread = build === 'hulk' ? 7.5 : 5.2;
  const lShoulder = { x: chest.x - f * shoulderSpread * scale, y: chest.y - 3 * scale };
  const rShoulder = { x: chest.x + f * shoulderSpread * scale, y: chest.y - 2 * scale };

  const upperLen = 22 * scale;
  const lowerLen = 20 * scale;

  const rArm = solveArm2Bone(rShoulder, rHandTarget, upperLen, lowerLen, f);
  const lArm = solveArm2Bone(lShoulder, lHandTarget, upperLen, lowerLen, f);

  if (st === 'IDLE' || st === 'WALK' || st === 'RUN') {
    offhandAngle = Math.atan2(lArm.hand.y - lArm.elbow.y, lArm.hand.x - lArm.elbow.x);
  }

  return {
    pelvis,
    chest,
    head,
    lShoulder,
    lElbow: lArm.elbow,
    lHand: lArm.hand,
    rShoulder,
    rElbow: rArm.elbow,
    rHand: rArm.hand,
    lKnee,
    lFoot,
    rKnee,
    rFoot,
    swordAngle,
    offhandAngle,
    torsoTilt,
    headTilt,
    scaleX,
    scaleY,
  };
}

function drawLimb(
  ctx: CanvasRenderingContext2D,
  a: Vec2,
  b: Vec2,
  widthA: number,
  widthB: number,
  color: string,
  outlineColor: string
): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  ctx.beginPath();
  ctx.moveTo(a.x + nx * widthA, a.y + ny * widthA);
  ctx.lineTo(b.x + nx * widthB, b.y + ny * widthB);
  ctx.arc(b.x, b.y, widthB, Math.atan2(ny, nx), Math.atan2(-ny, -nx));
  ctx.lineTo(a.x - nx * widthA, a.y - ny * widthA);
  ctx.arc(a.x, a.y, widthA, Math.atan2(-ny, -nx), Math.atan2(ny, nx));
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.6;
  ctx.stroke();
}

export function renderFighter(ctx: CanvasRenderingContext2D, fighter: Fighter, pose: JointPose): void {
  const v = fighter.visual;
  const isPlayerOrAlly = fighter.role === 'player' || fighter.role === 'ally';
  const f = fighter.facing;
  const build = v.bodyBuild ?? 'standard';
  const widthMult = build === 'hulk' ? 1.28 : build === 'slim' ? 0.88 : 1.0;

  // Ground shadow
  const shadowScale = Math.max(0.35, 1 - Math.max(0, GROUND_Y - pose.pelvis.y - 40) / 280);
  ctx.save();
  ctx.fillStyle = 'rgba(2, 6, 18, 0.55)';
  ctx.beginPath();
  ctx.ellipse(pose.pelvis.x, Math.min(GROUND_Y + 3, fighter.y + 3), 34 * v.scale * widthMult * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  if (fighter.state === 'DODGE') {
    ctx.globalAlpha = 0.6;
  } else if (
    fighter.invulnTimer > 0 &&
    Math.floor(fighter.invulnTimer * 25) % 2 === 0 &&
    fighter.state !== 'RAGDOLL'
  ) {
    ctx.globalAlpha = 0.72;
  }

  if (pose.scaleX !== 1 || pose.scaleY !== 1) {
    ctx.translate(fighter.x, fighter.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    ctx.translate(-fighter.x, -fighter.y);
  }

  // Zohakuten / Hantengu Merged rotating Taiko Drum Halo behind torso
  if (v.drumHalo) {
    ctx.save();
    ctx.translate(pose.chest.x - f * 8, pose.chest.y - 10);
    for (let d = 0; d < 5; d++) {
      const a = -Math.PI * 0.85 + (d / 4) * Math.PI * 0.7 + fighter.animTime * 0.4;
      const dx = Math.cos(a) * 38 * v.scale;
      const dy = Math.sin(a) * 38 * v.scale - 6;
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(dx, dy, 8.5 * v.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(dx, dy, 4.5 * v.scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Spider Legs protruding from back (Rui Father & Brother)
  if (v.spiderLegs) {
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4 * v.scale;
    ctx.lineCap = 'round';
    for (let s = 0; s < 3; s++) {
      const sy = pose.chest.y + (s - 1) * 9 * v.scale;
      const bendX = pose.chest.x - f * (26 + s * 6) * v.scale;
      const tipX = pose.chest.x - f * (40 + s * 4) * v.scale;
      const tipY = sy + (s === 0 ? -18 : s === 1 ? 6 : 24) * v.scale;
      ctx.beginPath();
      ctx.moveTo(pose.chest.x - f * 4, sy);
      ctx.lineTo(bendX, sy - 14 * v.scale);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Wings (Urogi)
  if (v.wings) {
    ctx.save();
    ctx.translate(pose.chest.x - f * 6, pose.chest.y - 4);
    const flap = Math.sin(fighter.animTime * 9) * 0.25;
    ctx.rotate(-f * (0.4 + flap));
    ctx.fillStyle = v.haoriPrimary;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-f * 42 * v.scale, -34 * v.scale, -f * 56 * v.scale, -6 * v.scale);
    ctx.quadraticCurveTo(-f * 32 * v.scale, 14 * v.scale, 0, 12 * v.scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Gyokko Porcelain Pot Vessel beneath torso
  if (v.potVessel) {
    ctx.save();
    ctx.translate(pose.pelvis.x, pose.pelvis.y + 8 * v.scale);
    ctx.fillStyle = '#e0f2fe';
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 8 * v.scale, 18 * v.scale, 22 * v.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-13 * v.scale, -12 * v.scale, 26 * v.scale, 5 * v.scale);
    ctx.restore();
  }

  // Telegraph aura on Demon Windup / BDA Cast
  if (fighter.role === 'demon' && (fighter.state === 'ATTACK_WINDUP' || fighter.state === 'BDA_CAST')) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(pose.chest.x, pose.chest.y, 46 * v.scale, 0, Math.PI * 2);
    ctx.fillStyle =
      fighter.state === 'BDA_CAST' ? 'rgba(192, 132, 252, 0.28)' : 'rgba(244, 63, 94, 0.25)';
    ctx.fill();
    ctx.restore();
  }

  // Flowing scarf / belt ribbon
  if (fighter.scarfPoints.length >= 2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fighter.scarfPoints[0].x, fighter.scarfPoints[0].y);
    for (let i = 1; i < fighter.scarfPoints.length; i++) {
      ctx.lineTo(fighter.scarfPoints[i].x, fighter.scarfPoints[i].y);
    }
    ctx.strokeStyle = v.scarfColor;
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  const outline = '#050811';
  const styleDef = BREATHING_STYLES[fighter.breathingStyle];

  // Back leg
  drawLimb(ctx, pose.pelvis, pose.lKnee, 8 * v.scale * widthMult, 6.5 * v.scale, v.uniformColor, outline);
  drawLimb(ctx, pose.lKnee, pose.lFoot, 6 * v.scale, 4.5 * v.scale, v.haoriAccent, outline);

  // Back arm & offhand weapon
  drawLimb(ctx, pose.lShoulder, pose.lElbow, 6.2 * v.scale * widthMult, 5 * v.scale, v.haoriPrimary, outline);
  drawLimb(ctx, pose.lElbow, pose.lHand, 4.8 * v.scale, 4 * v.scale, v.skinColor, outline);
  if (
    v.weapon === 'dual_serrated' ||
    v.weapon === 'dual_cleaver' ||
    v.weapon === 'blood_sickles' ||
    v.weapon === 'ice_fans' ||
    v.weapon === 'obi_ribbons'
  ) {
    renderWeapon(
      ctx,
      pose.lHand,
      pose.offhandAngle,
      v.weapon,
      v.bladeColor,
      styleDef.bladeEdgeColor,
      styleDef.tsubaColor,
      false,
      v.scale
    );
  } else if (v.weapon === 'shotgun_katana') {
    // Genya holds Nichirin sawed-off double-barrel shotgun in offhand!
    renderOffhandShotgun(ctx, pose.lHand, f, v.scale);
  }

  // Front leg
  drawLimb(ctx, pose.pelvis, pose.rKnee, 9 * v.scale * widthMult, 7 * v.scale, v.uniformColor, outline);
  drawLimb(ctx, pose.rKnee, pose.rFoot, 6.5 * v.scale, 4.8 * v.scale, v.haoriAccent, outline);

  // Torso & Haori / Kimono
  const dirX = pose.chest.x - pose.pelvis.x;
  const dirY = pose.chest.y - pose.pelvis.y;
  const len = Math.hypot(dirX, dirY) || 1;
  const perpX = -dirY / len;
  const perpY = dirX / len;

  ctx.beginPath();
  ctx.moveTo(pose.chest.x - perpX * 10 * v.scale * widthMult, pose.chest.y - perpY * 10 * v.scale);
  ctx.lineTo(pose.chest.x + perpX * 10 * v.scale * widthMult, pose.chest.y + perpY * 10 * v.scale);
  ctx.lineTo(pose.pelvis.x + perpX * 14 * v.scale * widthMult, pose.pelvis.y + perpY * 14 * v.scale);
  ctx.lineTo(pose.pelvis.x - perpX * 15 * v.scale * widthMult, pose.pelvis.y - perpY * 15 * v.scale);
  ctx.closePath();
  ctx.fillStyle = v.uniformColor;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  if (isPlayerOrAlly) {
    // Haori split coat tail
    ctx.beginPath();
    ctx.moveTo(pose.chest.x - perpX * 9, pose.chest.y - perpY * 9);
    ctx.lineTo(pose.pelvis.x - perpX * 16 - f * 8, pose.pelvis.y - perpY * 16 + 10);
    ctx.lineTo(pose.pelvis.x + perpX * 4, pose.pelvis.y + perpY * 4 + 6);
    ctx.closePath();
    ctx.fillStyle = v.haoriPrimary;
    ctx.fill();
    ctx.stroke();

    // Scabbard (Saya) resting cleanly on the slayer's waist hip
    if (
      v.weapon === 'katana' ||
      v.weapon === 'stinger_katana' ||
      v.weapon === 'whip_katana' ||
      v.weapon === 'shotgun_katana'
    ) {
      ctx.save();
      ctx.translate(pose.pelvis.x - f * 4, pose.pelvis.y - 2);
      ctx.rotate(f === 1 ? 2.68 : Math.PI - 2.68);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = styleDef.tsubaColor;
      ctx.lineWidth = 1.2;
      ctx.fillRect(-10, -2.3, 48 * v.scale, 4.6);
      ctx.strokeRect(-10, -2.3, 48 * v.scale, 4.6);
      ctx.restore();
    }
  } else if (v.kimono) {
    // Flowing traditional Demon Kimono robe skirt
    ctx.beginPath();
    ctx.moveTo(pose.pelvis.x - 13 * v.scale, pose.pelvis.y - 6);
    ctx.lineTo(pose.pelvis.x - 20 * v.scale - f * 7, pose.pelvis.y + 30 * v.scale);
    ctx.lineTo(pose.pelvis.x + 17 * v.scale, pose.pelvis.y + 28 * v.scale);
    ctx.lineTo(pose.pelvis.x + 13 * v.scale, pose.pelvis.y - 4);
    ctx.closePath();
    ctx.fillStyle = v.haoriPrimary;
    ctx.fill();
    ctx.stroke();
  } else if (v.hasMarkings) {
    ctx.strokeStyle = v.markingColor ?? '#fb7185';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pose.pelvis.x, pose.pelvis.y - 4);
    ctx.lineTo(pose.chest.x + f * 3, pose.chest.y + 4);
    ctx.stroke();
  }

  // Head & Hair / Horns / Fedora / Extra Eyes
  ctx.save();
  ctx.translate(pose.head.x, pose.head.y);
  ctx.rotate(pose.headTilt);

  ctx.beginPath();
  ctx.arc(0, 0, 11.5 * v.scale, 0, Math.PI * 2);
  ctx.fillStyle = v.skinColor;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Primary Eyes
  ctx.fillStyle = v.eyeColor;
  ctx.beginPath();
  ctx.ellipse(f * 5 * v.scale, -1 * v.scale, 2.4 * v.scale, 1.7 * v.scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Kokushibo 6 eyes or Daki third eye
  if (v.extraEyes) {
    ctx.fillStyle = v.eyeColor;
    ctx.beginPath();
    ctx.ellipse(f * 4.5 * v.scale, -5 * v.scale, 1.8 * v.scale, 1.2 * v.scale, 0, 0, Math.PI * 2);
    ctx.ellipse(f * 4.5 * v.scale, 3.2 * v.scale, 1.8 * v.scale, 1.2 * v.scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Anime spiky hair (or Boar mask hint if Inosuke!)
  if (fighter.characterId === 'inosuke') {
    // Boar mask snout + tusks
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(0, -1 * v.scale, 12.2 * v.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(f * 10 * v.scale, 1 * v.scale, 4 * v.scale, 3 * v.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(f * 4 * v.scale, -2.5 * v.scale, 2.2 * v.scale, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = v.hairColor;
    ctx.beginPath();
    ctx.moveTo(-11 * v.scale, 2 * v.scale);
    ctx.lineTo(-16 * v.scale, -6 * v.scale);
    ctx.lineTo(-9 * v.scale, -8 * v.scale);
    ctx.lineTo(-13 * v.scale, -15 * v.scale);
    ctx.lineTo(-3 * v.scale, -12 * v.scale);
    ctx.lineTo(1 * v.scale, -18 * v.scale);
    ctx.lineTo(6 * v.scale, -12 * v.scale);
    ctx.lineTo(13 * v.scale, -13 * v.scale);
    ctx.lineTo(9 * v.scale, -6 * v.scale);
    ctx.lineTo(13 * v.scale, -3 * v.scale);
    ctx.lineTo(4 * v.scale, -5 * v.scale);
    ctx.lineTo(-3 * v.scale, -3 * v.scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (v.fedora) {
    // Muzan Adult sharp white-banded black fedora
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.4;
    ctx.fillRect(-15 * v.scale, -11 * v.scale, 30 * v.scale, 3.2 * v.scale);
    ctx.fillRect(-9 * v.scale, -20 * v.scale, 18 * v.scale, 9 * v.scale);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-9 * v.scale, -13.5 * v.scale, 18 * v.scale, 2.2 * v.scale);
  }

  if (v.catEars) {
    ctx.fillStyle = v.hairColor;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    for (const ex of [-7, 4]) {
      ctx.beginPath();
      ctx.moveTo((ex - 4) * v.scale, -9 * v.scale);
      ctx.lineTo(ex * v.scale, -21 * v.scale);
      ctx.lineTo((ex + 5) * v.scale, -9 * v.scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  if (v.blindfoldMask) {
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-6 * v.scale, -11 * v.scale, 13 * v.scale, 10 * v.scale);
    ctx.strokeRect(-6 * v.scale, -11 * v.scale, 13 * v.scale, 10 * v.scale);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-1 * v.scale, -9 * v.scale, 3 * v.scale, 6 * v.scale);
  }

  if (v.hasHorns) {
    ctx.fillStyle = v.hornColor ?? '#e11d48';
    ctx.beginPath();
    ctx.moveTo(f * 3 * v.scale, -10 * v.scale);
    ctx.quadraticCurveTo(f * 13 * v.scale, -24 * v.scale, f * 4 * v.scale, -30 * v.scale);
    ctx.quadraticCurveTo(f * 7 * v.scale, -20 * v.scale, -f * 1 * v.scale, -11 * v.scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Front Upper Arm
  drawLimb(ctx, pose.rShoulder, pose.rElbow, 6.6 * v.scale * widthMult, 5.2 * v.scale, v.haoriPrimary, outline);

  // Weapon anchored directly at pose.rHand BEFORE drawing gripping knuckles!
  const isBreathing = fighter.state === 'BREATHING_FORM';
  const baseBlade = isPlayerOrAlly ? styleDef.bladeBaseColor : v.bladeColor;
  const edgeBlade = isPlayerOrAlly ? styleDef.bladeEdgeColor : '#f8fafc';
  const tsubaCol = isPlayerOrAlly ? styleDef.tsubaColor : '#eab308';
  renderWeapon(
    ctx,
    pose.rHand,
    pose.swordAngle,
    v.weapon,
    isBreathing ? styleDef.primaryColor : baseBlade,
    edgeBlade,
    tsubaCol,
    isBreathing,
    v.scale
  );

  // Front Forearm + Gripping Fist drawn over hilt
  drawLimb(ctx, pose.rElbow, pose.rHand, 5.2 * v.scale, 4.4 * v.scale, v.skinColor, outline);
  ctx.beginPath();
  ctx.arc(pose.rHand.x, pose.rHand.y, 4.6 * v.scale, 0, Math.PI * 2);
  ctx.fillStyle = v.skinColor;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Muzan multi-tentacle spine whips during attack
  if (v.weapon === 'muzan_tentacles' && (fighter.state === 'HEAVY_ATTACK' || fighter.state === 'LIGHT_ATTACK')) {
    ctx.save();
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 5;
    for (let w = -1; w <= 1; w++) {
      ctx.beginPath();
      ctx.moveTo(pose.chest.x, pose.chest.y);
      ctx.quadraticCurveTo(
        pose.chest.x + f * 90,
        pose.chest.y + w * 40,
        pose.chest.x + f * 185,
        pose.chest.y + w * 26
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  // Hit flash
  if (fighter.hitFlashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.68, fighter.hitFlashTimer * 6);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pose.chest.x, pose.chest.y, 24 * v.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Block / Parry guard arc
  if (fighter.state === 'BLOCK') {
    ctx.save();
    ctx.strokeStyle = fighter.parryFlashTimer > 0 ? '#fde047' : 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = fighter.parryFlashTimer > 0 ? 4.5 : 2.5;
    ctx.beginPath();
    ctx.arc(pose.chest.x + f * 22, pose.chest.y, 28 * v.scale, -Math.PI * 0.45, Math.PI * 0.45, f === -1);
    ctx.stroke();
    ctx.restore();
  }

  // Poison tick aura
  if (fighter.poisonTimer > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pose.chest.x, pose.chest.y, 30 * v.scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Frost chill crystal shimmer if slowed by Cryo BDA
  if (fighter.chillTimer > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.72)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(pose.chest.x, pose.chest.y, 32 * v.scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function renderOffhandShotgun(
  ctx: CanvasRenderingContext2D,
  hand: Vec2,
  facing: 1 | -1,
  scale: number
): void {
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.scale(facing * scale, scale);
  // Wooden grip + twin iron barrels
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-6, -3, 12, 6);
  ctx.fillStyle = '#334155';
  ctx.fillRect(4, -4, 24, 3.2);
  ctx.fillStyle = '#475569';
  ctx.fillRect(4, -0.5, 24, 3.2);
  ctx.restore();
}

function renderWeapon(
  ctx: CanvasRenderingContext2D,
  hand: Vec2,
  angle: number,
  weapon: WeaponStyle,
  bladeBaseColor: string,
  bladeEdgeColor: string,
  tsubaColor: string,
  glow: boolean,
  scale: number
): void {
  if (weapon === 'unarmed_claws' || weapon === 'muzan_tentacles') {
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(angle);
    ctx.fillStyle = bladeBaseColor;
    ctx.strokeStyle = '#050811';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(2, i * 2.5);
      ctx.lineTo(18 * scale, i * 4);
      ctx.lineTo(2, i * 2.5 + 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  if (weapon === 'ice_fans') {
    // Doma's golden war-fans
    ctx.fillStyle = '#eab308';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 28, -0.65, 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 23, -0.5, 0.5);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (weapon === 'blood_sickles') {
    // Gyutaro's curved twin crimson blood sickles
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-8, -2, 16, 4);
    ctx.fillStyle = bladeBaseColor;
    ctx.strokeStyle = '#050811';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(6, -1);
    ctx.quadraticCurveTo(38, -28, 56, -4);
    ctx.quadraticCurveTo(34, -12, 6, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (weapon === 'obi_ribbons') {
    // Daki / Spider Sister flowing razor sash ribbons
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.bezierCurveTo(28, -16, 56, 16, 86, -4);
    ctx.strokeStyle = bladeBaseColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#fce7f3';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Detailed Japanese Nichirin Hilt (Tsuka), Pommel (Kashira), Diamond Wrap (Tsuka-ito), Guard (Tsuba) & Collar (Habaki)
  ctx.fillStyle = '#475569';
  ctx.fillRect(-17, -2.8, 3.2, 5.6); // Kashira pommel
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-14, -2.5, 16, 5); // Tsuka handle core
  // Diamond Tsuka-ito wrap lines
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let hx = -12; hx <= -1; hx += 4) {
    ctx.moveTo(hx, -2.2);
    ctx.lineTo(hx + 2, 2.2);
    ctx.moveTo(hx + 2, -2.2);
    ctx.lineTo(hx, 2.2);
  }
  ctx.stroke();

  // Ornate Tsuba Handguard
  ctx.fillStyle = tsubaColor;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1;
  ctx.fillRect(2, -7.2, 3.8, 14.4);
  ctx.strokeRect(2, -7.2, 3.8, 14.4);

  // Brass Habaki collar
  ctx.fillStyle = '#eab308';
  ctx.fillRect(5.8, -2.6, 4.2, 5.2);

  if (weapon === 'stone_flail') {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(68, 0);
    ctx.stroke();
    ctx.fillStyle = '#57534e';
    ctx.beginPath();
    ctx.arc(72, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
  } else if (weapon === 'whip_katana') {
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.bezierCurveTo(36, -10, 68, 10, 98, -2);
    ctx.strokeStyle = glow ? '#ffffff' : bladeBaseColor;
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.strokeStyle = bladeEdgeColor;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  } else if (weapon === 'dual_cleaver') {
    ctx.beginPath();
    ctx.moveTo(10, -3.5);
    ctx.lineTo(54, -9);
    ctx.lineTo(65, 1.5);
    ctx.lineTo(52, 6.5);
    ctx.lineTo(10, 3.2);
    ctx.closePath();
    ctx.fillStyle = bladeBaseColor;
    ctx.fill();
    ctx.strokeStyle = bladeEdgeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    // Forged Metallic Nichirin Katana (Mune, Shinogi ridge, wavy Hamon temper line, Kissaki tip, steel reflection)
    const length = weapon === 'stinger_katana' ? 68 : weapon === 'flesh_katana' ? 84 : 76;

    // 1. Forged metallic body gradient from dark spine (Mune) to bright steel edge (Ha)
    const grad = ctx.createLinearGradient(10, -4.5, 10, 3.5);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.28, '#334155');
    grad.addColorStop(0.54, glow ? '#ffffff' : bladeBaseColor);
    grad.addColorStop(0.82, '#e2e8f0');
    grad.addColorStop(1, glow ? '#ffffff' : bladeEdgeColor);

    ctx.beginPath();
    ctx.moveTo(10, -2.7);
    ctx.quadraticCurveTo(length * 0.56, -4.9, length - 5, -1.5); // Curved Mune spine (Sori)
    ctx.lineTo(length + 3, 1.9); // Razor Kissaki point
    ctx.quadraticCurveTo(length * 0.56, 1.0, 10, 2.5); // Honed cutting edge
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 2. Crisp specular Shinogi ridge highlight along the blade center
    ctx.beginPath();
    ctx.moveTo(11, -0.7);
    ctx.quadraticCurveTo(length * 0.56, -2.1, length - 4, -0.2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // 3. Wave-patterned Tempered Hamon edge line
    ctx.beginPath();
    ctx.moveTo(12, 1.4);
    for (let x = 14; x <= length - 4; x += 6) {
      const waveY = 0.9 + Math.sin(x * 0.55) * 0.55;
      ctx.lineTo(x, waveY);
    }
    ctx.strokeStyle = glow ? '#ffffff' : bladeEdgeColor;
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // 4. Diagonal Kissaki Yokote bevel + bright cutting glint
    ctx.beginPath();
    ctx.moveTo(length - 7, -1.6);
    ctx.lineTo(length - 5, 1.2);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Serrated teeth for Inosuke's Beast Breathing blades
    if (weapon === 'dual_serrated') {
      ctx.fillStyle = '#e2e8f0';
      for (let tx = 18; tx < length - 8; tx += 9) {
        ctx.beginPath();
        ctx.moveTo(tx, 1.4);
        ctx.lineTo(tx + 3, 4.4);
        ctx.lineTo(tx + 6, 1.4);
        ctx.fill();
      }
    }

    // Dark outline along Mune spine
    ctx.beginPath();
    ctx.moveTo(10, -2.7);
    ctx.quadraticCurveTo(length * 0.56, -4.9, length - 5, -1.5);
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }

  ctx.restore();
}

export function getWeaponSegmentWorld(
  pose: JointPose,
  weapon: WeaponStyle,
  scale: number
): { start: Vec2; end: Vec2 } {
  const lenMap: Record<WeaponStyle, number> = {
    katana: 74,
    dual_serrated: 68,
    dual_cleaver: 65,
    whip_katana: 96,
    stone_flail: 84,
    stinger_katana: 68,
    shotgun_katana: 74,
    flesh_katana: 82,
    blood_sickles: 60,
    obi_ribbons: 88,
    ice_fans: 36,
    unarmed_claws: 22,
    muzan_tentacles: 140,
  };
  const len = (lenMap[weapon] ?? 72) * scale;
  return {
    start: pose.rHand,
    end: {
      x: pose.rHand.x + Math.cos(pose.swordAngle) * len,
      y: pose.rHand.y + Math.sin(pose.swordAngle) * len,
    },
  };
}

export function renderTrainingRock(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  hp: number,
  maxHp: number
): void {
  const pct = Math.max(0, hp / maxHp);
  ctx.save();
  ctx.translate(x, groundY);

  if (hp <= 0) {
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-68, 0);
    ctx.lineTo(-55, -82);
    ctx.lineTo(-10, -108);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(12, -106);
    ctx.lineTo(58, -74);
    ctx.lineTo(70, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-62, 0);
  ctx.lineTo(-56, -68);
  ctx.lineTo(-22, -108);
  ctx.lineTo(24, -106);
  ctx.lineTo(58, -62);
  ctx.lineTo(64, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-54, -46);
  ctx.quadraticCurveTo(0, -34, 54, -46);
  ctx.stroke();

  if (pct < 0.9) {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -106);
    ctx.lineTo(-6, -68);
    if (pct < 0.6) ctx.lineTo(8, -35);
    if (pct < 0.35) ctx.lineTo(-2, 0);
    ctx.stroke();
  }

  ctx.restore();
}
