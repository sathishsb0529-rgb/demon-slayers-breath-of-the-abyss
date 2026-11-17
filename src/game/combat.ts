import { evaluateFighterPose, getWeaponSegmentWorld } from './animation';
import { SoundEngine } from './audio';
import { DEMON_TEMPLATES } from './demons';
import { ParticleSystem } from './particles';
import { activateRagdoll } from './physics';
import { ArenaObstacle, Fighter, Rect, Vec2 } from './types';

export interface CombatStepOutcome {
  hitstop: number;
  shake: number;
  ragdollTriggered: boolean;
  landed: boolean;
  blocked: boolean;
  clashed: boolean;
  perfectDodged?: boolean;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function segmentsIntersect(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): boolean {
  const ccw = (p1: Vec2, p2: Vec2, p3: Vec2) =>
    (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
  return ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2);
}

export function segmentIntersectsRect(p1: Vec2, p2: Vec2, r: Rect): boolean {
  if (
    (p1.x >= r.x && p1.x <= r.x + r.w && p1.y >= r.y && p1.y <= r.y + r.h) ||
    (p2.x >= r.x && p2.x <= r.x + r.w && p2.y >= r.y && p2.y <= r.y + r.h)
  ) {
    return true;
  }
  const tl = { x: r.x, y: r.y };
  const tr = { x: r.x + r.w, y: r.y };
  const bl = { x: r.x, y: r.y + r.h };
  const br = { x: r.x + r.w, y: r.y + r.h };
  return (
    segmentsIntersect(p1, p2, tl, tr) ||
    segmentsIntersect(p1, p2, tr, br) ||
    segmentsIntersect(p1, p2, br, bl) ||
    segmentsIntersect(p1, p2, bl, tl)
  );
}

export function getFighterHurtbox(fighter: Fighter): Rect {
  const w = fighter.width * fighter.visual.scale;
  const h = fighter.height * fighter.visual.scale;
  return {
    x: fighter.x - w * 0.5,
    y: fighter.y - h,
    w,
    h,
  };
}

export function isAttackActive(fighter: Fighter): boolean {
  const spec = fighter.currentAttack;
  if (!spec) return false;
  if (
    fighter.state !== 'LIGHT_ATTACK' &&
    fighter.state !== 'HEAVY_ATTACK' &&
    fighter.state !== 'JUMP_ATTACK' &&
    fighter.state !== 'RUNNING_ATTACK' &&
    fighter.state !== 'COUNTER_ATTACK' &&
    fighter.state !== 'BREATHING_FORM'
  ) {
    return false;
  }
  return fighter.stateTimer >= spec.startup && fighter.stateTimer <= spec.startup + spec.active;
}

export function getActiveAttackHitbox(attacker: Fighter): Rect | null {
  if (!isAttackActive(attacker)) return null;
  const spec = attacker.currentAttack!;
  const x = attacker.facing === 1 ? attacker.x - 10 : attacker.x + 10 - spec.range;
  const y = attacker.y - spec.reachY - 12;
  return { x, y, w: spec.range, h: spec.reachY };
}

export function resolveSwordClash(
  a: Fighter,
  b: Fighter,
  particles: ParticleSystem,
  sound: SoundEngine
): CombatStepOutcome | null {
  if (!isAttackActive(a) || !isAttackActive(b)) return null;
  if (a.hitTargetsThisSwing.has(b.id) || b.hitTargetsThisSwing.has(a.id)) return null;

  const boxA = getActiveAttackHitbox(a);
  const boxB = getActiveAttackHitbox(b);
  if (!boxA || !boxB || !rectsOverlap(boxA, boxB)) return null;

  a.hitTargetsThisSwing.add(b.id);
  b.hitTargetsThisSwing.add(a.id);

  a.vx = -a.facing * 260;
  b.vx = -b.facing * 260;
  a.counterWindowTimer = 0.65;

  const midX = (a.x + b.x) * 0.5;
  const midY = Math.min(a.y, b.y) - 64;
  particles.spawnParrySparks(midX, midY, true);
  particles.spawnFloatingText(midX, midY - 30, 'CLASH!', '#fef08a', 1.2);
  sound.playSwordClash();

  return {
    hitstop: 0.065,
    shake: 10,
    ragdollTriggered: false,
    landed: false,
    blocked: false,
    clashed: true,
  };
}

export function resolveObstacleHit(
  attacker: Fighter,
  obstacle: ArenaObstacle,
  particles: ParticleSystem,
  sound: SoundEngine
): boolean {
  if (!obstacle.destructible || obstacle.hp <= 0) return false;
  if (obstacle.lastHitSwingId === attacker.attackSwingId) return false;

  const hitbox = getActiveAttackHitbox(attacker);
  if (!hitbox) return false;

  const obsRect: Rect = { x: obstacle.x, y: obstacle.y, w: obstacle.w, h: obstacle.h };
  if (!rectsOverlap(hitbox, obsRect)) return false;

  obstacle.lastHitSwingId = attacker.attackSwingId;
  const spec = attacker.currentAttack!;
  const dmg = Math.max(10, Math.round(spec.damage * attacker.damageMult));
  obstacle.hp = Math.max(0, obstacle.hp - dmg);
  const broken = obstacle.hp <= 0;
  const cx = obstacle.x + obstacle.w * 0.5;
  const cy = obstacle.y + obstacle.h * 0.5;

  if (obstacle.kind === 'rock' || obstacle.kind === 'pillar') {
    particles.spawnRockShards(cx, obstacle.y + obstacle.h, broken);
    sound.playRockCrack(broken);
  } else {
    particles.spawnWoodShards(cx, cy, broken);
    sound.playWoodBreak();
  }
  return true;
}

export function resolveAttackHit(
  attacker: Fighter,
  defender: Fighter,
  particles: ParticleSystem,
  sound: SoundEngine
): CombatStepOutcome {
  const result: CombatStepOutcome = {
    hitstop: 0,
    shake: 0,
    ragdollTriggered: false,
    landed: false,
    blocked: false,
    clashed: false,
    perfectDodged: false,
  };

  if (defender.hp <= 0 || defender.state === 'DEFEATED') return result;

  const spec = attacker.currentAttack;
  if (!spec) return result;

  // Quick double-slash resets hit tracking halfway through active window for its 2nd cut
  if (
    spec.isDoubleHit &&
    !attacker.secondHitFired &&
    attacker.stateTimer >= spec.startup + spec.active * 0.5
  ) {
    attacker.secondHitFired = true;
    attacker.hitTargetsThisSwing.clear();
  }

  if (attacker.hitTargetsThisSwing.has(defender.id)) return result;

  const hitbox = getActiveAttackHitbox(attacker);
  if (!hitbox) return result;

  const hurtbox = getFighterHurtbox(defender);
  const pose = evaluateFighterPose(attacker);
  const weaponSeg = getWeaponSegmentWorld(pose, attacker.visual.weapon, attacker.visual.scale);

  const hitBySegment = segmentIntersectsRect(weaponSeg.start, weaponSeg.end, hurtbox);
  const hitByBox = rectsOverlap(hitbox, hurtbox);
  if (!hitBySegment && !hitByBox) return result;

  // Dodge i-frames avoid damage cleanly and grant counterattack window
  if (defender.state === 'DODGE' || (defender.invulnTimer > 0 && defender.state !== 'RAGDOLL')) {
    if (defender.role === 'player' && defender.counterWindowTimer <= 0) {
      const baseCounter = defender.characterId === 'kanao' ? 1.05 : 0.72;
      defender.counterWindowTimer = baseCounter + (defender.counterWindowBonus ?? 0);
      defender.perfectDodgeStreak = (defender.perfectDodgeStreak ?? 0) + 1;
      particles.spawnFloatingText(defender.x, defender.y - 105, 'PERFECT DODGE!', '#5eead4', 1.0);
      result.perfectDodged = true;
    }
    return result;
  }

  attacker.hitTargetsThisSwing.add(defender.id);

  const isFacingAttacker =
    (defender.x >= attacker.x && defender.facing === -1) ||
    (defender.x < attacker.x && defender.facing === 1);
  const blocked = defender.state === 'BLOCK' && isFacingAttacker;

  const hitX = (attacker.x + defender.x) * 0.5 + attacker.facing * 12;
  const hitY = defender.y - defender.height * 0.58;

  if (blocked) {
    const perfectParry = defender.stateTimer <= 0.24;
    const chipDamage = perfectParry ? 0 : Math.max(1, Math.round(spec.damage * 0.16));
    defender.hp = Math.max(0, defender.hp - chipDamage);
    defender.vx = attacker.facing * spec.knockbackX * (perfectParry ? 0.22 : 0.42);
    defender.parryFlashTimer = 0.22;

    if (perfectParry) {
      defender.counterWindowTimer =
        (defender.characterId === 'kanao' ? 1.15 : 0.85) + (defender.counterWindowBonus ?? 0);
      defender.energy = Math.min(defender.maxEnergy, defender.energy + 12);
      if (defender.role === 'player' && !defender.awakeningActive) {
        defender.awakeningMeter = Math.min(100, defender.awakeningMeter + 9.5);
      }
      particles.spawnFloatingText(defender.x, defender.y - defender.height - 16, 'PERFECT PARRY!', '#fde047', 1.15);
      sound.playSwordClash();
    } else {
      particles.spawnFloatingText(
        defender.x,
        defender.y - defender.height - 12,
        `BLOCK -${chipDamage}`,
        '#7dd3fc',
        0.9
      );
      sound.playParry();
    }

    particles.spawnParrySparks(hitX, hitY, perfectParry);
    result.hitstop = perfectParry ? 0.055 : 0.03;
    result.shake = perfectParry ? 8 : 5;
    result.blocked = true;

    if (defender.hp <= 0) {
      const defPose = evaluateFighterPose(defender);
      activateRagdoll(defender, defPose, attacker.facing * 320, -240, true);
      result.ragdollTriggered = true;
    }
    return result;
  }

  // Clean hit with defense mitigation + Shield + Awakening bonuses
  const baseDefReduction = Math.min(
    0.58,
    defender.role === 'demon' && defender.demonArchetype
      ? DEMON_TEMPLATES[defender.demonArchetype].defense
      : defender.defenseReduction ?? (defender.characterId === 'genya' ? 0.12 : 0)
  );
  const shieldActive = (defender.shieldTimer ?? 0) > 0;
  const defReduction = shieldActive ? Math.min(0.76, baseDefReduction + 0.36) : baseDefReduction;
  const hasTransparent =
    attacker.transparentWorldActive ||
    (attacker.awakeningActive &&
      (attacker.awakeningTier === 'transparent_world' || attacker.awakeningTier === 'transcendent'));
  const hasRedBlade =
    attacker.awakeningActive &&
    (attacker.awakeningTier === 'red_blade' || attacker.awakeningTier === 'transcendent');

  const critMult = hasTransparent ? 1.24 : 1.0;
  const finalDamage = Math.max(
    1,
    Math.round(spec.damage * attacker.damageMult * critMult * (1 - defReduction))
  );
  defender.hp = Math.max(0, defender.hp - finalDamage);
  defender.damageTaken += finalDamage;
  defender.hitFlashTimer = 0.16;
  defender.consecutiveHitsTaken = (defender.consecutiveHitsTaken ?? 0) + 1;
  defender.consecutiveHitTimer = 1.65;
  attacker.hitCount += 1;
  attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 4.5);
  if (attacker.role === 'player' && !attacker.awakeningActive) {
    const meterGain = spec.kind === 'ULTIMATE_ATTACK' ? 0 : spec.triggersRagdoll ? 8.5 : 5.5;
    attacker.awakeningMeter = Math.min(100, attacker.awakeningMeter + meterGain);
  }
  if (shieldActive) {
    particles.spawnFloatingText(defender.x, defender.y - defender.height - 32, 'SHIELDED', '#34d399', 0.8);
  }

  if (spec.poisonDps && spec.poisonDps > 0) {
    defender.poisonTimer = 4.0;
    defender.poisonDps = spec.poisonDps;
  }
  if (hasRedBlade && defender.role === 'demon') {
    defender.redBladeBurnTimer = 4.5;
  }

  const isLethal = defender.hp <= 0;
  const isBreathing = attacker.state === 'BREATHING_FORM';
  const isHeavy = spec.triggersRagdoll || isLethal || spec.kind === 'ULTIMATE_ATTACK';

  sound.playHit(isHeavy);
  particles.spawnHitBurst(hitX, hitY, attacker.facing, isHeavy, defender.role === 'demon');

  particles.spawnFloatingText(
    defender.x,
    defender.y - defender.height - 16,
    hasTransparent
      ? `-${finalDamage} WEAK POINT!`
      : isBreathing
        ? `-${finalDamage}!`
        : `-${finalDamage}`,
    hasTransparent ? '#38bdf8' : isBreathing ? '#38bdf8' : isHeavy ? '#fbbf24' : '#f8fafc',
    hasTransparent || isBreathing ? 1.25 : isHeavy ? 1.15 : 0.95
  );

  if (isHeavy) {
    const defPose = evaluateFighterPose(defender);
    activateRagdoll(
      defender,
      defPose,
      attacker.facing * spec.knockbackX,
      spec.knockbackY,
      isLethal
    );
    result.ragdollTriggered = true;
  } else {
    defender.state = 'HURT';
    defender.stateTimer = 0;
    defender.currentAttack = null;
    defender.vx = attacker.facing * spec.knockbackX;
    defender.vy = spec.knockbackY * 0.45;
    if (defender.vy < -20) defender.grounded = false;
  }

  result.hitstop = spec.hitstop;
  result.shake = isBreathing ? 14 : isHeavy ? 10 : 4.5;
  result.landed = true;
  return result;
}
