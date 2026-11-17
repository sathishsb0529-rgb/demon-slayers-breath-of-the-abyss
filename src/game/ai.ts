import { SoundEngine } from './audio';
import { buildBreathingAttackSpec } from './breathing';
import {
  BASE_ATTACK_SPECS,
  DEMON_ATTACK_SPECS,
  PLAYER_JUMP_VELOCITY,
  TRANSPARENT_WORLD_BOSS_SLOW,
  TRANSPARENT_WORLD_NORMAL_SLOW,
} from './constants';
import { DEMON_ABILITY_DB, DEMON_TEMPLATES } from './demons';
import { ParticleSystem } from './particles';
import {
  ArenaHazardKind,
  ArenaObstacle,
  ArenaPlatform,
  BdaProjectile,
  DemonArchetype,
  Fighter,
} from './types';

export interface AiBdaSpawn {
  projectiles?: Omit<BdaProjectile, 'id'>[];
  projectile?: Omit<BdaProjectile, 'id'>;
  spawnCloneArchetype?: DemonArchetype;
  triggerRoomShift?: boolean;
  teleportToX?: number;
  telegraphText?: string | null;
  spawnHazard?: {
    x: number;
    y: number;
    w: number;
    h: number;
    kind: ArenaHazardKind;
    damage: number;
    cycleDuration: number;
  };
}

export class EnemyAI {
  private decisionCooldown = 0.25;
  private attackCooldown = 0.52;
  private bdaCooldown = 1.9;
  private ultimateCooldown = 7.2;
  private cloneCooldown = 8.0;
  private defenseCooldown = 1.05;
  private classPowerCooldown = 4.2;
  private strafeDir: -1 | 0 | 1 = 0;
  private strafeTimer = 0;
  private activeTelegraph: string | null = null;
  private telegraphTimer = 0;
  private comboCounter = 0;
  private playerLightSpamCount = 0;
  private lastSeenPlayerSwingId = -1;
  private adaptCooldown = 0;

  public reset(): void {
    this.decisionCooldown = 0.25;
    this.attackCooldown = 0.52;
    this.bdaCooldown = 1.9;
    this.ultimateCooldown = 7.2;
    this.cloneCooldown = 7.5;
    this.defenseCooldown = 1.05;
    this.classPowerCooldown = 3.8;
    this.strafeDir = 0;
    this.strafeTimer = 0;
    this.activeTelegraph = null;
    this.telegraphTimer = 0;
    this.comboCounter = 0;
    this.playerLightSpamCount = 0;
    this.lastSeenPlayerSwingId = -1;
    this.adaptCooldown = 0;
  }

  public getTelegraph(): string | null {
    return this.telegraphTimer > 0 ? this.activeTelegraph : null;
  }

  private setTelegraph(text: string, duration = 0.95): void {
    this.activeTelegraph = text;
    this.telegraphTimer = duration;
  }

  public update(
    demon: Fighter,
    targets: Fighter[],
    dt: number,
    sound: SoundEngine,
    particles: ParticleSystem,
    allowCloneSpawn = true,
    isEngaged = true,
    obstacles: ArenaObstacle[] = [],
    _platforms: ArenaPlatform[] = [],
    allyDemonX?: number | null,
    aiRateMult = 1.0
  ): AiBdaSpawn | null {
    this.telegraphTimer = Math.max(0, this.telegraphTimer - dt);
    if (this.telegraphTimer <= 0) {
      this.activeTelegraph = null;
    }

    if (demon.hp <= 0 || demon.state === 'DEFEATED') {
      demon.vx = 0;
      this.activeTelegraph = null;
      return null;
    }

    if (!isEngaged) {
      demon.vx *= 0.85;
      if (Math.abs(demon.vx) < 5) demon.vx = 0;
      demon.state = 'IDLE';
      return null;
    }

    const arch = demon.demonArchetype ?? 'basic';
    const template = DEMON_TEMPLATES[arch];
    const specDb = DEMON_ABILITY_DB[arch];
    const dClass = demon.demonClass ?? specDb.demonClass ?? 'basic';
    const chillFactor = demon.chillTimer > 0 ? 0.65 : 1.0;

    // 4-Phase transitions at 75%, 50%, 25% HP for Upper Moons, Muzan & Major Bosses
    const hpRatio = demon.maxHp > 0 ? demon.hp / demon.maxHp : 0;
    const isMajorBoss =
      specDb.phases >= 4 ||
      dClass === 'boss' ||
      arch.startsWith('boss_') ||
      arch === 'muzan_final' ||
      arch === 'kokushibo_demon' ||
      arch === 'akaza_awakened' ||
      arch === 'doma_final' ||
      arch === 'gyutaro' ||
      arch === 'gyutaro_awakened' ||
      arch === 'daki_awakened' ||
      arch === 'gyokko' ||
      arch === 'zohakuten';

    const maxPhases = isMajorBoss ? 4 : specDb.phases;
    const shortName = template.displayName.split('·')[0].trim();

    if (maxPhases >= 4 && hpRatio <= 0.25 && demon.bossPhase < 4) {
      demon.bossPhase = 4;
      demon.shieldTimer = Math.max(demon.shieldTimer ?? 0, 2.5);
      sound.playTransformation();
      sound.playDemonLaugh();
      sound.setBossPhaseIntensity(3);
      this.bdaCooldown = Math.min(this.bdaCooldown, 0.4);
      this.ultimateCooldown = Math.min(this.ultimateCooldown, 1.2);
      this.setTelegraph(`${shortName} · FINAL TRANSFORMATION (25% HP)!`, 1.75);
      particles.spawnFloatingText(demon.x, demon.y - 145, 'PHASE IV · ABYSSAL DESPERATION!', '#f43f5e', 1.45);
    } else if (maxPhases >= 3 && hpRatio <= 0.5 && demon.bossPhase < 3) {
      demon.bossPhase = 3;
      sound.playTransformation();
      sound.playDemonLaugh();
      sound.setBossPhaseIntensity(3);
      this.bdaCooldown = Math.min(this.bdaCooldown, 0.5);
      this.setTelegraph(`${shortName} · PHASE III ENRAGED (50% HP)!`, 1.45);
      particles.spawnFloatingText(demon.x, demon.y - 135, 'PHASE III ENRAGED!', template.bdaColor, 1.32);
    } else if (maxPhases >= 2 && hpRatio <= 0.75 && demon.bossPhase < 2) {
      demon.bossPhase = 2;
      sound.playTransformation();
      sound.playDemonRoar();
      sound.setBossPhaseIntensity(2);
      this.setTelegraph(`${shortName} · PHASE II AWAKENED (75% HP)`, 1.25);
      particles.spawnFloatingText(demon.x, demon.y - 130, 'PHASE II AWAKENED!', template.bdaColor, 1.22);
    }

    // Demon cellular regeneration (suppressed while ragdolled, poisoned, or scorched by Red Blade)
    if (
      template.regenPerSec > 0 &&
      demon.state !== 'RAGDOLL' &&
      demon.poisonTimer <= 0 &&
      demon.redBladeBurnTimer <= 0
    ) {
      demon.regenTimer += dt;
      if (demon.regenTimer >= 1.0) {
        demon.regenTimer = 0;
        const phaseRegenMult = demon.bossPhase === 4 ? 1.65 : demon.bossPhase === 3 ? 1.38 : demon.bossPhase === 2 ? 1.18 : 1.0;
        const heal = Math.round(template.regenPerSec * phaseRegenMult);
        if (demon.hp < demon.maxHp) {
          demon.hp = Math.min(demon.maxHp, demon.hp + heal);
        }
      }
    }

    if (
      demon.state === 'RAGDOLL' ||
      demon.state === 'GETTING_UP' ||
      demon.state === 'HURT' ||
      demon.state === 'DODGE' ||
      demon.state === 'ATTACK_WINDUP' ||
      demon.state === 'BDA_CAST' ||
      demon.state === 'LIGHT_ATTACK' ||
      demon.state === 'HEAVY_ATTACK'
    ) {
      return null;
    }

    const aliveTargets = targets.filter((t) => t.hp > 0);
    if (aliveTargets.length === 0) {
      demon.state = 'IDLE';
      demon.vx = 0;
      return null;
    }

    let target = aliveTargets[0];
    let bestDist = Math.abs(target.x - demon.x);
    for (let i = 1; i < aliveTargets.length; i++) {
      const d = Math.abs(aliveTargets[i].x - demon.x);
      if (d < bestDist) {
        bestDist = d;
        target = aliveTargets[i];
      }
    }

    const targetHasTransparent =
      Boolean(target.transparentWorldActive) ||
      (target.awakeningActive &&
        (target.awakeningTier === 'transparent_world' || target.awakeningTier === 'transcendent'));
    const targetHasSelfless =
      target.awakeningActive &&
      (target.awakeningTier === 'selfless_state' || target.awakeningTier === 'transcendent');

    // Transparent World slows ordinary demons ~35% (0.65) and Upper Moon / Muzan bosses ~13% (0.87)
    const isBossUnit = isMajorBoss || arch.startsWith('boss_') || specDb.difficultyTier === 'Extreme' || specDb.difficultyTier === 'Insane';
    const transparentSlow = targetHasTransparent
      ? isBossUnit
        ? TRANSPARENT_WORLD_BOSS_SLOW
        : TRANSPARENT_WORLD_NORMAL_SLOW
      : 1.0;

    const phasePace = demon.bossPhase === 4 ? 1.38 : demon.bossPhase === 3 ? 1.24 : demon.bossPhase === 2 ? 1.12 : 1.0;
    const paceDt = dt * chillFactor * transparentSlow * phasePace * aiRateMult;

    this.attackCooldown = Math.max(0, this.attackCooldown - paceDt);
    this.decisionCooldown = Math.max(0, this.decisionCooldown - paceDt);
    this.bdaCooldown = Math.max(0, this.bdaCooldown - paceDt);
    this.ultimateCooldown = Math.max(0, this.ultimateCooldown - paceDt);
    this.cloneCooldown = Math.max(0, this.cloneCooldown - dt);
    this.defenseCooldown = Math.max(0, this.defenseCooldown - paceDt);
    this.classPowerCooldown = Math.max(0, this.classPowerCooldown - paceDt);
    this.strafeTimer = Math.max(0, this.strafeTimer - dt);
    this.adaptCooldown = Math.max(0, this.adaptCooldown - dt);

    const dx = target.x - demon.x;
    const absDx = Math.abs(dx);
    demon.facing = dx >= 0 ? 1 : -1;

    // Anti-spam adaptation: track repeated player slashes on the same rhythm
    if (
      target.state === 'LIGHT_ATTACK' &&
      target.attackSwingId !== this.lastSeenPlayerSwingId &&
      absDx < 170
    ) {
      this.lastSeenPlayerSwingId = target.attackSwingId;
      this.playerLightSpamCount += 1;
    } else if (target.state === 'BREATHING_FORM' || target.state === 'HEAVY_ATTACK') {
      this.playerLightSpamCount = Math.max(0, this.playerLightSpamCount - 1);
    }

    const isAkaza = arch === 'boss_akaza' || arch === 'akaza_awakened';
    const isDoma = arch === 'boss_doma' || arch === 'doma_ice_clone' || arch === 'doma_final';
    const isKokushibo = arch === 'boss_kokushibo' || arch === 'kokushibo_demon';
    const isGyutaro = arch === 'gyutaro' || arch === 'gyutaro_awakened';
    const isGyokko = arch === 'gyokko';
    const isHantengu = arch === 'hantengu_base' || arch === 'zohakuten' || arch === 'hantengu_merged';
    const isRui = arch === 'boss_rui' || arch === 'rui_brother' || arch === 'spider_brother_main';
    const isNakime = arch === 'boss_nakime';
    const isMuzanTier =
      arch === 'boss_muzan' || arch === 'muzan_final' || arch === 'demon_king_tanjiro';

    // Anti-spam / Breakaway counter after 3-4 consecutive hits or light slash spam
    if (
      ((demon.consecutiveHitsTaken ?? 0) >= 3 || (this.playerLightSpamCount >= 4 && isBossUnit)) &&
      this.adaptCooldown <= 0
    ) {
      demon.consecutiveHitsTaken = 0;
      this.playerLightSpamCount = 0;
      this.adaptCooldown = isBossUnit ? 2.1 : 2.8;
      this.defenseCooldown = 1.1;

      const rollAdapt = Math.random();
      if (rollAdapt < 0.45 && absDx < 145) {
        // Immediate armored counter kick/slam!
        demon.currentAttack = isMuzanTier
          ? DEMON_ATTACK_SPECS.MUZAN_TENTACLE_WHIP
          : isAkaza
            ? DEMON_ATTACK_SPECS.DEMON_KICK
            : DEMON_ATTACK_SPECS.DEMON_HEAVY_SLAM;
        demon.state = 'ATTACK_WINDUP';
        demon.stateTimer = 0;
        demon.attackSwingId += 1;
        demon.hitTargetsThisSwing.clear();
        demon.vx = 0;
        this.setTelegraph('ADAPTIVE COUNTERSTRIKE!', 0.7);
        particles.spawnFloatingText(demon.x, demon.y - 120, 'ADAPTED · COUNTER!', '#fb7185', 0.92);
        sound.playDemonTelegraph();
        return null;
      } else if (rollAdapt < 0.78) {
        demon.state = 'DODGE';
        demon.stateTimer = 0;
        demon.invulnTimer = 0.28;
        // Evasive dash behind or away from player
        demon.vx = (absDx < 95 ? demon.facing : -demon.facing) * 640;
        sound.playDodge();
        particles.spawnFloatingText(demon.x, demon.y - 115, 'EVASIVE STEP!', '#fda4af', 0.85);
        return null;
      } else {
        demon.state = 'BLOCK';
        demon.stateTimer = 0;
        demon.vx = 0;
        particles.spawnFloatingText(demon.x, demon.y - 115, 'IRON GUARD!', '#fbbf24', 0.85);
        return null;
      }
    }

    if (target.state === 'RAGDOLL' && absDx < 140 && !isMuzanTier && !isAkaza && !isKokushibo) {
      demon.state = 'IDLE';
      demon.vx *= 0.85;
      return null;
    }

    // Strategic defensive reactions: block, dodge, retreat when threatened or low HP
    const incomingThreat =
      target.state === 'LIGHT_ATTACK' ||
      target.state === 'HEAVY_ATTACK' ||
      target.state === 'BREATHING_FORM' ||
      target.state === 'RUNNING_ATTACK' ||
      target.state === 'COUNTER_ATTACK';

    if (incomingThreat && absDx < 185 && this.defenseCooldown <= 0) {
      const akazaPenalty = targetHasSelfless ? -0.22 : 0.24;
      const baseDodge = isAkaza
        ? Math.max(0.16, Math.min(0.75, specDb.dodgeChance + akazaPenalty))
        : specDb.dodgeChance;
      const dodgeProb = Math.min(0.8, baseDodge + (demon.bossPhase >= 3 ? 0.12 : 0));

      if (Math.random() < dodgeProb) {
        demon.state = 'DODGE';
        demon.stateTimer = 0;
        demon.invulnTimer = isAkaza ? 0.3 : 0.24;
        const evadeBehind = absDx < 110 && Math.random() < 0.45;
        demon.vx = (evadeBehind ? demon.facing : -demon.facing) * (specDb.canTeleport ? 710 : 580);
        this.defenseCooldown = isBossUnit ? 1.05 : 1.45;
        this.attackCooldown = Math.min(this.attackCooldown, 0.25); // Quick counter after dodge!
        sound.playDodge();
        if (isAkaza) {
          this.setTelegraph(
            targetHasSelfless ? 'COMPASS DISRUPTED!' : 'COMPASS NEEDLE: READING SPIRIT!',
            0.85
          );
          particles.spawnFloatingText(
            demon.x,
            demon.y - 122,
            targetHasSelfless ? 'SPIRIT LOST!' : 'COMPASS EVADE!',
            '#38bdf8',
            0.9
          );
        }
        return null;
      } else if ((specDb.canBlock || isRui) && Math.random() < 0.52) {
        demon.state = 'BLOCK';
        demon.stateTimer = 0;
        demon.vx = 0;
        this.defenseCooldown = 1.2;
        this.attackCooldown = Math.min(this.attackCooldown, 0.22); // Counter-ready after guard!
        if (isRui) {
          particles.spawnFloatingText(demon.x, demon.y - 115, 'STEEL THREAD GUARD', '#fda4af', 0.85);
        }
        return null;
      }
    } else if (demon.state === 'BLOCK' && !incomingThreat) {
      demon.state = 'IDLE';
      // Counterattack immediately when player finishes swinging into guard
      if (absDx < 135 && this.attackCooldown <= 0.25) {
        this.attackCooldown = 0;
      }
    }

    // Active Demon Class Powers (working abilities & cooldowns per class)
    if (this.classPowerCooldown <= 0 && absDx < 480) {
      if (dClass === 'regeneration' && hpRatio < 0.88 && demon.poisonTimer <= 0 && demon.redBladeBurnTimer <= 0) {
        this.classPowerCooldown = 6.2;
        const healAmt = Math.round(demon.maxHp * 0.09);
        demon.hp = Math.min(demon.maxHp, demon.hp + healAmt);
        demon.shieldTimer = Math.max(demon.shieldTimer ?? 0, 3.2);
        sound.playTransformation();
        particles.spawnFloatingText(demon.x, demon.y - 128, `REGEN SURGE +${healAmt} & SHIELD!`, '#34d399', 1.05);
        particles.spawnPoisonCloud(demon.x, demon.y - 45, 8);
        return null;
      }
      if (dClass === 'fast' && absDx > 160) {
        this.classPowerCooldown = 4.6;
        const dashBehindX = target.x + (target.facing === 1 ? -115 : 115);
        sound.playDodge();
        particles.spawnDust(demon.x, demon.y, 8, 0);
        this.setTelegraph('PHANTOM TELEPORT DASH!', 0.7);
        return { teleportToX: dashBehindX, telegraphText: this.activeTelegraph };
      }
      if (dClass === 'shadow' && absDx > 130) {
        this.classPowerCooldown = 5.0;
        const ambushX = target.x - target.facing * 105;
        sound.playDemonAttackSound('biwa', false);
        this.setTelegraph('SHADOW STEP AMBUSH!', 0.75);
        particles.spawnFloatingText(demon.x, demon.y - 120, 'SHADOW BLINK!', '#c084fc', 0.95);
        return { teleportToX: ambushX, telegraphText: this.activeTelegraph };
      }
      if (dClass === 'poison') {
        this.classPowerCooldown = 5.4;
        sound.playDemonAttackSound('sickle', false);
        particles.spawnPoisonCloud(demon.x + demon.facing * 50, demon.y - 45, 16);
        this.setTelegraph('TOXIC MIASMA POOL!', 0.9);
        return {
          spawnHazard: {
            x: Math.max(120, target.x - 65),
            y: demon.y - 18,
            w: 130,
            h: 22,
            kind: 'poison_pool',
            damage: Math.round(8 * demon.damageMult),
            cycleDuration: 4.5,
          },
          telegraphText: this.activeTelegraph,
        };
      }
      if (dClass === 'blood') {
        this.classPowerCooldown = 5.2;
        sound.playDemonAttackSound('sickle', false);
        this.setTelegraph('CRIMSON BLOOD TRAP!', 0.85);
        return {
          spawnHazard: {
            x: Math.max(120, target.x - 55),
            y: demon.y - 16,
            w: 110,
            h: 20,
            kind: 'blood_trap',
            damage: Math.round(14 * demon.damageMult),
            cycleDuration: 3.6,
          },
          telegraphText: this.activeTelegraph,
        };
      }
      if (dClass === 'ice') {
        this.classPowerCooldown = 5.4;
        sound.playDemonAttackSound('ice', false);
        this.setTelegraph('GLACIAL FROST FLOOR!', 0.9);
        return {
          spawnHazard: {
            x: Math.max(120, target.x - 75),
            y: demon.y - 14,
            w: 150,
            h: 18,
            kind: 'ice_patch',
            damage: Math.round(9 * demon.damageMult),
            cycleDuration: 4.8,
          },
          telegraphText: this.activeTelegraph,
        };
      }
    }

    // Clone / subordinate spawning (Doma Ice Clones, Hantengu clones, Rui family)
    if (allowCloneSpawn && specDb.cloneArchetype && this.cloneCooldown <= 0 && hpRatio < 0.85) {
      this.cloneCooldown = isDoma ? 11.5 : 13.5;
      sound.playDemonAttackSound(specDb.sfxTheme, true);
      const summonText = isDoma ? 'CRYSTALLINE DIVINE CHILD!' : isHantengu ? 'EMOTION MANIFESTATION SPLIT!' : 'SUMMONING ALLY!';
      this.setTelegraph(summonText, 1.3);
      particles.spawnFloatingText(demon.x, demon.y - 135, summonText, template.bdaColor, 1.2);
      return {
        spawnCloneArchetype: specDb.cloneArchetype,
        telegraphText: this.activeTelegraph,
      };
    }

    // Gyokko Pot Teleportation / Nakime Room Shift
    if (
      (specDb.canTeleport || isNakime || isGyokko) &&
      ((isNakime && this.bdaCooldown <= 0.4 && Math.random() < 0.08) ||
        (isGyokko && absDx < 95 && this.defenseCooldown <= 0) ||
        (absDx < 85 && this.defenseCooldown <= 0 && Math.random() < 0.06))
    ) {
      this.defenseCooldown = isNakime ? 2.2 : isGyokko ? 2.6 : 3.0;
      const offset = Math.random() < 0.5 ? -290 : 290;
      const shift = target.x + offset;
      sound.playDemonAttackSound(specDb.sfxTheme, false);
      particles.spawnDust(demon.x, demon.y, 10, 0);
      if (isNakime) {
        this.setTelegraph('BIWA STRUM · INFINITY ROOM SHIFT!', 1.0);
      } else if (isGyokko) {
        this.setTelegraph('PORCELAIN POT TELEPORT!', 0.9);
      }
      return {
        teleportToX: shift,
        triggerRoomShift: Boolean(specDb.triggersRoomShift || isNakime),
        telegraphText: this.activeTelegraph,
      };
    }

    // Jump up if player is elevated on a platform
    if (target.y < demon.y - 75 && demon.grounded && absDx < 260 && Math.random() < 0.075) {
      demon.vy = PLAYER_JUMP_VELOCITY * 0.95;
      demon.grounded = false;
      demon.state = 'JUMP';
    }

    // Ultimate Blood Demon Art cast!
    if (this.ultimateCooldown <= 0 && absDx < 660 && (maxPhases > 1 || specDb.difficultyTier !== 'Easy')) {
      demon.currentAttack = isMuzanTier
        ? DEMON_ATTACK_SPECS.MUZAN_SHOCKWAVE
        : DEMON_ATTACK_SPECS.DEMON_ULTIMATE;
      demon.state = 'BDA_CAST';
      demon.stateTimer = 0;
      demon.attackSwingId += 1;
      demon.hitTargetsThisSwing.clear();
      demon.vx = 0;
      const phaseUltMult = demon.bossPhase >= 4 ? 0.65 : demon.bossPhase >= 3 ? 0.78 : demon.bossPhase >= 2 ? 0.88 : 1.0;
      this.ultimateCooldown = specDb.ultimateCooldown * phaseUltMult;
      this.bdaCooldown = 1.6;
      this.setTelegraph(specDb.ultimateText, 1.45);
      sound.playDemonAttackSound(specDb.sfxTheme, true);
      if (isDoma || isAkaza || isMuzanTier || isKokushibo || isGyutaro) {
        sound.playDemonLaugh();
      }
      particles.spawnFloatingText(demon.x, demon.y - 135, specDb.ultimateText, template.bdaColor, 1.25);

      const projectiles = this.buildProjectiles(demon, template.bdaColor, template.bdaGlow, specDb, true);
      return {
        projectiles,
        projectile: projectiles[0],
        triggerRoomShift: Boolean(specDb.triggersRoomShift),
        telegraphText: this.activeTelegraph,
      };
    }

    // Standard Blood Demon Art cast based on archetype fighting style
    if (this.bdaCooldown <= 0 && absDx >= Math.max(55, specDb.preferredMinDist * 0.6) && absDx <= 620) {
      const preferArea = isAkaza ? absDx < 175 : isDoma ? absDx < 220 : absDx < 195;
      const isArea = preferArea && Math.random() < (isDoma ? 0.4 : 0.48);
      demon.currentAttack = isArea
        ? isMuzanTier
          ? DEMON_ATTACK_SPECS.MUZAN_SHOCKWAVE
          : DEMON_ATTACK_SPECS.DEMON_BDA_AREA
        : DEMON_ATTACK_SPECS.DEMON_BDA_PROJECTILE;
      demon.state = 'BDA_CAST';
      demon.stateTimer = 0;
      demon.attackSwingId += 1;
      demon.hitTargetsThisSwing.clear();
      demon.vx = 0;
      const phaseBdaMult = demon.bossPhase === 4 ? 0.56 : demon.bossPhase === 3 ? 0.68 : demon.bossPhase === 2 ? 0.82 : 1.0;
      this.bdaCooldown = specDb.bdaCooldown * phaseBdaMult;
      sound.playDemonAttackSound(specDb.sfxTheme, false);

      const bdaBanner = isAkaza
        ? 'DESTRUCTIVE DEATH · AIR TYPE!'
        : isDoma
          ? 'CRYOKINESIS · SCATTERING LOTUSES!'
          : isKokushibo
            ? 'MOON BREATHING · CALAMITOUS CRESCENTS!'
            : isGyutaro
              ? 'FLYING BLOOD SICKLES!'
              : isGyokko
                ? 'KILLER FISH SCALES · NEEDLE BARRAGE!'
                : isHantengu
                  ? 'DRUM LIGHTNING & WOOD DRAGON!'
                  : `${shortName} unleashes Blood Demon Art!`;
      this.setTelegraph(bdaBanner, 0.95);

      if (!isArea) {
        const projectiles = this.buildProjectiles(demon, template.bdaColor, template.bdaGlow, specDb, false);
        return {
          projectiles,
          projectile: projectiles[0],
          triggerRoomShift: Boolean(specDb.triggersRoomShift),
          telegraphText: this.activeTelegraph,
        };
      }
      return {
        triggerRoomShift: Boolean(specDb.triggersRoomShift),
        telegraphText: this.activeTelegraph,
      };
    }

    // Flanking / Surrounding Coordination when fighting alongside a partner demon
    const sameSideAsPartner =
      typeof allyDemonX === 'number' &&
      Math.sign(allyDemonX - target.x) === Math.sign(demon.x - target.x) &&
      Math.abs(allyDemonX - demon.x) < 120 &&
      absDx < 220;

    // Distance management + Intelligent Solid Obstacle Jumping / Destroying
    const baseMove = isAkaza || dClass === 'fast' || arch === 'chachamaru' ? 300 : isGyutaro || isKokushibo ? 275 : 228;
    const moveSpeed = baseMove * demon.speedMult * chillFactor * transparentSlow * (demon.bossPhase >= 3 ? 1.12 : 1.0);

    // Detect solid obstacle directly in path
    const blockingObstacle = obstacles.find(
      (o) =>
        o.solid &&
        o.hp > 0 &&
        demon.y > o.y + 8 &&
        ((demon.facing === 1 && o.x >= demon.x && o.x - demon.x < 78) ||
          (demon.facing === -1 && o.x + o.w <= demon.x && demon.x - (o.x + o.w) < 78))
    );

    if (blockingObstacle) {
      if (blockingObstacle.destructible && this.attackCooldown <= 0 && Math.random() < 0.52) {
        demon.currentAttack = DEMON_ATTACK_SPECS.DEMON_CLAW;
        demon.state = 'ATTACK_WINDUP';
        demon.stateTimer = 0;
        demon.attackSwingId += 1;
        demon.hitTargetsThisSwing.clear();
        demon.vx = 0;
        this.attackCooldown = 0.58;
        return null;
      } else if (demon.grounded) {
        demon.vy = PLAYER_JUMP_VELOCITY * 0.96;
        demon.grounded = false;
        demon.vx = demon.facing * moveSpeed;
        demon.state = 'JUMP';
        return null;
      }
    }

    if (sameSideAsPartner && demon.grounded && this.defenseCooldown <= 0) {
      // Leap over the player to surround them from both sides!
      this.defenseCooldown = 2.0;
      demon.vy = PLAYER_JUMP_VELOCITY * 0.85;
      demon.grounded = false;
      demon.vx = demon.facing * moveSpeed * 1.45;
      demon.state = 'JUMP';
      return null;
    }

    // Tactical retreat when low HP & ranged/poison/shadow class
    if (
      hpRatio < 0.28 &&
      absDx < 95 &&
      (dClass === 'poison' || dClass === 'shadow' || isGyokko || isHantengu) &&
      this.defenseCooldown <= 0
    ) {
      demon.vx = -demon.facing * moveSpeed * 1.1;
      demon.state = 'WALK';
      return null;
    }

    if (absDx > specDb.preferredMaxDist) {
      demon.vx = demon.facing * moveSpeed;
      demon.state = moveSpeed > 220 ? 'RUN' : 'WALK';
    } else if (absDx < specDb.preferredMinDist && specDb.preferredMinDist >= 110) {
      demon.vx = -demon.facing * moveSpeed * 0.88;
      demon.state = 'WALK';
    } else if (
      this.attackCooldown <= 0 &&
      this.decisionCooldown <= 0 &&
      absDx <= Math.max(155, specDb.preferredMaxDist)
    ) {
      this.comboCounter = (this.comboCounter + 1) % 3;
      const roll = Math.random();
      let spec = DEMON_ATTACK_SPECS.DEMON_CLAW;

      if (isMuzanTier) {
        spec =
          this.comboCounter === 0
            ? DEMON_ATTACK_SPECS.MUZAN_TENTACLE_WHIP
            : this.comboCounter === 1
              ? DEMON_ATTACK_SPECS.DEMON_PUNCH_COMBO
              : DEMON_ATTACK_SPECS.MUZAN_SHOCKWAVE;
      } else if (isAkaza) {
        spec =
          this.comboCounter === 0
            ? DEMON_ATTACK_SPECS.DEMON_PUNCH_COMBO
            : this.comboCounter === 1
              ? DEMON_ATTACK_SPECS.DEMON_KICK
              : DEMON_ATTACK_SPECS.DEMON_HEAVY_SLAM;
      } else if (isKokushibo) {
        spec =
          this.comboCounter === 2
            ? DEMON_ATTACK_SPECS.DEMON_HEAVY_SLAM
            : { ...BASE_ATTACK_SPECS.LIGHT_1, kind: 'LIGHT_1', damage: Math.round(20 * demon.damageMult), range: 140 };
      } else if (isGyutaro) {
        spec =
          this.comboCounter === 0
            ? DEMON_ATTACK_SPECS.DEMON_CLAW
            : this.comboCounter === 1
              ? DEMON_ATTACK_SPECS.DEMON_KICK
              : DEMON_ATTACK_SPECS.DEMON_PUNCH_COMBO;
      } else if (template.visual.bodyBuild === 'hulk' || dClass === 'tank') {
        spec = this.comboCounter === 2 ? DEMON_ATTACK_SPECS.DEMON_HEAVY_SLAM : DEMON_ATTACK_SPECS.DEMON_PUNCH_COMBO;
      } else if (
        specDb.sfxTheme === 'martial' ||
        dClass === 'fast' ||
        arch === 'nezuko_awakened' ||
        arch === 'nezuko_adult'
      ) {
        spec =
          this.comboCounter === 0
            ? DEMON_ATTACK_SPECS.DEMON_KICK
            : this.comboCounter === 1
              ? DEMON_ATTACK_SPECS.DEMON_PUNCH_COMBO
              : DEMON_ATTACK_SPECS.DEMON_HEAVY_SLAM;
      } else {
        // Varied combo cycling for normal demons instead of repeating one strike
        spec =
          this.comboCounter === 0
            ? DEMON_ATTACK_SPECS.DEMON_CLAW
            : this.comboCounter === 1
              ? DEMON_ATTACK_SPECS.DEMON_KICK
              : roll < 0.5
                ? DEMON_ATTACK_SPECS.DEMON_PUNCH_COMBO
                : DEMON_ATTACK_SPECS.DEMON_HEAVY_SLAM;
      }

      if (specDb.poisonDps && specDb.poisonDps > 0) {
        spec = { ...spec, poisonDps: specDb.poisonDps };
      }

      demon.currentAttack = spec;
      demon.state = 'ATTACK_WINDUP';
      demon.stateTimer = 0;
      demon.attackSwingId += 1;
      demon.hitTargetsThisSwing.clear();
      demon.vx = 0;

      const paceFactor = isBossUnit
        ? demon.bossPhase === 4
          ? 0.48
          : demon.bossPhase === 3
            ? 0.58
            : demon.bossPhase === 2
              ? 0.72
              : 0.84
        : 0.82;
      this.attackCooldown = (spec.triggersRagdoll ? 1.05 : 0.68) * paceFactor;
      this.decisionCooldown = 0.16 * paceFactor;
      if (spec.triggersRagdoll) {
        this.setTelegraph(isAkaza ? 'COMPASS LEG SPLITTER!' : 'INCOMING HEAVY STRIKE!', 0.55);
      }
      sound.playDemonTelegraph();
    } else {
      if (this.strafeTimer <= 0) {
        this.strafeDir = absDx < 58 ? (-demon.facing as -1 | 1) : 0;
        this.strafeTimer = 0.22 + Math.random() * 0.2;
      }
      demon.vx = this.strafeDir * 135 * chillFactor;
      demon.state = this.strafeDir === 0 ? 'IDLE' : 'WALK';
    }

    return null;
  }

  private buildProjectiles(
    demon: Fighter,
    color: string,
    glowColor: string,
    specDb: (typeof DEMON_ABILITY_DB)[DemonArchetype],
    isUltimate: boolean
  ): Omit<BdaProjectile, 'id'>[] {
    const kind = isUltimate ? specDb.ultimateKind : specDb.projectileKind;
    const phaseBonus = demon.bossPhase >= 4 ? 3 : demon.bossPhase >= 3 ? 2 : demon.bossPhase >= 2 ? 1 : 0;
    const isAirType = kind === 'compass_wave';
    const count = isAirType
      ? Math.max(isUltimate ? 4 : 2, specDb.multiShotCount + phaseBonus)
      : isUltimate
        ? Math.max(2, specDb.multiShotCount + phaseBonus)
        : Math.max(1, specDb.multiShotCount + (demon.bossPhase >= 2 ? 1 : 0));
    const speed = specDb.projectileSpeed * (isUltimate ? 1.18 : 1.0) * (isAirType ? 1.18 : 1.0);
    const dmg = Math.round((isUltimate ? 24 : 16) * demon.damageMult);
    const out: Omit<BdaProjectile, 'id'>[] = [];

    for (let i = 0; i < count; i++) {
      const spreadOffset = count === 1 ? 0 : (i - (count - 1) * 0.5) * (isAirType ? 34 : 76);
      const isSwampOrSpike = kind === 'ground_spike' || kind === 'swamp_pool';
      const isBuddhaOrDragon = kind === 'ice_buddha' || kind === 'wooden_dragon';
      out.push({
        ownerId: demon.id,
        ownerRole: 'demon',
        x: demon.x + demon.facing * (44 + (isAirType ? i * 36 : i * 16)),
        y: isSwampOrSpike
          ? demon.y - 6
          : demon.y - (isAirType ? 58 + (i % 2 === 0 ? -10 : 8) : 64) + spreadOffset * 0.22,
        vx: demon.facing * speed * (1 + i * (isAirType ? 0.08 : 0.05)),
        vy: kind === 'temari_ball' ? -260 - i * 50 : isAirType ? spreadOffset * 0.14 : spreadOffset * 0.58,
        radius: isBuddhaOrDragon ? 32 : isUltimate ? 21 : 15,
        damage: dmg,
        color,
        glowColor,
        life: kind === 'swamp_pool' ? 2.6 : 2.35,
        maxLife: kind === 'swamp_pool' ? 2.6 : 2.35,
        kind,
        triggeredRagdoll: isUltimate || isBuddhaOrDragon || kind === 'compass_wave' || kind === 'vector_arrow',
        bouncesLeft: kind === 'temari_ball' ? (specDb.bounces ?? 3) : 0,
        chillDuration: specDb.chillDuration,
        poisonDps: specDb.poisonDps,
        gravityScale: kind === 'temari_ball' ? 0.55 : 0,
      });
    }
    return out;
  }
}

/**
 * AI Controller for Canon Allies (Hashira, Squadmates & Nezuko) fighting alongside the player.
 * Supports multi-zone traversal: follows beside the player across large maps when no demon is nearby.
 */
export class HashiraAllyAI {
  private attackCooldown = 0.55;
  private specialCooldown = 2.4;
  private dodgeCooldown = 1.2;

  public update(
    ally: Fighter,
    enemies: Fighter[],
    player: Fighter,
    slotIndex: number,
    dt: number,
    sound: SoundEngine,
    particles: ParticleSystem,
    enemyEngaged: boolean
  ): void {
    if (ally.hp <= 0 || ally.state === 'DEFEATED') {
      ally.vx = 0;
      return;
    }

    if (
      ally.state === 'RAGDOLL' ||
      ally.state === 'GETTING_UP' ||
      ally.state === 'HURT' ||
      ally.state === 'DODGE' ||
      ally.state === 'LIGHT_ATTACK' ||
      ally.state === 'HEAVY_ATTACK' ||
      ally.state === 'BREATHING_FORM'
    ) {
      return;
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);

    const aliveEnemies = enemies.filter((e) => e.hp > 0);
    let target = aliveEnemies[0];
    let bestDist = target ? Math.abs(target.x - ally.x) : 99999;
    for (let i = 1; i < aliveEnemies.length; i++) {
      const d = Math.abs(aliveEnemies[i].x - ally.x);
      if (d < bestDist) {
        bestDist = d;
        target = aliveEnemies[i];
      }
    }

    // Exploration Follow Mode when between zones or target is far away
    if (!target || !enemyEngaged || bestDist > 680) {
      const followOffset = -player.facing * (78 + slotIndex * 54);
      const followTargetX = player.x + followOffset;
      const distToFollow = followTargetX - ally.x;
      if (Math.abs(distToFollow) > 42) {
        ally.facing = distToFollow >= 0 ? 1 : -1;
        const followSpeed = Math.abs(distToFollow) > 190 ? 345 : 230;
        ally.vx = ally.facing * followSpeed;
        ally.state = followSpeed > 260 ? 'RUN' : 'WALK';
        // Jump if stuck behind height or player jumped up
        if (player.y < ally.y - 80 && ally.grounded && Math.abs(player.x - ally.x) < 160) {
          ally.vy = PLAYER_JUMP_VELOCITY * 0.95;
          ally.grounded = false;
          ally.state = 'JUMP';
        }
      } else {
        ally.vx *= 0.72;
        ally.facing = player.facing;
        ally.state = 'IDLE';
      }
      return;
    }

    const dx = target.x - ally.x;
    const absDx = Math.abs(dx);
    ally.facing = dx >= 0 ? 1 : -1;

    // Defensive evasion against telegraphed demon attacks
    if (
      (target.state === 'ATTACK_WINDUP' || target.state === 'BDA_CAST') &&
      absDx < 200 &&
      this.dodgeCooldown <= 0
    ) {
      if (Math.random() < 0.62) {
        ally.state = 'DODGE';
        ally.stateTimer = 0;
        ally.vx = -ally.facing * 560;
        ally.invulnTimer = 0.25;
        this.dodgeCooldown = 1.45;
        sound.playDodge();
        return;
      } else {
        ally.state = 'BLOCK';
        ally.vx = 0;
        return;
      }
    }

    const isNezuko = ally.characterId === 'nezuko_ally';
    const urgentProtect = player.state === 'RAGDOLL' || player.hp < player.maxHp * 0.35;
    const moveSpeed = (urgentProtect ? 335 : 275) * ally.speedMult;

    if (absDx > 112) {
      ally.vx = ally.facing * moveSpeed;
      ally.state = moveSpeed > 280 ? 'RUN' : 'WALK';
    } else if (this.specialCooldown <= 0 && ally.energy >= 30) {
      const formIndex: 1 | 2 | 3 = ally.energy >= 40 ? 3 : 2;
      const spec = buildBreathingAttackSpec(ally.breathingStyle, formIndex, ally.damageMult);
      ally.energy -= formIndex * 10;
      ally.currentAttack = isNezuko
        ? {
            ...spec,
            kind: 'BREATHING_3',
            damage: Math.round(24 * ally.damageMult),
          }
        : spec;
      ally.state = 'BREATHING_FORM';
      ally.stateTimer = 0;
      ally.attackSwingId += 1;
      ally.hitTargetsThisSwing.clear();
      ally.vx = ally.facing * spec.forwardImpulse;
      this.specialCooldown = 3.4;
      sound.playBreathingStyle(ally.breathingStyle, formIndex);
      if (isNezuko) {
        particles.spawnFloatingText(ally.x, ally.y - 110, 'EXPLODING BLOOD!', '#fb7185', 1.0);
        particles.spawnBreathingEffect('flame', formIndex, 'dragon_finisher', ally.x, ally.y, ally.facing, spec.range);
      } else {
        particles.spawnBreathingEffect(
          ally.breathingStyle,
          formIndex,
          spec.motionPattern ?? 'forward_surge',
          ally.x,
          ally.y,
          ally.facing,
          spec.range
        );
      }
    } else if (this.attackCooldown <= 0) {
      ally.currentAttack = isNezuko
        ? {
            ...DEMON_ATTACK_SPECS.DEMON_KICK,
            damage: Math.round(15 * ally.damageMult),
            triggersRagdoll: false,
            range: 98,
          }
        : {
            kind: 'LIGHT_1',
            technique: 'horizontal_slash',
            damage: Math.round(14 * ally.damageMult),
            startup: 0.08,
            active: 0.12,
            recovery: 0.14,
            knockbackX: 190,
            knockbackY: -100,
            triggersRagdoll: false,
            hitstop: 0.02,
            range: 112,
            reachY: 92,
            forwardImpulse: 125,
          };
      ally.state = 'LIGHT_ATTACK';
      ally.stateTimer = 0;
      ally.attackSwingId += 1;
      ally.hitTargetsThisSwing.clear();
      ally.vx = ally.facing * 125;
      this.attackCooldown = 0.52;
      sound.playSwordSlash(false);
    } else {
      ally.vx *= 0.8;
      ally.state = 'IDLE';
    }
  }
}
